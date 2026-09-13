"use client"

import { useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { STATUS_OPTIONS } from "@/lib/students/options"

export function StudentFilters({
  classes,
  sections,
}: {
  classes: { id: string; name: string }[]
  sections: { id: string; classId: string; name: string }[]
}) {
  const searchParams = useSearchParams()

  // Remount whenever the URL's query changes so uncontrolled defaultValues
  // (search text, selected filters) always reflect the current filters.
  return (
    <StudentFiltersInner
      key={searchParams.toString()}
      classes={classes}
      sections={sections}
    />
  )
}

function StudentFiltersInner({
  classes,
  sections,
}: {
  classes: { id: string; name: string }[]
  sections: { id: string; classId: string; name: string }[]
}) {
  const t = useTranslations("students")
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
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
    >
      <div className="relative flex-1 sm:min-w-64">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchLabel")}
          className="pl-8"
        />
      </div>

      <NativeSelect
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

      <NativeSelect
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

      <NativeSelect
        name="status"
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(event) => submit({ status: event.target.value })}
      >
        <NativeSelectOption value="">{t("filters.allStatuses")}</NativeSelectOption>
        {STATUS_OPTIONS.map((status) => (
          <NativeSelectOption key={status} value={status}>
            {t(`status.${status}`)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </form>
  )
}
