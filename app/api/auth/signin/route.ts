import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "default-secret-change-me")

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const callbackUrl = (formData.get("callbackUrl") as string) || "/admin"

    console.log("[signin] Login attempt with email:", email)
    console.log("[signin] Has password:", !!password)

    if (!email || !password) {
      console.log("[signin] Missing email or password")
      return NextResponse.redirect(new URL(`/login?error=Missing credentials`, req.url))
    }

    // Find user
    console.log("[signin] Querying database for user:", email)
    const user = await db.user.findUnique({
      where: { email },
    })

    console.log("[signin] User found:", !!user)
    if (!user || !user.password) {
      console.log("[signin] User not found or no password")
      return NextResponse.redirect(new URL(`/login?error=Invalid credentials`, req.url))
    }

    // Verify password
    console.log("[signin] Verifying password...")
    const isValid = await bcrypt.compare(password, user.password)
    console.log("[signin] Password valid:", isValid)

    if (!isValid) {
      console.log("[signin] Invalid password for user:", email)
      return NextResponse.redirect(new URL(`/login?error=Invalid credentials`, req.url))
    }

    // Create JWT
    console.log("[signin] Creating JWT...")
    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret)

    console.log("[signin] JWT created")

    // Set auth cookie
    const cookieStore = await cookies()
    cookieStore.set({
      name: "authjs.session-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    console.log("[signin] Cookie set, redirecting to:", callbackUrl)
    console.log("[signin] Login successful:", email)

    return NextResponse.redirect(new URL(callbackUrl, req.url), {
      status: 302,
    })
  } catch (error) {
    console.error("[signin] Caught error:", error)
    return NextResponse.redirect(new URL(`/login?error=An error occurred`, req.url))
  }
}
