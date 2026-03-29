import { db } from "@/lib/db"
import { TranslationsClient } from "./translations-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Site Translations — IYC Admin" }

export default async function TranslationsPage() {
  const translations = await db.siteTranslation.findMany({
    orderBy: [{ namespace: "asc" }, { key: "asc" }],
  })

  return <TranslationsClient initialData={translations} />
}
