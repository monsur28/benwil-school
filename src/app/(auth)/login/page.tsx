import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { portalHomeForRole } from "@/lib/portal/routes"
import { getLoginBranding } from "@/lib/settings/branding"
import { SlidingAuthCard } from "@/components/auth/sliding-auth-card"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { SchoolCrest } from "@/components/shared/school-crest"
import { Users, BookOpen, TrendingUp, ShieldCheck } from "lucide-react"
import Image from "next/image"

export default async function LoginPage() {
  const session = await getSession()
  if (session.userId && session.role) {
    redirect(portalHomeForRole(session.role))
  }

  const branding = await getLoginBranding()

  return (
    <main className="h-screen max-h-[100dvh] w-full flex bg-background overflow-hidden">

      {/* LEFT COLUMN - Information & Brand Background (Hidden on small screens) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[55%] xl:w-[58%] bg-cover bg-bottom relative overflow-hidden border-r border-border/80"
        style={{ backgroundImage: `url('${branding.loginBackgroundUrl || "/students_studying.jpg"}')` }}
      >
        {/* Soft fading overlay at the top to guarantee 100% text readability */}
        <div className="absolute top-0 inset-x-0 h-[60%] bg-gradient-to-b from-background/95 via-background/80 to-transparent pointer-events-none z-0" />

        {/* Content Container positioned at top */}
        <div className="p-6 lg:p-8 xl:p-10 flex flex-col z-10 relative">

          {/* Logo Area */}
          <div className="flex items-center gap-3 mb-4 xl:mb-5">
            <div className="w-10 h-10 flex items-center justify-center bg-card/90 rounded-xl shadow-2xs p-1">
              {branding.logoUrl ? (
                <Image
                  src={branding.logoUrl}
                  alt={branding.schoolName}
                  width={36}
                  height={36}
                  className="object-contain"
                  unoptimized
                  priority
                />
              ) : (
                <SchoolCrest size="sm" className="size-9" />
              )}
            </div>
            <div>
              <h1 className="text-foreground font-extrabold text-[20px] tracking-tight font-heading leading-tight">
                {branding.schoolName}
              </h1>
            </div>
          </div>

          {/* Heading */}
          <div className="max-w-lg">
            <h2 className="text-[28px] xl:text-[34px] font-black text-foreground tracking-tight font-heading leading-[1.15] mb-2.5">
              A Brighter Future <br />
              <span className="text-primary">for Every Learner</span>
            </h2>
            <p className="text-foreground/80 text-[13px] xl:text-[14px] leading-relaxed max-w-md mb-4 font-medium">
              {branding.loginDescription}
            </p>

            {/* Feature Blocks - Clean without card containers or curve borders */}
            <div className="grid grid-cols-4 gap-3 max-w-lg">
              <div className="flex flex-col items-start">
                <div className="w-9 h-9 rounded-xl bg-info/10 text-info flex items-center justify-center mb-1.5 shadow-2xs">
                  <Users className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-foreground text-[12.5px] leading-snug">Students</h3>
                <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight font-medium">Manage with ease</p>
              </div>

              <div className="flex flex-col items-start">
                <div className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-1.5 shadow-2xs">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-foreground text-[12.5px] leading-snug">Academics</h3>
                <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight font-medium">Track progress</p>
              </div>

              <div className="flex flex-col items-start">
                <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center mb-1.5 shadow-2xs">
                  <TrendingUp className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-foreground text-[12.5px] leading-snug">Results</h3>
                <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight font-medium">Measure success</p>
              </div>

              <div className="flex flex-col items-start">
                <div className="w-9 h-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center mb-1.5 shadow-2xs">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-bold text-foreground text-[12.5px] leading-snug">Safe & Secure</h3>
                <p className="text-[10.5px] text-muted-foreground mt-0.5 leading-tight font-medium">Data protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Space at bottom for students */}
        <div className="h-4 shrink-0" />
      </div>

      {/* RIGHT COLUMN - Auth Form */}
      <div className="w-full lg:w-[45%] xl:w-[42%] flex flex-col justify-between relative bg-background h-full overflow-hidden">
        {/* Header with Language Picker */}
        <div className="w-full flex justify-end px-6 pt-4 pb-2">
          <LanguageSwitcher variant="rounded" />
        </div>

        {/* Centered Auth Card */}
        <div className="flex-1 flex items-center justify-center px-4 py-2">
          <SlidingAuthCard branding={branding} />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-[11px] text-muted-foreground">
          <p>{branding.loginFooterText || `© ${new Date().getFullYear()} ${branding.schoolName}. All rights reserved.`}</p>
          <div className="flex items-center gap-2.5 mt-1.5 sm:mt-0 font-medium">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <span>|</span>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <span>|</span>
            <a href="#" className="hover:text-foreground transition-colors">Help</a>
          </div>
        </div>
      </div>
    </main>
  )
}
