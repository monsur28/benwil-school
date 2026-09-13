"use server"

import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { prisma } from "@/lib/db/client"
import { verifyPassword } from "@/lib/auth/password"
import { createSession } from "@/lib/auth/session"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

export async function login(input: LoginInput): Promise<{ error: string }> {
  const t = await getTranslations("auth")
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: t("errors.invalidForm") }
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (!user || !user.isActive) {
    return { error: t("invalidCredentials") }
  }

  const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash)
  if (!passwordMatches) {
    return { error: t("invalidCredentials") }
  }

  await createSession({
    userId: user.id,
    schoolId: user.schoolId,
    name: user.name,
    role: user.role,
  })

  redirect("/dashboard")
}
