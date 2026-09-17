"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { FileUp, LoaderCircle, Plus } from "lucide-react"
import { addStudentDocument } from "@/actions/students/add-student-document"
import type { DocumentInput } from "@/lib/validations/student"
import type { StudentDocumentUpload } from "@/lib/storage/cloudinary-student-documents"
import { DOCUMENT_TYPE_OPTIONS } from "@/lib/students/options"
import { StudentDocumentUploader } from "@/components/students/student-document-uploader"
import { IconBadge } from "@/components/ui/icon-badge"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

export function AddDocumentForm({ studentId }: { studentId: string }) {
  const t = useTranslations("students")
  const [isPending, startTransition] = useTransition()
  const [upload, setUpload] = useState<StudentDocumentUpload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(formData: FormData) {
    if (!upload) {
      setError(t("errors.invalidForm"))
      return
    }
    const title = String(formData.get("title") ?? "").trim()
    const type = String(formData.get("type") ?? "OTHER")

    startTransition(async () => {
      const result = await addStudentDocument(studentId, {
        title,
        type: type as DocumentInput["type"],
        ...upload,
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      setError(null)
      setUpload(null)
      formRef.current?.reset()
      toast.add({ title: t("success.documentAdded"), type: "success" })
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
      {/* Clean header bar with icon, title, and supported file format hint */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
        <div className="flex items-center gap-2">
          <IconBadge name="document" tone="blue" size="xs" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            {t("profile.uploadDocument")}
          </h3>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
          <FileUp className="size-3 text-muted-foreground" />
          {t("profile.uploadHint")}
        </span>
      </div>

      <form ref={formRef} action={onSubmit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
          {/* Document Name - 4 columns */}
          <div className="space-y-1.5 sm:col-span-4">
            <label
              className="text-xs font-semibold text-brand-navy"
              htmlFor="document-title"
            >
              {t("fields.documentTitle")}
            </label>
            <Input
              id="document-title"
              name="title"
              required
              placeholder="e.g. Birth Certificate, NID..."
              className="h-9 text-xs"
            />
          </div>

          {/* Document Type - 3 columns */}
          <div className="space-y-1.5 sm:col-span-3">
            <label
              className="text-xs font-semibold text-brand-navy"
              htmlFor="document-type"
            >
              {t("fields.documentType")}
            </label>
            <NativeSelect
              id="document-type"
              name="type"
              defaultValue="OTHER"
              className="h-9 text-xs"
            >
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <NativeSelectOption key={option} value={option}>
                  {t(`documentType.${option}`)}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          {/* File - 3 columns */}
          <div className="space-y-1.5 sm:col-span-3">
            <label
              className="text-xs font-semibold text-brand-navy"
              htmlFor="student-document-file"
            >
              {t("fields.file")}
            </label>
            <StudentDocumentUploader
              inputId="student-document-file"
              value={upload ?? undefined}
              onUploaded={setUpload}
              onClear={() => setUpload(null)}
              disabled={isPending}
              showHint={false}
            />
          </div>

          {/* Action Button - 2 columns */}
          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={isPending || !upload}
              className="h-9 w-full gap-1.5 text-xs font-semibold"
            >
              {isPending ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5 stroke-[2.5]" />
              )}
              <span>{isPending ? t("actions.adding") : t("actions.addDocument")}</span>
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}
