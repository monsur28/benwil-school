import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { requireRole } from "@/lib/auth/dal"
import { getRolesForHref } from "@/lib/permissions/nav"
import { getClassRosterForAssignment } from "@/lib/fees/get-fees"
import { PageHeader } from "@/components/shared/page-header"
import { BulkAssignPanel } from "@/components/fees/bulk-assign-panel"

export default async function AssignFeeStructurePage({
  params,
}: {
  params: Promise<{ structureId: string }>
}) {
  const user = await requireRole(...getRolesForHref("/fees/structures"))
  const t = await getTranslations("fees")
  const { structureId } = await params

  const roster = await getClassRosterForAssignment({ schoolId: user.schoolId, structureId })
  if (!roster) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title={t("assign.bulkTitle")} description={roster.structureName} />
      <BulkAssignPanel
        structureId={structureId}
        defaultDueDate=""
        eligibleStudents={roster.eligibleStudents}
      />
    </div>
  )
}
