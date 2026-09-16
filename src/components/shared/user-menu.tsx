"use client"

import { useTransition } from "react"
import { ChevronsUpDown, LogOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "cn"
import { logout } from "@/actions/auth/logout"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/**
 * Account control.
 *
 * `rail` is the primary presentation — a full identity card pinned to the
 * bottom of the navigation rail, where the signed-in identity belongs.
 * `compact` is the avatar-only fallback used in the top bar below `lg`, where
 * the rail is hidden behind the drawer.
 */
export function UserMenu({
  name,
  roleLabel,
  variant = "compact",
}: {
  name: string
  roleLabel: string
  variant?: "rail" | "compact"
}) {
  const t = useTranslations("common")
  const [isPending, startTransition] = useTransition()

  const trigger =
    variant === "rail" ? (
      <button
        aria-label={t("account")}
        className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-2.5 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
      />
    ) : (
      <button
        aria-label={t("account")}
        className="flex size-9 items-center justify-center rounded-full outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      />
    )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger}>
        <Avatar
          size="sm"
          className={cn(variant === "rail" && "shrink-0 ring-1 ring-sidebar-border")}
        >
          <AvatarFallback
            className={cn(
              "text-[11px] font-semibold",
              variant === "rail" && "bg-sidebar-primary text-sidebar-primary-foreground"
            )}
          >
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        {variant === "rail" && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-sidebar-foreground">{name}</span>
              <span className="block truncate text-[11px] text-sidebar-muted">{roleLabel}</span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-muted" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={variant === "rail" ? "top" : "bottom"}
        align={variant === "rail" ? "start" : "end"}
        className="w-60"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate text-sm font-semibold text-foreground">{name}</span>
            <span className="truncate text-xs font-normal text-muted-foreground">{roleLabel}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onClick={() => startTransition(() => logout())}
        >
          <LogOut />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
