"use client"

import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"

const VARIANT_BY_STATUS = {
  UNPAID: "destructive",
  PARTIAL: "outline",
  PAID: "default",
  WAIVED: "secondary",
  CANCELLED: "ghost",
} as const

export function FeeStatusBadge({ status }: { status: keyof typeof VARIANT_BY_STATUS }) {
  const t = useTranslations("fees")
  return <Badge variant={VARIANT_BY_STATUS[status]}>{t(`status.${status}`)}</Badge>
}
