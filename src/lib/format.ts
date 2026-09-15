/**
 * Formatting utilities supporting bilingual display (en / bn).
 */

export function formatNumber(val: number | string, locale: string = "en"): string {
  const num = typeof val === "string" ? parseFloat(val) : val
  if (isNaN(num)) return String(val)
  return new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(num)
}

export function formatPercent(val: number, locale: string = "en", decimals: number = 1): string {
  if (isNaN(val)) return "0%"
  const formatted = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US", {
    minimumFractionDigits: Number.isInteger(val) ? 0 : decimals,
    maximumFractionDigits: decimals,
  }).format(val)
  return `${formatted}%`
}

export function formatCurrency(
  val: number,
  locale: string = "en",
  symbol: string = "৳"
): string {
  if (isNaN(val)) return `${symbol} 0`
  const formatted = new Intl.NumberFormat(locale === "bn" ? "bn-BD" : "en-US").format(val)
  return `${symbol} ${formatted}`
}

export function formatLakh(val: number, locale: string = "en", suffixLakh: string = "L"): string {
  if (isNaN(val)) return "0"
  if (val >= 100000) {
    const lakhs = (val / 100000).toFixed(1)
    const formatted = formatNumber(lakhs, locale)
    return `${formatted}${suffixLakh}`
  }
  return formatNumber(val, locale)
}

export function formatDate(date: Date, locale: string = "en"): string {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

export function formatDateTime(date: Date, locale: string = "en"): string {
  return new Intl.DateTimeFormat(locale === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

/**
 * Picks the Bangla value when the locale is "bn" and it's present, otherwise
 * falls back to the English value - never renders blank for a partially
 * translated bilingual field (title/titleBn, content/contentBn, ...).
 */
export function pickLocalized(en: string, bn: string | null | undefined, locale: string): string {
  return locale === "bn" && bn ? bn : en
}
