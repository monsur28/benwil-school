"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { assignSubjectToClass } from "@/actions/academics/class-subjects"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { toast } from "@/components/ui/toast"

export function AssignSubjectForm({
  classId,
  availableSubjects,
  hasAnySubjects,
}: {
  classId: string
  availableSubjects: { id: string; name: string }[]
  hasAnySubjects: boolean
}) {
  const t = useTranslations("academics")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  if (availableSubjects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {hasAnySubjects ? t("classDetail.allSubjectsAssigned") : t("classDetail.noSubjectsExist")}
      </p>
    )
  }

  function onSubmit(formData: FormData) {
    const subjectId = String(formData.get("subjectId") ?? "")
    if (!subjectId) return

    startTransition(async () => {
      const result = await assignSubjectToClass({ classId, subjectId })
      if (!result.success) {
        toast.add({ title: result.error, type: "error" })
        return
      }
      toast.add({ title: t("success.saved"), type: "success" })
      router.refresh()
    })
  }

  return (
    <form action={onSubmit} className="flex flex-wrap items-center gap-2">
      <NativeSelect name="subjectId" defaultValue="">
        <NativeSelectOption value="" disabled>
          {t("classDetail.selectSubject")}
        </NativeSelectOption>
        {availableSubjects.map((subject) => (
          <NativeSelectOption key={subject.id} value={subject.id}>
            {subject.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        <Plus />
        {t("classDetail.addSubject")}
      </Button>
    </form>
  )
}
