import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "cn"

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

/**
 * A student's face where there is one, their initials where there is not.
 *
 * The fallback is not a placeholder state to be designed around: most schools
 * will register students long before they have a photo for them, so initials
 * are the normal case and stay the same shape and size as the photo.
 *
 * The image is decorative here — every caller renders the student's name
 * beside it — so the alt text is empty rather than a duplicate of that name.
 */
export function StudentAvatar({
  name,
  photoUrl,
  size = "default",
  className,
  fallbackClassName,
}: {
  name: string
  photoUrl?: string | null
  size?: "sm" | "default" | "lg"
  className?: string
  fallbackClassName?: string
}) {
  return (
    <Avatar size={size} className={className}>
      {photoUrl && <AvatarImage src={photoUrl} alt="" />}
      <AvatarFallback
        className={cn(
          "bg-brand-navy-light/90 font-bold text-primary tracking-wider text-xs",
          fallbackClassName
        )}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  )
}

