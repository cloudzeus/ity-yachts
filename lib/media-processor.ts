// Server-only — do NOT import this file in client components (it imports sharp/ffmpeg)
import "server-only"
import sharp from "sharp"
import ffmpeg from "fluent-ffmpeg"
import { tmpdir } from "os"
import { join } from "path"
import { writeFile, readFile, unlink } from "fs/promises"
import { randomBytes } from "crypto"

export async function processImage(buffer: Buffer): Promise<{
  buffer: Buffer
  width: number
  height: number
  mimeType: "image/webp"
}> {
  const output = await sharp(buffer)
    .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85, alphaQuality: 90 })
    .toBuffer({ resolveWithObject: true })

  return {
    buffer: output.data,
    width: output.info.width,
    height: output.info.height,
    mimeType: "image/webp",
  }
}

/**
 * Convert any video to H.264 MP4 with good quality and smaller size.
 * Returns the processed buffer as MP4.
 */
export async function processVideo(buffer: Buffer): Promise<{
  buffer: Buffer
  mimeType: "video/mp4"
}> {
  const id = randomBytes(8).toString("hex")
  const inputPath = join(tmpdir(), `upload-${id}-input`)
  const outputPath = join(tmpdir(), `upload-${id}-output.mp4`)

  await writeFile(inputPath, buffer)

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-c:v", "libx264",       // H.264 codec
          "-preset", "medium",     // balance speed vs compression
          "-crf", "23",            // quality (18=high, 23=good, 28=low)
          "-c:a", "aac",           // AAC audio
          "-b:a", "128k",          // audio bitrate
          "-movflags", "+faststart", // web streaming
          "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", // ensure even dimensions
          "-y",                    // overwrite output
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run()
    })

    const outputBuffer = await readFile(outputPath)
    return { buffer: outputBuffer, mimeType: "video/mp4" }
  } finally {
    // Clean up temp files
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})
  }
}

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/")
}

export function isSvg(mimeType: string): boolean {
  return mimeType === "image/svg+xml"
}

export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/")
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-|-$/g, "")
}
