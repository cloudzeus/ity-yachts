import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ReviewEditorClient } from "./editor-client"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const review = await db.review.findUnique({ where: { id }, select: { name: true } })
  return { title: review ? `${review.name} — Reviews — IYC Admin` : "Review — IYC Admin" }
}

export default async function ReviewEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const review = await db.review.findUnique({ where: { id } })

  if (!review) notFound()

  return (
    <ReviewEditorClient
      review={{
        ...review,
        content: review.content as Record<string, string>,
        date: review.date.toISOString(),
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
      }}
    />
  )
}
