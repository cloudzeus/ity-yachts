import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { BookingEditorClient } from "./editor-client"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await db.booking.findUnique({ where: { id }, select: { bookingNumber: true } })
  return { title: booking ? `${booking.bookingNumber} — Bookings — IYC Admin` : "Booking — IYC Admin" }
}

function serializeDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

export default async function BookingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      yacht: {
        include: {
          model: true,
          category: true,
          builder: true,
        },
      },
      extras: true,
      services: true,
      payments: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { createdAt: "desc" } },
      documents: true,
    },
  })

  if (!booking) {
    notFound()
  }

  const serialized = {
    ...booking,
    dateFrom: serializeDate(booking.dateFrom),
    dateTo: serializeDate(booking.dateTo),
    depositDueDate: serializeDate(booking.depositDueDate),
    balanceDueDate: serializeDate(booking.balanceDueDate),
    optionExpiresAt: serializeDate(booking.optionExpiresAt),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    customer: {
      ...booking.customer,
      passportExpiry: serializeDate(booking.customer.passportExpiry),
      dateOfBirth: serializeDate(booking.customer.dateOfBirth),
      createdAt: booking.customer.createdAt.toISOString(),
      updatedAt: booking.customer.updatedAt.toISOString(),
    },
    yacht: {
      ...booking.yacht,
      createdAt: booking.yacht.createdAt.toISOString(),
      updatedAt: booking.yacht.updatedAt.toISOString(),
      model: booking.yacht.model ? {
        ...booking.yacht.model,
        createdAt: booking.yacht.model.createdAt.toISOString(),
        updatedAt: booking.yacht.model.updatedAt.toISOString(),
      } : null,
      category: booking.yacht.category ? {
        ...booking.yacht.category,
        createdAt: booking.yacht.category.createdAt.toISOString(),
        updatedAt: booking.yacht.category.updatedAt.toISOString(),
      } : null,
      builder: booking.yacht.builder ? {
        ...booking.yacht.builder,
        createdAt: booking.yacht.builder.createdAt.toISOString(),
        updatedAt: booking.yacht.builder.updatedAt.toISOString(),
      } : null,
    },
    extras: booking.extras.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
    services: booking.services.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    payments: booking.payments.map((p) => ({
      ...p,
      paidAt: serializeDate(p.paidAt),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    })),
    statusHistory: booking.statusHistory.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
    documents: booking.documents.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  }

  return <BookingEditorClient booking={serialized} />
}
