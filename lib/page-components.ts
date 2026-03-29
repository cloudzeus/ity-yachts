// ── Page Component Registry ──────────────────────────────────
// Defines available component types that can be placed on pages.
// Each type has a key, display name, description, and default props/dataSource.

export interface ComponentDefinition {
  type: string
  label: string
  description: string
  category: "content" | "data" | "media" | "layout"
  defaultProps: Record<string, unknown>
  defaultDataSource: Record<string, unknown>
}

export const COMPONENT_REGISTRY: Record<string, ComponentDefinition> = {
  "team-grid": {
    type: "team-grid",
    label: "Team Grid",
    description: "Displays company staff members in a responsive grid with photos, names, and positions",
    category: "data",
    defaultProps: {
      columns: 4,
      variant: "minimal",    // "minimal" | "card" | "overlay"
      showBio: false,
      maxMembers: 0,         // 0 = all
    },
    defaultDataSource: {
      model: "staff",
      filter: { status: "active" },
      orderBy: { sortOrder: "asc" },
    },
  },
}

export function getComponentDefinition(type: string): ComponentDefinition | null {
  return COMPONENT_REGISTRY[type] ?? null
}

export function getComponentTypes(): ComponentDefinition[] {
  return Object.values(COMPONENT_REGISTRY)
}
