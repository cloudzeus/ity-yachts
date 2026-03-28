import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { LocationEditorClient } from "./editor-client"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const location = await db.location.findUnique({ where: { id }, select: { name: true } })
  return { title: location ? `${location.name} — Locations — IYC Admin` : "Location — IYC Admin" }
}

export default async function LocationEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const location = await db.location.findUnique({ where: { id } })

  if (!location) notFound()

  return (
    <LocationEditorClient
      location={{
        ...location,
        nameTranslations: location.nameTranslations as Record<string, string>,
        shortDesc: location.shortDesc as Record<string, string>,
        description: location.description as Record<string, string>,
        prefecture: location.prefecture as Record<string, string>,
        images: location.images as string[],
        createdAt: location.createdAt.toISOString(),
        updatedAt: location.updatedAt.toISOString(),
      }}
    />
  )
}
