import { db } from "@/lib/db"
import { TeamGrid, type StaffMember } from "./team-grid"

interface PageComponentData {
  id: string
  type: string
  name: string
  props: Record<string, unknown>
  dataSource: Record<string, unknown>
  sortOrder: number
  status: string
}

// ── Data resolvers ─────────────────────────────────────────────
// Each resolver fetches data for a specific model type.

async function resolveStaffData(dataSource: Record<string, unknown>) {
  const filter = (dataSource.filter as Record<string, unknown>) ?? { status: "active" }
  const orderBy = (dataSource.orderBy as Record<string, string>) ?? { sortOrder: "asc" }

  const staff = await db.staff.findMany({
    where: filter,
    select: {
      id: true,
      name: true,
      position: true,
      department: true,
      image: true,
      bio: true,
      sortOrder: true,
    },
    orderBy: Object.entries(orderBy).map(([k, v]) => ({ [k]: v })),
  })

  return staff as unknown as StaffMember[]
}

async function resolveDataSource(dataSource: Record<string, unknown>) {
  const model = dataSource.model as string | undefined
  if (!model) return null

  switch (model) {
    case "staff":
      return resolveStaffData(dataSource)
    default:
      console.warn(`[PageComponentRenderer] Unknown data source model: ${model}`)
      return null
  }
}

// ── Renderer ───────────────────────────────────────────────────

interface PageComponentRendererProps {
  components: PageComponentData[]
  lang?: string
}

export async function PageComponentRenderer({ components, lang = "en" }: PageComponentRendererProps) {
  const active = components.filter((c) => c.status === "active").sort((a, b) => a.sortOrder - b.sortOrder)

  const rendered = await Promise.all(
    active.map(async (comp) => {
      switch (comp.type) {
        case "team-grid": {
          const staff = await resolveDataSource(comp.dataSource)
          if (!staff) return null
          const props = comp.props as { columns?: number; variant?: "minimal" | "card" | "overlay"; showBio?: boolean; maxMembers?: number }
          return (
            <TeamGrid
              key={comp.id}
              staff={staff as StaffMember[]}
              columns={props.columns}
              variant={props.variant}
              maxMembers={props.maxMembers}
              lang={lang}
            />
          )
        }
        default:
          console.warn(`[PageComponentRenderer] Unknown component type: ${comp.type}`)
          return null
      }
    })
  )

  return <>{rendered}</>
}

// ── Helper: Fetch page components from DB ──────────────────────

export async function getPageComponents(pageId: string) {
  return db.pageComponent.findMany({
    where: { pageId },
    orderBy: { sortOrder: "asc" },
  }) as unknown as PageComponentData[]
}
