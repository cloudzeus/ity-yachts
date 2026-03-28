import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const itinerary = await db.itinerary.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: {
            legs: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    })
    if (!itinerary) {
      return NextResponse.json({ error: "Itinerary not found" }, { status: 404 })
    }

    return NextResponse.json({ itinerary })
  } catch (error) {
    console.error("[GET /api/admin/itineraries/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const {
      name, slug, status, shortDesc, startFrom, startLatitude, startLongitude,
      places, totalDays, totalMiles, defaultMedia, defaultMediaType, metaTitle, metaDesc,
      days,
    } = body

    if (slug) {
      const existing = await db.itinerary.findUnique({ where: { slug } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      }
    }

    // Update itinerary fields
    const itinerary = await db.itinerary.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(status !== undefined && { status }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(startFrom !== undefined && { startFrom }),
        ...(startLatitude !== undefined && { startLatitude }),
        ...(startLongitude !== undefined && { startLongitude }),
        ...(places !== undefined && { places }),
        ...(totalDays !== undefined && { totalDays }),
        ...(totalMiles !== undefined && { totalMiles }),
        ...(defaultMedia !== undefined && { defaultMedia }),
        ...(defaultMediaType !== undefined && { defaultMediaType }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDesc !== undefined && { metaDesc }),
      },
    })

    // If days are provided, sync them (full replace)
    if (days !== undefined && Array.isArray(days)) {
      // Delete existing days (cascade deletes legs)
      await db.itineraryDay.deleteMany({ where: { itineraryId: id } })

      // Create new days with legs
      for (const day of days) {
        const createdDay = await db.itineraryDay.create({
          data: {
            itineraryId: id,
            dayNumber: day.dayNumber,
            description: day.description ?? {},
          },
        })
        if (day.legs && Array.isArray(day.legs)) {
          for (const leg of day.legs) {
            await db.itineraryLeg.create({
              data: {
                dayId: createdDay.id,
                sortOrder: leg.sortOrder ?? 0,
                name: leg.name ?? {},
                description: leg.description ?? {},
                latitude: leg.latitude ?? null,
                longitude: leg.longitude ?? null,
                images: leg.images ?? [],
              },
            })
          }
        }
      }
    }

    // Re-fetch with relations
    const updated = await db.itinerary.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { dayNumber: "asc" },
          include: { legs: { orderBy: { sortOrder: "asc" } } },
        },
      },
    })

    return NextResponse.json({ itinerary: updated })
  } catch (error) {
    console.error("[PATCH /api/admin/itineraries/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    await db.itinerary.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/admin/itineraries/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
