"use server"
import { ActionResult } from "@/lib/types/action"

import { revalidatePath } from "next/cache"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { prisma } from "@/lib/db/client"
import { NOTICE_ADMIN_ROLES } from "@/lib/notices/notice-access"
import { createNoticeSchema, editNoticeSchema } from "@/lib/validations/notices"

// classId/sectionId come from the client and must be re-validated against
// this school before ever being attached to a notice - otherwise a school
// A admin could point a notice at school B's class by editing the request.
async function resolveAudienceScope(
  schoolId: string,
  audienceType: string,
  classId: string,
  sectionId: string
): Promise<{ classId: string | null; sectionId: string | null } | null> {
  if (audienceType === "CLASS") {
    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId }, select: { id: true } })
    if (!cls) return null
    return { classId: cls.id, sectionId: null }
  }
  if (audienceType === "SECTION") {
    const section = await prisma.section.findFirst({
      where: { id: sectionId, classId, class: { schoolId } },
      select: { id: true, classId: true },
    })
    if (!section) return null
    return { classId: section.classId, sectionId: section.id }
  }
  return { classId: null, sectionId: null }
}

async function createNotice(input: unknown, status: "DRAFT" | "PUBLISHED"): Promise<ActionResult> {
  const user = await requireRole(...NOTICE_ADMIN_ROLES)
  const t = await getTranslations("notices")

  const parsed = createNoticeSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const category = await prisma.noticeCategory.findFirst({
    where: { id: parsed.data.categoryId, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!category) return { success: false, error: t("errors.invalidForm") }

  const scope = await resolveAudienceScope(
    user.schoolId,
    parsed.data.audienceType,
    parsed.data.classId ?? "",
    parsed.data.sectionId ?? ""
  )
  if (!scope) return { success: false, error: t("errors.invalidForm") }

  await prisma.notice.create({
    data: {
      schoolId: user.schoolId,
      categoryId: parsed.data.categoryId,
      title: parsed.data.title,
      titleBn: parsed.data.titleBn || null,
      content: parsed.data.content,
      contentBn: parsed.data.contentBn || null,
      status,
      audienceType: parsed.data.audienceType,
      classId: scope.classId,
      sectionId: scope.sectionId,
      publishAt: new Date(parsed.data.publishAt),
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      createdById: user.userId,
    },
  })

  revalidatePath("/notices")
  return { success: true }
}

// The create form's two actions (spec §10): save as a draft, or create and
// publish immediately in one step.
export async function createNoticeDraft(input: unknown): Promise<ActionResult> {
  return createNotice(input, "DRAFT")
}

export async function createNoticeAndPublish(input: unknown): Promise<ActionResult> {
  return createNotice(input, "PUBLISHED")
}

async function findEditableNotice(schoolId: string, id: string) {
  return prisma.notice.findFirst({
    where: { id, schoolId, status: { in: ["DRAFT", "PUBLISHED"] } },
    select: { id: true },
  })
}

export async function updateNotice(input: unknown): Promise<ActionResult> {
  const user = await requireRole(...NOTICE_ADMIN_ROLES)
  const t = await getTranslations("notices")

  const parsed = editNoticeSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: t("errors.invalidForm") }

  const existing = await findEditableNotice(user.schoolId, parsed.data.id)
  if (!existing) return { success: false, error: t("errors.notFound") }

  const category = await prisma.noticeCategory.findFirst({
    where: { id: parsed.data.categoryId, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!category) return { success: false, error: t("errors.invalidForm") }

  const scope = await resolveAudienceScope(
    user.schoolId,
    parsed.data.audienceType,
    parsed.data.classId ?? "",
    parsed.data.sectionId ?? ""
  )
  if (!scope) return { success: false, error: t("errors.invalidForm") }

  await prisma.notice.update({
    where: { id: parsed.data.id },
    data: {
      categoryId: parsed.data.categoryId,
      title: parsed.data.title,
      titleBn: parsed.data.titleBn || null,
      content: parsed.data.content,
      contentBn: parsed.data.contentBn || null,
      audienceType: parsed.data.audienceType,
      classId: scope.classId,
      sectionId: scope.sectionId,
      publishAt: new Date(parsed.data.publishAt),
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      updatedById: user.userId,
    },
  })

  revalidatePath("/notices")
  revalidatePath(`/notices/${parsed.data.id}`)
  return { success: true }
}

export async function publishNotice(id: string): Promise<ActionResult> {
  const user = await requireRole(...NOTICE_ADMIN_ROLES)
  const t = await getTranslations("notices")

  const existing = await prisma.notice.findFirst({
    where: { id, schoolId: user.schoolId, status: "DRAFT" },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  await prisma.notice.update({
    where: { id },
    data: { status: "PUBLISHED", updatedById: user.userId },
  })

  revalidatePath("/notices")
  revalidatePath(`/notices/${id}`)
  return { success: true }
}

export async function archiveNotice(id: string): Promise<ActionResult> {
  const user = await requireRole(...NOTICE_ADMIN_ROLES)
  const t = await getTranslations("notices")

  const existing = await prisma.notice.findFirst({
    where: { id, schoolId: user.schoolId, status: { in: ["DRAFT", "PUBLISHED"] } },
    select: { id: true },
  })
  if (!existing) return { success: false, error: t("errors.notFound") }

  await prisma.notice.update({
    where: { id },
    data: { status: "ARCHIVED", updatedById: user.userId },
  })

  revalidatePath("/notices")
  revalidatePath(`/notices/${id}`)
  return { success: true }
}
