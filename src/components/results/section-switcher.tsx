"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export function SectionSwitcher({
  examId,
  classId,
  sectionId,
  sections,
}: {
  examId: string
  classId: string
  sectionId: string
  sections: { id: string; name: string }[]
}) {
  const t = useTranslations("results")
  const router = useRouter()

  return (
    <NativeSelect
      aria-label={t("fields.section")}
      value={sectionId}
      onChange={(event) => router.push(`/results/${examId}/${classId}/${event.target.value}`)}
    >
      {sections.map((section) => (
        <NativeSelectOption key={section.id} value={section.id}>
          {section.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
