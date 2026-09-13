import type { SessionOptions } from "iron-session"
import type { Role } from "@prisma/client"

// Deliberately free of "next/headers" and "server-only": this file is
// imported both by lib/auth/session.ts (Server Components/Actions) and by
// proxy.ts, which runs in its own bundle and should not pull in render-only
// modules.

export type SessionData = {
  userId: string
  schoolId: string
  name: string
  role: Role
}

const sessionSecret = process.env.SESSION_SECRET
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is not set.")
}

export const sessionOptions: SessionOptions = {
  cookieName: "benwil_session",
  password: sessionSecret,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
}
