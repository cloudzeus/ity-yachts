"use client"

import { useState } from "react"
import { CompanyTab } from "@/components/admin/settings/company-tab"
import { SocialTab } from "@/components/admin/settings/social-tab"
import { AITab } from "@/components/admin/settings/ai-tab"
import { AnalyticsTab } from "@/components/admin/settings/analytics-tab"
import { NausysTab } from "@/components/admin/settings/nausys-tab"
import { EmailTab } from "@/components/admin/settings/email-tab"
import { WeatherTab } from "@/components/admin/settings/weather-tab"

interface SettingsClientProps {
  settings: Record<string, any>
}

const TABS = [
  { value: "company",   label: "Company" },
  { value: "social",    label: "Social Media" },
  { value: "ai",        label: "AI Keys" },
  { value: "analytics", label: "Analytics" },
  { value: "nausys",    label: "NAUSYS" },
  { value: "email",     label: "Email" },
  { value: "weather",   label: "Weather" },
] as const

export function SettingsClient({ settings }: SettingsClientProps) {
  const [active, setActive] = useState("company")

  return (
    <div className="flex flex-col gap-0">
      <div className="pb-4" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
        <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--primary)", letterSpacing: "-0.01em" }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--on-surface-variant)" }}>
          Manage your company information, integrations, and API credentials.
        </p>
      </div>

      <div className="flex gap-1 pt-4 border-b" style={{ borderColor: "var(--outline-variant)" }}>
        {TABS.map(({ value, label }) => {
          const isActive = active === value
          return (
            <button
              key={value}
              onClick={() => setActive(value)}
              className="px-4 py-2 text-xs font-medium transition-colors relative"
              style={{
                color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
              }}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--primary)" }} />
              )}
            </button>
          )
        })}
      </div>

      <div className="pt-6">
        {active === "company" && <CompanyTab initialData={settings.company ?? {}} />}
        {active === "social" && <SocialTab initialData={settings.social ?? {}} />}
        {active === "ai" && <AITab initialData={settings.ai_keys ?? {}} />}
        {active === "analytics" && <AnalyticsTab initialData={settings.analytics ?? {}} />}
        {active === "nausys" && <NausysTab initialData={settings.nausys ?? {}} />}
        {active === "email" && <EmailTab initialData={settings.email ?? {}} />}
        {active === "weather" && <WeatherTab />}
      </div>
    </div>
  )
}
