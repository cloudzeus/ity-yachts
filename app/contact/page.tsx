import { db } from "@/lib/db"
import { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ContactPageClient } from "@/components/contact/contact-page-client"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Contact — IYC Yachts",
  description: "Get in touch with IYC Ionische Yacht Charter. Offices in Munich and Lefkada, Greece. We're here to help plan your perfect yacht charter.",
  openGraph: {
    title: "Contact — IYC Yachts",
    description: "Get in touch with IYC Ionische Yacht Charter. Offices in Munich and Lefkada.",
  },
}

export default async function ContactPage() {
  const staff = await db.staff.findMany({
    where: { status: "active" },
    select: {
      id: true,
      name: true,
      position: true,
      department: true,
      image: true,
      bio: true,
      email: true,
      phone: true,
      mobile: true,
      city: true,
      sortOrder: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  })

  // Pass raw JSON fields — TeamGrid resolves language internally
  const staffData = staff.map((s) => ({
    id: s.id,
    name: s.name,
    position: (s.position ?? {}) as Record<string, string>,
    department: (s.department ?? {}) as Record<string, string>,
    bio: (s.bio ?? {}) as Record<string, string>,
    image: s.image,
    sortOrder: s.sortOrder,
  }))

  return (
    <main>
      <div
        className="relative z-10 min-h-screen"
        style={{ background: "#060c27", clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <SiteHeader />
        <ContactPageClient staff={staffData} />
      </div>
      <SiteFooter />
    </main>
  )
}
