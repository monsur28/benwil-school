import "server-only"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/client"

// The single source of truth for "is this notice visible to this user right
// now" - every list/detail query for students and guardians goes through
// one of the functions below, so the audience/date rules are encoded in
// exactly one place (never duplicated in a page or re-checked only in the
// UI). No background job publishes or expires a notice: this filter is
// evaluated fresh on every request against the current server time.
function activeWindowFilter(now: Date): Prisma.NoticeWhereInput {
  return {
    status: "PUBLISHED",
    publishAt: { lte: now },
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  }
}

const NOTICE_LIST_SELECT = {
  id: true,
  title: true,
  titleBn: true,
  content: true,
  contentBn: true,
  publishAt: true,
  expiresAt: true,
  audienceType: true,
  category: { select: { id: true, name: true, nameBn: true } },
} satisfies Prisma.NoticeSelect

export type VisibleNoticeListItem = Prisma.NoticeGetPayload<{ select: typeof NOTICE_LIST_SELECT }>

interface PageArgs {
  skip?: number
  take?: number
}

export async function getVisibleNoticesForStudent(
  args: { schoolId: string; classId: string; sectionId: string } & PageArgs
): Promise<VisibleNoticeListItem[]> {
  const now = new Date()
  return prisma.notice.findMany({
    where: {
      schoolId: args.schoolId,
      ...activeWindowFilter(now),
      AND: [
        {
          OR: [
            { audienceType: "ALL" },
            { audienceType: "STUDENTS" },
            { audienceType: "CLASS", classId: args.classId },
            { audienceType: "SECTION", sectionId: args.sectionId },
          ],
        },
      ],
    },
    select: NOTICE_LIST_SELECT,
    orderBy: { publishAt: "desc" },
    skip: args.skip,
    take: args.take,
  })
}

export async function getVisibleNoticesForGuardian(
  args: { schoolId: string; childClassIds: string[]; childSectionIds: string[] } & PageArgs
): Promise<VisibleNoticeListItem[]> {
  const now = new Date()
  return prisma.notice.findMany({
    where: {
      schoolId: args.schoolId,
      ...activeWindowFilter(now),
      AND: [
        {
          OR: [
            { audienceType: "ALL" },
            { audienceType: "GUARDIANS" },
            { audienceType: "CLASS", classId: { in: args.childClassIds } },
            { audienceType: "SECTION", sectionId: { in: args.childSectionIds } },
          ],
        },
      ],
    },
    select: NOTICE_LIST_SELECT,
    orderBy: { publishAt: "desc" },
    skip: args.skip,
    take: args.take,
  })
}

export async function getNoticeForStudent(args: {
  schoolId: string
  noticeId: string
  classId: string
  sectionId: string
}): Promise<VisibleNoticeListItem | null> {
  const now = new Date()
  return prisma.notice.findFirst({
    where: {
      id: args.noticeId,
      schoolId: args.schoolId,
      ...activeWindowFilter(now),
      AND: [
        {
          OR: [
            { audienceType: "ALL" },
            { audienceType: "STUDENTS" },
            { audienceType: "CLASS", classId: args.classId },
            { audienceType: "SECTION", sectionId: args.sectionId },
          ],
        },
      ],
    },
    select: NOTICE_LIST_SELECT,
  })
}

export async function getNoticeForGuardian(args: {
  schoolId: string
  noticeId: string
  childClassIds: string[]
  childSectionIds: string[]
}): Promise<VisibleNoticeListItem | null> {
  const now = new Date()
  return prisma.notice.findFirst({
    where: {
      id: args.noticeId,
      schoolId: args.schoolId,
      ...activeWindowFilter(now),
      AND: [
        {
          OR: [
            { audienceType: "ALL" },
            { audienceType: "GUARDIANS" },
            { audienceType: "CLASS", classId: { in: args.childClassIds } },
            { audienceType: "SECTION", sectionId: { in: args.childSectionIds } },
          ],
        },
      ],
    },
    select: NOTICE_LIST_SELECT,
  })
}

// --- Admin-side reads: schoolId-scoped only, no audience/date filtering -
// admins see everything, including drafts and archived notices. ---

const ADMIN_NOTICE_LIST_SELECT = {
  id: true,
  title: true,
  titleBn: true,
  status: true,
  audienceType: true,
  classId: true,
  sectionId: true,
  publishAt: true,
  expiresAt: true,
  createdAt: true,
  category: { select: { id: true, name: true, nameBn: true } },
  createdBy: { select: { id: true, name: true } },
  class: { select: { id: true, name: true } },
  section: { select: { id: true, name: true } },
} satisfies Prisma.NoticeSelect

export type AdminNoticeListItem = Prisma.NoticeGetPayload<{ select: typeof ADMIN_NOTICE_LIST_SELECT }>

export async function getAdminNoticeList(args: {
  schoolId: string
  q?: string
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED"
  categoryId?: string
  skip?: number
  take?: number
}): Promise<{ notices: AdminNoticeListItem[]; total: number }> {
  const where: Prisma.NoticeWhereInput = {
    schoolId: args.schoolId,
    ...(args.status && { status: args.status }),
    ...(args.categoryId && { categoryId: args.categoryId }),
    ...(args.q && {
      OR: [
        { title: { contains: args.q, mode: "insensitive" } },
        { titleBn: { contains: args.q, mode: "insensitive" } },
      ],
    }),
  }

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      select: ADMIN_NOTICE_LIST_SELECT,
      orderBy: { createdAt: "desc" },
      skip: args.skip,
      take: args.take,
    }),
    prisma.notice.count({ where }),
  ])

  return { notices, total }
}

const ADMIN_NOTICE_DETAIL_SELECT = {
  ...ADMIN_NOTICE_LIST_SELECT,
  content: true,
  contentBn: true,
  updatedAt: true,
  updatedBy: { select: { id: true, name: true } },
} satisfies Prisma.NoticeSelect

export type AdminNoticeDetail = Prisma.NoticeGetPayload<{ select: typeof ADMIN_NOTICE_DETAIL_SELECT }>

export async function getAdminNotice(args: { schoolId: string; noticeId: string }): Promise<AdminNoticeDetail | null> {
  return prisma.notice.findFirst({
    where: { id: args.noticeId, schoolId: args.schoolId },
    select: ADMIN_NOTICE_DETAIL_SELECT,
  })
}
