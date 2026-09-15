import type { ReactNode } from "react"

export type TranslatedNavItem = {
  href: string
  label: string
  icon: ReactNode
}

export type TranslatedNavGroup = {
  titleKey: string
  title: string
  items: TranslatedNavItem[]
}
