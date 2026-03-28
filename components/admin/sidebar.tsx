"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Ship,
  CalendarDays,
  FileText,
  Settings,
  BarChart3,
  ImageIcon,
  MapPin,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Route,
  Star,
  Sailboat,
  DollarSign,
  Anchor,
  Package,
  Calendar,
  Contact,
  MessageSquare,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const navGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Bookings",
    items: [
      { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
      { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare },
      { label: "Customers", href: "/admin/customers", icon: Contact },
      { label: "Yachts", href: "/admin/yachts", icon: Ship },
    ],
  },
  {
    label: "Fleet",
    items: [
      { label: "Fleet", href: "/admin/fleet", icon: Sailboat, exact: true },
      { label: "Pricing", href: "/admin/fleet/pricing", icon: DollarSign },
      { label: "Bases", href: "/admin/fleet/bases", icon: Anchor },
      { label: "Seasons", href: "/admin/fleet/seasons", icon: Calendar },
      { label: "Catalogue", href: "/admin/fleet/catalogue", icon: Package },
    ],
  },
  {
    label: "CMS",
    items: [
      { label: "Pages", href: "/admin/pages", icon: FileText },
      { label: "Locations", href: "/admin/locations", icon: MapPin },
      { label: "Itineraries", href: "/admin/itineraries", icon: Route },
      { label: "Reviews", href: "/admin/reviews", icon: Star },
      { label: "Media", href: "/admin/media", icon: ImageIcon },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Company Staff", href: "/admin/staff", icon: UserCircle },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex h-full flex-col transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
        style={{ background: "var(--primary-container)" }}
      >
        {/* Logo & Toggle */}
        <div
          className="flex h-14 shrink-0 items-center justify-between px-3"
          style={{ background: "rgba(0, 0, 0, 0.3)" }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center"
                style={{
                  background: "var(--gradient-ocean)",
                  borderRadius: "var(--radius-xs)",
                }}
              >
                <span
                  className="text-[0.65rem] font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-display)", color: "var(--tertiary-fixed)" }}
                >
                  IYC
                </span>
              </div>
              <div>
                <p
                  className="text-xs font-semibold leading-none text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  IYC Yachts
                </p>
                <p className="mt-0.5 text-[0.6rem] leading-none" style={{ color: "var(--secondary-light)" }}>
                  Admin
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 transition-colors hover:bg-white/10"
            style={{ color: "var(--secondary-light)" }}
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>

        {/* Nav groups */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2 py-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p
                  className="label-sm mb-2 px-2 text-xs"
                  style={{ color: "var(--secondary-light)", opacity: 0.7 }}
                >
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const active = isActive(item.href, item.exact)
                  const ItemIcon = item.icon

                  return collapsed ? (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link
                          href={item.href}
                          className="flex items-center justify-center py-2 px-2 rounded transition-colors"
                          style={{
                            borderRadius: "var(--radius-md)",
                            background: active ? "var(--secondary-light)" : "transparent",
                            color: active ? "var(--primary-container)" : "var(--secondary-light)",
                          }}
                        >
                          <ItemIcon className="size-5" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded transition-colors"
                      style={{
                        borderRadius: "var(--radius-md)",
                        background: active ? "var(--secondary-light)" : "transparent",
                        color: active ? "var(--primary-container)" : "var(--secondary-light)",
                      }}
                    >
                      <ItemIcon className="size-5 shrink-0" />
                      <span style={{ fontFamily: "var(--font-body)" }}>{item.label}</span>
                      {active && (
                        <span
                          className="ml-auto h-2 w-1"
                          style={{
                            background: "var(--primary-container)",
                            borderRadius: "var(--radius-xs)",
                          }}
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="shrink-0 px-2 py-3" style={{ background: "rgba(0, 0, 0, 0.2)" }}>
          <form action="/api/auth/signout" method="POST">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center py-2 px-2 rounded transition-colors"
                    style={{
                      borderRadius: "var(--radius-md)",
                      color: "var(--secondary-light)",
                    }}
                  >
                    <LogOut className="size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-3 py-2 text-sm rounded transition-colors hover:bg-white/10"
                style={{
                  borderRadius: "var(--radius-md)",
                  color: "var(--secondary-light)",
                  fontFamily: "var(--font-body)",
                }}
              >
                <LogOut className="size-5" />
                <span>Sign out</span>
              </button>
            )}
          </form>
        </div>
      </aside>
    </TooltipProvider>
  )
}
