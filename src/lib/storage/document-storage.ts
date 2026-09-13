import "server-only"

export type UploadedFile = { url: string; fileName: string }

export interface DocumentStorage {
  upload(file: File, path: string): Promise<UploadedFile>
}

// No S3-compatible provider is configured in this environment. Wire one up
// here (e.g. an adapter around @aws-sdk/client-s3) and return it once
// credentials exist — every call site already goes through this function,
// so nothing else needs to change. Until then, document records are saved
// as metadata only; the UI reflects that rather than pretending files are
// stored somewhere.
export function getDocumentStorage(): DocumentStorage | null {
  return null
}
