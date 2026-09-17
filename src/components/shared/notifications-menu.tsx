"use client"

import { Bell, BellOff } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NotificationsMenu() {
  const t = useTranslations("common.header")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={t("notifications")}
            className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        }
      >
        <Bell className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("notifications")}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
          <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BellOff className="size-4" />
          </div>
          <p className="text-xs font-medium text-foreground">{t("noNotifications")}</p>
          <p className="text-[11px] text-muted-foreground">{t("noNotificationsDescription")}</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
