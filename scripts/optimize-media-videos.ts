import "dotenv/config"
import fs from "fs"
import os from "os"
import path from "path"
import { spawn } from "child_process"
import { db } from "../lib/db"

/**
 * Re-encode every video already in the media library.
 *
 * The upload route transcodes from now on, but everything uploaded before it
 * existed is still sitting on the CDN at camera bitrates — 836 MB across
 * twenty files, the largest 243 MB.
 *
 * Each file is replaced at its own path, so every URL already saved against
 * it keeps working and immediately serves the smaller file. The original is
 * copied to `_originals/<path>` first: overwriting is otherwise irreversible,
 * and a master worth keeping should not vanish because of a bitrate decision.
 *
 * Safe to re-run — anything already stamped `optimizedAt` is skipped.
 */

const ZONE = process.env.BUNNY_STORAGE_ZONE!
const KEY = process.env.BUNNY_STORAGE_PASSWORD!
const API_KEY = process.env.BUNNY_API_KEY
const CDN = process.env.NEXT_PUBLIC_BUNNY_CDN_URL!

const PRESET = { width: 1600, crf: 31, fps: 25 }
const mb = (n: number) => (n / 1048576).toFixed(2)

function run(bin: string, args: string[], timeoutMs = 30 * 60 * 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args)
    let out = ""
    let err = ""
    const timer = setTimeout(() => { child.kill("SIGKILL"); reject(new Error(`${bin} timed out`)) }, timeoutMs)
    child.stdout.on("data", (d) => { out += d })
    child.stderr.on("data", (d) => { err += d })
    child.on("error", (e) => { clearTimeout(timer); reject(e) })
    child.on("close", (c) => { clearTimeout(timer); c === 0 ? resolve(out) : reject(new Error(`${bin} ${c}: ${err.slice(-400)}`)) })
  })
}

async function put(remotePath: string, body: Buffer) {
  const res = await fetch(`https://storage.bunnycdn.com/${ZONE}/${remotePath}`, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream", AccessKey: KEY },
    body: new Uint8Array(body),
  })
  if (!res.ok) throw new Error(`upload ${res.status} for ${remotePath}`)
}

async function purge(url: string) {
  if (!API_KEY) return
  await fetch(`https://api.bunnycdn.com/purge?url=${encodeURIComponent(url)}`, {
    method: "POST",
    headers: { AccessKey: API_KEY },
  }).catch(() => {})
}

async function main() {
  const rows = await db.media.findMany({
    where: { mimeType: { startsWith: "video" }, optimizedAt: null },
    select: { id: true, path: true, url: true, size: true, name: true },
    orderBy: { size: "desc" },
  })

  console.log(`${rows.length} video(s) to process\n`)

  let savedBytes = 0
  let done = 0
  let skipped = 0
  let failed = 0

  for (const [i, row] of rows.entries()) {
    const label = `[${i + 1}/${rows.length}] ${row.path.split("/").pop()!.slice(0, 52)}`
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "iyc-opt-"))
    const ext = path.extname(row.path).slice(1) || "mp4"
    const inPath = path.join(dir, `in.${ext}`)
    const outPath = path.join(dir, "out.mp4")

    try {
      const res = await fetch(row.url)
      if (!res.ok) throw new Error(`download ${res.status}`)
      const original = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(inPath, original)

      await run("ffmpeg", [
        "-y", "-v", "error", "-i", inPath,
        "-an", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p",
        "-crf", String(PRESET.crf), "-preset", "slow",
        "-r", String(PRESET.fps), "-g", String(PRESET.fps * 2),
        "-vf", `scale='min(${PRESET.width},iw)':-2:flags=lanczos`,
        "-movflags", "+faststart", outPath,
      ])

      const encoded = fs.readFileSync(outPath)

      // Never make a file bigger. An already-small clip is left exactly as is.
      if (encoded.length >= original.length) {
        await db.media.update({ where: { id: row.id }, data: { optimizedAt: new Date() } })
        console.log(`${label}\n    ${mb(original.length)} MB — already web-sized, left alone`)
        skipped++
        continue
      }

      let width: number | undefined
      let height: number | undefined
      try {
        const probe = JSON.parse(await run("ffprobe", [
          "-v", "error", "-select_streams", "v:0",
          "-show_entries", "stream=width,height", "-of", "json", outPath,
        ], 60_000))
        width = probe.streams?.[0]?.width
        height = probe.streams?.[0]?.height
      } catch { /* dimensions are a nicety */ }

      // The master, kept before anything is overwritten.
      await put(`_originals/${row.path}`, original)
      await put(row.path, encoded)
      await purge(row.url)

      await db.media.update({
        where: { id: row.id },
        data: {
          size: encoded.length,
          originalSize: original.length,
          optimizedAt: new Date(),
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
        },
      })

      savedBytes += original.length - encoded.length
      done++
      const pct = Math.round(100 - (encoded.length / original.length) * 100)
      console.log(`${label}\n    ${mb(original.length)} MB -> ${mb(encoded.length)} MB  (-${pct}%)  ${width}x${height}`)
    } catch (error) {
      failed++
      console.error(`${label}\n    FAILED, original untouched: ${error instanceof Error ? error.message : error}`)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }

  console.log(`\n${done} optimised, ${skipped} already small, ${failed} failed`)
  console.log(`total saved: ${mb(savedBytes)} MB`)
  console.log(`originals preserved under ${CDN}/_originals/`)
  await db.$disconnect()
}

main()
