"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  GraduationCap,
  Calculator,
  UserCheck,
  Loader2,
  AlertCircle,
  HelpCircle,
  Phone,
  Building2,
} from "lucide-react"
import { login } from "@/actions/auth/login"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "cn"

interface DemoAccount {
  label: string
  role: string
  email: string
  pass: string
  icon: React.ComponentType<{ className?: string }>
}

const DEMO_ROLES: DemoAccount[] = [
  {
    label: "Admin",
    role: "Administrator",
    email: "super.admin@benwil.test",
    pass: "Passw0rd!",
    icon: Shield,
  },
  {
    label: "Teacher",
    role: "Faculty Member",
    email: "teacher@benwil.test",
    pass: "Passw0rd!",
    icon: GraduationCap,
  },
  {
    label: "Accountant",
    role: "Finance Dept",
    email: "accountant@benwil.test",
    pass: "Passw0rd!",
    icon: Calculator,
  },
  {
    label: "Student",
    role: "Enrolled Pupil",
    email: "student@benwil.test",
    pass: "Passw0rd!",
    icon: UserCheck,
  },
]

export function SlidingAuthCard() {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [activeRole, setActiveRole] = useState<string>("Admin")
  const [helpOpen, setHelpOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "super.admin@benwil.test",
      password: "Passw0rd!",
    },
  })

  function handleSelectRole(demo: DemoAccount) {
    setActiveRole(demo.label)
    setValue("email", demo.email, { shouldValidate: true })
    setValue("password", demo.pass, { shouldValidate: true })
    clearErrors()
  }

  function onLoginSubmit(data: LoginInput) {
    clearErrors()
    startTransition(async () => {
      const result = await login(data)
      if (result?.error) {
        setError("root", { message: result.error })
      }
    })
  }

  return (
    <div className="w-full max-w-[920px] bg-white rounded-[22px] sm:rounded-[28px] md:rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.14),0_12px_24px_-8px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col md:flex-row min-h-[540px] md:min-h-[560px] relative z-10 transition-all duration-500">
      
      {/* ============================================================ */}
      {/* LEFT PANEL: Vibrant Teal Gradient Hero (Matching Reference)  */}
      {/* ============================================================ */}
      <section className="relative w-full md:w-[45%] bg-gradient-to-br from-[#25B499] via-[#20A88D] to-[#1A987E] text-white p-6 sm:p-8 lg:p-12 flex flex-col justify-between overflow-hidden select-none">
        
        {/* Subtle translucent geometric decorations from reference */}
        <div className="absolute top-10 right-10 w-16 h-16 rounded-2xl bg-white/10 rotate-45 backdrop-blur-[2px] pointer-events-none" />
        <div className="absolute bottom-16 right-6 w-20 h-20 rounded-3xl bg-white/10 rotate-45 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/10 pointer-events-none" />

        {/* Top-Left: Brand Header (minimalist modern emblem + Benwil School) */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border-2 border-white/80 flex items-center justify-center text-white p-1 shadow-xs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-white font-bold text-base sm:text-lg tracking-tight font-heading">
              Benwil
            </span>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15 text-white/90 font-mono uppercase tracking-wider">
            EST. 1994
          </span>
        </div>

        {/* Center: Welcome Heading & Subtitle & Outline Button */}
        <div className="relative z-10 my-auto py-6 md:py-10 text-center flex flex-col items-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-heading">
            {t("auth.welcomeBack")}
          </h2>

          <p className="text-white/90 text-xs sm:text-sm lg:text-[14.5px] font-normal leading-relaxed max-w-[270px] mt-2 md:mt-4">
            {t("auth.welcomeBackDesc")}
          </p>

          {/* White outline pill button opening the institutional help/guide modal */}
          <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
            <DialogTrigger
              render={
                <button
                  type="button"
                  className="mt-6 md:mt-8 inline-flex items-center justify-center px-8 md:px-11 py-2.5 md:py-3 rounded-full border-2 border-white text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-[#20A88D] transition-all duration-300 shadow-xs active:scale-95 cursor-pointer"
                >
                  {t("auth.forgotPassword")}
                </button>
              }
            />
            <DialogContent className="sm:max-w-md rounded-2xl border-border bg-white text-gray-800 p-6">
              <DialogHeader>
                <div className="w-10 h-10 rounded-full bg-[#20A88D]/10 text-[#20A88D] flex items-center justify-center mb-2">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <DialogTitle className="text-lg font-bold font-heading text-gray-900">
                  {t("auth.helpTitle")}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 leading-relaxed pt-1">
                  {t("auth.helpDescription")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Building2 className="size-4 text-[#20A88D] shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-gray-900">{t("auth.itDesk")}</p>
                    <p className="text-gray-500">{t("auth.emailHelp")}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <Phone className="size-4 text-[#20A88D] shrink-0" />
                  <div className="text-xs">
                    <p className="font-semibold text-gray-900">{t("auth.registrarOffice")}</p>
                    <p className="text-gray-500">{t("auth.phone")}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <DialogClose
                  render={
                    <Button variant="outline" size="sm" className="rounded-xl text-xs">
                      {t("auth.close")}
                    </Button>
                  }
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bottom micro notice */}
        <div className="relative z-10 text-center text-[10px] sm:text-[11px] text-white/60">
          Benwil Model Institutional System
        </div>
      </section>

      {/* ============================================================ */}
      {/* RIGHT PANEL: Pure White Sign In Form                         */}
      {/* ============================================================ */}
      <section className="relative w-full md:w-[55%] bg-white p-6 sm:p-8 lg:p-12 flex flex-col justify-between">
        
        {/* Form Container */}
        <div className="my-auto max-w-sm w-full mx-auto">
          
          {/* Heading in Emerald/Teal */}
          <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-[#20A88D] tracking-tight text-center font-heading">
            {t("auth.signIn")}
          </h1>

          {/* Role selector circular buttons (styled like f, G+, in from reference) */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {DEMO_ROLES.map((demo) => {
              const Icon = demo.icon
              const isSelected = activeRole === demo.label
              return (
                <button
                  key={demo.label}
                  type="button"
                  onClick={() => handleSelectRole(demo)}
                  title={`Quick fill ${demo.label} (${demo.role})`}
                  className={cn(
                    "w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 shadow-xs active:scale-90 cursor-pointer",
                    isSelected
                      ? "border-[#20A88D] bg-[#20A88D] text-white shadow-md shadow-[#20A88D]/25"
                      : "border-gray-200 text-gray-500 hover:border-[#20A88D] hover:text-[#20A88D] hover:bg-[#20A88D]/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>

          {/* Subtitle / Divider text */}
          <p className="text-xs text-gray-400 font-medium text-center mt-3 mb-6 tracking-wide">
            {t("auth.orUseSchoolEmail")}
          </p>

          {/* Global error banner */}
          {errors.root && (
            <Alert variant="destructive" className="mb-4 py-2.5 rounded-xl text-xs bg-red-50 border-red-200 text-red-700">
              <AlertCircle className="size-4 shrink-0" />
              <AlertDescription className="text-xs">{errors.root.message}</AlertDescription>
            </Alert>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-3.5">
            {/* Email Field */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={isPending}
                  placeholder={t("auth.email") || "Email"}
                  {...register("email")}
                  className={cn(
                    "w-full pl-10 pr-4 py-3 bg-[#F0F5F4] text-gray-800 placeholder-gray-400 text-sm rounded-lg border border-transparent focus:border-[#20A88D]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20A88D]/20 transition-all",
                    errors.email && "border-red-400 bg-red-50/40"
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 pl-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  disabled={isPending}
                  placeholder={t("auth.password") || "Password"}
                  {...register("password")}
                  className={cn(
                    "w-full pl-10 pr-10 py-3 bg-[#F0F5F4] text-gray-800 placeholder-gray-400 text-sm rounded-lg border border-transparent focus:border-[#20A88D]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20A88D]/20 transition-all",
                    errors.password && "border-red-400 bg-red-50/40"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-500 pl-1">{errors.password.message}</p>
              )}
            </div>

            {/* Checkbox and Help Modal Trigger */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600">
                <Checkbox
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                  className="rounded border-gray-300 data-[state=checked]:bg-[#20A88D] data-[state=checked]:border-[#20A88D]"
                />
                <span className="text-[12px]">{t("auth.rememberMe")}</span>
              </label>

              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="text-[12px] text-gray-500 hover:text-[#20A88D] hover:underline transition-colors cursor-pointer"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>

            {/* Sign In Submit CTA */}
            <div className="pt-4 text-center">
              <button
                type="submit"
                disabled={isPending}
                className="w-auto px-12 py-3.5 rounded-full bg-[#20A88D] hover:bg-[#1A987E] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-widest shadow-[0_8px_20px_rgba(32,168,141,0.35)] hover:shadow-[0_10px_25px_rgba(32,168,141,0.45)] transition-all duration-200 active:scale-[0.98] inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isPending ? t("auth.loggingIn") : t("auth.signIn")}</span>
              </button>
            </div>
          </form>

        </div>

        {/* Bottom security notice */}
        <div className="text-center pt-4 text-[10.5px] text-gray-400 border-t border-gray-100 mt-6">
          {t("auth.securityNotice")}
        </div>
      </section>
    </div>
  )
}
