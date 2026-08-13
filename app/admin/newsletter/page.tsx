import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { NewsletterClient } from "./newsletter-client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Newsletter — IYC Admin" }

export default async function AdminNewsletterPage() {
  const session = await getSession()
  if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
    redirect("/login")
  }
  return <NewsletterClient />
}
