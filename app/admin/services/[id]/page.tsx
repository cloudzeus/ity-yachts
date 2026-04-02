import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { ServiceEditorClient } from "./editor-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = await db.service.findUnique({ where: { id }, select: { title: true } })
  const title = service ? (service.title as Record<string, string>)?.en : null
  return { title: title ? `${title} — Services — IYC Admin` : "Service — IYC Admin" }
}

export default async function ServiceEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const service = await db.service.findUnique({ where: { id } })

  if (!service) notFound()

  return (
    <ServiceEditorClient
      service={{
        ...service,
        title: service.title as Record<string, string>,
        label: service.label as Record<string, string>,
        header: service.header as Record<string, string>,
        shortDesc: service.shortDesc as Record<string, string>,
        description: service.description as Record<string, string>,
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
      }}
    />
  )
}
