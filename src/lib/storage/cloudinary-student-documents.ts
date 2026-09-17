import "server-only"
import { createHash } from "node:crypto"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
])
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,pdf"

export type StudentDocumentUpload = {
  fileUrl: string
  fileName: string
  cloudinaryPublicId: string
  mimeType: string
  fileSize: number
}

export type StudentDocumentUploadSignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  folder: string
  allowedFormats: string
  signature: string
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) return null
  return { cloudName, apiKey, apiSecret }
}

export function validateStudentDocumentFile(file: { name: string; type: string; size: number }): string | null {
  if (!file.name || !file.type || !Number.isFinite(file.size) || file.size <= 0) return "invalid"
  if (file.size > MAX_FILE_SIZE || !ALLOWED_MIME_TYPES.has(file.type)) return "unsupported"
  return null
}

export function createStudentDocumentUploadSignature(
  schoolId: string,
  file: { name: string; type: string; size: number }
): StudentDocumentUploadSignature | null {
  if (validateStudentDocumentFile(file)) return null
  const config = getCloudinaryConfig()
  if (!config) return null

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `benwil-school/${schoolId}/student-documents`
  const toSign = `allowed_formats=${ALLOWED_FORMATS}&folder=${folder}&timestamp=${timestamp}${config.apiSecret}`
  const signature = createHash("sha1").update(toSign).digest("hex")

  return { cloudName: config.cloudName, apiKey: config.apiKey, timestamp, folder, allowedFormats: ALLOWED_FORMATS, signature }
}

export function isTrustedStudentDocumentUpload(upload: StudentDocumentUpload, schoolId: string): boolean {
  const config = getCloudinaryConfig()
  if (!config || validateStudentDocumentFile({ name: upload.fileName, type: upload.mimeType, size: upload.fileSize })) return false

  const expectedFolder = `benwil-school/${schoolId}/student-documents/`
  return upload.cloudinaryPublicId.startsWith(expectedFolder) && upload.fileUrl.startsWith(`https://res.cloudinary.com/${config.cloudName}/`)
}

export const studentDocumentUploadLimits = {
  maxFileSize: MAX_FILE_SIZE,
  acceptedMimeTypes: [...ALLOWED_MIME_TYPES],
}

/* ---------------------------------------------------------------------------
 * Student profile photo
 *
 * Deliberately a separate lane from documents, with its own folder, its own
 * MIME whitelist and a tighter size cap: a profile photo is displayed inline
 * everywhere a student appears, so a PDF or a 10 MB original would be wrong
 * in a way a filed document never is.
 * ------------------------------------------------------------------------- */

const MAX_PHOTO_SIZE = 2 * 1024 * 1024
const ALLOWED_PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const ALLOWED_PHOTO_FORMATS = "jpg,jpeg,png,webp"

function studentPhotoFolder(schoolId: string) {
  return `benwil-school/${schoolId}/student-photos`
}

export function validateStudentPhotoFile(file: { name: string; type: string; size: number }): string | null {
  if (!file.name || !file.type || !Number.isFinite(file.size) || file.size <= 0) return "invalid"
  if (file.size > MAX_PHOTO_SIZE || !ALLOWED_PHOTO_MIME_TYPES.has(file.type)) return "unsupported"
  return null
}

export function createStudentPhotoUploadSignature(
  schoolId: string,
  file: { name: string; type: string; size: number }
): StudentDocumentUploadSignature | null {
  if (validateStudentPhotoFile(file)) return null
  const config = getCloudinaryConfig()
  if (!config) return null

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = studentPhotoFolder(schoolId)
  const toSign = `allowed_formats=${ALLOWED_PHOTO_FORMATS}&folder=${folder}&timestamp=${timestamp}${config.apiSecret}`
  const signature = createHash("sha1").update(toSign).digest("hex")

  return {
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    timestamp,
    folder,
    allowedFormats: ALLOWED_PHOTO_FORMATS,
    signature,
  }
}

/**
 * The photo is stored as a bare URL on the student row, so there is no
 * public id to check the folder against — the URL has to carry its own proof.
 * A Cloudinary secure_url embeds the upload folder, so requiring both the
 * configured cloud and this school's photo folder is what stops a tampered
 * payload from pointing the field at another school's photo or at an
 * arbitrary host.
 */
export function isTrustedStudentPhotoUrl(url: string, schoolId: string): boolean {
  const config = getCloudinaryConfig()
  if (!config) return false

  return (
    url.startsWith(`https://res.cloudinary.com/${config.cloudName}/`) &&
    url.includes(`/${studentPhotoFolder(schoolId)}/`)
  )
}

export const studentPhotoUploadLimits = {
  maxFileSize: MAX_PHOTO_SIZE,
  acceptedMimeTypes: [...ALLOWED_PHOTO_MIME_TYPES],
}
