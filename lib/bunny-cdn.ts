const BUNNY_API_URL = "https://api.bunnycdn.com"
const BUNNY_STORAGE_URL = "https://storage.bunnycdn.com"

function storageZone() {
  return process.env.BUNNY_STORAGE_ZONE || ""
}
function storagePassword() {
  return process.env.BUNNY_STORAGE_PASSWORD || ""
}

export interface BunnyFile {
  ObjectName: string
  Path: string
  IsDirectory: boolean
  Length: number
  LastChanged: string
  ContentType: string
  StorageZoneName: string
}

interface BunnyCDNUploadOptions {
  storageZone: string
  fileName: string
  file: Buffer | Blob
}

/** Upload file to Bunny CDN Storage */
export async function uploadToBunnyCDN({
  storageZone,
  fileName,
  file,
}: BunnyCDNUploadOptions): Promise<{ success: boolean; url?: string }> {
  try {
    const buffer = file instanceof Blob ? await file.arrayBuffer() : file

    const response = await fetch(
      `${BUNNY_STORAGE_URL}/${storageZone}/${fileName}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          AccessKey: process.env.BUNNY_STORAGE_PASSWORD || "",
        },
        body: buffer as unknown as BodyInit,
      }
    )

    if (response.ok) {
      const cdnUrl = `${process.env.NEXT_PUBLIC_BUNNY_CDN_URL}/${fileName}`
      return { success: true, url: cdnUrl }
    }

    return { success: false }
  } catch (error) {
    console.error("Bunny CDN upload error:", error)
    return { success: false }
  }
}

/** List files and sub-folders in a directory */
export async function listDirectory(folder: string): Promise<BunnyFile[]> {
  const zone = storageZone()
  const path = folder ? `${zone}/${folder}/` : `${zone}/`

  const res = await fetch(`${BUNNY_STORAGE_URL}/${path}`, {
    method: "GET",
    headers: {
      AccessKey: storagePassword(),
      accept: "application/json",
    },
  })

  if (!res.ok) {
    console.error("[bunny] listDirectory failed:", res.status, await res.text())
    return []
  }

  return res.json()
}

/** Create a folder (Bunny CDN uses trailing-slash PUT) */
export async function createFolder(folderPath: string): Promise<boolean> {
  const zone = storageZone()
  // Ensure trailing slash — required by Bunny CDN to create a directory
  const path = folderPath.endsWith("/") ? folderPath : `${folderPath}/`

  const res = await fetch(`${BUNNY_STORAGE_URL}/${zone}/${path}`, {
    method: "PUT",
    headers: {
      AccessKey: storagePassword(),
      "Content-Length": "0",
    },
    body: "",
  })

  if (!res.ok) {
    console.error("[bunny] createFolder failed:", res.status, await res.text())
  }
  return res.ok
}

/** Delete a file or folder from Bunny CDN Storage */
export async function deleteObject(objectPath: string): Promise<boolean> {
  const zone = storageZone()

  const res = await fetch(`${BUNNY_STORAGE_URL}/${zone}/${objectPath}`, {
    method: "DELETE",
    headers: {
      AccessKey: storagePassword(),
    },
  })

  if (!res.ok) {
    console.error("[bunny] deleteObject failed:", res.status, await res.text())
  }
  return res.ok
}

/** Get CDN URL for a file */
export function getCDNUrl(fileName: string): string {
  return `${process.env.NEXT_PUBLIC_BUNNY_CDN_URL}/${fileName}`
}

/** Purge CDN cache for a file */
export async function purgeCDNCache(fileName: string): Promise<boolean> {
  try {
    const response = await fetch(`${BUNNY_API_URL}/purge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        AccessKey: process.env.BUNNY_API_KEY || "",
      },
      body: JSON.stringify({
        url: `${process.env.NEXT_PUBLIC_BUNNY_CDN_URL}/${fileName}`,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Bunny CDN purge error:", error)
    return false
  }
}
