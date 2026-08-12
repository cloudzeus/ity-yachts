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
ARG DATABASE_URL
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_BUNNY_CDN_URL
ENV DATABASE_URL=$DATABASE_URL \
    NEXTAUTH_URL=$NEXTAUTH_URL \
    NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_BUNNY_CDN_URL=$NEXT_PUBLIC_BUNNY_CDN_URL

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
