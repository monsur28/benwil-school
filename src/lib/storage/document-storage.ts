import "server-only"
import fs from "node:fs/promises"
import path from "node:path"

export type UploadedFile = {
  url: string
  fileName: string
  fileSize?: number
  mimeType?: string
}

export interface DocumentStorage {
  upload(file: File, relativePath: string): Promise<UploadedFile>
}

// Local filesystem storage provider for development and standalone hosting.
// Saves files under the public/ directory so Next.js static asset serving delivers
// them directly at /uploads/...
// When AWS S3 or Cloudflare R2 credentials are configured in the future,
// return an S3/R2 adapter here implementing DocumentStorage — all callers
// go through getDocumentStorage() so nothing else in the app needs to change.
export class LocalDocumentStorage implements DocumentStorage {
  private baseDir = path.join(process.cwd(), "public")

  async upload(file: File, relativePath: string): Promise<UploadedFile> {
    const cleanRelativePath = relativePath.replace(/^[/\\]+/, "")
    const fullPath = path.join(this.baseDir, cleanRelativePath)
    const dir = path.dirname(fullPath)
    await fs.mkdir(dir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(fullPath, buffer)

    const normalizedUrl = `/${cleanRelativePath.replace(/\\/g, "/")}`
    return {
      url: normalizedUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    }
  }
}

export function getDocumentStorage(): DocumentStorage {
  return new LocalDocumentStorage()
}
