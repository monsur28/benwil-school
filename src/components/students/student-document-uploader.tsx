"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Check, FileUp, LoaderCircle, X } from "lucide-react"
import { getStudentDocumentUploadSignature } from "@/actions/students/get-document-upload-signature"
import type { StudentDocumentUpload } from "@/lib/storage/cloudinary-student-documents"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const ACCEPTED_FILES = ".pdf,.jpg,.jpeg,.png,.webp"

type CloudinaryUploadResponse = {
  secure_url?: string
  public_id?: string
  error?: { message?: string }
}

export function StudentDocumentUploader({
  value,
  onUploaded,
  onClear,
  disabled = false,
  inputId,
  showHint = true,
}: {
  value?: StudentDocumentUpload
  onUploaded: (document: StudentDocumentUpload) => void
  onClear: () => void
  disabled?: boolean
  inputId: string
  showHint?: boolean
}) {
  const t = useTranslations("students")
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setError(null)
    setIsUploading(true)
    try {
      const signatureResult = await getStudentDocumentUploadSignature({ name: file.name, type: file.type, size: file.size })
      if (!signatureResult.success) throw new Error(signatureResult.error)

      const { cloudName, apiKey, timestamp, folder, allowedFormats, signature } = signatureResult.data
      const formData = new FormData()
      formData.append("file", file)
      formData.append("api_key", apiKey)
      formData.append("timestamp", String(timestamp))
      formData.append("folder", folder)
      formData.append("allowed_formats", allowedFormats)
      formData.append("signature", signature)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body: formData })
      const result = (await response.json()) as CloudinaryUploadResponse
      if (!response.ok || !result.secure_url || !result.public_id) throw new Error(result.error?.message || t("errors.invalidForm"))

      onUploaded({ fileUrl: result.secure_url, fileName: file.name, cloudinaryPublicId: result.public_id, mimeType: file.type, fileSize: file.size })
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t("errors.invalidForm"))
      if (inputRef.current) inputRef.current.value = ""
    } finally {
      setIsUploading(false)
    }
  }

  if (value) {
    return (
      <div className="flex h-9 items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-emerald-50/80 px-2.5 text-xs text-emerald-800 shadow-2xs">
        <span className="flex min-w-0 items-center gap-1.5 truncate font-medium">
          <Check className="size-3.5 shrink-0 text-emerald-600" />
          <span className="truncate">{value.fileName}</span>
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={disabled}
          aria-label={t("actions.remove")}
          title={t("actions.remove")}
          onClick={() => {
            onClear()
            if (inputRef.current) inputRef.current.value = ""
          }}
          className="hover:bg-emerald-100 hover:text-emerald-900"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPTED_FILES}
          disabled={disabled || isUploading}
          className="h-9 cursor-pointer text-xs file:mr-2 file:rounded-md file:border-0 file:bg-brand-navy-light file:px-2 file:py-0.5 file:text-xs file:font-semibold file:text-brand-navy file:cursor-pointer"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
        {isUploading && (
          <LoaderCircle
            className="size-4 shrink-0 animate-spin text-primary"
            aria-label={t("actions.adding")}
          />
        )}
      </div>
      {showHint && !isUploading && (
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <FileUp className="size-3" />
          PDF, JPG, PNG, or WebP · 10 MB
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
