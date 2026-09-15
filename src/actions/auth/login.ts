"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/db/client"
import { verifyPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { portalHomeForRole } from "@/lib/portal/routes"
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/auth/rate-limit"

export async function login(input: LoginInput): Promise<{ error: string }> {
  try {
    const t = await getTranslations("auth")
    const parsed = loginSchema.safeParse(input)
    if (!parsed.success) {
      return { error: t("errors.invalidForm") }
    }

    const headerList = await headers()
    const ip = headerList.get("x-forwarded-for")?.split(",")[0].trim() || headerList.get("x-real-ip") || "unknown"
    const normalizedEmail = parsed.data.email.toLowerCase().trim()
    const rateLimitKey = `${ip}:${normalizedEmail}`

    const { allowed } = checkRateLimit(rateLimitKey)
    if (!allowed) {
      return { error: t("errors.tooManyAttempts") }
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (!user || !user.isActive) {
      recordFailedAttempt(rateLimitKey)
      return { error: t("invalidCredentials") }
    }

    const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash)
    if (!passwordMatches) {
      recordFailedAttempt(rateLimitKey)
      return { error: t("invalidCredentials") }
    }

    resetRateLimit(rateLimitKey)

    await createSession({
      userId: user.id,
      schoolId: user.schoolId,
      name: user.name,
      role: user.role,
    })

    redirect(portalHomeForRole(user.role))
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof err.digest === "string" &&
      err.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw err
    }
    console.error("Login action error:", err)
    const t = await getTranslations("auth")
    return { error: t("errors.loginFailed") }
  }
}

