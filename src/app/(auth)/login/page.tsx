import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { GraduationCap } from "lucide-react"
import { getSession } from "@/lib/auth/session"
import { LoginForm } from "@/components/auth/login-form"
import { LanguageSwitcher } from "@/components/shared/language-switcher"

export default async function LoginPage() {
  const session = await getSession()
  if (session.userId) {
    redirect("/dashboard")
  }

  const t = await getTranslations()

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <GraduationCap className="size-8 text-primary" />
          <div>
            <h1 className="font-heading text-lg font-semibold">{t("common.appName")}</h1>
            <p className="text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
