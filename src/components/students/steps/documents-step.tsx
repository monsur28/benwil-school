"use client"

import { useFieldArray, useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import { Plus, Trash2, Info } from "lucide-react"
import type { StudentFormValues } from "@/components/students/student-form"
import { translateFieldError } from "@/components/students/field-message"
import { DOCUMENT_TYPE_OPTIONS } from "@/lib/students/options"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DocumentsStep() {
  const t = useTranslations("students")
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<StudentFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: "documents" })

  return (
    <div className="space-y-4">
      <Alert>
        <Info />
        <AlertDescription>{t("fileNotConfigured")}</AlertDescription>
      </Alert>

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2 rounded-lg border p-3">
          <FieldGroup className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={`documents.${index}.title`}>
                {t("fields.documentTitle")}
              </FieldLabel>
              <Input
                id={`documents.${index}.title`}
                aria-invalid={Boolean(errors.documents?.[index]?.title)}
                {...register(`documents.${index}.title`)}
              />
              <FieldError
                errors={[
                  errors.documents?.[index]?.title && {
                    message: translateFieldError(t, errors.documents[index]?.title),
                  },
                ]}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`documents.${index}.type`}>
                {t("fields.documentType")}
              </FieldLabel>
              <NativeSelect id={`documents.${index}.type`} {...register(`documents.${index}.type`)}>
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <NativeSelectOption key={option} value={option}>
                    {t(`documentType.${option}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </FieldGroup>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="mt-6"
            onClick={() => remove(index)}
            aria-label={t("actions.remove")}
          >
            <Trash2 />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ type: "OTHER", title: "" })}
      >
        <Plus />
        {t("actions.addDocument")}
      </Button>
    </div>
  )
}
