"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useTransition } from "react"
import { loginBrandingSchema, type LoginBrandingInput } from "@/lib/validations/school-settings"
import { updateLoginBranding } from "@/actions/settings/school-settings"
import { BrandingImageUploader } from "@/components/settings/branding-image-uploader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/toast"

export function LoginBrandingForm({
  settings,
  initialLoginLogoUrl,
  initialLoginBackgroundUrl,
}: {
  settings: LoginBrandingInput
  initialLoginLogoUrl: string | null
  initialLoginBackgroundUrl: string | null
}) {
  const t = useTranslations("settings")
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginBrandingInput>({
    resolver: zodResolver(loginBrandingSchema),
    defaultValues: settings,
  })

  function submit(values: LoginBrandingInput) {
    startTransition(async () => {
      const result = await updateLoginBranding(values)
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BrandingImageUploader
          kind="loginLogo"
          label={t("branding.loginLogo")}
          recommendedText={t("branding.logoRecommended")}
          accept="image/jpeg,image/png,image/webp"
          initialUrl={initialLoginLogoUrl}
        />
        <BrandingImageUploader
          kind="loginBackground"
          label={t("branding.loginBackground")}
          recommendedText={t("branding.loginBackgroundRecommended")}
          accept="image/jpeg,image/png,image/webp"
          initialUrl={initialLoginBackgroundUrl}
        />
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="login-title">{t("branding.loginTitle")}</FieldLabel>
          <Input id="login-title" placeholder={t("branding.loginTitleDefault")} {...register("loginTitle")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="login-subtitle">{t("branding.loginSubtitle")}</FieldLabel>
          <Input id="login-subtitle" placeholder={t("branding.loginSubtitleDefault")} {...register("loginSubtitle")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="login-description">{t("branding.loginDescription")}</FieldLabel>
          <Textarea id="login-description" rows={2} {...register("loginDescription")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="login-footer">{t("branding.loginFooterText")}</FieldLabel>
          <Input id="login-footer" placeholder={t("branding.loginFooterDefault")} {...register("loginFooterText")} />
        </Field>
      </FieldGroup>

      <Button type="submit" disabled={isPending}>
        {isPending ? t("actions.saving") : t("actions.saveChanges")}
      </Button>
    </form>
  )
}
