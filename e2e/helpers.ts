import { type Page } from "@playwright/test"

export const ACCOUNTS = {
  admin: { email: "school.admin@benwil.test", password: "Passw0rd!" },
  principal: { email: "principal@benwil.test", password: "Passw0rd!" },
  teacher: { email: "teacher@benwil.test", password: "Passw0rd!" },
  accountant: { email: "accountant@benwil.test", password: "Passw0rd!" },
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
  await page.waitForURL("**/dashboard")
}
