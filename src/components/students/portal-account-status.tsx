import { getTranslations } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { PortalAccountDialog } from "@/components/students/portal-account-dialog"
import { PortalAccountActiveToggle } from "@/components/students/portal-account-active-toggle"

export async function PortalAccountStatus({
  kind,
  targetId,
  targetName,
  account,
}: {
  kind: "student" | "guardian"
  targetId: string
  targetName: string
  account: { id: string; email: string; isActive: boolean } | null
}) {
  const t = await getTranslations("portal")

  if (!account) {
    return (
      <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
        <span className="text-muted-foreground">{t("account.notLinked")}</span>
        <PortalAccountDialog kind={kind} targetId={targetId} targetName={targetName} />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <div>
        <p className="font-medium text-foreground">{account.email}</p>
        <Badge variant={account.isActive ? "default" : "outline"}>
          {account.isActive ? t("account.active") : t("account.inactive")}
        </Badge>
      </div>
      <PortalAccountActiveToggle userId={account.id} isActive={account.isActive} />
    </div>
  )
}
