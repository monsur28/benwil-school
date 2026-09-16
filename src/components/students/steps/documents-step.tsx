"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Plus, Trash2 } from "lucide-react"
import { DOCUMENT_TYPE_OPTIONS } from "@/lib/students/options"
import type { StudentFormValues } from "@/components/students/student-form"
import { StudentDocumentUploader } from "@/components/students/student-document-uploader"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { translateFieldError } from "@/components/students/field-message"

const emptyDocument = {
  type: "OTHER" as const,
  title: "",
  fileUrl: "",
  fileName: "",
  cloudinaryPublicId: "",
  mimeType: "",
  fileSize: 0,
}

export function DocumentsStep() {
  const t = useTranslations("students")
  const { control, register, setValue, watch, formState: { errors } } = useFormContext<StudentFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: "documents" })

  return (
    <div className="space-y-4">
      {fields.map((field, index) => {
        const document = watch(`documents.${index}`)
        const uploaded = document?.fileUrl ? {
          fileUrl: document.fileUrl,
          fileName: document.fileName,
          cloudinaryPublicId: document.cloudinaryPublicId,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
        } : undefined

        return (
          <div key={field.id} className="flex items-start gap-2 rounded-xl border border-border/80 bg-muted/20 p-3">
            <FieldGroup className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor={`documents.${index}.title`}>{t("fields.documentTitle")}</FieldLabel>
                <Input id={`documents.${index}.title`} aria-invalid={Boolean(errors.documents?.[index]?.title)} {...register(`documents.${index}.title`)} />
                <FieldError errors={[errors.documents?.[index]?.title && { message: translateFieldError(t, errors.documents[index]?.title) }]} />
              </Field>
              <Field>
                <FieldLabel htmlFor={`documents.${index}.type`}>{t("fields.documentType")}</FieldLabel>
                <NativeSelect id={`documents.${index}.type`} {...register(`documents.${index}.type`)}>
                  {DOCUMENT_TYPE_OPTIONS.map((option) => <NativeSelectOption key={option} value={option}>{t(`documentType.${option}`)}</NativeSelectOption>)}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor={`documents.${index}.file`}>{t("fields.file")}</FieldLabel>
                <StudentDocumentUploader
                  inputId={`documents.${index}.file`}
                  value={uploaded}
                  onUploaded={(upload) => {
                    setValue(`documents.${index}.fileUrl`, upload.fileUrl, { shouldDirty: true, shouldValidate: true })
                    setValue(`documents.${index}.fileName`, upload.fileName, { shouldDirty: true, shouldValidate: true })
                    setValue(`documents.${index}.cloudinaryPublicId`, upload.cloudinaryPublicId, { shouldDirty: true, shouldValidate: true })
                    setValue(`documents.${index}.mimeType`, upload.mimeType, { shouldDirty: true, shouldValidate: true })
                    setValue(`documents.${index}.fileSize`, upload.fileSize, { shouldDirty: true, shouldValidate: true })
                  }}
                  onClear={() => {
                    setValue(`documents.${index}.fileUrl`, "", { shouldDirty: true, shouldValidate: true })
                    setValue(`documents.${index}.fileName`, "", { shouldDirty: true, shouldValidate: true })
                    setValue(`documents.${index}.cloudinaryPublicId`, "", { shouldDirty: true, shouldValidate: true })
                    setValue(`documents.${index}.mimeType`, "", { shouldDirty: true, shouldValidate: true })
                    setValue(`documents.${index}.fileSize`, 0, { shouldDirty: true, shouldValidate: true })
                  }}
                />
                <FieldError errors={[errors.documents?.[index]?.fileUrl && { message: translateFieldError(t, errors.documents[index]?.fileUrl) }]} />
              </Field>
            </FieldGroup>
            <Button type="button" variant="ghost" size="icon-sm" className="mt-6" onClick={() => remove(index)} aria-label={t("actions.remove")}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        )
      })}

      <Button type="button" variant="outline" onClick={() => append(emptyDocument)}>
        <Plus className="size-4" />
        {t("actions.addDocument")}
      </Button>
    </div>
  )
}
