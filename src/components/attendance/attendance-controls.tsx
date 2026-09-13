"use client"

import { useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel } from "@/components/ui/field"

type ClassOption = { id: string; name: string }
type SectionOption = { id: string; classId: string; name: string }

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function AttendanceControls({
  classes,
  sections,
}: {
  classes: ClassOption[]
  sections: SectionOption[]
}) {
  const searchParams = useSearchParams()
  return (
    <AttendanceControlsInner
      key={searchParams.toString()}
      classes={classes}
      sections={sections}
    />
  )
}

function AttendanceControlsInner({
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

  const currentClassId = searchParams.get("classId") ?? classes[0]?.id ?? ""
  const availableSections = sections.filter((section) => section.classId === currentClassId)
  const currentSectionId = searchParams.get("sectionId") ?? availableSections[0]?.id ?? ""
  const currentDate = searchParams.get("date") ?? todayIso()

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

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <form ref={formRef} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <Field className="sm:w-40">
        <FieldLabel htmlFor="attendance-class">{t("fields.class")}</FieldLabel>
        <NativeSelect
          id="attendance-class"
          name="classId"
          defaultValue={currentClassId}
          onChange={(event) => {
            const nextClassId = event.target.value
            const firstSection = sections.find((section) => section.classId === nextClassId)
            submit({ classId: nextClassId, sectionId: firstSection?.id ?? "" })
          }}
        >
          {classes.map((klass) => (
            <NativeSelectOption key={klass.id} value={klass.id}>
              {klass.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field className="sm:w-32">
        <FieldLabel htmlFor="attendance-section">{t("fields.section")}</FieldLabel>
        <NativeSelect
          id="attendance-section"
          name="sectionId"
          defaultValue={currentSectionId}
          onChange={(event) => submit({ sectionId: event.target.value })}
        >
          {availableSections.map((section) => (
            <NativeSelectOption key={section.id} value={section.id}>
              {section.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field className="sm:w-44">
        <FieldLabel htmlFor="attendance-date">{t("fields.date")}</FieldLabel>
        <Input
          id="attendance-date"
          name="date"
          type="date"
          max={todayIso()}
          defaultValue={currentDate}
          onChange={(event) => submit({ date: event.target.value || todayIso() })}
        />
      </Field>
    </form>
  )
}
