import { getLocale, getTranslations } from "next-intl/server"
import { Wallet, CheckCircle2 } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { TintedPanel, TintedPanelHeader } from "@/components/shared/tinted-panel"

/**
 * Fee status.
 *
 * The only section whose tint is chosen by its data: money owed turns the
 * whole surface amber, money settled turns it green. That is the point of a
 * semantic surface — a guardian glancing at a phone should know the answer
 * before reading a single figure.
 *
 * A student with no fees assigned gets a neutral-green "nothing due" state,
 * not an invented balance.
 */
export async function StudentFeeCard({
  totalCharges,
  totalPaid,
  totalOutstanding,
  href,
}: {
  totalCharges: number
  totalPaid: number
  totalOutstanding: number
  href: string
}) {
  const [t, tFees, locale] = await Promise.all([
    getTranslations("portal"),
    getTranslations("fees"),
    getLocale(),
  ])

  const hasOutstanding = totalOutstanding > 0
  const tint = hasOutstanding ? "orange" : "green"
  const ink = hasOutstanding ? "text-surface-orange-foreground" : "text-surface-green-foreground"
  const inkMuted = hasOutstanding
    ? "text-surface-orange-foreground/75"
    : "text-surface-green-foreground/75"

  return (
    <TintedPanel tint={tint} className="h-full">
      <TintedPanelHeader
        tint={tint}
        title={t("nav.fees")}
        icon={<Wallet />}
        href={href}
        hrefLabel={tFees("actions.view")}
      />

      <div className="flex flex-1 flex-col justify-between px-5 pb-5">
        <div>
          <p className={`metric text-[2.25rem] ${ink}`}>
            {formatCurrency(hasOutstanding ? totalOutstanding : totalPaid, locale)}
          </p>
          <p className={`mt-1 inline-flex items-center gap-1.5 text-[13px] font-medium ${inkMuted}`}>
            {!hasOutstanding && <CheckCircle2 className="size-3.5" />}
            {hasOutstanding ? tFees("fields.outstandingBalance") : tFees("fields.totalPaid")}
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-card/70 px-3 py-2.5">
            <dt className={`text-[11px] font-semibold ${inkMuted}`}>{tFees("fields.totalCharges")}</dt>
            <dd className={`mt-1 text-sm font-bold tabular-nums ${ink}`}>
              {formatCurrency(totalCharges, locale)}
            </dd>
          </div>
          <div className="rounded-xl bg-card/70 px-3 py-2.5">
            <dt className={`text-[11px] font-semibold ${inkMuted}`}>{tFees("fields.totalPaid")}</dt>
            <dd className={`mt-1 text-sm font-bold tabular-nums ${ink}`}>
              {formatCurrency(totalPaid, locale)}
            </dd>
          </div>
        </dl>
      </div>
    </TintedPanel>
  )
}
