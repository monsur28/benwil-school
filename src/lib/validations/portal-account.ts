import { z } from "zod"

export const createPortalAccountSchema = z.object({
  email: z.email({ error: "portal.errors.invalidEmail" }),
  password: z.string().min(8, { error: "portal.errors.passwordTooShort" }),
})

export type CreatePortalAccountInput = z.infer<typeof createPortalAccountSchema>
