import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Load NAUSYS credentials from settings
    const setting = await db.setting.findUnique({ where: { key: "nausys" } })
    if (!setting) {
      return NextResponse.json({ ok: false, message: "No NAUSYS credentials configured. Please save your credentials first." })
    }

    const { username, password, endpoint } = setting.value as { username: string; password: string; endpoint: string }
    if (!username || !password) {
      return NextResponse.json({ ok: false, message: "Username or password is empty. Please fill in your credentials." })
    }

    const baseUrl = endpoint || "https://ws.nausys.com/CBMS-external/rest"

    // NAUSYS API uses POST with credentials in the JSON body
    const res = await fetch(`${baseUrl}/catalogue/v6/yachtCategories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(10000),
    })

    const data = await res.json().catch(() => null)

    // NAUSYS returns 200 with errorCode for auth failures
    if (data?.status === "AUTHENTICATION_ERROR") {
      return NextResponse.json({
        ok: false,
        message: "Authentication failed. Please check your username and password.",
      })
    }

    if (res.ok && data?.status === "OK") {
      const count = Array.isArray(data.categories) ? data.categories.length : 0

      // Try to detect the charter company ID from seasons endpoint
      let detectedCompanyId: number | null = null
      try {
        const seasonsRes = await fetch(`${baseUrl}/catalogue/v6/seasons`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ username, password }),
          signal: AbortSignal.timeout(10000),
        })
        const seasonsData = await seasonsRes.json().catch(() => null)
        if (seasonsData?.status === "OK" && Array.isArray(seasonsData.seasons)) {
          for (const s of seasonsData.seasons) {
            if (s.charterCompanyId) {
              detectedCompanyId = s.charterCompanyId
              break
            }
          }
        }
      } catch {}

      // Auto-save companyId if detected and not already set
      if (detectedCompanyId && setting) {
        const currentValue = setting.value as Record<string, unknown>
        if (!currentValue.companyId) {
          await db.setting.update({
            where: { key: "nausys" },
            data: { value: { ...currentValue, companyId: String(detectedCompanyId) } },
          })
        }
      }

      return NextResponse.json({
        ok: true,
        message: `Connection successful. API returned ${count} yacht categories.${detectedCompanyId ? ` Charter Company ID detected: ${detectedCompanyId}` : ""}`,
        companyId: detectedCompanyId ? String(detectedCompanyId) : null,
      })
    }

    return NextResponse.json({
      ok: false,
      message: `API returned HTTP ${res.status}: ${res.statusText}`,
    })
  } catch (error: any) {
    const message = error?.name === "TimeoutError"
      ? "Connection timed out. Please check the endpoint URL."
      : `Connection failed: ${error?.message || "Unknown error"}`
    return NextResponse.json({ ok: false, message })
  }
}
