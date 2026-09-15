"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { addStudentDocument } from "@/actions/students/add-student-document"
import { DOCUMENT_TYPE_OPTIONS } from "@/lib/students/options"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

export function AddDocumentForm({ studentId }: { studentId: string }) {
  const t = useTranslations("students")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  function onSubmit(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim()
    const type = String(formData.get("type") ?? "OTHER")

    startTransition(async () => {
      const result = await addStudentDocument(studentId, { title, type: type as never })
      if (!result.success) {
        setError(result.error)
        return
      }
      setError(null)
      formRef.current?.reset()
      toast.add({ title: t("success.documentAdded"), type: "success" })
    })
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1 space-y-1.5">
        <label className="text-sm font-medium" htmlFor="document-title">
          {t("fields.documentTitle")}
        </label>
        <Input id="document-title" name="title" required />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="document-type">
          {t("fields.documentType")}
        </label>
        <NativeSelect id="document-type" name="type" defaultValue="OTHER">
          {DOCUMENT_TYPE_OPTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {t(`documentType.${option}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" disabled={isPending}>
        <Plus />
        {isPending ? t("actions.adding") : t("actions.addDocument")}
      </Button>
      {error && (
        <Alert variant="destructive" className="sm:basis-full">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </form>
  )
}
