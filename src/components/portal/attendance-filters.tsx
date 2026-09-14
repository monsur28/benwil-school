"use client"

import { useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel } from "@/components/ui/field"

type AcademicYearOption = { id: string; name: string }

export function AttendanceFilters({ academicYears }: { academicYears: AcademicYearOption[] }) {
  const searchParams = useSearchParams()
  return <AttendanceFiltersInner key={searchParams.toString()} academicYears={academicYears} />
}

function AttendanceFiltersInner({ academicYears }: { academicYears: AcademicYearOption[] }) {
  const t = useTranslations("portal")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)

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
        <FieldLabel htmlFor="portal-attendance-year">{t("fields.academicYear")}</FieldLabel>
        <NativeSelect
          id="portal-attendance-year"
          name="academicYearId"
          defaultValue={searchParams.get("academicYearId") ?? ""}
          onChange={(event) => submit({ academicYearId: event.target.value })}
        >
          <NativeSelectOption value="">{t("filters.allYears")}</NativeSelectOption>
          {academicYears.map((year) => (
            <NativeSelectOption key={year.id} value={year.id}>
              {year.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>

      <Field className="sm:w-40">
        <FieldLabel htmlFor="portal-attendance-from">{t("filters.from")}</FieldLabel>
        <Input
          id="portal-attendance-from"
          name="from"
          type="date"
          defaultValue={searchParams.get("from") ?? ""}
          onChange={(event) => submit({ from: event.target.value })}
        />
      </Field>

      <Field className="sm:w-40">
        <FieldLabel htmlFor="portal-attendance-to">{t("filters.to")}</FieldLabel>
        <Input
          id="portal-attendance-to"
          name="to"
          type="date"
          defaultValue={searchParams.get("to") ?? ""}
          onChange={(event) => submit({ to: event.target.value })}
        />
      </Field>
    </form>
  )
}
