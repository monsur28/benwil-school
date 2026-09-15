"use client"

import { useRef } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const

export function NoticeFilters({ categories }: { categories: { id: string; name: string }[] }) {
  const searchParams = useSearchParams()

  // Remount whenever the URL's query changes so uncontrolled defaultValues
  // (search text, selected filters) always reflect the current filters.
  return <NoticeFiltersInner key={searchParams.toString()} categories={categories} />
}

function NoticeFiltersInner({ categories }: { categories: { id: string; name: string }[] }) {
  const t = useTranslations("notices")
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
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder={t("list.searchPlaceholder")}
          className="pl-8"
        />
      </div>

      <NativeSelect
        name="status"
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(event) => submit({ status: event.target.value })}
      >
        <NativeSelectOption value="">{t("list.filterStatus")}</NativeSelectOption>
        {STATUSES.map((status) => (
          <NativeSelectOption key={status} value={status}>
            {t(`status.${status}`)}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      <NativeSelect
        name="categoryId"
        defaultValue={searchParams.get("categoryId") ?? ""}
        onChange={(event) => submit({ categoryId: event.target.value })}
      >
        <NativeSelectOption value="">{t("list.filterCategory")}</NativeSelectOption>
        {categories.map((category) => (
          <NativeSelectOption key={category.id} value={category.id}>
            {category.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </form>
  )
}
