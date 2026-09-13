"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus, Pencil } from "lucide-react"
import { createAcademicYear, updateAcademicYear } from "@/actions/academics/academic-years"
import { createAcademicYearSchema } from "@/lib/validations/academics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

// The trigger button is built here, not passed in as an element from the
// (server) caller: a Server Component's JSX can't be cloned/introspected
// once it crosses into a Client Component, so this only ever takes plain
// data (the entity, for create-vs-edit) and renders its own trigger.
export function AcademicYearDialog({
  academicYear,
}: {
  academicYear?: { id: string; name: string }
}) {
  const t = useTranslations("academics")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: { name: academicYear?.name ?? "" },
  })

  function onSubmit(values: { name: string }) {
    startTransition(async () => {
      const result = academicYear
        ? await updateAcademicYear({ id: academicYear.id, name: values.name })
        : await createAcademicYear(values)

      if (result.error) {
        setError("root", { message: result.error })
        return
      }

      toast.add({ title: t("success.saved"), type: "success" })
      setOpen(false)
      reset()
      router.refresh()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger render={<Button variant={academicYear ? "ghost" : "default"} size={academicYear ? "sm" : "default"} />}>
        {academicYear ? <Pencil /> : <Plus />}
        {academicYear ? t("actions.edit") : t("years.addTitle")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {academicYear ? t("years.editTitle") : t("years.addTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="year-name">{t("fields.name")}</FieldLabel>
            <Input id="year-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
            <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("actions.saving") : t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
