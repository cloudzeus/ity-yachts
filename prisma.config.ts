import "dotenv/config"
import path from "node:path"
import { defineConfig, env } from "prisma/config"

/**
 * Prisma 7 moved the migration connection URL out of schema.prisma and into
 * this file; the runtime client gets its connection from the driver adapter in
 * lib/db.ts instead.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
})
