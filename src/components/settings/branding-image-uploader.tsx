"use client"

import { useRef, useState, useTransition } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { ImagePlus, X, Loader2 } from "lucide-react"
import { uploadBrandingImage, removeBrandingImage } from "@/actions/settings/school-settings"
import type { BrandingImageKind } from "@/lib/validations/school-settings"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"

export function BrandingImageUploader({
  kind,
  label,
  recommendedText,
  accept,
  initialUrl,
}: {
  kind: BrandingImageKind
  label: string
  recommendedText: string
  accept: string
  initialUrl: string | null
}) {
  const t = useTranslations("settings")
  const [url, setUrl] = useState(initialUrl)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      const result = await uploadBrandingImage(kind, formData)
      if (!result.success) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      setUrl(result.data.url)
      toast.add({ title: t("success.imageUploaded"), type: "success" })
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeBrandingImage(kind)
      if (!result.success) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      setUrl(null)
      toast.add({ title: t("success.imageRemoved"), type: "success" })
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40">
          {url ? (
            <Image src={url} alt={label} width={64} height={64} className="size-full object-contain" unoptimized />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
            >
              {isPending && <Loader2 className="size-3.5 animate-spin" />}
              {url ? t("actions.replace") : t("actions.upload")}
            </Button>
            {url && (
              <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={handleRemove}>
                <X className="size-3.5" />
                {t("actions.remove")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{recommendedText}</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="sr-only"
        aria-label={label}
      />
    </div>
  )
}
