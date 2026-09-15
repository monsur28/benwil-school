"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Plus, Pencil } from "lucide-react"
import { createClass, updateClass } from "@/actions/academics/classes"
import { createClassSchema } from "@/lib/validations/academics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
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

type ClassRecord = { id: string; name: string; order: number; isActive: boolean }

export function ClassDialog({
  klass,
  defaultOrder,
}: {
  klass?: ClassRecord
  defaultOrder?: number
}) {
  const t = useTranslations("academics")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isActive, setIsActive] = useState(klass?.isActive ?? true)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: klass?.name ?? "",
      order: klass?.order ?? defaultOrder ?? 1,
    },
  })

  function onSubmit(values: { name: string; order: number }) {
    startTransition(async () => {
      const result = klass
        ? await updateClass({ id: klass.id, ...values, isActive })
        : await createClass(values)

      if (!result.success) {
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
      <DialogTrigger render={<Button variant={klass ? "ghost" : "default"} size={klass ? "sm" : "default"} />}>
        {klass ? <Pencil /> : <Plus />}
        {klass ? t("actions.edit") : t("classes.addTitle")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{klass ? t("classes.editTitle") : t("classes.addTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <Field>
            <FieldLabel htmlFor="class-name">{t("fields.name")}</FieldLabel>
            <Input id="class-name" aria-invalid={Boolean(errors.name)} {...register("name")} />
            <FieldError errors={[errors.name && { message: t(errors.name.message as never) }]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="class-order">{t("fields.order")}</FieldLabel>
            <Input
              id="class-order"
              type="number"
              min={1}
              aria-invalid={Boolean(errors.order)}
              {...register("order")}
            />
            <FieldError errors={[errors.order && { message: t(errors.order.message as never) }]} />
          </Field>
          {klass && (
            <Field>
              <FieldLabel htmlFor="class-status">{t("fields.status")}</FieldLabel>
              <NativeSelect
                id="class-status"
                value={isActive ? "active" : "inactive"}
                onChange={(event) => setIsActive(event.target.value === "active")}
              >
                <NativeSelectOption value="active">{t("status.active")}</NativeSelectOption>
                <NativeSelectOption value="inactive">{t("status.inactive")}</NativeSelectOption>
              </NativeSelect>
            </Field>
          )}
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
