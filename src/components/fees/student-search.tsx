"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function StudentSearchForm() {
  const t = useTranslations("fees")
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  return (
    <form
      className="flex max-w-md gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(() => {
          router.push(`/fees/student?q=${encodeURIComponent(query)}`)
        })
      }}
    >
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("list.searchPlaceholder")}
      />
      <Button type="submit" disabled={isPending}>
        <Search />
        {t("actions.search")}
      </Button>
    </form>
  )
}
