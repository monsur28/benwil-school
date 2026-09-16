"use client"

import { useState, useTransition } from "react"
import type { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus } from "lucide-react"
import { createTeacherAssignment } from "@/actions/academics/teacher-assignments"
import { teacherAssignmentSchema } from "@/lib/validations/academics"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"

type Teacher = { id: string; name: string }
type ClassOption = { id: string; name: string }
type SectionOption = { id: string; classId: string; name: string }
type ClassSubjectOption = { classId: string; subjectId: string; subjectName: string }

export function TeacherAssignmentDialog({ teachers, classes, sections, classSubjects, academicYears, defaultTeacherId }: { teachers: Teacher[]; classes: ClassOption[]; sections: SectionOption[]; classSubjects: ClassSubjectOption[]; academicYears: { id: string; name: string }[]; defaultTeacherId?: string }) {
  const t = useTranslations("academics")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const form = useForm<z.input<typeof teacherAssignmentSchema>>({ resolver: zodResolver(teacherAssignmentSchema), defaultValues: { teacherId: defaultTeacherId ?? teachers[0]?.id ?? "", classId: classes[0]?.id ?? "", sectionId: "", subjectId: "", academicYearId: academicYears[0]?.id ?? "", isClassTeacher: false } })
  const classId = form.watch("classId")
  const availableSections = sections.filter((section) => section.classId === classId)
  const availableSubjects = classSubjects.filter((subject) => subject.classId === classId)

  function submit(values: z.input<typeof teacherAssignmentSchema>) {
    startTransition(async () => {
      const result = await createTeacherAssignment({ ...values, isClassTeacher: values.isClassTeacher ?? false })
      if (!result.success) { form.setError("root", { message: result.error }); return }
      toast.add({ title: t("success.saved"), type: "success" })
      setOpen(false); form.reset(); router.refresh()
    })
  }

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button />}><Plus />{t("assignments.addTitle")}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{t("assignments.addTitle")}</DialogTitle></DialogHeader><form onSubmit={form.handleSubmit(submit)} className="space-y-3"><NativeSelect {...form.register("teacherId")}>{teachers.map((teacher) => <NativeSelectOption key={teacher.id} value={teacher.id}>{teacher.name}</NativeSelectOption>)}</NativeSelect><NativeSelect {...form.register("academicYearId")}>{academicYears.map((year) => <NativeSelectOption key={year.id} value={year.id}>{year.name}</NativeSelectOption>)}</NativeSelect><NativeSelect {...form.register("classId")} onChange={(event) => { form.setValue("classId", event.target.value); form.setValue("sectionId", ""); form.setValue("subjectId", "") }}><NativeSelectOption value="">{t("fields.class")}</NativeSelectOption>{classes.map((item) => <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>)}</NativeSelect><NativeSelect {...form.register("sectionId")}><NativeSelectOption value="">{t("fields.section")}</NativeSelectOption>{availableSections.map((item) => <NativeSelectOption key={item.id} value={item.id}>{item.name}</NativeSelectOption>)}</NativeSelect><NativeSelect {...form.register("subjectId")}><NativeSelectOption value="">{t("fields.subject")}</NativeSelectOption>{availableSubjects.map((item) => <NativeSelectOption key={item.subjectId} value={item.subjectId}>{item.subjectName}</NativeSelectOption>)}</NativeSelect><label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register("isClassTeacher")} />Class teacher</label>{form.formState.errors.root && <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>}<DialogFooter><Button type="submit" disabled={isPending}>{isPending ? t("actions.saving") : t("actions.save")}</Button></DialogFooter></form></DialogContent></Dialog>
}
