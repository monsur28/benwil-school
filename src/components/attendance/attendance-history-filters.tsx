"use client"

import { useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel } from "@/components/ui/field"

type ClassOption = { id: string; name: string }
type SectionOption = { id: string; classId: string; name: string }

export function AttendanceHistoryFilters({
  classes,
  sections,
}: {
  classes: ClassOption[]
  sections: SectionOption[]
}) {
  const searchParams = useSearchParams()
  return (
    <AttendanceHistoryFiltersInner
      key={searchParams.toString()}
      classes={classes}
      sections={sections}
    />
  )
}

function AttendanceHistoryFiltersInner({
  classes,
  sections,
}: {
  classes: ClassOption[]
  sections: SectionOption[]
}) {
  const t = useTranslations("attendance")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)

  const currentClassId = searchParams.get("classId") ?? ""
  const availableSections = sections.filter((section) => section.classId === currentClassId)

  function submit(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams()
    const formData = new FormData(formRef.current!)

    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value) params.set(key, value)
    }
    for (const [key, value] of Object.entries(overrides)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }

    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname)
  }

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <Field className="sm:w-40">
        <FieldLabel htmlFor="history-class">{t("fields.class")}</FieldLabel>
        <NativeSelect
          id="history-class"
          name="classId"
          defaultValue={currentClassId}
          onChange={(event) => submit({ classId: event.target.value, sectionId: "" })}
        >
          <NativeSelectOption value="">{t("filters.allClasses")}</NativeSelectOption>
          {classes.map((klass) => (
            <NativeSelectOption key={klass.id} value={klass.id}>
              {klass.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field className="sm:w-32">
        <FieldLabel htmlFor="history-section">{t("fields.section")}</FieldLabel>
        <NativeSelect
          id="history-section"
          name="sectionId"
          defaultValue={searchParams.get("sectionId") ?? ""}
          onChange={(event) => submit({ sectionId: event.target.value })}
        >
          <NativeSelectOption value="">{t("filters.allSections")}</NativeSelectOption>
          {availableSections.map((section) => (
            <NativeSelectOption key={section.id} value={section.id}>
              {section.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field className="sm:w-44">
        <FieldLabel htmlFor="history-date">{t("fields.date")}</FieldLabel>
        <Input
          id="history-date"
          name="date"
          type="date"
          defaultValue={searchParams.get("date") ?? ""}
          onChange={(event) => submit({ date: event.target.value })}
        />
      </Field>
    </form>
  )
}
