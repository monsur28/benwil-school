"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type { GuardianChild } from "@/lib/portal/identity"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Field, FieldLabel } from "@/components/ui/field"

export function ChildSwitcher({ children, selectedId }: { children: GuardianChild[]; selectedId: string }) {
  const t = useTranslations("portal")
  const router = useRouter()

  if (children.length <= 1) return null

  return (
    <Field className="sm:w-64">
      <FieldLabel htmlFor="portal-child-switcher">{t("nav.myChildren")}</FieldLabel>
      <NativeSelect
        id="portal-child-switcher"
        value={selectedId}
        onChange={(event) => router.push(`/portal/guardian/children/${event.target.value}`)}
      >
        {children.map((child) => (
          <NativeSelectOption key={child.id} value={child.id}>
            {child.name} — {child.className} {child.sectionName}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  )
}
