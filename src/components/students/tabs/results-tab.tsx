import { getTranslations } from "next-intl/server"
import { FileText } from "lucide-react"
import { prisma } from "@/lib/db/client"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export async function ResultsTab({ studentId }: { studentId: string }) {
  const t = await getTranslations("students.results")

  const marks = await prisma.examMark.findMany({
    where: { studentId },
    include: {
      examSchedule: {
        include: {
          exam: { include: { examType: true } },
          subject: true,
        },
      },
    },
    orderBy: [
      { examSchedule: { exam: { startDate: "desc" } } },
      { examSchedule: { subject: { name: "asc" } } },
    ],
  })

  if (marks.length === 0) {
    return <EmptyState icon={FileText} title={t("empty.title")} description={t("empty.description")} />
  }

  type MarkRow = (typeof marks)[number]
  const groupedByExam = new Map<string, { examName: string; examTypeName: string; rows: MarkRow[] }>()
  for (const mark of marks) {
    const examId = mark.examSchedule.examId
    const group = groupedByExam.get(examId)
    if (group) {
      group.rows.push(mark)
    } else {
      groupedByExam.set(examId, {
        examName: mark.examSchedule.exam.name,
        examTypeName: mark.examSchedule.exam.examType.name,
        rows: [mark],
      })
    }
  }

  return (
    <div className="space-y-4">
      {Array.from(groupedByExam.entries()).map(([examId, group]) => (
        <Card key={examId}>
          <CardHeader>
            <CardTitle>
              {group.examName} <span className="font-normal text-muted-foreground">({group.examTypeName})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("subject")}</TableHead>
                  <TableHead>{t("fullMarks")}</TableHead>
                  <TableHead>{t("passMarks")}</TableHead>
                  <TableHead>{t("marks")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.rows.map((mark) => (
                  <TableRow key={mark.id}>
                    <TableCell>{mark.examSchedule.subject.name}</TableCell>
                    <TableCell>{mark.examSchedule.fullMarks}</TableCell>
                    <TableCell>{mark.examSchedule.passMarks}</TableCell>
                    <TableCell>{mark.isAbsent ? "—" : mark.marks}</TableCell>
                    <TableCell>
                      <Badge variant={mark.isAbsent ? "destructive" : "default"}>
                        {mark.isAbsent ? t("absent") : t("present")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
