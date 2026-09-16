"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Input } from "@/components/ui/input"
import { PAYMENT_METHODS } from "@/lib/validations/fees"

export function PaymentFilters() {
  const searchParams = useSearchParams()
  return <PaymentFiltersInner key={searchParams.toString()} />
}

function PaymentFiltersInner() {
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
    // Inputs default to `w-full`, which in a wrap container pushes every
    // control onto its own row. Each filter gets an explicit basis so the
    // row reads as one toolbar on desktop and still stacks on a phone.
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      <Input
        className="sm:w-64"
        placeholder={t("list.searchPlaceholder")}
        defaultValue={searchParams.get("q") ?? ""}
        onBlur={(event) => updateParam("q", event.target.value)}
      />
      <Input
        type="date"
        className="sm:w-40"
        aria-label={t("filters.from")}
        defaultValue={searchParams.get("from") ?? ""}
        onChange={(event) => updateParam("from", event.target.value)}
      />
      <Input
        type="date"
        className="sm:w-40"
        aria-label={t("filters.to")}
        defaultValue={searchParams.get("to") ?? ""}
        onChange={(event) => updateParam("to", event.target.value)}
      />
      <NativeSelect
        aria-label={t("fields.paymentMethod")}
        defaultValue={searchParams.get("method") ?? ""}
        onChange={(event) => updateParam("method", event.target.value)}
      >
        <NativeSelectOption value="">{t("list.filterMethod")}</NativeSelectOption>
        {PAYMENT_METHODS.map((method) => (
          <NativeSelectOption key={method} value={method}>
            {t(`method.${method}`)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label={t("fields.status")}
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(event) => updateParam("status", event.target.value)}
      >
        <NativeSelectOption value="">{t("list.filterStatus")}</NativeSelectOption>
        <NativeSelectOption value="COMPLETED">{t("status.COMPLETED")}</NativeSelectOption>
        <NativeSelectOption value="VOIDED">{t("status.VOIDED")}</NativeSelectOption>
      </NativeSelect>
    </div>
  )
}
