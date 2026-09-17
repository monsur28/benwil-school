"use client"

import { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { ImageUp, LoaderCircle, Trash2 } from "lucide-react"
import { getStudentPhotoUploadSignature } from "@/actions/students/get-photo-upload-signature"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const ACCEPTED_FILES = ".jpg,.jpeg,.png,.webp"

type CloudinaryUploadResponse = {
  secure_url?: string
  error?: { message?: string }
}

/**
 * Profile photo picker for the student wizard.
 *
 * Uploads straight to Cloudinary with a server-issued signature — the file
 * never passes through the app server — and hands the resulting URL back to
 * the form. The preview is the same Avatar used everywhere else the student
 * appears, so what the registrar sees here is what the roster will show.
 *
 * The URL alone is what gets stored; the server re-checks it against the
 * school's own photo folder before it ever reaches the database.
 */
export function StudentPhotoUploader({
  value,
  studentName,
  onUploaded,
  onClear,
  disabled = false,
  inputId,
}: {
  value?: string
  studentName?: string
  onUploaded: (photoUrl: string) => void
  onClear: () => void
  disabled?: boolean
  inputId: string
}) {
  const t = useTranslations("students")
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = (studentName ?? "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  async function upload(file: File) {
    setError(null)
    setIsUploading(true)
    try {
      const signatureResult = await getStudentPhotoUploadSignature({
        name: file.name,
        type: file.type,
        size: file.size,
      })
      if (!signatureResult.success) throw new Error(signatureResult.error)

      const { cloudName, apiKey, timestamp, folder, allowedFormats, signature } = signatureResult.data
      const formData = new FormData()
      formData.append("file", file)
      formData.append("api_key", apiKey)
      formData.append("timestamp", String(timestamp))
      formData.append("folder", folder)
      formData.append("allowed_formats", allowedFormats)
      formData.append("signature", signature)

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      })
      const result = (await response.json()) as CloudinaryUploadResponse
      if (!response.ok || !result.secure_url) {
        throw new Error(result.error?.message || t("errors.invalidPhoto"))
      }

      onUploaded(result.secure_url)
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t("errors.invalidPhoto"))
      if (inputRef.current) inputRef.current.value = ""
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-start gap-4">
      <Avatar size="lg" className="size-16 shrink-0">
        {value && <AvatarImage src={value} alt="" />}
        <AvatarFallback className="text-base">
          {initials || <ImageUp className="size-5 text-muted-foreground" />}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={ACCEPTED_FILES}
            disabled={disabled || isUploading}
            className="h-9 max-w-xs cursor-pointer text-xs file:mr-2 file:rounded-md file:border-0 file:bg-brand-navy-light file:px-2 file:py-1 file:text-xs file:font-semibold file:text-brand-navy"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void upload(file)
            }}
          />
          {isUploading && (
            <LoaderCircle
              className="size-4 shrink-0 animate-spin text-muted-foreground"
              aria-label={t("actions.adding")}
            />
          )}
          {value && !isUploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => {
                onClear()
                if (inputRef.current) inputRef.current.value = ""
              }}
            >
              <Trash2 className="size-3.5" />
              {t("actions.removePhoto")}
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{t("photoHint")}</p>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
