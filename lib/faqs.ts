/* The guard that would have caught the client import below. */
import "server-only"
import { db } from "@/lib/db"

export interface FaqEntry {
  id: string
  question: Record<string, string>
  answer: Record<string, string>
  topic: string
}

const SELECT = { id: true, question: true, answer: true, topic: true } as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toEntry = (f: any): FaqEntry => ({
  id: f.id,
  question: (f.question ?? {}) as Record<string, string>,
  answer: (f.answer ?? {}) as Record<string, string>,
  topic: f.topic,
})

/** The handful worth putting on the homepage. */
export async function getHomepageFaqs(): Promise<FaqEntry[]> {
  const rows = await db.faq.findMany({
    where: { status: "published", showOnHomepage: true },
    orderBy: { sortOrder: "asc" },
    select: SELECT,
  })
  return rows.map(toEntry)
}

/** Everything, for the answers page. */
export async function getAllFaqs(): Promise<FaqEntry[]> {
  const rows = await db.faq.findMany({
    where: { status: "published" },
    orderBy: [{ sortOrder: "asc" }],
    select: SELECT,
  })
  return rows.map(toEntry)
}

