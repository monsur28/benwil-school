import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"

export const SUPPORTED_LOCALES = ["en", "bn"] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = "en"
export const LOCALE_COOKIE = "locale"

function isLocale(value: string | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale)
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
