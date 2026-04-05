/**
 * Remove Greek accent marks (τόνος) from text.
 * In Greek typography, uppercase letters never carry accents.
 * Maps: ά→α, έ→ε, ή→η, ί→ι, ό→ο, ύ→υ, ώ→ω, ΐ→ϊ, ΰ→ϋ
 */
const TONOS_MAP: Record<string, string> = {
  "ά": "α", "έ": "ε", "ή": "η", "ί": "ι", "ό": "ο", "ύ": "υ", "ώ": "ω",
  "Ά": "Α", "Έ": "Ε", "Ή": "Η", "Ί": "Ι", "Ό": "Ο", "Ύ": "Υ", "Ώ": "Ω",
  "ΐ": "ϊ", "ΰ": "ϋ",
}

export function removeGreekTonos(text: string): string {
  return text.replace(/[άέήίόύώΆΈΉΊΌΎΏΐΰ]/g, (ch) => TONOS_MAP[ch] || ch)
}
