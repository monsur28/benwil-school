import "server-only"
import { cookies } from "next/headers"
import { getIronSession, type IronSession } from "iron-session"
import { sessionOptions, type SessionData } from "./session-config"

export type { SessionData }

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

export async function createSession(data: SessionData) {
  const session = await getSession()
  session.userId = data.userId
  session.schoolId = data.schoolId
  session.name = data.name
  session.role = data.role
  await session.save()
}

export async function destroySession() {
  const session = await getSession()
  session.destroy()
}
