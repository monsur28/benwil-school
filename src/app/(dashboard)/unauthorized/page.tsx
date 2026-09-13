import { requireAuth } from "@/lib/auth/dal"
import { AccessRestricted } from "@/components/shared/access-restricted"

export default async function UnauthorizedPage() {
  await requireAuth()

  return (
    <div className="flex flex-1 items-center justify-center">
      <AccessRestricted />
    </div>
  )
}
