"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

type Option = { id: string; name: string }

export function OutstandingFilters(props: {
  academicYears: Option[]
  classes: Option[]
  categories: Option[]
}) {
  const searchParams = useSearchParams()
  return <OutstandingFiltersInner key={searchParams.toString()} {...props} />
}

function OutstandingFiltersInner({
  academicYears,
  classes,
  categories,
}: {
  academicYears: Option[]
  classes: Option[]
  categories: Option[]
}) {
  const t = useTranslations("fees")
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
    <div className="flex flex-wrap gap-2 print:hidden">
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
      <NativeSelect
        aria-label={t("fields.category")}
        defaultValue={searchParams.get("feeCategoryId") ?? ""}
        onChange={(event) => updateParam("feeCategoryId", event.target.value)}
      >
        <NativeSelectOption value="">{t("list.filterCategory")}</NativeSelectOption>
        {categories.map((category) => (
          <NativeSelectOption key={category.id} value={category.id}>
            {category.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
