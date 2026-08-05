import "dotenv/config"
import bcrypt from "bcryptjs"
import { db } from "../lib/db"

async function main() {
  const email = "gkozyris@i4ria.com"
  const password = "1f1femsk"

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    console.log(`Admin user already exists: ${email}`)
    return
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const user = await db.user.create({
    data: {
      name: "G. Kozyris",
      email,
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  })

  console.log(`✓ Admin user created: ${user.email} (${user.role})`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
