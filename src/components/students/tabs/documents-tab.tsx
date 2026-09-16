import { getLocale, getTranslations } from "next-intl/server"
import type { StudentWithRelations } from "@/lib/students/types"
import { AddDocumentForm } from "@/components/students/add-document-form"
import { EmptyState } from "@/components/shared/empty-state"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { ExternalLink, FileText } from "lucide-react"

export async function DocumentsTab({
  student,
  canManage,
}: {
  student: StudentWithRelations
  canManage: boolean
}) {
  const [t, locale] = await Promise.all([getTranslations("students"), getLocale()])
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })

  return (
    <div className="space-y-4">
      {canManage && <AddDocumentForm studentId={student.id} />}

      {student.documents.length === 0 ? (
        <EmptyState icon={FileText} title={t("profile.noDocuments")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("fields.documentTitle")}</TableHead>
              <TableHead>{t("fields.documentType")}</TableHead>
              <TableHead>{t("fields.uploadedDate")}</TableHead>
              <TableHead className="text-right">{t("fields.file")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {student.documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium text-foreground">{document.title}</TableCell>
                <TableCell>{t(`documentType.${document.type}`)}</TableCell>
                <TableCell>{dateFormatter.format(document.uploadedAt)}</TableCell>
                <TableCell className="text-right">
                  {document.fileUrl ? (
                    <a href={document.fileUrl} target="_blank" rel="noreferrer" className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-brand-navy hover:bg-brand-navy-light">
                      {t("table.view")}<ExternalLink className="size-3" />
                    </a>
                  ) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
