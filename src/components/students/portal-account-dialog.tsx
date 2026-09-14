"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import {
  createPortalAccountSchema,
  type CreatePortalAccountInput,
} from "@/lib/validations/portal-account"
import { createStudentAccount, createGuardianAccount } from "@/actions/portal/account-linking"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

type PortalAccountDialogProps = {
  kind: "student" | "guardian"
  targetId: string
  targetName: string
}

export function PortalAccountDialog({ kind, targetId, targetName }: PortalAccountDialogProps) {
  const t = useTranslations("portal")
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreatePortalAccountInput>({
    resolver: zodResolver(createPortalAccountSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: CreatePortalAccountInput) {
    startTransition(async () => {
      const result =
        kind === "student"
          ? await createStudentAccount(targetId, values)
          : await createGuardianAccount(targetId, values)
      if (result.error) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t("success.accountCreated"), type: "success" })
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
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <UserPlus />
        {t("actions.createAccount")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialog.createAccountTitle", { name: targetName })}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="portal-account-email">{t("fields.email")}</FieldLabel>
              <Input id="portal-account-email" type="email" {...register("email")} />
              <FieldError errors={[errors.email && { message: t(errors.email.message as never) }]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="portal-account-password">{t("fields.password")}</FieldLabel>
              <Input id="portal-account-password" type="password" {...register("password")} />
              <FieldError errors={[errors.password && { message: t(errors.password.message as never) }]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {t("actions.createAccount")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
