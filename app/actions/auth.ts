"use server"

import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-change-me")

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password required" }
  }

  try {
    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user || !user.password) {
      return { error: "Invalid credentials" }
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return { error: "Invalid credentials" }
    }

    const token = await new SignJWT({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      sub: user.id,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret)

    const cookieStore = await cookies()
    cookieStore.set({
      name: "authjs.session-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    })

    return { success: true }
  } catch (error) {
    console.error("[Server Action] Login error:", error)
    return { error: "An error occurred during login" }
  }
}
