import { jwtVerify } from "jose"
import { cookies } from "next/headers"

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-change-me")

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
}

export interface Session {
  user?: SessionUser
}

export async function getSession(): Promise<Session> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("authjs.session-token")?.value

    if (!token) {
      return {}
    }

    const verified = await jwtVerify(token, secret)
    const payload = verified.payload as any

    return {
      user: {
        id: payload.id || payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    }
  } catch (err) {
    return {}
  }
}
