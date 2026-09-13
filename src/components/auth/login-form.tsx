"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { AlertCircle } from "lucide-react"
import { login } from "@/actions/auth/login"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function LoginForm() {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  function onSubmit(values: LoginInput) {
    startTransition(async () => {
      const result = await login(values)
      if (result?.error) {
        setError("root", { message: result.error })
      }
    })
  }

  return (
    <Card>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {errors.root && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{errors.root.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{t(errors.email.message as never)}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{t(errors.password.message as never)}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("auth.loggingIn") : t("auth.loginButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
