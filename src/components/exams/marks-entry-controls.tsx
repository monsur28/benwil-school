"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

type Option = { id: string; name: string }

type MarksEntryControlsProps = {
  classes: Option[]
  sections: Option[]
  subjects: Option[]
  selectedClassId?: string
  selectedSectionId?: string
  selectedSubjectId?: string
}

export function MarksEntryControls(props: MarksEntryControlsProps) {
  const searchParams = useSearchParams()
  // Remount whenever the URL's query changes so uncontrolled defaultValues
  // always reflect the current selection.
  return <MarksEntryControlsInner key={searchParams.toString()} {...props} />
}

function MarksEntryControlsInner({
  classes,
  sections,
  subjects,
  selectedClassId,
  selectedSectionId,
  selectedSubjectId,
}: MarksEntryControlsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function updateParam(key: "classId" | "sectionId" | "subjectId", value: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set(key, value)
    if (key === "classId") {
      params.delete("sectionId")
      params.delete("subjectId")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <NativeSelect
        defaultValue={selectedClassId ?? ""}
        onChange={(event) => updateParam("classId", event.target.value)}
      >
        {classes.map((cls) => (
          <NativeSelectOption key={cls.id} value={cls.id}>
            {cls.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        defaultValue={selectedSectionId ?? ""}
        onChange={(event) => updateParam("sectionId", event.target.value)}
      >
        {sections.map((section) => (
          <NativeSelectOption key={section.id} value={section.id}>
            {section.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <NativeSelect
        defaultValue={selectedSubjectId ?? ""}
        onChange={(event) => updateParam("subjectId", event.target.value)}
      >
        {subjects.map((subject) => (
          <NativeSelectOption key={subject.id} value={subject.id}>
            {subject.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}
