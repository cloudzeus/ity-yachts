import "server-only"
import { db } from "@/lib/db"

/** Keys live in the settings table, not the environment, so they stay editable in /admin. */
export async function getDeepSeekKey(): Promise<string> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  if (!record) throw new Error("AI keys not configured")
  const keys = record.value as Record<string, string>
  if (!keys.deepseekKey) throw new Error("DeepSeek API key not configured")
  return keys.deepseekKey
}
