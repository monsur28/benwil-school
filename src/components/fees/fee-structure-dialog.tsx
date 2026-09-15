"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import type { z } from "zod"
import { createFeeStructureSchema, editFeeStructureSchema, FEE_FREQUENCIES } from "@/lib/validations/fees"

// Form values are typed by the schema's *input* shape (before z.coerce
// runs), matching grade-rule-dialog.tsx's pattern - otherwise the coerced
// `amount` field mismatches the resolver's expected output type.
type CreateFeeStructureFormInput = z.input<typeof createFeeStructureSchema>
type EditFeeStructureFormInput = z.input<typeof editFeeStructureSchema>
import { createFeeStructure, updateFeeStructure } from "@/actions/fees/fee-structures"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

type Option = { id: string; name: string }

type FeeStructureDialogProps = {
  academicYears: Option[]
  classes: Option[]
  categories: Option[]
  structure?: {
    id: string
    academicYearId: string
    classId: string
    feeCategoryId: string
    name: string
    nameBn: string | null
    amount: number
    frequency: string
    dueDate: Date | null
    isActive: boolean
  }
}

export function FeeStructureDialog({ academicYears, classes, categories, structure }: FeeStructureDialogProps) {
  const t = useTranslations("fees")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isEdit = Boolean(structure)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateFeeStructureFormInput | EditFeeStructureFormInput>({
    resolver: zodResolver(isEdit ? editFeeStructureSchema : createFeeStructureSchema),
    defaultValues: isEdit
      ? {
          id: structure!.id,
          academicYearId: structure!.academicYearId,
          classId: structure!.classId,
          feeCategoryId: structure!.feeCategoryId,
          name: structure!.name,
          nameBn: structure!.nameBn ?? "",
          amount: structure!.amount,
          frequency: structure!.frequency as (typeof FEE_FREQUENCIES)[number],
          dueDate: structure!.dueDate ? structure!.dueDate.toISOString().slice(0, 10) : "",
          isActive: structure!.isActive,
        }
      : {
          academicYearId: academicYears[0]?.id ?? "",
          classId: classes[0]?.id ?? "",
          feeCategoryId: categories[0]?.id ?? "",
          name: "",
          nameBn: "",
          frequency: "ONE_TIME",
          dueDate: "",
        },
  })

  function onSubmit(values: CreateFeeStructureFormInput | EditFeeStructureFormInput) {
    startTransition(async () => {
      const result = isEdit ? await updateFeeStructure(values) : await createFeeStructure(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t(isEdit ? "success.structureUpdated" : "success.structureCreated"), type: "success" })
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
      <DialogTrigger render={isEdit ? <Button variant="ghost" size="icon-sm" /> : <Button size="sm" />}>
        {isEdit ? (
          <Pencil />
        ) : (
          <>
            <Plus />
            {t("actions.addStructure")}
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isEdit ? "actions.edit" : "actions.addStructure")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fee-structure-year">{t("fields.academicYear")}</FieldLabel>
              <NativeSelect id="fee-structure-year" {...register("academicYearId")}>
                {academicYears.map((year) => (
                  <NativeSelectOption key={year.id} value={year.id}>
                    {year.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="fee-structure-class">{t("fields.class")}</FieldLabel>
              <NativeSelect id="fee-structure-class" {...register("classId")}>
                {classes.map((cls) => (
                  <NativeSelectOption key={cls.id} value={cls.id}>
                    {cls.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="fee-structure-category">{t("fields.category")}</FieldLabel>
              <NativeSelect id="fee-structure-category" {...register("feeCategoryId")}>
                {categories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="fee-structure-name">{t("fields.name")}</FieldLabel>
              <Input id="fee-structure-name" {...register("name")} />
              <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="fee-structure-name-bn">{t("fields.nameBn")}</FieldLabel>
              <Input id="fee-structure-name-bn" {...register("nameBn")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="fee-structure-amount">{t("fields.amount")}</FieldLabel>
              <Input id="fee-structure-amount" type="number" step="0.01" min="0" {...register("amount")} />
              <FieldError errors={[errors.amount && { message: t(errors.amount.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="fee-structure-frequency">{t("fields.frequency")}</FieldLabel>
              <NativeSelect id="fee-structure-frequency" {...register("frequency")}>
                {FEE_FREQUENCIES.map((frequency) => (
                  <NativeSelectOption key={frequency} value={frequency}>
                    {t(`frequency.${frequency}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="fee-structure-due-date">{t("fields.dueDate")}</FieldLabel>
              <Input id="fee-structure-due-date" type="date" {...register("dueDate")} />
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
