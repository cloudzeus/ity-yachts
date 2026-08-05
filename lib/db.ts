import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * The mariadb driver only parses `mariadb://` URLs, while DATABASE_URL has to
 * stay `mysql://` for the Prisma CLI and migrations. So hand the adapter an
 * explicit pool config instead of the raw string.
 */
function poolConfigFromUrl(raw: string) {
  const url = new URL(raw)
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: Number(url.searchParams.get("connection_limit") ?? 10),
    // MySQL 8's caching_sha2_password will not send credentials over an
    // unencrypted link. The server currently presents a self-signed
    // certificate, so verification is off by default — set
    // DATABASE_SSL_REJECT_UNAUTHORIZED=true once it has a trusted one.
    ssl: {
      rejectUnauthorized:
        process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
    },
  }
}

// Prisma 7 connects through a driver adapter instead of a datasource URL in
// schema.prisma, so the connection is configured here at construction time.
const adapter = new PrismaMariaDb(
  poolConfigFromUrl(process.env.DATABASE_URL as string)
)

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
