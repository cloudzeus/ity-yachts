import { db } from "@/lib/db"

export const SUPPORTED_LOCALES = ["en", "el", "de"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

async function getDeepSeekKey(): Promise<string> {
  const record = await db.setting.findUnique({ where: { key: "ai_keys" } })
  if (!record) throw new Error("AI keys not configured")
  const keys = record.value as Record<string, string>
  if (!keys.deepseekKey) throw new Error("DeepSeek API key not configured")
  return keys.deepseekKey
}

export async function translate(
  text: string,
  targetLang: string,
  sourceLang = "en"
): Promise<string> {
  const apiKey = await getDeepSeekKey()

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are a professional translator and an expert skipper, yacht specialist, and naval expert working for a luxury yacht charter website. You have deep knowledge of maritime terminology, sailing equipment, navigation instruments, yacht services, and charter industry vocabulary. The website supports three languages: English (en), Greek (el), and German (de). Translate the following text from ${sourceLang} to ${targetLang}. Use the correct industry-standard maritime/nautical terminology in the target language. Use formal, professional language appropriate for a high-end yacht charter brand. If a term has no established translation in the target language (e.g. brand names, universal technical terms), keep the original English. Return only the translated text with no explanation or extra commentary.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek error ${res.status}: ${err}`)
  }

  const json = await res.json()
  return json.choices[0].message.content.trim()
}

export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang = "en"
): Promise<string[]> {
  const apiKey = await getDeepSeekKey()

  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join("\n")

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are a professional translator and an expert skipper, yacht specialist, and naval expert working for a luxury yacht charter website. You have deep knowledge of maritime terminology, sailing equipment, navigation instruments, yacht services, and charter industry vocabulary. The website supports three languages: English (en), Greek (el), and German (de). Translate each numbered item from ${sourceLang} to ${targetLang}. Use the correct industry-standard maritime/nautical terminology in the target language. Use formal, professional language appropriate for a high-end yacht charter brand. If a term has no established translation in the target language (e.g. brand names, universal technical terms), keep the original English. Return the same numbered list with only the translated text. Do not add explanations.`,
        },
        {
          role: "user",
          content: numbered,
        },
      ],
      temperature: 0.3,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek error ${res.status}: ${err}`)
  }

  const json = await res.json()
  const raw: string = json.choices[0].message.content.trim()

  return raw
    .split("\n")
    .filter((line) => /^\d+\./.test(line.trim()))
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
}
