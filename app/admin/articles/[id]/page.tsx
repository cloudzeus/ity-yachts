import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ArticleEditorClient } from "./editor-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await db.article.findUnique({ where: { id }, select: { title: true } })
  const title = article ? (article.title as Record<string, string>)?.en || "Article" : "Article"
  return { title: `${title} — Articles — IYC Admin` }
}

export default async function ArticleEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const article = await db.article.findUnique({ where: { id } })

  if (!article) notFound()

  return (
    <ArticleEditorClient
      article={{
        ...article,
        title: article.title as Record<string, string>,
        category: article.category as Record<string, string>,
        shortDesc: article.shortDesc as Record<string, string>,
        description: article.description as Record<string, string>,
        media: article.media as string[],
        date: article.date.toISOString(),
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString(),
      }}
    />
  )
}
