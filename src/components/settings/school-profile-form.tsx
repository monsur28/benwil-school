"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { schoolProfileSchema, type SchoolProfileInput } from "@/lib/validations/school-settings"
import { updateSchoolProfile } from "@/actions/settings/school-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldError, FieldGroup } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

export function SchoolProfileForm({ settings }: { settings: SchoolProfileInput }) {
  const t = useTranslations("settings")
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SchoolProfileInput>({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: settings,
  })

  function submit(values: SchoolProfileInput) {
    startTransition(async () => {
      const result = await updateSchoolProfile(values)
      if (!result.success) {
        setError("root", { message: result.error })
        return
      }
      toast.add({ title: t("success.saved"), type: "success" })
    })
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      {errors.root && (
        <Alert variant="destructive">
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <p className="text-sm font-semibold text-foreground">{t("school.sections.basic")}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="school-name">{t("fields.schoolName")} *</FieldLabel>
            <Input id="school-name" {...register("schoolName")} />
            <FieldError errors={[errors.schoolName && { message: t(errors.schoolName.message as never) }]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="school-short-name">{t("fields.shortName")}</FieldLabel>
            <Input id="school-short-name" {...register("shortName")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="school-code">{t("fields.schoolCode")}</FieldLabel>
            <Input id="school-code" {...register("schoolCode")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="school-established-year">{t("fields.establishedYear")}</FieldLabel>
            <Input id="school-established-year" type="number" {...register("establishedYear")} />
            <FieldError errors={[errors.establishedYear && { message: t(errors.establishedYear.message as never) }]} />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="school-motto">{t("fields.motto")}</FieldLabel>
          <Input id="school-motto" {...register("motto")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="school-description">{t("fields.description")}</FieldLabel>
          <Textarea id="school-description" rows={3} {...register("description")} />
        </Field>

        <p className="pt-2 text-sm font-semibold text-foreground">{t("school.sections.administration")}</p>
        <Field>
          <FieldLabel htmlFor="school-principal-name">{t("fields.principalName")}</FieldLabel>
          <Input id="school-principal-name" {...register("principalName")} />
        </Field>

        <p className="pt-2 text-sm font-semibold text-foreground">{t("school.sections.contact")}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="school-email">{t("fields.email")}</FieldLabel>
            <Input id="school-email" type="email" {...register("email")} />
            <FieldError errors={[errors.email && { message: t(errors.email.message as never) }]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="school-phone">{t("fields.phone")}</FieldLabel>
            <Input id="school-phone" {...register("phone")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="school-alternate-phone">{t("fields.alternatePhone")}</FieldLabel>
            <Input id="school-alternate-phone" {...register("alternatePhone")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="school-website">{t("fields.website")}</FieldLabel>
            <Input id="school-website" placeholder="https://" {...register("website")} />
            <FieldError errors={[errors.website && { message: t(errors.website.message as never) }]} />
          </Field>
        </div>

        <p className="pt-2 text-sm font-semibold text-foreground">{t("school.sections.address")}</p>
        <Field>
          <FieldLabel htmlFor="school-address">{t("fields.address")}</FieldLabel>
          <Input id="school-address" {...register("address")} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="school-city">{t("fields.city")}</FieldLabel>
            <Input id="school-city" {...register("city")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="school-country">{t("fields.country")}</FieldLabel>
            <Input id="school-country" {...register("country")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="school-postal-code">{t("fields.postalCode")}</FieldLabel>
            <Input id="school-postal-code" {...register("postalCode")} />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? t("actions.saving") : t("actions.saveChanges")}
        </Button>
      </div>
    </form>
  )
}
