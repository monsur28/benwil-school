"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

type ResultFiltersProps = {
  academicYears: { id: string; name: string }[]
  exams: { id: string; name: string }[]
  classes: { id: string; name: string }[]
}

export function ResultFilters(props: ResultFiltersProps) {
  const searchParams = useSearchParams()
  return <ResultFiltersInner key={searchParams.toString()} {...props} />
}

function ResultFiltersInner({ academicYears, exams, classes }: ResultFiltersProps) {
  const t = useTranslations("results")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <NativeSelect
        aria-label={t("fields.academicYear")}
        defaultValue={searchParams.get("academicYearId") ?? ""}
        onChange={(event) => updateParam("academicYearId", event.target.value)}
      >
        <NativeSelectOption value="">{t("list.filterAcademicYear")}</NativeSelectOption>
        {academicYears.map((year) => (
          <NativeSelectOption key={year.id} value={year.id}>
            {year.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={t("fields.exam")}
        defaultValue={searchParams.get("examId") ?? ""}
        onChange={(event) => updateParam("examId", event.target.value)}
      >
        <NativeSelectOption value="">{t("list.filterExam")}</NativeSelectOption>
        {exams.map((exam) => (
          <NativeSelectOption key={exam.id} value={exam.id}>
            {exam.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={t("fields.class")}
        defaultValue={searchParams.get("classId") ?? ""}
        onChange={(event) => updateParam("classId", event.target.value)}
      >
        <NativeSelectOption value="">{t("list.filterClass")}</NativeSelectOption>
        {classes.map((cls) => (
          <NativeSelectOption key={cls.id} value={cls.id}>
            {cls.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
