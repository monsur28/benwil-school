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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "cn"

export function SlidingAuthCard() {
  const t = useTranslations()
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
    <div className="w-full max-w-[400px] bg-white rounded-[24px] shadow-lg shadow-slate-200/50 flex flex-col py-6 px-6 sm:py-7 sm:px-8 mx-auto">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-5">
        <div className="w-13 h-13 bg-[#EEF2F6] rounded-2xl flex items-center justify-center mb-2.5 p-2 shadow-2xs">
          <Image
            src="/images/school_crest.png"
            alt="Benwil Model School Crest"
            width={38}
            height={38}
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-[22px] font-extrabold text-[#0F172A] tracking-tight font-heading text-center leading-tight mb-0.5">
          Welcome Back
        </h1>
        <p className="text-[12.5px] text-slate-500 text-center font-normal">
          Sign in to your School Management System
        </p>
      </div>

      {/* Global error banner */}
      {errors.root && (
        <Alert variant="destructive" className="mb-4 py-2 px-3 rounded-xl text-xs bg-red-50 border-red-200 text-red-700">
          <AlertCircle className="size-3.5 shrink-0" />
          <AlertDescription className="text-[12px]">{errors.root.message}</AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-3.5">
        {/* Email Field */}
        <div className="space-y-1">
          <label className="text-[12px] font-semibold text-[#0F172A] block">Email or Username</label>
          <div className="relative flex items-center">
            <User className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              placeholder="Enter your email or username"
              {...register("email")}
              className={cn(
                "w-full pl-9 pr-3.5 py-2 text-slate-900 placeholder:text-slate-400 text-[13px] border border-slate-200 rounded-lg focus:outline-none transition-all",
                "bg-white focus:border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]",
                errors.email && "!border-red-400 !bg-red-50/40"
              )}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-red-500 pl-0.5">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label className="text-[12px] font-semibold text-[#0F172A] block">Password</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={isPending}
              placeholder="Enter your password"
              {...register("password")}
              className={cn(
                "w-full pl-9 pr-9 py-2 text-slate-900 placeholder:text-slate-400 text-[13px] border border-slate-200 rounded-lg focus:outline-none transition-all",
                "bg-white focus:border-[#C81E1E] focus:ring-1 focus:ring-[#C81E1E]",
                errors.password && "!border-red-400 !bg-red-50/40"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-500 pl-0.5">{errors.password.message}</p>
          )}
        </div>

        {/* Checkbox and Forgot Password */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              className="rounded w-3.5 h-3.5 border-slate-300 data-[state=checked]:bg-[#C81E1E] data-[state=checked]:border-[#C81E1E] data-[state=checked]:text-white"
            />
            <span className="text-[12px] font-normal text-slate-600">Remember me</span>
          </label>

          <button
            type="button"
            className="text-[12px] font-semibold text-[#C81E1E] hover:text-[#A51818] hover:underline transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Button */}
        <div className="pt-1.5">
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-lg bg-[#C81E1E] hover:bg-[#B71C1C] disabled:opacity-70 text-white font-bold text-[13.5px] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Sign In</span>
            {!isPending && <ArrowRight className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>
      </form>

      {/* Need Help Link */}
      <p className="text-center text-[12px] text-slate-500 font-normal pt-4">
        Need help?{" "}
        <a href="#" className="text-[#C81E1E] font-semibold hover:underline">
          Contact your administrator
        </a>
      </p>
    </div>
  )
}
