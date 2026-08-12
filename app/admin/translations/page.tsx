import { db } from "@/lib/db"
import { TranslationsClient } from "./translations-client"
import { loadCatalogueTranslations } from "@/lib/catalogue-translations"

export const dynamic = "force-dynamic"

export const metadata = { title: "Site Translations — IYC Admin" }

export default async function TranslationsPage() {
  const [translations, catalogue] = await Promise.all([
    db.siteTranslation.findMany({ orderBy: [{ namespace: "asc" }, { key: "asc" }] }),
    // NAUSYS catalogue names — equipment, services, locations. They live in
    // their own tables rather than site_translations, and NAUSYS never sends
    // Greek, so this screen is where their Greek has to come from.
    loadCatalogueTranslations(),
  ])

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col overflow-hidden">
      <TranslationsClient initialData={[...translations, ...catalogue]} />
    </div>
  )
}
