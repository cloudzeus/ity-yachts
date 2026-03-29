import { db } from "@/lib/db"
import { getSession } from "@/lib/auth-session"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { type, name, props, dataSource, sortOrder, status } = body

    const component = await db.pageComponent.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(name !== undefined && { name }),
        ...(props !== undefined && { props }),
        ...(dataSource !== undefined && { dataSource }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json({ component })
  } catch (error) {
    console.error("[PATCH /api/admin/page-components/[id]]", error)
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

    await db.pageComponent.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/admin/page-components/[id]]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
