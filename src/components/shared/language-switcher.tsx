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

interface LanguageSwitcherProps {
  variant?: "ghost" | "pill"
}

export function LanguageSwitcher({ variant = "ghost" }: LanguageSwitcherProps = {}) {
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
      <DropdownMenuTrigger
        render={
          variant === "pill" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              className="h-9 rounded-full bg-white/90 px-3 text-xs font-medium shadow-xs backdrop-blur-xs hover:bg-white border-slate-200/80 gap-1.5 cursor-pointer"
            />
          ) : (
            <Button variant="ghost" size="icon" disabled={isPending} />
          )
        }
      >
        <Globe className={variant === "pill" ? "size-3.5 text-muted-foreground" : undefined} />
        {variant === "pill" && (
          <span className="uppercase text-slate-700 font-semibold text-[11px] tracking-wide">{locale}</span>
        )}
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
