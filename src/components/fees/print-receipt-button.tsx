"use client"

import { useTranslations } from "next-intl"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PrintReceiptButton() {
  const t = useTranslations("fees")
  return (
    <Button size="sm" className="gap-1.5 print:hidden" onClick={() => window.print()}>
      <Printer />
      {t("actions.printReceipt")}
    </Button>
  )
}
