import { jwtVerify } from "jose"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { DEFAULT_LOCALE, isLocale, stripLocale } from "@/lib/locale"

const ADMIN_ROLES = ["ADMIN", "MANAGER", "EDITOR", "EMPLOYEE"]
const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret-change-me")

/** The server reads the visitor's language off this rather than guessing. */
export const LOCALE_HEADER = "x-iyc-locale"

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
    } catch {
      return NextResponse.redirect(new URL("/login", nextUrl))
    }
    return NextResponse.next()
  }

  /* Language routing. `/el/fleet` is rewritten to `/fleet` — the app keeps one
     set of route files — and the locale travels on a request header that the
     root layout reads. A rewrite, not a redirect: the prefixed URL is the real
     address of the Greek page and has to stay in the address bar for it to be
     indexable. */
  const first = nextUrl.pathname.split("/").filter(Boolean)[0]
  const locale = isLocale(first) ? first : DEFAULT_LOCALE

  const headers = new Headers(req.headers)
  headers.set(LOCALE_HEADER, locale)

  if (locale === DEFAULT_LOCALE) {
    return NextResponse.next({ request: { headers } })
  }

  const url = nextUrl.clone()
  url.pathname = stripLocale(nextUrl.pathname)
  return NextResponse.rewrite(url, { request: { headers } })
}

export const config = {
  /* Everything a reader sees, and nothing else. Excluding the API matters:
     /api/translations must not be rewritten, and neither must the files that
     have to stay at a fixed address — robots, sitemap, feed, llms.txt. */
  matcher: [
    "/admin/:path*",
    /* Written out rather than built from LOCALES: Next requires the
       matcher to be static strings it can read without executing anything. */
    "/(el|de)/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|feed.xml|llms.txt|manifest.webmanifest|\\.well-known|brand|.*\\..*).*)",
  ],
}
