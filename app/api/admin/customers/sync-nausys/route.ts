import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextResponse } from "next/server"
import { fetchClients, type NausysCredentials, type RawClient } from "@/lib/nausys-api"

export async function POST() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Load NAUSYS credentials
    const setting = await db.setting.findUnique({ where: { key: "nausys" } })
    if (!setting) {
      return NextResponse.json(
        { error: "NAUSYS credentials not configured. Go to Settings > NAUSYS." },
        { status: 400 }
      )
    }

    const { username, password, endpoint, companyId } = setting.value as {
      username: string; password: string; endpoint: string; companyId: string
    }
    if (!username || !password) {
      return NextResponse.json({ error: "NAUSYS username or password is empty." }, { status: 400 })
    }
    if (!companyId) {
      return NextResponse.json({ error: "Charter Company ID not configured." }, { status: 400 })
    }

    const creds: NausysCredentials = {
      username,
      password,
      endpoint: endpoint || "https://ws.nausys.com/CBMS-external/rest",
      companyId,
    }

    const clients = await fetchClients(creds)

    let created = 0
    let updated = 0

    for (const client of clients) {
      if (!client.id) continue

      const data = mapClientToCustomer(client)
      const existing = await db.customer.findUnique({
        where: { nausysClientId: client.id },
      })

      if (existing) {
        await db.customer.update({
          where: { id: existing.id },
          data,
        })
        updated++
      } else {
        await db.customer.create({
          data: {
            ...data,
            nausysClientId: client.id,
          },
        })
        created++
      }
    }

    return NextResponse.json({
      ok: true,
      total: clients.length,
      created,
      updated,
    })
  } catch (error: any) {
    console.error("[POST /api/admin/customers/sync-nausys]", error)
    return NextResponse.json(
      { error: error?.message || "Failed to sync clients from NAUSYS" },
      { status: 500 }
    )
  }
}

function mapClientToCustomer(client: RawClient) {
  return {
    firstName: client.firstName || "Unknown",
    lastName: client.lastName || "Unknown",
    email: client.email || "",
    phone: client.phone || "",
    mobile: client.mobile || "",
    nationality: client.nationality || "",
    passportNumber: client.passportNumber || "",
    dateOfBirth: client.dateOfBirth ? parseNausysDateSafe(client.dateOfBirth) : null,
    address: client.address || "",
    city: client.city || "",
    country: client.country || "",
    postcode: client.postcode || "",
    notes: client.remarks || null,
  }
}

function parseNausysDateSafe(dateStr: string): Date | null {
  try {
    // NAUSYS dates are DD.MM.YYYY
    const [day, month, year] = dateStr.split(".")
    if (!day || !month || !year) return null
    const d = new Date(`${year}-${month}-${day}T00:00:00Z`)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}
