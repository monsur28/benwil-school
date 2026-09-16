"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import Image from "next/image"
import { login } from "@/actions/auth/login"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import type { PublicBranding } from "@/lib/settings/branding"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { SchoolCrest } from "@/components/shared/school-crest"
import { cn } from "cn"

export function SlidingAuthCard({ branding }: { branding: PublicBranding }) {
  const t = useTranslations()
  const logoUrl = branding.loginLogoUrl ?? branding.logoUrl
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
    <div className="w-full max-w-[400px] bg-card rounded-[24px] shadow-lg shadow-border/50 flex flex-col py-6 px-6 sm:py-7 sm:px-8 mx-auto">

      {/* Header */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-13 h-13 bg-muted rounded-2xl flex items-center justify-center mb-2.5 p-2 shadow-2xs">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={branding.schoolName}
              width={38}
              height={38}
              className="object-contain"
              unoptimized
              priority
            />
          ) : (
            <SchoolCrest size="sm" className="size-9.5" />
          )}
        </div>
        <h1 className="text-[22px] font-extrabold text-foreground tracking-tight font-heading text-center leading-tight mb-0.5">
          {branding.loginTitle}
        </h1>
        <p className="text-[12.5px] text-muted-foreground text-center font-normal">
          {branding.loginSubtitle}
        </p>
      </div>

      {/* Global error banner */}
      {errors.root && (
        <Alert variant="destructive" className="mb-4 py-2 px-3 rounded-xl text-xs bg-destructive/10 border-destructive/20 text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <AlertDescription className="text-[12px]">{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-3.5">
        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-[12px] font-semibold text-foreground block">Email or Username</label>
          <div className="relative flex items-center">
            <User className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              placeholder="Enter your email or username"
              {...register("email")}
              className={cn(
                "w-full pl-9 pr-3.5 py-2 text-foreground placeholder:text-muted-foreground text-[13px] border border-input rounded-lg focus:outline-none transition-all",
                "bg-background focus:border-primary focus:ring-1 focus:ring-primary",
                errors.email && "!border-destructive !bg-destructive/10"
              )}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-destructive pl-0.5">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label className="text-[12px] font-semibold text-foreground block">Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isPending}
              placeholder="Enter your password"
              {...register("password")}
              className={cn(
                "w-full pl-9 pr-9 py-2 text-foreground placeholder:text-muted-foreground text-[13px] border border-input rounded-lg focus:outline-none transition-all",
                "bg-background focus:border-primary focus:ring-1 focus:ring-primary",
                errors.password && "!border-destructive !bg-destructive/10"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-destructive pl-0.5">{errors.password.message}</p>
          )}
        </div>

        {/* Checkbox and Forgot Password */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              className="rounded w-3.5 h-3.5 border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
            />
            <span className="text-[12px] font-normal text-muted-foreground">Remember me</span>
          </label>

          <button
            type="button"
            className="text-[12px] font-semibold text-primary hover:text-brand-red-dark hover:underline transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-1.5">
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-70 text-primary-foreground font-bold text-[13.5px] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Sign In</span>
            {!isPending && <ArrowRight className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>
      </form>

      {/* Need Help Link */}
      <p className="text-center text-[12px] text-muted-foreground font-normal pt-4">
        Need help?{" "}
        <a href="#" className="text-primary font-semibold hover:underline">
          Contact your administrator
        </a>
      </p>
    </div>
  )
}
