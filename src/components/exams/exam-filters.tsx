"use client"

import { useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

type ExamFiltersProps = {
  academicYears: { id: string; name: string }[]
  examTypes: { id: string; name: string }[]
}

export function ExamFilters(props: ExamFiltersProps) {
  const searchParams = useSearchParams()
  // Remount whenever the URL's query changes so uncontrolled defaultValues
  // (search text, selected filters) always reflect the current filters.
  return <ExamFiltersInner key={searchParams.toString()} {...props} />
}

function ExamFiltersInner({ academicYears, examTypes }: ExamFiltersProps) {
  const t = useTranslations("exams")
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
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <div className="relative flex-1 sm:min-w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="search"
          defaultValue={searchParams.get("search") ?? ""}
          placeholder={t("list.searchPlaceholder")}
          className="pl-8"
        />
      </div>

      <NativeSelect
        name="academicYearId"
        defaultValue={searchParams.get("academicYearId") ?? ""}
        onChange={(event) => submit({ academicYearId: event.target.value })}
      >
        <NativeSelectOption value="">{t("list.filterAcademicYear")}</NativeSelectOption>
        {academicYears.map((year) => (
          <NativeSelectOption key={year.id} value={year.id}>
            {year.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <NativeSelect
        name="examTypeId"
        defaultValue={searchParams.get("examTypeId") ?? ""}
        onChange={(event) => submit({ examTypeId: event.target.value })}
      >
        <NativeSelectOption value="">{t("list.filterExamType")}</NativeSelectOption>
        {examTypes.map((examType) => (
          <NativeSelectOption key={examType.id} value={examType.id}>
            {examType.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <NativeSelect
        name="status"
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(event) => submit({ status: event.target.value })}
      >
        <NativeSelectOption value="">{t("list.filterStatus")}</NativeSelectOption>
        <NativeSelectOption value="active">{t("status.active")}</NativeSelectOption>
        <NativeSelectOption value="inactive">{t("status.inactive")}</NativeSelectOption>
      </NativeSelect>
    </form>
  )
}
