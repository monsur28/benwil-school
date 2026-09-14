import { NextResponse, type NextRequest } from "next/server"
import { getIronSession, nextProxyCookies } from "iron-session"
import { sessionOptions, type SessionData } from "@/lib/auth/session-config"
import { portalHomeForRole } from "@/lib/portal/routes"

// This app has no public pages (internal school system), so everything is
// protected by default except the login page itself.
const PUBLIC_PATHS = new Set(["/login"])

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Permit static assets in /images or with file extensions
  if (
    pathname.startsWith("/images/") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  const isPublicPath = PUBLIC_PATHS.has(pathname)

  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(
    nextProxyCookies(request, response),
    sessionOptions
  )
  const isAuthenticated = Boolean(session.userId)

  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthenticated && isPublicPath) {
    // isAuthenticated (session.userId set) implies the rest of SessionData
    // is present too - createSession() always sets all fields together.
    return NextResponse.redirect(new URL(portalHomeForRole(session.role!), request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}

