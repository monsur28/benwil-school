import { z } from "zod"

// Error messages are i18n keys, not display text: the form resolves them
// with `t(message)` so the same schema drives validation in every locale.
export const loginSchema = z.object({
  email: z.email({ error: "auth.errors.invalidEmail" }),
  password: z.string().min(1, { error: "auth.errors.passwordRequired" }),
})

export type LoginInput = z.infer<typeof loginSchema>
