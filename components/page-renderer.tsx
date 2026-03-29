import Image from "next/image"
import { PageSection, PageBlock, PageArea, ColumnRatio, SectionHeight, SectionBackground } from "@/types/page"

function getGridCols(ratio: ColumnRatio): string {
  switch (ratio) {
    case "1": return "grid-cols-1"
    case "1:1": return "grid-cols-1 md:grid-cols-2"
    case "2:1": return "grid-cols-1 md:grid-cols-[2fr_1fr]"
    case "1:2": return "grid-cols-1 md:grid-cols-[1fr_2fr]"
    case "1:1:1": return "grid-cols-1 md:grid-cols-3"
    case "2:1:1": return "grid-cols-1 md:grid-cols-[2fr_1fr_1fr]"
    case "1:2:1": return "grid-cols-1 md:grid-cols-[1fr_2fr_1fr]"
    case "1:1:2": return "grid-cols-1 md:grid-cols-[1fr_1fr_2fr]"
    default: return "grid-cols-1"
  }
}

function getSectionHeight(height: SectionHeight): string {
  if (height === "auto") return ""
  if (height === "screen") return "min-h-screen"
  if (height === "half-screen") return "min-h-[50vh]"
  if (typeof height === "number") return ""
  return ""
}

function getSectionHeightStyle(height: SectionHeight): React.CSSProperties {
  if (typeof height === "number") return { minHeight: `${height}px` }
  return {}
}

function getAlignClass(align?: string): string {
  switch (align) {
    case "center": return "items-center"
    case "bottom": return "items-end"
    default: return "items-start"
  }
}

function getHAlignClass(align?: string): string {
  switch (align) {
    case "center": return "text-center"
    case "right": return "text-right"
    default: return "text-left"
  }
}

function BackgroundLayer({ bg }: { bg?: SectionBackground }) {
  if (!bg || bg.type === "none") return null
  const opacity = bg.opacity != null ? bg.opacity / 100 : 1

  if (bg.type === "color" && bg.color) {
    return <div className="absolute inset-0" style={{ backgroundColor: bg.color, opacity }} />
  }
  if (bg.type === "image" && bg.imageUrl) {
    return (
      <div className="absolute inset-0" style={{ opacity }}>
        <Image
          src={bg.imageUrl}
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: bg.position || "center" }}
        />
      </div>
    )
  }
  if (bg.type === "video" && bg.videoUrl) {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ opacity }}>
        <video
          src={bg.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
      </div>
    )
  }
  return null
}

function BlockRenderer({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "h1":
      return (
        <div>
          <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl" style={{ color: "#ffffff" }}>
            {block.content}
          </h1>
          {block.subheader && (
            <p className="mt-2 text-lg text-white/60">{block.subheader}</p>
          )}
        </div>
      )
    case "h2":
      return (
        <div>
          <h2 className="text-3xl font-bold md:text-4xl" style={{ color: "#ffffff" }}>
            {block.content}
          </h2>
          {block.subheader && (
            <p className="mt-2 text-lg text-white/60">{block.subheader}</p>
          )}
        </div>
      )
    case "h3":
      return (
        <div>
          <h3 className="text-2xl font-semibold md:text-3xl" style={{ color: "#ffffff" }}>
            {block.content}
          </h3>
          {block.subheader && (
            <p className="mt-1 text-base text-white/60">{block.subheader}</p>
          )}
        </div>
      )
    case "h4":
      return <h4 className="text-xl font-semibold" style={{ color: "#ffffff" }}>{block.content}</h4>
    case "h5":
      return <h5 className="text-lg font-semibold" style={{ color: "#ffffff" }}>{block.content}</h5>
    case "h6":
      return <h6 className="text-base font-semibold" style={{ color: "#ffffff" }}>{block.content}</h6>
    case "paragraph":
      return <p className="text-base leading-relaxed text-white/70">{block.content}</p>
    case "richtext":
      return (
        <div
          className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-a:text-[#83776d] prose-strong:text-white"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      )
    case "image":
      return (
        <figure>
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image src={block.url} alt={block.alt || ""} fill className="object-cover" />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-sm text-white/50">{block.caption}</figcaption>
          )}
        </figure>
      )
    case "video":
      return (
        <figure>
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <video src={block.url} controls className="h-full w-full object-cover" />
          </div>
          {block.caption && (
            <figcaption className="mt-2 text-sm text-white/50">{block.caption}</figcaption>
          )}
        </figure>
      )
    default:
      return null
  }
}

function AreaRenderer({ area }: { area: PageArea }) {
  const vAlign = getAlignClass(area.verticalAlign)
  const hAlign = getHAlignClass(area.horizontalAlign)

  return (
    <div
      className={`relative flex flex-col gap-4 ${vAlign} ${hAlign}`}
      style={{
        paddingLeft: area.paddingX ? `${area.paddingX}px` : undefined,
        paddingRight: area.paddingX ? `${area.paddingX}px` : undefined,
        paddingTop: area.paddingY ? `${area.paddingY}px` : undefined,
        paddingBottom: area.paddingY ? `${area.paddingY}px` : undefined,
      }}
    >
      <BackgroundLayer bg={area.background} />
      <div className="relative z-10 flex flex-col gap-4">
        {area.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </div>
  )
}

function SectionRenderer({ section }: { section: PageSection }) {
  const gridCols = getGridCols(section.ratio)
  const heightClass = getSectionHeight(section.height)
  const heightStyle = getSectionHeightStyle(section.height)
  const vAlign = getAlignClass(section.verticalAlign)

  return (
    <section
      className={`relative ${heightClass}`}
      style={{
        ...heightStyle,
        paddingLeft: section.paddingX ? `${section.paddingX}px` : undefined,
        paddingRight: section.paddingX ? `${section.paddingX}px` : undefined,
        paddingTop: section.paddingY ? `${section.paddingY}px` : undefined,
        paddingBottom: section.paddingY ? `${section.paddingY}px` : undefined,
      }}
    >
      <BackgroundLayer bg={section.background} />
      <div className={`relative z-10 mx-auto max-w-7xl px-6 grid gap-8 ${gridCols} ${vAlign}`}>
        {section.areas.map((area) => (
          <AreaRenderer key={area.id} area={area} />
        ))}
      </div>
    </section>
  )
}

interface PageRendererProps {
  sections: PageSection[]
}

export function PageRenderer({ sections }: PageRendererProps) {
  if (!sections || sections.length === 0) return null

  return (
    <div className="flex flex-col gap-0">
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  )
}
