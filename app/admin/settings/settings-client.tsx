"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CompanyTab } from "@/components/admin/settings/company-tab"
import { SocialTab } from "@/components/admin/settings/social-tab"
import { AITab } from "@/components/admin/settings/ai-tab"
import { AnalyticsTab } from "@/components/admin/settings/analytics-tab"
import { NausysTab } from "@/components/admin/settings/nausys-tab"
import { EmailTab } from "@/components/admin/settings/email-tab"

interface SettingsClientProps {
  settings: Record<string, any>
}

const TABS = [
  { value: "company",   label: "Company",      color: "#0063A9" },
  { value: "social",    label: "Social Media",  color: "#0063A9" },
  { value: "ai",        label: "AI Keys",       color: "#E53935" },
  { value: "analytics", label: "Analytics",     color: "#0063A9" },
  { value: "nausys",    label: "NAUSYS",        color: "#E53935" },
  { value: "email",     label: "Email",         color: "#E53935" },
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

      <Tabs value={active} onValueChange={setActive} className="flex-col">
        <TabsList variant="line" className="flex flex-wrap gap-1.5 pt-4 pb-4 w-full h-auto" style={{ borderBottom: "1px solid var(--outline-variant)" }}>
          {TABS.map(({ value, label, color }) => {
            const isActive = active === value
            return (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-full px-3 text-xs font-medium h-7 border-0 after:hidden transition-all"
                style={isActive
                  ? { background: color, color: "#fff", opacity: 1 }
                  : { background: `${color}18`, color, opacity: 0.75 }
                }
              >
                {label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="pt-6">
          <TabsContent value="company">
            <CompanyTab initialData={settings.company ?? {}} />
          </TabsContent>
          <TabsContent value="social">
            <SocialTab initialData={settings.social ?? {}} />
          </TabsContent>
          <TabsContent value="ai">
            <AITab initialData={settings.ai_keys ?? {}} />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab initialData={settings.analytics ?? {}} />
          </TabsContent>
          <TabsContent value="nausys">
            <NausysTab initialData={settings.nausys ?? {}} />
          </TabsContent>
          <TabsContent value="email">
            <EmailTab initialData={settings.email ?? {}} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
