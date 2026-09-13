"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { Globe, Check } from "lucide-react"
import { setLocale } from "@/actions/settings/set-locale"
import type { Locale } from "@/i18n/request"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা" },
]

export function LanguageSwitcher() {
  const t = useTranslations("common")
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleSelect(next: Locale) {
    if (next === locale) return
    startTransition(async () => {
      await setLocale(next)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" disabled={isPending} />}>
        <Globe />
        <span className="sr-only">{t("language")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem key={language.value} onClick={() => handleSelect(language.value)}>
            {language.label}
            {locale === language.value && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
