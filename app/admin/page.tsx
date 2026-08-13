import { Users, Ship, TrendingUp, CalendarDays } from "lucide-react"
import { WeatherWidget } from "@/components/admin/weather-widget"
import { FleetGantt } from "@/components/admin/fleet-gantt"
import { CustomerRequests } from "@/components/admin/customer-requests"
import { db } from "@/lib/db"
import Link from "next/link"

/** Charter season, used for the occupancy denominator. */
const SEASON_START_MONTH = 3 // April
const SEASON_END_MONTH = 9 // October

export default async function AdminPage() {
  const [yachts, rawPeriods, locations, prices, bookings] = await Promise.all([
    db.nausysYacht.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.nausysAvailability.findMany({ orderBy: { dateFrom: "asc" } }),
    db.nausysLocation.findMany({ select: { id: true, name: true } }),
    db.nausysYachtPrice.findMany({
      where: { priceType: "WEEKLY" },
      select: { yachtId: true, dateFrom: true, dateTo: true, price: true, currency: true },
    }),
    // Charters we sold ourselves carry the customer and the money; NAUSYS
    // occupancy carries neither. They meet at the reservation number.
    db.booking.findMany({
      where: { nausysReservationId: { not: null } },
      select: {
        id: true, bookingNumber: true, nausysReservationId: true, status: true,
        totalPrice: true, currency: true, guests: true,
        customer: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ])

  const locName = new Map(
    locations.map((l) => {
      const n = l.name as Record<string, string> | null
      return [l.id, n?.en || n?.el || n?.de || `#${l.id}`]
    })
  )
  const bookingByReservation = new Map(bookings.map((b) => [b.nausysReservationId!, b]))

  /* ── Dashboard figures ──────────────────────────────────────────────────
     Everything here is computed from the occupancy mirror, because that is
     what we actually hold. There is deliberately no "Revenue" card: no
     payment has ever been recorded, so any figure under that word would be
     an invention. Booked value is list price × booked weeks, and says so.  */

  const now = new Date()
  const year = now.getUTCFullYear()
  const seasonFrom = new Date(Date.UTC(year, SEASON_START_MONTH, 1))
  const seasonTo = new Date(Date.UTC(year, SEASON_END_MONTH + 1, 0))

  const onCharterNow = rawPeriods.filter(
    (p) => p.status === "BOOKED" && p.dateFrom <= now && p.dateTo >= now
  ).length

  const openOptions = rawPeriods.filter((p) => p.status === "OPTION" && p.dateTo >= now).length

  // Occupied days inside the season, clipped to it, over the days the whole
  // fleet could have sold.
  const seasonDays = Math.round((seasonTo.getTime() - seasonFrom.getTime()) / 86_400_000)
  let bookedDays = 0
  let bookedValue = 0
  for (const p of rawPeriods) {
    if (p.status !== "BOOKED") continue
    if (p.dateTo <= seasonFrom || p.dateFrom >= seasonTo) continue
    const a = p.dateFrom < seasonFrom ? seasonFrom : p.dateFrom
    const b = p.dateTo > seasonTo ? seasonTo : p.dateTo
    bookedDays += (b.getTime() - a.getTime()) / 86_400_000
    const price = prices.find(
      (q) => q.yachtId === p.yachtId && q.dateFrom <= p.dateFrom && q.dateTo >= p.dateFrom
    )
    if (price) bookedValue += Number(price.price)
  }
  const occupancy = seasonDays > 0 && yachts.length > 0
    ? Math.round((bookedDays / (seasonDays * yachts.length)) * 100)
    : 0

  const newEnquiries = await db.enquiry.count({ where: { status: "NEW" } })

  /* Everything the public site sends us. The contact form and the yacht booking
     form both land as WEBSITE — a charter request carries dates, a general
     message does not — and the planning conversation lands as WIZARD.
     Filtering on WEBSITE alone hid every request the agent collected. */
  const PUBLIC_SOURCES = ["WEBSITE", "WIZARD"]

  const requests = await db.enquiry.findMany({
    where: { source: { in: PUBLIC_SOURCES } },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true, status: true, source: true, createdAt: true, notes: true,
      aiBrief: true, wizard: true,
      dateFrom: true, dateTo: true, guests: true, budget: true, currency: true,
      customer: { select: { firstName: true, lastName: true, email: true } },
    },
  })
  const totalRequests = await db.enquiry.count({ where: { source: { in: PUBLIC_SOURCES } } })

  const stats = [
    {
      label: "On charter now",
      value: `${onCharterNow}/${yachts.length}`,
      delta: onCharterNow === yachts.length ? "Whole fleet is out" : "Yachts at sea today",
      icon: Ship,
      iconColor: "var(--secondary)",
      iconBg: "rgba(0,99,153,0.08)",
      href: undefined,
    },
    {
      label: "Season occupancy",
      value: `${occupancy}%`,
      delta: `Apr–Oct ${year}, whole fleet`,
      icon: TrendingUp,
      iconColor: "#4F7A46",
      iconBg: "rgba(45,106,79,0.08)",
      href: undefined,
    },
    {
      label: "Booked value",
      value: bookedValue > 0
        ? new Intl.NumberFormat("en-GB", {
            style: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 2,
          }).format(bookedValue)
        : "—",
      delta: `${year} season · at list price`,
      icon: CalendarDays,
      iconColor: "var(--secondary-light)",
      iconBg: "rgba(0,119,182,0.08)",
      href: undefined,
    },
    {
      label: "Needs attention",
      value: String(newEnquiries + openOptions),
      delta: `${newEnquiries} new enquiries · ${openOptions} options held`,
      icon: Users,
      iconColor: "#C1782A",
      iconBg: "rgba(193,120,42,0.10)",
      href: "/admin/enquiries",
    },
  ]

  const periods = rawPeriods.map((p) => {
    const listPrice = prices.find(
      (q) => q.yachtId === p.yachtId && q.dateFrom <= p.dateFrom && q.dateTo >= p.dateFrom
    )
    const own = p.nausysId != null ? bookingByReservation.get(p.nausysId) : undefined
    return {
      id: p.id,
      yachtId: p.yachtId,
      dateFrom: p.dateFrom.toISOString(),
      dateTo: p.dateTo.toISOString(),
      status: p.status,
      reservationNo: p.nausysId,
      checkInTime: p.checkInTime,
      checkOutTime: p.checkOutTime,
      baseFrom: p.locationFromId != null ? (locName.get(p.locationFromId) ?? null) : null,
      baseTo: p.locationToId != null ? (locName.get(p.locationToId) ?? null) : null,
      optionValidTill: p.optionValidTill?.toISOString() ?? null,
      listPrice: listPrice ? Number(listPrice.price) : null,
      currency: listPrice?.currency ?? "EUR",
      booking: own
        ? {
            id: own.id,
            bookingNumber: own.bookingNumber,
            status: own.status,
            totalPrice: own.totalPrice,
            currency: own.currency,
            guests: own.guests,
            customer: `${own.customer.firstName} ${own.customer.lastName}`.trim(),
            email: own.customer.email,
          }
        : null,
    }
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Page header — no border, whitespace is the separator */}
      <div>
        <h2
          className="text-[1.5rem] font-semibold leading-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}
        >
          Overview
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--on-surface-variant)" }}>
          Maritime enterprise management dashboard.
        </p>
      </div>

      {/* Stat cards — surface-container-lowest on surface, no borders */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Fleet occupancy — the one view that answers "what can I sell?" */}
      <FleetGantt yachts={yachts} periods={periods} />

      {/* Bottom panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CustomerRequests requests={requests} total={totalRequests} />

        {/* Weather */}
        <WeatherWidget />
      </div>
    </div>
  )
}

type Stat = {
  label: string
  value: string
  delta: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  iconColor: string
  iconBg: string
  href?: string
}

/** Identical card either way; only the one with somewhere to go is a link. */
function StatCard({ label, value, delta, icon: Icon, iconColor, iconBg, href }: Stat) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="label-sm" style={{ color: "var(--on-surface-variant)" }}>
          {label}
        </span>
        <div
          className="flex size-8 items-center justify-center"
          style={{ background: iconBg, borderRadius: "var(--radius-xs)" }}
        >
          <Icon className="size-4" style={{ color: iconColor }} />
        </div>
      </div>
      <div>
        <p
          className="text-3xl font-bold leading-none"
          style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.02em" }}
        >
          {value}
        </p>
        <p className="mt-1.5 text-xs" style={{ color: "var(--on-surface-variant)" }}>
          {delta}
        </p>
      </div>
    </>
  )

  const className = "flex flex-col gap-3 p-5"
  const style = {
    background: "var(--surface-container-lowest)",
    borderRadius: "var(--radius-md)",
    boxShadow: "var(--shadow-ambient)",
  }

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {body}
      </Link>
    )
  }
  return (
    <div className={className} style={style}>
      {body}
    </div>
  )
}

