"use client"

import { useFormContext } from "react-hook-form"
import { useTranslations } from "next-intl"
import type { StudentFormValues } from "@/components/students/student-form"
import { translateFieldError } from "@/components/students/field-message"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"

export type AcademicOptions = {
  academicYears: { id: string; name: string }[]
  classes: { id: string; name: string }[]
  sections: { id: string; classId: string; name: string }[]
}

export function AcademicInfoStep({ academicYears, classes, sections }: AcademicOptions) {
  const t = useTranslations("students")
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<StudentFormValues>()

  const selectedClassId = watch("classId")
  const availableSections = sections.filter((section) => section.classId === selectedClassId)
  const classField = register("classId")

  return (
    <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="academicYearId">{t("fields.academicYear")}</FieldLabel>
        <NativeSelect id="academicYearId" {...register("academicYearId")}>
          {academicYears.map((year) => (
            <NativeSelectOption key={year.id} value={year.id}>
              {year.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError
          errors={[
            errors.academicYearId && { message: translateFieldError(t, errors.academicYearId) },
          ]}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="classId">{t("fields.class")}</FieldLabel>
        <NativeSelect
          id="classId"
          {...classField}
          onChange={(event) => {
            classField.onChange(event)
            // A plain <select> can't be left unselected once it has options:
            // the browser will visually show the first one regardless. Keep
            // the form's tracked value in sync with that instead of clearing
            // it to "", which would validate as missing.
            const firstSection = sections.find((section) => section.classId === event.target.value)
            setValue("sectionId", firstSection?.id ?? "")
          }}
        >
          {classes.map((klass) => (
            <NativeSelectOption key={klass.id} value={klass.id}>
              {klass.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError
          errors={[errors.classId && { message: translateFieldError(t, errors.classId) }]}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="sectionId">{t("fields.section")}</FieldLabel>
        <NativeSelect id="sectionId" {...register("sectionId")}>
          {availableSections.map((section) => (
            <NativeSelectOption key={section.id} value={section.id}>
              {section.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <FieldError
          errors={[errors.sectionId && { message: translateFieldError(t, errors.sectionId) }]}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="roll">{t("fields.roll")}</FieldLabel>
        <Input
          id="roll"
          type="number"
          min={1}
          aria-invalid={Boolean(errors.roll)}
          {...register("roll")}
        />
        <FieldError errors={[errors.roll && { message: translateFieldError(t, errors.roll) }]} />
      </Field>
    </FieldGroup>
  )
}
