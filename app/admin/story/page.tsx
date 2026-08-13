import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-session"
import { StoryEditor } from "./story-editor"

export const dynamic = "force-dynamic"

export const metadata = { title: "Our story — IYC Admin" }

export default async function AdminStoryPage() {
  const session = await getSession()
  if (!session.user || !["ADMIN", "MANAGER", "EDITOR"].includes(session.user.role)) {
    redirect("/login")
  }

  return <StoryEditor />
}
