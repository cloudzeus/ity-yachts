import "server-only"
import { spawn } from "child_process"
import { mkdtemp, readFile, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"

/**
 * Re-encode an uploaded video for the web.
 *
 * Video used to be stored exactly as it arrived, which is how a 33 MB drone
 * clip at 23 Mbps ended up as a decorative background on the homepage. These
 * are muted, looping, scrimmed backgrounds, so the settings are chosen for
 * that job rather than for archival quality:
 *
 *   1600px wide  — sharp enough for a full-width hero, a quarter of the pixels
 *   CRF 31       — measured against the source; detail holds, no blocking
 *   25 fps       — a slow aerial pan does not need 30, and it saves ~15%
 *   no audio     — every one of these plays muted
 *   faststart    — the moov atom first, so playback starts before the download
 *                  finishes rather than after
 *
 * On the sample footage this took 33.10 MB to 3.97 MB with no visible loss.
 */

export const VIDEO_PRESET = {
  width: 1600,
  crf: 31,
  fps: 25,
  keepAudio: false,
} as const

export interface TranscodeResult {
  buffer: Buffer
  width: number
  height: number
  durationSeconds: number | null
}

/** Run a binary to completion, collecting stderr for the error message. */
function run(bin: string, args: string[], timeoutMs = 10 * 60 * 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args)
    let stderr = ""
    let stdout = ""

    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      reject(new Error(`${bin} timed out after ${Math.round(timeoutMs / 1000)}s`))
    }, timeoutMs)

    child.stdout.on("data", (d) => { stdout += d.toString() })
    child.stderr.on("data", (d) => { stderr += d.toString() })
    child.on("error", (err) => { clearTimeout(timer); reject(err) })
    child.on("close", (code) => {
      clearTimeout(timer)
      if (code === 0) resolve(stdout)
      // ffmpeg writes everything to stderr; the tail is the useful part.
      else reject(new Error(`${bin} exited ${code}: ${stderr.slice(-600)}`))
    })
  })
}

/** Is ffmpeg available? The runtime image has it; a dev machine may not. */
export async function hasFfmpeg(): Promise<boolean> {
  try {
    await run("ffmpeg", ["-version"], 10_000)
    return true
  } catch {
    return false
  }
}

export async function transcodeVideo(input: Buffer, ext = "mp4"): Promise<TranscodeResult> {
  const dir = await mkdtemp(join(tmpdir(), "iyc-video-"))
  const inPath = join(dir, `in.${ext}`)
  const outPath = join(dir, "out.mp4")

  try {
    await writeFile(inPath, input)

    const args = [
      "-y", "-v", "error",
      "-i", inPath,
      ...(VIDEO_PRESET.keepAudio ? ["-c:a", "aac", "-b:a", "128k"] : ["-an"]),
      "-c:v", "libx264",
      "-profile:v", "high",
      "-pix_fmt", "yuv420p",
      "-crf", String(VIDEO_PRESET.crf),
      "-preset", "slow",
      "-r", String(VIDEO_PRESET.fps),
      // A keyframe every two seconds, so a loop restarts cleanly.
      "-g", String(VIDEO_PRESET.fps * 2),
      /* Never upscale: `min(width,iw)` leaves a small source alone, and -2
         keeps the height even, which H.264 requires. */
      "-vf", `scale='min(${VIDEO_PRESET.width},iw)':-2:flags=lanczos`,
      "-movflags", "+faststart",
      outPath,
    ]

    await run("ffmpeg", args)
    const buffer = await readFile(outPath)

    let width = 0
    let height = 0
    let durationSeconds: number | null = null
    try {
      const probe = await run("ffprobe", [
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height:format=duration",
        "-of", "json",
        outPath,
      ], 30_000)
      const meta = JSON.parse(probe)
      width = meta.streams?.[0]?.width ?? 0
      height = meta.streams?.[0]?.height ?? 0
      const d = Number.parseFloat(meta.format?.duration ?? "")
      durationSeconds = Number.isFinite(d) ? d : null
    } catch {
      // Dimensions are nice to have; a failed probe is not a failed transcode.
    }

    return { buffer, width, height, durationSeconds }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
