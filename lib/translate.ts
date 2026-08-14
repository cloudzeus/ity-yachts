import { aiChat } from "@/lib/ai"

export const SUPPORTED_LOCALES = ["en", "el", "de"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]

/**
 * The words this site has already settled on.
 *
 * Without it the translator reaches for the dictionary rather than the trade:
 * it rendered "bareboat" as γυμνά — naked — and "skipper" as πλοηγός, which is
 * the pilot who brings ships into harbour. Both had to be corrected by hand
 * once already, and the next model made the same two mistakes.
 */
const GLOSSARY = [
  "Use exactly these terms and no synonyms.",
  "Greek — skipper: κυβερνήτης (never πλοηγός); bareboat: χωρίς πλήρωμα (never γυμνό or γυμνά);",
  "cabin: καμπίνα; guests: επιβάτες; anchorage: αγκυροβόλιο; charter (noun): ναύλωση;",
  "to charter: ναυλώνω; sailing yacht: ιστιοπλοϊκό; catamaran: καταμαράν; Beaufort: μποφόρ;",
  "nautical mile: ναυτικό μίλι; skippers school: σχολή κυβερνητών.",
  "Greek uses sentence case: only the first word and proper nouns take a capital.",
  "German — skipper: Skipper; bareboat: bareboat; cabin: Kabine; anchorage: Ankerplatz;",
  "sailing yacht: Segelyacht; catamaran: Katamaran; nautical mile: Seemeile.",
].join(" ")

const SYSTEM = (sourceLang: string, targetLang: string, numbered: boolean) =>
  `You are a professional translator and an expert skipper, yacht specialist, and naval expert working for a luxury yacht charter website. You have deep knowledge of maritime terminology, sailing equipment, navigation instruments, yacht services, and charter industry vocabulary. The website supports three languages: English (en), Greek (el), and German (de). Translate ${
    numbered ? "each numbered item" : "the following text"
  } from ${sourceLang} to ${targetLang}. Use the correct industry-standard maritime/nautical terminology in the target language. Use formal, professional language appropriate for a high-end yacht charter brand. If a term has no established translation in the target language (e.g. brand names, universal technical terms), keep the original English. ${GLOSSARY} ${
    numbered
      ? "Return the same numbered list with only the translated text. Do not add explanations."
      : "Return only the translated text with no explanation or extra commentary."
  }`

export async function translate(text: string, targetLang: string, sourceLang = "en"): Promise<string> {
  return aiChat({
    messages: [
      { role: "system", content: SYSTEM(sourceLang, targetLang, false) },
      { role: "user", content: text },
    ],
    // Translations run longer than their source in German especially.
    maxTokens: Math.max(1024, Math.ceil(text.length / 2)),
    temperature: 0.3,
  })
}

export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang = "en"
): Promise<string[]> {
  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join("\n")

  const raw = await aiChat({
    messages: [
      { role: "system", content: SYSTEM(sourceLang, targetLang, true) },
      { role: "user", content: numbered },
    ],
    maxTokens: Math.max(1024, Math.ceil(numbered.length / 2)),
    temperature: 0.3,
  })

  return raw
    .split("\n")
    .filter((line) => /^\d+\./.test(line.trim()))
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
}
