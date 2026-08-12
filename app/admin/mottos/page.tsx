import { db } from "@/lib/db"
import { MottosClient } from "./mottos-client"

export const dynamic = "force-dynamic"

export const metadata = { title: "Mottos — IYC Admin" }

export default async function MottosPage() {
  const mottos = await db.motto.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  })

  return <MottosClient initialData={JSON.parse(JSON.stringify(mottos))} />
}
