import { jwtVerify } from "jose"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_ROLES = ["ADMIN", "MANAGER", "EDITOR", "EMPLOYEE"]
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-change-me")

export async function proxy(req: NextRequest) {
  const { nextUrl } = req

  if (nextUrl.pathname.startsWith("/admin")) {
    const token = req.cookies.get("authjs.session-token")?.value

    if (!token) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }

    try {
      const verified = await jwtVerify(token, secret)
      const payload = verified.payload as { role?: string }

      if (!ADMIN_ROLES.includes(payload.role ?? "")) {
        return NextResponse.redirect(new URL("/", nextUrl))
      }
    } catch (err) {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
