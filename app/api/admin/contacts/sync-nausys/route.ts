import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextResponse } from "next/server"
import { fetchContacts2, type NausysCredentials, type RawContact2 } from "@/lib/nausys-api"

export async function POST() {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

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

    const contacts = await fetchContacts2(creds)

    let created = 0
    let updated = 0

    for (const contact of contacts) {
      if (!contact.id) continue

      const data = mapContact(contact)
      const existing = await db.nausysContact.findUnique({
        where: { id: contact.id },
      })

      if (existing) {
        await db.nausysContact.update({
          where: { id: contact.id },
          data,
        })
        updated++
      } else {
        await db.nausysContact.create({
          data: { id: contact.id, ...data },
        })
        created++
      }
    }

    return NextResponse.json({
      ok: true,
      total: contacts.length,
      created,
      updated,
    })
  } catch (error: any) {
    console.error("[POST /api/admin/contacts/sync-nausys]", error)
    return NextResponse.json(
      { error: error?.message || "Failed to sync contacts from NAUSYS" },
      { status: 500 }
    )
  }
}

function mapContact(c: RawContact2) {
  return {
    contactType: c.contactType || "",
    title: c.title || "",
    firstName: c.firstName || "",
    lastName: c.lastName || "",
    company: c.company || "",
    email: c.email || "",
    phone: c.phone || "",
    mobile: c.mobile || "",
    fax: c.fax || "",
    address: c.address || "",
    city: c.city || "",
    country: c.country || "",
    postcode: c.postcode || "",
    nationality: c.nationality || "",
    passportNumber: c.passportNumber || "",
    dateOfBirth: c.dateOfBirth ? parseNausysDateSafe(c.dateOfBirth) : null,
    language: c.language || "",
    taxNumber: c.taxNumber || "",
    remarks: c.remarks || null,
  }
}

function parseNausysDateSafe(dateStr: string): Date | null {
  try {
    const [day, month, year] = dateStr.split(".")
    if (!day || !month || !year) return null
    const d = new Date(`${year}-${month}-${day}T00:00:00Z`)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}
