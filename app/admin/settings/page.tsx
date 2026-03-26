import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { SettingsClient } from "./settings-client"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/admin")
  }

  const records = await db.setting.findMany()
  const settings = Object.fromEntries(records.map((r) => [r.key, r.value]))

  return <SettingsClient settings={settings} />
}
