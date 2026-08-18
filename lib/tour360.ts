import type { Locale } from "@/lib/locale"

/**
 * The 360° walkthroughs, and what is left of the tool that made them.
 *
 * They were built in Kolor Panotour Pro 2.5.14, which exported a krpano player
 * and lived at iyc.de/dl/360_degrees. Panotour was discontinued in 2018 and
 * there is no project file, so nothing can be re-exported: what sits on that
 * server is the only copy, and that server is being switched off.
 *
 * What it left behind is not a closed format, which is the whole reason this
 * is possible. Each scene is a cube rendered as a pyramid of plain JPEGs:
 *
 *     {folder}/{face 0-5}/{level}/{row}_{column}.jpg
 *
 * with 512px tiles, three levels, and the faces in krpano's order — front,
 * right, back, left, up, down.
 *
 * Photo Sphere Viewer reads a cube of tiles too, with one condition krpano
 * does not share: the grid must be a power of two, and Panotour rendered 7x7
 * and 6x6. The levels below are 4x4, 3x3 and 2x2, so the only grid that fits
 * as it stands is the 1024px base — the fallback image, a quarter of the
 * detail that was shot. Rather than accept that, scripts/retile-tour360.mjs
 * stitches each face back to its full size and cuts it again into 8x8: 3584
 * into eight of 448, 3072 into eight of 384, no resampling, into a `psv`
 * folder beside the originals. The originals stay exactly as krpano wrote
 * them, so nothing is lost if this ever has to be redone differently.
 *
 * Beside the pyramid each scene also carries `mobile/0..5.jpg`, six whole
 * 1024px faces. Those are the base layer: one small request per face fills the
 * sphere immediately, and the tiles sharpen it as they arrive. They are not
 * good enough to show on their own.
 */

/** krpano writes the cube faces in this order, and the folders are indexed by it. */
export const KRPANO_FACES = ["front", "right", "back", "left", "up", "down"] as const

/**
 * Photo Sphere Viewer names its faces; krpano numbers them. The order differs,
 * so the two are mapped by name rather than by position — lining the arrays up
 * by index puts the ceiling on the port side.
 */
export const PSV_FACE_TO_KRPANO: Record<string, number> = {
  left: 3,
  front: 0,
  right: 1,
  back: 2,
  top: 4,
  bottom: 5,
}

export interface Tour360Level {
  /** The level's own folder name, as krpano wrote it. */
  level: string
  /** Pixel size of the whole face at this level. */
  size: number
  /** Tiles per side — size / tilesize, rounded up. */
  grid: number
}

export interface Tour360Scene {
  /** Folder under the tour, e.g. "saloon_660". */
  folder: string
  /** What the room is called, in each language. */
  title: Partial<Record<Locale, string>>
  /** Edge of one tile, in pixels. 512 in every tour we have. */
  tilesize: number
  /**
   * Coarsest first, and held per scene rather than per tour: the rooms were
   * not all shot at the same resolution. Maistros alone has a saloon at
   * 3584px a face and a foredeck at 3072, so one list for the whole tour would
   * ask for a row of tiles that was never rendered.
   *
   * Kept for provenance and for re-cutting; the viewer reads `psv`.
   */
  levels: Tour360Level[]
  /** The re-cut grid the viewer actually loads. Absent if it could not be cut. */
  psv?: { grid: number; size: number; tile: number } | null
}

export interface Tour360 {
  /** Folder under the tour base URL, e.g. "210925_maistros". */
  base: string
  scenes: Tour360Scene[]
}

/**
 * Where the tiles are served from.
 *
 * Set to the Bunny pull zone in production. It falls back to the original
 * host so the viewer can be built and checked against the live tours while
 * they are still up — but that is a courtesy, not a plan: iyc.de is going
 * away, and a deployment that still points at it will go dark with it.
 */
export const TOUR360_BASE =
  process.env.NEXT_PUBLIC_TOUR360_BASE?.replace(/\/+$/, "") ||
  "https://www.iyc.de/dl/360_degrees"

/** Read a stored tour off a yacht row, or null when there is none. */
export function asTour360(value: unknown): Tour360 | null {
  if (!value || typeof value !== "object") return null
  const t = value as Partial<Tour360>
  if (!t.base || !Array.isArray(t.scenes) || !t.scenes.length) return null
  /* A scene without a re-cut grid cannot be drawn, so it is left out rather
     than shown as a broken room in the strip. */
  const scenes = t.scenes.filter((s) => s && s.folder && s.psv && s.psv.grid > 0)
  if (!scenes.length) return null
  return { base: t.base, scenes }
}

/** One tile, in Photo Sphere Viewer's terms, from the re-cut 8x8 grid. */
export function tileUrl(
  tour: Tour360,
  scene: Tour360Scene,
  face: string,
  col: number,
  row: number
): string | null {
  const krpano = PSV_FACE_TO_KRPANO[face]
  if (krpano === undefined) return null
  /* Row first, as krpano wrote it and as the re-cut kept it. */
  return `${TOUR360_BASE}/${tour.base}/${scene.folder}/psv/${krpano}/${row}_${col}.jpg`
}

/** The scene's title in this language, falling back rather than showing blank. */
export function sceneTitle(scene: Tour360Scene, locale: Locale): string {
  const t = scene.title || {}
  return (t[locale] || t.en || t.el || t.de || scene.folder).trim()
}

/**
 * The six whole faces of a scene, in Photo Sphere Viewer's own face order.
 * Used as the base layer under the tiles.
 */
export function faceUrls(tour: Tour360, folder: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [psv, krpano] of Object.entries(PSV_FACE_TO_KRPANO)) {
    out[psv] = `${TOUR360_BASE}/${tour.base}/${folder}/mobile/${krpano}.jpg`
  }
  return out
}
