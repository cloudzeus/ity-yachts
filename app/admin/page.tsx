import { Users, Ship, TrendingUp, CalendarDays } from "lucide-react"

const stats = [
  {
    label: "Total Users",
    value: "—",
    delta: "Registered accounts",
    icon: Users,
    iconColor: "var(--secondary)",
    iconBg: "rgba(0,99,153,0.08)",
  },
  {
    label: "Yachts Listed",
    value: "—",
    delta: "Active fleet",
    icon: Ship,
    iconColor: "var(--tertiary-fixed-dim)",
    iconBg: "rgba(88,214,241,0.1)",
  },
  {
    label: "Revenue",
    value: "—",
    delta: "This month",
    icon: TrendingUp,
    iconColor: "#2D6A4F",
    iconBg: "rgba(45,106,79,0.08)",
  },
  {
    label: "Bookings",
    value: "—",
    delta: "Upcoming charters",
    icon: CalendarDays,
    iconColor: "var(--secondary-light)",
    iconBg: "rgba(0,119,182,0.08)",
  },
]

export default function AdminPage() {
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
          <div
            key={s.label}
            className="flex flex-col gap-3 p-5"
            style={{
              background: "var(--surface-container-lowest)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-ambient)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="label-sm" style={{ color: "var(--on-surface-variant)" }}>
                {s.label}
              </span>
              <div
                className="flex size-8 items-center justify-center"
                style={{ background: s.iconBg, borderRadius: "var(--radius-xs)" }}
              >
                <s.icon className="size-4" style={{ color: s.iconColor }} />
              </div>
            </div>
            <div>
              <p
                className="text-3xl font-bold leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {s.value}
              </p>
              <p className="mt-1.5 text-xs" style={{ color: "var(--on-surface-variant)" }}>
                {s.delta}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom panels — surface-container-low sections, no borders */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Bookings */}
        <div
          className="flex flex-col"
          style={{
            background: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <div
            className="px-6 py-4"
            style={{ background: "var(--surface-container-low)", borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
            >
              Recent Bookings
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Latest charter requests
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
              No bookings yet
            </p>
          </div>
        </div>

        {/* Fleet Status */}
        <div
          className="flex flex-col"
          style={{
            background: "var(--surface-container-lowest)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-ambient)",
          }}
        >
          <div
            className="px-6 py-4"
            style={{ background: "var(--surface-container-low)", borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
            >
              Fleet Status
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: "var(--on-surface-variant)" }}>
              Yacht availability overview
            </p>
          </div>
          <div className="flex flex-1 items-center justify-center px-6 py-12">
            <p className="text-sm" style={{ color: "var(--on-surface-variant)" }}>
              No yachts added yet
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
