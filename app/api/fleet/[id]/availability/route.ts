import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fetchFreeYacht } from "@/lib/nausys-api"

function toNausysDate(isoDate: string): string {
  const d = new Date(isoDate)
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const yachtId = parseInt(id)
  if (isNaN(yachtId)) {
    return NextResponse.json({ available: false, error: "Invalid yacht ID" }, { status: 400 })
  }

  const checkIn = request.nextUrl.searchParams.get("checkIn")
  const checkOut = request.nextUrl.searchParams.get("checkOut")

  if (!checkIn || !checkOut) {
    return NextResponse.json({ available: false, error: "checkIn and checkOut required" }, { status: 400 })
  }

  // Load NAUSYS credentials
  const setting = await db.setting.findUnique({ where: { key: "nausys" } })
  if (!setting?.value) {
    // No NAUSYS credentials — fall back to local price data check
    const price = await db.nausysYachtPrice.findFirst({
      where: {
        yachtId,
        priceType: "WEEKLY",
        dateFrom: { lte: new Date(checkIn) },
        dateTo: { gte: new Date(checkOut) },
      },
    })
    return NextResponse.json({
      available: !!price,
      price: price ? Number(price.price) : undefined,
      currency: price?.currency || "EUR",
      source: "local",
    })
  }

  const creds = setting.value as { username: string; password: string; endpoint: string; companyId: string }

  try {
    const results = await fetchFreeYacht(
      creds,
      toNausysDate(checkIn),
      toNausysDate(checkOut),
      [yachtId]
    )

    const match = results.find((r) => r.yachtId === yachtId)
    if (match) {
      return NextResponse.json({
        available: true,
        price: match.price ? parseFloat(match.price.clientPrice) : undefined,
        listPrice: match.price ? parseFloat(match.price.priceListPrice) : undefined,
        currency: "EUR",
        discounts: match.price?.discounts || [],
        source: "nausys",
      })
    }

    return NextResponse.json({ available: false, source: "nausys" })
  } catch {
    // NAUSYS call failed — fall back to local data
    const price = await db.nausysYachtPrice.findFirst({
      where: {
        yachtId,
        priceType: "WEEKLY",
        dateFrom: { lte: new Date(checkIn) },
        dateTo: { gte: new Date(checkOut) },
      },
    })
    return NextResponse.json({
      available: !!price,
      price: price ? Number(price.price) : undefined,
      currency: price?.currency || "EUR",
      source: "local_fallback",
    })
  }
}
