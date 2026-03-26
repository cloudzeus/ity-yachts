import { getSession } from "@/lib/auth-session"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const roleColors: Record<string, { text: string; bg: string }> = {
  ADMIN:    { text: "var(--secondary)",           bg: "rgba(0,99,153,0.08)" },
  MANAGER:  { text: "#006399",                    bg: "rgba(0,119,182,0.08)" },
  EDITOR:   { text: "var(--tertiary-container)",  bg: "rgba(88,214,241,0.1)" },
  EMPLOYEE: { text: "#2D6A4F",                    bg: "rgba(45,106,79,0.08)" },
  CUSTOMER: { text: "var(--on-surface-variant)",  bg: "var(--surface-container-low)" },
}

export async function AdminHeader({ title }: { title?: string }) {
  const session = await getSession()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session?.user as any
  const role: string = user?.role ?? "CUSTOMER"
  const colors = roleColors[role] ?? roleColors.CUSTOMER
  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user?.email?.[0] ?? "?").toUpperCase()

  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between px-6"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        /* Horizon effect — ghost border bottom only */
        borderBottom: "1px solid rgba(196,198,207,0.2)",
      }}
    >
      {/* Page title — Manrope headline */}
      <h1
        className="text-sm font-semibold"
        style={{
          fontFamily: "var(--font-display)",
          color: "var(--primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {title ?? "Dashboard"}
      </h1>

      <div className="flex items-center gap-4">
        {/* Role chip */}
        <span
          className="label-sm px-2.5 py-1"
          style={{
            color: colors.text,
            background: colors.bg,
            borderRadius: "var(--radius-xs)",
          }}
        >
          {role}
        </span>

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7">
            <AvatarFallback
              className="text-xs font-bold"
              style={{
                background: "var(--gradient-ocean)",
                color: "var(--tertiary-fixed)",
                fontFamily: "var(--font-display)",
                borderRadius: "var(--radius-xs)",
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col sm:flex">
            <span
              className="text-xs font-semibold leading-none"
              style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
            >
              {user?.name ?? user?.email}
            </span>
            {user?.name && (
              <span
                className="mt-0.5 text-[0.6rem] leading-none"
                style={{ color: "var(--on-surface-variant)" }}
              >
                {user.email}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
