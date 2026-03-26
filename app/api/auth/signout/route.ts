import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  cookieStore.delete("authjs.session-token")

  return NextResponse.redirect(new URL("/login", req.url), {
    status: 302,
  })
}
