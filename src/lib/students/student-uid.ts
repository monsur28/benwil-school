import "server-only"
import { prisma } from "@/lib/db/client"

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // no 0/O/1/I to avoid confusion

function randomCode(length: number) {
  let out = ""
  for (let i = 0; i < length; i += 1) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  }
  return out
}

// A short, human-readable ID distinct from the admission number (which the
// office assigns) and the database id (which is internal).
export async function generateStudentUid(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = `STU-${randomCode(6)}`
    const existing = await prisma.student.findUnique({ where: { studentUid: candidate } })
    if (!existing) return candidate
  }
  throw new Error("Could not generate a unique student ID.")
}
