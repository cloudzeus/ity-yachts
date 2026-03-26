// ── Background ────────────────────────────────────────────────
export interface SectionBackground {
  type: "none" | "color" | "image" | "video"
  color?: string                  // hex/css value
  imageUrl?: string
  videoUrl?: string
  opacity?: number                // 0–100, applied to bg layer
  position?: string               // CSS background-position, e.g. "center"
  size?: "cover" | "contain" | "auto"
}

// ── Scroll & Animation ────────────────────────────────────────
export type ScrollEffect = "none" | "parallax" | "fade-in" | "slide-up" | "slide-left" | "slide-right" | "zoom-in"
export type TextAnimation = "none" | "fade-words" | "split-chars" | "typewriter" | "blur-in"

export interface AnimationConfig {
  scrollEffect?: ScrollEffect
  textAnimation?: TextAnimation
  duration?: number               // ms, default 600
  delay?: number                  // ms, default 0
  easing?: "ease" | "ease-in" | "ease-out" | "spring"
}

// ── Blocks ────────────────────────────────────────────────────
export type PageBlock =
  | { id: string; type: "h1" | "h2" | "h3"; content: string; animation?: AnimationConfig }
  | { id: string; type: "paragraph"; content: string; animation?: AnimationConfig }
  | { id: string; type: "richtext"; content: string; animation?: AnimationConfig }
  | { id: string; type: "image"; url: string; alt: string; caption?: string }
  | { id: string; type: "video"; url: string; caption?: string }

// ── Area (column slot) ────────────────────────────────────────
export interface PageArea {
  id: string
  blocks: PageBlock[]
  background?: SectionBackground
  verticalAlign?: "top" | "center" | "bottom"
  horizontalAlign?: "left" | "center" | "right"
  paddingX?: number               // px
  paddingY?: number               // px
  animation?: AnimationConfig
}

// ── Section (row) ─────────────────────────────────────────────
export type ColumnRatio = "1" | "1:1" | "2:1" | "1:2" | "1:1:1" | "2:1:1" | "1:2:1" | "1:1:2"
export type SectionHeight = "auto" | "screen" | "half-screen" | number  // number = px

export interface PageSection {
  id: string
  columns: 1 | 2 | 3
  ratio: ColumnRatio
  height: SectionHeight
  background?: SectionBackground
  verticalAlign?: "top" | "center" | "bottom"
  paddingX?: number
  paddingY?: number
  animation?: AnimationConfig
  areas: PageArea[]
}

// ── Page Content ──────────────────────────────────────────────
export type PageContent = PageSection[]
