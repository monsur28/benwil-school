"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import type { z } from "zod"
import { assignStudentFeeSchema } from "@/lib/validations/fees"

// Form values are typed by the schema's *input* shape (before z.coerce
// runs) - see fee-structure-dialog.tsx for the same pattern.
type AssignStudentFeeFormInput = z.input<typeof assignStudentFeeSchema>
import { assignStudentFee } from "@/actions/fees/student-fees"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

type FeeStructureOption = { id: string; name: string; amount: number; feeCategoryId: string }
type CategoryOption = { id: string; name: string }

export function AssignFeeDialog({
  studentId,
  academicYearId,
  structures,
  categories,
}: {
  studentId: string
  academicYearId: string
  structures: FeeStructureOption[]
  categories: CategoryOption[]
}) {
  const t = useTranslations("fees")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<AssignStudentFeeFormInput>({
    resolver: zodResolver(assignStudentFeeSchema),
    defaultValues: {
      studentId,
      academicYearId,
      feeStructureId: "",
      feeCategoryId: categories[0]?.id ?? "",
      name: "",
      amount: 0,
      dueDate: "",
    },
  })

  const selectedStructureId = watch("feeStructureId")

  function onStructureChange(structureId: string) {
    setValue("feeStructureId", structureId)
    const structure = structures.find((item) => item.id === structureId)
    if (structure) {
      setValue("name", structure.name)
      setValue("amount", structure.amount)
      setValue("feeCategoryId", structure.feeCategoryId)
    }
  }

  function onSubmit(values: AssignStudentFeeFormInput) {
    startTransition(async () => {
      const result = await assignStudentFee(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t("success.feeAssigned"), type: "success" })
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
      <DialogTrigger render={<Button size="sm" />}>
        <Plus />
        {t("actions.assignFee")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("assign.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            {structures.length > 0 && (
              <Field>
                <FieldLabel htmlFor="assign-fee-structure">{t("subnav.structures")}</FieldLabel>
                <NativeSelect
                  id="assign-fee-structure"
                  value={selectedStructureId}
                  onChange={(event) => onStructureChange(event.target.value)}
                >
                  <NativeSelectOption value="">—</NativeSelectOption>
                  {structures.map((structure) => (
                    <NativeSelectOption key={structure.id} value={structure.id}>
                      {structure.name} ({structure.amount.toFixed(2)})
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="assign-fee-category">{t("fields.category")}</FieldLabel>
              <NativeSelect id="assign-fee-category" {...register("feeCategoryId")}>
                {categories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="assign-fee-name">{t("fields.name")}</FieldLabel>
              <Input id="assign-fee-name" {...register("name")} />
              <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="assign-fee-amount">{t("fields.amount")}</FieldLabel>
              <Input id="assign-fee-amount" type="number" step="0.01" min="0" {...register("amount")} />
              <FieldError errors={[errors.amount && { message: t(errors.amount.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="assign-fee-due-date">{t("fields.dueDate")}</FieldLabel>
              <Input id="assign-fee-due-date" type="date" {...register("dueDate")} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
