"use client"

import { useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import type { StudentFormValues } from "@/components/students/student-form"
import { translateFieldError } from "@/components/students/field-message"
import { GENDER_OPTIONS, BLOOD_GROUP_OPTIONS, STATUS_OPTIONS } from "@/lib/students/options"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { StudentPhotoUploader } from "@/components/students/student-photo-uploader"

export function BasicInfoStep({ mode }: { mode: "create" | "edit" }) {
  const t = useTranslations("students")
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<StudentFormValues>()

  const photoUrl = watch("photoUrl")
  const name = watch("name")

  return (
    <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Spans the row: the photo identifies the record the rest of this step
          describes, so it reads as the head of the form rather than as one
          more field in the grid. */}
      <Field className="sm:col-span-2">
        <FieldLabel htmlFor="photoUrl">{t("fields.photo")}</FieldLabel>
        <StudentPhotoUploader
          inputId="photoUrl"
          value={photoUrl || undefined}
          studentName={name}
          onUploaded={(url) => setValue("photoUrl", url, { shouldDirty: true })}
          onClear={() => setValue("photoUrl", "", { shouldDirty: true })}
        />
        <FieldError errors={[errors.photoUrl && { message: translateFieldError(t, errors.photoUrl) }]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="name">{t("fields.name")}</FieldLabel>
        <Input id="name" aria-invalid={Boolean(errors.name)} {...register("name")} />
        <FieldError errors={[errors.name && { message: translateFieldError(t, errors.name) }]} />
      </Field>

      <Field>
        <FieldLabel htmlFor="nameBn">{t("fields.nameBn")}</FieldLabel>
        <Input id="nameBn" {...register("nameBn")} />
      </Field>

      <Field>
        <FieldLabel htmlFor="dateOfBirth">{t("fields.dateOfBirth")}</FieldLabel>
        <Input
          id="dateOfBirth"
          type="date"
          aria-invalid={Boolean(errors.dateOfBirth)}
          {...register("dateOfBirth")}
        />
        <FieldError
          errors={[errors.dateOfBirth && { message: translateFieldError(t, errors.dateOfBirth) }]}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="admissionDate">{t("fields.admissionDate")}</FieldLabel>
        <Input
          id="admissionDate"
          type="date"
          aria-invalid={Boolean(errors.admissionDate)}
          {...register("admissionDate")}
        />
        <FieldError
          errors={[
            errors.admissionDate && { message: translateFieldError(t, errors.admissionDate) },
          ]}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="gender">{t("fields.gender")}</FieldLabel>
        <NativeSelect id="gender" {...register("gender")}>
          {GENDER_OPTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {t(`gender.${option}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field>
        <FieldLabel htmlFor="bloodGroup">{t("fields.bloodGroup")}</FieldLabel>
        <NativeSelect id="bloodGroup" {...register("bloodGroup")} defaultValue="">
          <NativeSelectOption value="">—</NativeSelectOption>
          {BLOOD_GROUP_OPTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {t(`bloodGroup.${option}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field>
        <FieldLabel htmlFor="admissionNumber">{t("fields.admissionNumber")}</FieldLabel>
        <Input
          id="admissionNumber"
          aria-invalid={Boolean(errors.admissionNumber)}
          {...register("admissionNumber")}
        />
        <FieldError
          errors={[
            errors.admissionNumber && { message: translateFieldError(t, errors.admissionNumber) },
          ]}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="birthCertificateNumber">
          {t("fields.birthCertificateNumber")}
        </FieldLabel>
        <Input id="birthCertificateNumber" {...register("birthCertificateNumber")} />
      </Field>

      <Field>
        <FieldLabel htmlFor="religion">{t("fields.religion")}</FieldLabel>
        <Input id="religion" {...register("religion")} />
      </Field>

      <Field>
        <FieldLabel htmlFor="nationality">{t("fields.nationality")}</FieldLabel>
        <Input id="nationality" {...register("nationality")} />
      </Field>

      {mode === "edit" && (
        <Field>
          <FieldLabel htmlFor="status">{t("fields.status")}</FieldLabel>
          <NativeSelect id="status" {...register("status")}>
            {STATUS_OPTIONS.map((option) => (
              <NativeSelectOption key={option} value={option}>
                {t(`status.${option}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      )}
    </FieldGroup>
  )
}
