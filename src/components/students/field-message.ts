// Zod-sourced errors carry an i18n key as their message (one schema, every
// locale) and need `t()`. Server actions return already-translated text and
// tag it `type: "server"` via setError so it isn't translated a second time.
//
// Typed structurally (rather than as RHF's `FieldError`) so this also
// accepts the `Merge<FieldError, ...>` shape RHF gives array-level errors
// (e.g. `errors.guardians`), which isn't assignable to `FieldError` itself.
export function translateFieldError(
  t: (key: string) => string,
  error?: { message?: string; type?: string }
): string | undefined {
  if (!error?.message) return undefined
  return error.type === "server" ? error.message : t(error.message)
}
