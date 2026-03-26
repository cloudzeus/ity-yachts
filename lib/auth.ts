import { NextAuth } from "@auth/nextjs"
import type { NextAuthConfig } from "@auth/nextjs"
import Credentials from "@auth/core/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email as string },
          })

          if (!user || !user.password) {
            return null
          }

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!valid) return null

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          }
        } catch (error) {
          console.error("[Auth] Authorization error:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async authorized() {
      return true
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }: any) {
      if (token && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session.user as any).id = token.id
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  session: { strategy: "jwt" },
  trustHost: true,
}

export const { auth, handlers } = NextAuth(authConfig)
