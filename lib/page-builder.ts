import { PageSection, PageArea, PageBlock } from "@/types/page"

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function createSection(columns: 1 | 2 | 3 = 1): PageSection {
  const columnRatios = {
    1: "1" as const,
    2: "1:1" as const,
    3: "1:1:1" as const,
  }

  const areas = Array.from({ length: columns }, () => ({
    id: generateId(),
    blocks: [],
  })) as PageArea[]

  return {
    id: generateId(),
    columns,
    ratio: columnRatios[columns],
    height: "auto",
    areas,
  }
}

export function createBlock(type: PageBlock["type"]): PageBlock {
  const base = { id: generateId(), type } as any

  switch (type) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
    case "paragraph":
    case "richtext":
      return { ...base, content: "" }
    case "image":
      return { ...base, url: "", alt: "" }
    case "video":
      return { ...base, url: "" }
    default:
      return base
  }
}

export function updateSection(sections: PageSection[], sectionId: string, updates: Partial<PageSection>): PageSection[] {
  return sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
}

export function moveSection(sections: PageSection[], sectionId: string, direction: "up" | "down"): PageSection[] {
  const idx = sections.findIndex((s) => s.id === sectionId)
  if (idx === -1) return sections
  if (direction === "up" && idx === 0) return sections
  if (direction === "down" && idx === sections.length - 1) return sections

  const newIdx = direction === "up" ? idx - 1 : idx + 1
  const newSections = [...sections]
  ;[newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]]
  return newSections
}

export function deleteSection(sections: PageSection[], sectionId: string): PageSection[] {
  return sections.filter((s) => s.id !== sectionId)
}

export function updateBlock(
  sections: PageSection[],
  sectionId: string,
  areaId: string,
  blockId: string,
  updates: Partial<PageBlock>
): PageSection[] {
  return sections.map((s) =>
    s.id === sectionId
      ? {
          ...s,
          areas: s.areas.map((a) =>
            a.id === areaId
              ? {
                  ...a,
                  blocks: a.blocks.map((b) => (b.id === blockId ? { ...b, ...updates } as PageBlock : b)),
                }
              : a
          ),
        }
      : s
  )
}

export function deleteBlock(sections: PageSection[], sectionId: string, areaId: string, blockId: string): PageSection[] {
  return sections.map((s) =>
    s.id === sectionId
      ? {
          ...s,
          areas: s.areas.map((a) =>
            a.id === areaId ? { ...a, blocks: a.blocks.filter((b) => b.id !== blockId) } : a
          ),
        }
      : s
  )
}

export function moveBlock(
  sections: PageSection[],
  sectionId: string,
  areaId: string,
  blockId: string,
  direction: "up" | "down"
): PageSection[] {
  return sections.map((s) =>
    s.id === sectionId
      ? {
          ...s,
          areas: s.areas.map((a) => {
            if (a.id !== areaId) return a
            const idx = a.blocks.findIndex((b) => b.id === blockId)
            if (idx === -1) return a
            if (direction === "up" && idx === 0) return a
            if (direction === "down" && idx === a.blocks.length - 1) return a

            const newIdx = direction === "up" ? idx - 1 : idx + 1
            const newBlocks = [...a.blocks]
            ;[newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]]
            return { ...a, blocks: newBlocks }
          }),
        }
      : s
  )
}

export function addBlockToArea(sections: PageSection[], sectionId: string, areaId: string, block: PageBlock): PageSection[] {
  return sections.map((s) =>
    s.id === sectionId
      ? {
          ...s,
          areas: s.areas.map((a) => (a.id === areaId ? { ...a, blocks: [...a.blocks, block] } : a)),
        }
      : s
  )
}
