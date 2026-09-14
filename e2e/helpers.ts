import { type Page } from "@playwright/test"

export const ACCOUNTS = {
  admin: { email: "school.admin@benwil.test", password: "Passw0rd!" },
  principal: { email: "principal@benwil.test", password: "Passw0rd!" },
  teacher: { email: "teacher@benwil.test", password: "Passw0rd!" },
  accountant: { email: "accountant@benwil.test", password: "Passw0rd!" },
  // Seeded and linked in prisma/seed.ts: student@benwil.test -> Nusrat Jahan
  // (STU-0501), guardian@benwil.test -> that same student's sole guardian.
  student: { email: "student@benwil.test", password: "Passw0rd!" },
  guardian: { email: "guardian@benwil.test", password: "Passw0rd!" },
} as const

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login")

  // The login form's fields carry a hardcoded demo defaultValue
  // ("super.admin@benwil.test"), and a plain .fill() has been observed to
  // append to rather than replace that default — select-all + retype is the
  // robust way to land on an exact value regardless.
  const emailInput = page.locator('input[type="email"]')
  await emailInput.click({ clickCount: 3 })
  await emailInput.press("Backspace")
  await emailInput.pressSequentially(email)

  const passwordInput = page.locator('input[type="password"]')
  await passwordInput.click({ clickCount: 3 })
  await passwordInput.press("Backspace")
  await passwordInput.pressSequentially(password)

  await page.locator('button[type="submit"]').click()
  // Admin/teacher/etc land on /dashboard; STUDENT/GUARDIAN land on /portal/*
  // (and a guardian with exactly one child is redirected once more, to that
  // child's dashboard) - waiting for "away from /login" covers every role
  // without hardcoding a single destination.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"))
}

// Switching accounts within a single test needs an explicit logout first -
// the session cookie survives a plain page.goto("/login"), and proxy.ts
// bounces an already-authenticated visitor straight back to their
// dashboard/portal without ever showing the login form.
export async function logout(page: Page) {
  await page.getByRole("button", { name: "Account", exact: true }).click()
  await page.getByRole("menuitem", { name: "Log out" }).click()
  await page.waitForURL("**/login")
}
