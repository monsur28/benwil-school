import "server-only"
import { prisma } from "@/lib/db/client"

// The canonical "current academic year" resolver - the school-management
// actions (Phase 11's academic-years.ts) enforce exactly one isActive row
// per school at a time, so this is the single source of truth every module
// needing "today's" academic year should call instead of re-inlining this
// same findFirst.
export async function getActiveAcademicYear(schoolId: string) {
  return prisma.academicYear.findFirst({ where: { schoolId, isActive: true } })
}
