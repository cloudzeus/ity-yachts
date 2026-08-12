import Link from "next/link"

/* ─── Customer requests ────────────────────────────────────────────────────
   Everything the public site sends us. The contact form and the yacht booking
   form both write to `enquiry` with source WEBSITE, so nothing in the row type
   says which one it was — describeRequest works that out from the shape of the
   data, and the panel labels each entry accordingly.                         */

export interface CustomerRequest {
  id: string
  status: string
  createdAt: Date
  notes: string | null
  dateFrom: Date | null
  dateTo: Date | null
  guests: number | null
  budget: number | null
  currency: string | null
  customer: { firstName: string; lastName: string; email: string } | null
}

export function CustomerRequests({
  requests,
  total,
}: {
  requests: CustomerRequest[]
  total: number
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        background: "var(--surface-container-lowest)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-ambient)",
      }}
    >
      <div
        className="flex items-start justify-between gap-4 px-6 py-4"
        style={{
          background: "var(--surface-container-low)",
          borderRadius: "var(--radius-md) var(--radius-md) 0 0",
        }}
      >
        <div>
          <h3
            className="text-sm font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
          >
            Customer Requests
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: "var(--on-surface-variant)" }}>
            {total} submitted through the website
          </p>
        </div>
        {total > 0 && (
          <Link
            href="/admin/enquiries"
            className="shrink-0 text-xs font-semibold hover:underline"
            style={{ color: "var(--secondary)" }}
          >
            View all →
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
            Nothing received yet
          </p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {requests.map((r) => {
            const req = describeRequest(r)
            return (
              <li key={r.id} style={{ borderTop: "1px solid var(--outline-variant)" }}>
                <Link
                  href={`/admin/enquiries/${r.id}`}
                  className="flex flex-col gap-1 px-6 py-3 transition-colors hover:bg-[var(--surface-container-low)]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-semibold" style={{ color: "var(--primary)" }}>
                      {req.who}
                    </span>
                    <span className="shrink-0 text-[11px]" style={{ color: "var(--on-surface-variant)" }}>
                      {req.age}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                      style={{ background: req.kindBg, color: req.kindFg, borderRadius: "var(--radius-xs)" }}
                    >
                      {req.kind}
                    </span>
                    {r.status === "NEW" && (
                      <span
                        className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{
                          background: "rgba(193,120,42,0.12)",
                          color: "#8A5418",
                          borderRadius: "var(--radius-xs)",
                        }}
                      >
                        Unanswered
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--on-surface-variant)" }}>
                      {req.detail}
                    </span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * Which form did this come from?
 *
 * A charter request carries dates and names a yacht in its notes; the contact
 * route prefixes its notes with "[Contact Form]" and leaves the dates null.
 */
function describeRequest(r: CustomerRequest) {
  const notes = r.notes ?? ""
  const isContact = notes.startsWith("[Contact Form]")
  const who = r.customer
    ? `${r.customer.firstName} ${r.customer.lastName}`.trim() || r.customer.email
    : "Unknown sender"

  const d = (v: Date) =>
    `${String(v.getUTCDate()).padStart(2, "0")}/${String(v.getUTCMonth() + 1).padStart(2, "0")}`

  let detail: string
  if (isContact) {
    const subject = notes.match(/^Subject: (.+)$/m)?.[1]
    detail = subject || notes.split("\n").filter(Boolean).slice(-1)[0]?.slice(0, 60) || "—"
  } else {
    const yacht = notes.match(/^Yacht: (.+)$/m)?.[1]
    const dates = r.dateFrom && r.dateTo ? `${d(r.dateFrom)}–${d(r.dateTo)}` : null
    const guests = r.guests ? `${r.guests} guests` : null
    const budget =
      r.budget != null
        ? new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: r.currency || "EUR",
            maximumFractionDigits: 0,
          }).format(r.budget)
        : null
    detail = [yacht, dates, guests, budget].filter(Boolean).join(" · ") || "—"
  }

  return {
    who,
    detail,
    kind: isContact ? "Message" : "Charter",
    kindBg: isContact ? "rgba(107,122,133,0.14)" : "rgba(11,96,153,0.10)",
    kindFg: isContact ? "#4A565F" : "#0B6099",
    age: relativeAge(r.createdAt),
  }
}

/** "3d" reads faster than a date when scanning an inbox. */
function relativeAge(from: Date) {
  const mins = Math.max(0, Math.round((Date.now() - from.getTime()) / 60_000))
  if (mins < 60) return `${mins}m`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d`
  return `${Math.round(days / 30)}mo`
}
