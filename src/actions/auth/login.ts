"use server"
import { ActionResult } from '@/lib/types/action'

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/db/client"
import { verifyPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { portalHomeForRole } from "@/lib/portal/routes"
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/auth/rate-limit"

export async function login(input: LoginInput): Promise<ActionResult> {
  try {
    const t = await getTranslations("auth")
    const parsed = loginSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: t("errors.invalidForm") }
    }

    const headerList = await headers()
    // In a real proxy setup, this should be trusted, but for defense-in-depth or if proxy is absent:
    const ip = headerList.get("x-real-ip") || headerList.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
    const normalizedEmail = parsed.data.email.toLowerCase().trim()
    const rateLimitKey = `${ip}:${normalizedEmail}`

    const { allowed } = await checkRateLimit(rateLimitKey)
    if (!allowed) {
      return { success: false, error: t("errors.tooManyAttempts") }
    }

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (!user || !user.isActive) {
      await recordFailedAttempt(rateLimitKey)
      return { success: false, error: t("invalidCredentials") }
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return { success: false, error: t("errors.tooManyAttempts") } // use same generic error, or a specific locked out one
    }

    const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash)
    if (!passwordMatches) {
      await recordFailedAttempt(rateLimitKey)
      
      // Implement account lockout logic: if they failed enough, lock them out.
      // But we just use the rate limit to get the count.
      // Or simply: check the rate limit count AFTER recording it
      const { remaining } = await checkRateLimit(rateLimitKey)
      if (remaining === 0) {
        // Lock out the user for 15 minutes
        await prisma.user.update({
          where: { id: user.id },
          data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }
        })
      }

      return { success: false, error: t("invalidCredentials") }
    }

    // Reset rate limit and lockout on success
    await resetRateLimit(rateLimitKey)
    if (user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lockedUntil: null }
      })
    }

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
    return { success: false, error: t("errors.loginFailed") }
  }
}

