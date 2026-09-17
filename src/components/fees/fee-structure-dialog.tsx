"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Pencil, Plus, Wallet, Loader2, Check, AlertCircle } from "lucide-react"
import type { z } from "zod"
import { createFeeStructureSchema, editFeeStructureSchema, FEE_FREQUENCIES } from "@/lib/validations/fees"
import { createFeeStructure, updateFeeStructure } from "@/actions/fees/fee-structures"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"
import { IconBadge } from "@/components/ui/icon-badge"

type CreateFeeStructureFormInput = z.input<typeof createFeeStructureSchema>
type EditFeeStructureFormInput = z.input<typeof editFeeStructureSchema>

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
          <Pencil className="size-4" />
        ) : (
          <>
            <Plus className="size-4" />
            {t("actions.addStructure")}
          </>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <IconBadge tone="amber" size="sm">
              <Wallet className="size-4" />
            </IconBadge>
            <div>
              <DialogTitle>{t(isEdit ? "structureDialog.editTitle" : "structureDialog.addTitle")}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {t("structureDialog.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-1">
          {errors.root && (
            <Alert variant="destructive" className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {/* Academic Year & Class */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fee-structure-year">
                  {t("fields.academicYear")}
                  <span className="text-danger font-bold ml-0.5">*</span>
                </FieldLabel>
                <NativeSelect id="fee-structure-year" className="w-full" {...register("academicYearId")}>
                  {academicYears.map((year) => (
                    <NativeSelectOption key={year.id} value={year.id}>
                      {year.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel htmlFor="fee-structure-class">
                  {t("fields.class")}
                  <span className="text-danger font-bold ml-0.5">*</span>
                </FieldLabel>
                <NativeSelect id="fee-structure-class" className="w-full" {...register("classId")}>
                  {classes.map((cls) => (
                    <NativeSelectOption key={cls.id} value={cls.id}>
                      {cls.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            {/* Fee Category & Frequency */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fee-structure-category">
                  {t("fields.category")}
                  <span className="text-danger font-bold ml-0.5">*</span>
                </FieldLabel>
                <NativeSelect id="fee-structure-category" className="w-full" {...register("feeCategoryId")}>
                  {categories.map((category) => (
                    <NativeSelectOption key={category.id} value={category.id}>
                      {category.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel htmlFor="fee-structure-frequency">
                  {t("fields.frequency")}
                  <span className="text-danger font-bold ml-0.5">*</span>
                </FieldLabel>
                <NativeSelect id="fee-structure-frequency" className="w-full" {...register("frequency")}>
                  {FEE_FREQUENCIES.map((frequency) => (
                    <NativeSelectOption key={frequency} value={frequency}>
                      {t(`frequency.${frequency}`)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            {/* Title (English) & Bangla Name */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fee-structure-name">
                  {t("fields.name")}
                  <span className="text-danger font-bold ml-0.5">*</span>
                </FieldLabel>
                <Input
                  id="fee-structure-name"
                  placeholder={t("structureDialog.namePlaceholder")}
                  {...register("name")}
                />
                <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="fee-structure-name-bn">
                  {t("fields.nameBn")}
                </FieldLabel>
                <Input
                  id="fee-structure-name-bn"
                  placeholder={t("structureDialog.nameBnPlaceholder")}
                  {...register("nameBn")}
                />
              </Field>
            </div>

            {/* Amount & Due Date */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="fee-structure-amount">
                  {t("fields.amount")} (৳)
                  <span className="text-danger font-bold ml-0.5">*</span>
                </FieldLabel>
                <Input
                  id="fee-structure-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={t("structureDialog.amountPlaceholder")}
                  {...register("amount")}
                />
                <FieldError errors={[errors.amount && { message: t(errors.amount.message as never) }]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="fee-structure-due-date">
                  {t("fields.dueDate")}
                </FieldLabel>
                <Input id="fee-structure-due-date" type="date" {...register("dueDate")} />
              </Field>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-28 gap-2">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t("actions.saving")}</span>
                </>
              ) : isEdit ? (
                <>
                  <Check className="size-4" />
                  <span>{t("actions.save")}</span>
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  <span>{t("actions.addStructure")}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
