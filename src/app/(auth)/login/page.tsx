import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { portalHomeForRole } from "@/lib/portal/routes"
import { SlidingAuthCard } from "@/components/auth/sliding-auth-card"
import { LanguageSwitcher } from "@/components/shared/language-switcher"

export default async function LoginPage() {
  const session = await getSession()
  if (session.userId && session.role) {
    redirect(portalHomeForRole(session.role))
  }

  return (
    <main className="min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 relative overflow-hidden bg-[#EFF4F5] selection:bg-[#20A88D]/20 selection:text-[#20A88D]">
      {/* ============================================================ */}
      {/* GEOMETRIC BACKGROUND ACCENTS (Faithful to Reference Image)    */}
      {/* ============================================================ */}
      
      {/* Bottom-Left Sun-Yellow Circle */}
      <div
        className="absolute -bottom-24 -left-24 sm:-bottom-28 sm:-left-28 w-80 h-80 sm:w-96 sm:h-96 md:w-[460px] md:h-[460px] rounded-full bg-[#FFC53D] pointer-events-none z-0 shadow-md transition-all"
        aria-hidden="true"
      />

      {/* Top-Right Coral-Red Polygon Angle */}
      <div
        className="absolute -top-10 -right-10 sm:-top-6 sm:-right-6 w-64 h-64 sm:w-80 sm:h-80 md:w-[380px] md:h-[380px] bg-[#E84D58] [clip-path:polygon(100%_0,25%_0,100%_75%)] pointer-events-none z-0 shadow-xs transition-all"
        aria-hidden="true"
      />

      {/* Top-Right Language Switcher Control */}
      <div className="absolute top-5 right-6 z-20">
        <LanguageSwitcher variant="pill" />
      </div>

      {/* ============================================================ */}
      {/* CENTERED FLOATING AUTH CARD                                  */}
      {/* ============================================================ */}
      <SlidingAuthCard />
    </main>
  )
}
