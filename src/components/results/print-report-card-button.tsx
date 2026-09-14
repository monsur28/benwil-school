"use client"

import { useTranslations } from "next-intl"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PrintReportCardButton() {
  const t = useTranslations("results")
  return (
    <Button size="sm" className="gap-1.5 print:hidden" onClick={() => window.print()}>
      <Printer />
      {t("actions.print")}
    </Button>
  )
}
