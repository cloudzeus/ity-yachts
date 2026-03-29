import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { EditorClient } from "./editor-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Page Editor — IYC Admin" }

export default async function PageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const page = await db.page.findUnique({ where: { id } })

  if (!page) {
    notFound()
  }

  return <EditorClient page={{
    id: page.id,
    name: page.name,
    slug: page.slug,
    status: page.status,
    content: page.content,
    heroSection: page.heroSection as Record<string, unknown> | null,
    translations: (typeof page.translations === 'object' && page.translations ? page.translations : {}) as Record<string, string>,
    metaTitle: page.metaTitle ?? undefined,
    metaDesc: page.metaDesc ?? undefined,
    metaKeywords: page.metaKeywords ?? undefined,
    metaOgTitle: page.metaOgTitle ?? undefined,
    metaOgDesc: page.metaOgDesc ?? undefined,
    metaOgImage: page.metaOgImage ?? undefined,
    metaRobots: page.metaRobots ?? undefined,
    metaCanonical: page.metaCanonical ?? undefined,
    showInMenu: page.showInMenu,
    menuOrder: page.menuOrder,
    menuLabel: page.menuLabel ?? undefined,
  }} />
}
