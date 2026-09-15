import { requireStudentIdentity } from "@/lib/portal/identity"
import { SharedFeesPage } from "@/components/portal/shared-fees-page"

export default async function StudentFeesPage() {
  const { user, student } = await requireStudentIdentity()

  return (
    <SharedFeesPage 
      schoolId={user.schoolId} 
      studentId={student.id} 
      baseReceiptPath="/portal/student/fees" 
    />
  )
}
