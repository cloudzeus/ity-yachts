import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { fetchFreeYacht } from "@/lib/nausys-api"

function toNausysDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00")
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
}

/**
 * Is the yacht already taken for this period, according to the occupancy
 * calendar mirrored from NAUSYS?
 *
 * Strict comparisons on purpose: charters run Saturday to Saturday and the
 * turnaround day is shared, so a week starting on another charter's check-out
 * date is not a clash.
 */
async function isBookedLocally(yachtId: number, checkIn: string, checkOut: string) {
  // UTC, to match parseNausysDate — every stored period is UTC midnight. Local
  // parsing shifts the boundary by the server's offset, which makes a week
  // starting on a turnaround day overlap the charter that ends that morning.
  const from = new Date(checkIn + "T00:00:00Z")
  const to = new Date(checkOut + "T00:00:00Z")
  const clash = await db.nausysAvailability.findFirst({
    where: { yachtId, dateFrom: { lt: to }, dateTo: { gt: from } },
    select: { id: true },
  })
  return !!clash
}

/**
 * Availability from our own data.
 *
 * The occupancy calendar is the authority on whether the boat is free; the
 * price table only supplies the number. Deciding availability from the price
 * table alone — which is what this route used to do — reports every booked
 * yacht as available, since a price period covers the whole season regardless
 * of who has chartered it.
 */
async function localAvailability(yachtId: number, checkIn: string, checkOut: string, source: string) {
  const checkInDate = new Date(checkIn + "T00:00:00Z")
  const [booked, price] = await Promise.all([
    isBookedLocally(yachtId, checkIn, checkOut),
    db.nausysYachtPrice.findFirst({
      where: { yachtId, priceType: "WEEKLY", dateFrom: { lte: checkInDate }, dateTo: { gte: checkInDate } },
    }),
  ])
  return NextResponse.json({
    available: !booked && !!price,
    price: price ? Number(price.price) : undefined,
    currency: price?.currency || "EUR",
    source,
  })
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
    return localAvailability(yachtId, checkIn, checkOut, "local")
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

    // NAUSYS answered but left this yacht out, which normally means it is
    // taken. Our occupancy mirror decides; it will not claim it is free.
    return localAvailability(yachtId, checkIn, checkOut, "local_fallback")
  } catch {
    // NAUSYS unreachable — answer from the mirrored calendar.
    return localAvailability(yachtId, checkIn, checkOut, "local_fallback")
  }
}
