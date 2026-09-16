"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { addStudentDocument } from "@/actions/students/add-student-document"
import type { DocumentInput } from "@/lib/validations/student"
import type { StudentDocumentUpload } from "@/lib/storage/cloudinary-student-documents"
import { DOCUMENT_TYPE_OPTIONS } from "@/lib/students/options"
import { StudentDocumentUploader } from "@/components/students/student-document-uploader"
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
    if (!upload) { setError(t("errors.invalidForm")); return }
    const title = String(formData.get("title") ?? "").trim()
    const type = String(formData.get("type") ?? "OTHER")

    startTransition(async () => {
      const result = await addStudentDocument(studentId, { title, type: type as DocumentInput["type"], ...upload })
      if (!result.success) { setError(result.error); return }
      setError(null)
      setUpload(null)
      formRef.current?.reset()
      toast.add({ title: t("success.documentAdded"), type: "success" })
    })
  }

  return (
    <form ref={formRef} action={onSubmit} className="grid gap-3 rounded-xl border border-border/80 bg-muted/20 p-3 sm:grid-cols-4 sm:items-end">
      <div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="document-title">{t("fields.documentTitle")}</label><Input id="document-title" name="title" required /></div>
      <div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="document-type">{t("fields.documentType")}</label><NativeSelect id="document-type" name="type" defaultValue="OTHER">{DOCUMENT_TYPE_OPTIONS.map((option) => <NativeSelectOption key={option} value={option}>{t(`documentType.${option}`)}</NativeSelectOption>)}</NativeSelect></div>
      <div className="space-y-1.5"><label className="text-sm font-medium" htmlFor="student-document-file">{t("fields.file")}</label><StudentDocumentUploader inputId="student-document-file" value={upload ?? undefined} onUploaded={setUpload} onClear={() => setUpload(null)} disabled={isPending} /></div>
      <Button type="submit" disabled={isPending || !upload}><Plus className="size-4" />{isPending ? t("actions.adding") : t("actions.addDocument")}</Button>
      {error && <Alert variant="destructive" className="sm:col-span-4"><AlertDescription>{error}</AlertDescription></Alert>}
    </form>
  )
}
