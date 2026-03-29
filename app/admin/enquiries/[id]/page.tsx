import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { EnquiryEditorClient } from "./editor-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const enquiry = await db.enquiry.findUnique({ where: { id }, select: { id: true } })
  return { title: enquiry ? `Enquiry — IYC Admin` : "Enquiry — IYC Admin" }
}

export default async function EnquiryEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const enquiry = await db.enquiry.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignedStaff: { select: { id: true, name: true } },
    },
  })

  if (!enquiry) notFound()

  return (
    <EnquiryEditorClient
      enquiry={{
        ...enquiry,
        budget: enquiry.budget !== null ? enquiry.budget : null,
        dateFrom: enquiry.dateFrom?.toISOString() ?? null,
        dateTo: enquiry.dateTo?.toISOString() ?? null,
        createdAt: enquiry.createdAt.toISOString(),
        updatedAt: enquiry.updatedAt.toISOString(),
      }}
    />
  )
}
