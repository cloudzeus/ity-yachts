# Debian slim rather than Alpine: sharp and the Prisma CLI both ship glibc
# prebuilds, and chasing musl variants of them is not worth the ~80 MB saved.
FROM node:24-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ── Dependencies ────────────────────────────────────────────────────────────
# Its own stage so the install layer is only rebuilt when the lockfile moves,
# not on every source edit.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `next build` imports the whole module graph to collect routes, and lib/db.ts
# builds its connection pool at module scope — so DATABASE_URL has to be present
# here or the build throws on `new URL(undefined)`. NEXT_PUBLIC_* values are
# inlined into the client bundle at build time and cannot be supplied later.
# These stay in the builder stage; none of them reach the published image.
#
# DATABASE_URL carries a placeholder default on purpose. Nothing here connects
# to a database — `prisma generate` only writes types, and the pool in lib/db.ts
# is constructed but never dialled — they just need a string that parses. With
# no default the build died before it started, on prisma.config.ts:
#   PrismaConfigEnvError: Cannot resolve environment variable: DATABASE_URL
# and the alternative, passing the real URL as a build argument, writes the
# database password into an image layer where `docker history` can read it.
# The runtime value comes from the environment and overrides this.
ARG DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BUNNY_CDN_URL
# Where the 360° panorama tiles are served from. NEXT_PUBLIC_*, so it is written
# into the client bundle now and cannot be changed after the image is built —
# left unset, the viewer falls back to iyc.de, the server these were rescued
# from, and every tour goes dark when it is switched off.
ARG NEXT_PUBLIC_TOUR360_BASE
ENV DATABASE_URL=$DATABASE_URL \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_BUNNY_CDN_URL=$NEXT_PUBLIC_BUNNY_CDN_URL \
    NEXT_PUBLIC_TOUR360_BASE=$NEXT_PUBLIC_TOUR360_BASE

RUN npx prisma generate
RUN npm run build

# ── Runtime ─────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# The media upload route shells out to ffmpeg to transcode video.
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg \
 && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next's output tracing does not reliably follow the runtime require of the
# generated client, which surfaces as "@prisma/client did not initialize yet"
# only once the container is live. Copying it explicitly is cheap insurance.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
