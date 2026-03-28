import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"

export const dynamic = "force-dynamic"

export const metadata = {
  title: { default: "Admin — IYC Yachts", template: "%s — IYC Admin" },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface)" }}>
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main
          className="flex-1 overflow-y-auto p-6"
          style={{ background: "var(--surface)" }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
