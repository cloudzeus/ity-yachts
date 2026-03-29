import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { CustomerEditorClient } from "./editor-client"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await db.customer.findUnique({ where: { id }, select: { firstName: true, lastName: true } })
  return { title: customer ? `${customer.firstName} ${customer.lastName} — IYC Admin` : "Customer — IYC Admin" }
}

export default async function CustomerEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      _count: { select: { bookings: true } },
    },
  })

  if (!customer) notFound()

  return (
    <CustomerEditorClient
      customer={{
        ...customer,
        certifications: customer.certifications as string[],
        passportExpiry: customer.passportExpiry?.toISOString() ?? null,
        dateOfBirth: customer.dateOfBirth?.toISOString() ?? null,
        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString(),
      }}
    />
  )
}
