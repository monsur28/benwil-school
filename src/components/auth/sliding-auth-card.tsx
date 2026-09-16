"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { login } from "@/actions/auth/login"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import type { PublicBranding } from "@/lib/settings/branding"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

/**
 * The sign-in form.
 *
 * Presented as bare content on the white column rather than as a floating
 * card — the page frame already provides the surface, so a second card would
 * only add an outline. Behaviour (react-hook-form + zod + the `login` server
 * action, including the root-error path) is unchanged.
 */
export function SlidingAuthCard({ branding }: { branding: PublicBranding }) {
  const t = useTranslations("auth")
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onLoginSubmit(data: LoginInput) {
    clearErrors()
    startTransition(async () => {
      const result = await login(data)
      if (!result?.success) {
        setError("root", { message: result.error })
      }
    })
  }

  return (
    <div className="w-full max-w-[24rem]">
      <div className="mb-8">
        <h1 className="font-heading text-[1.75rem] font-bold leading-tight tracking-[-0.03em] text-foreground">
          {t("loginTitle")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{branding.loginSubtitle}</p>
      </div>

      {errors.root && (
        <Alert variant="destructive" className="mb-5">
          <AlertCircle />
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={isPending}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="h-11"
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" className="text-xs font-medium text-danger">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isPending}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="h-11 pr-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={t("password")}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-xs font-medium text-danger">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer select-none items-center gap-2">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
            />
            <span className="text-[13px] text-muted-foreground">{t("rememberMe")}</span>
          </label>

          <button
            type="button"
            className="text-[13px] font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            {t("forgotPassword")}
          </button>
        </div>

        <Button type="submit" size="lg" disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {isPending ? t("loggingIn") : t("signIn")}
          {!isPending && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <p className="mt-8 text-center text-[13px] text-muted-foreground">
        {t("helpTitle")}{" "}
        <a href="#" className="font-medium text-primary underline-offset-4 hover:underline">
          {t("itDesk")}
        </a>
      </p>
    </div>
  )
}
