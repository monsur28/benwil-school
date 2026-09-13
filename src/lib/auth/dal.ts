import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import type { Role } from "@prisma/client"
import { getSession, type SessionData } from "./session"

/**
 * Central place every page/action/component asks "who is logged in?".
 * Memoized per request so multiple calls don't re-read the cookie.
 */
export const requireAuth = cache(async (): Promise<SessionData> => {
  const session = await getSession()
  if (!session.userId) {
    redirect("/login")
  }
  // createSession() always sets all four fields together, so once userId
  // is present the rest of SessionData is guaranteed to be there too.
  return session as SessionData
})

export async function requireRole(...roles: Role[]): Promise<SessionData> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    redirect("/unauthorized")
  }
  return user
}
