// Pure date-only logic with zero imports, deliberately kept separate from
// homework-submission-access.ts (which is "server-only" and pulls in
// teacher-assignment/Prisma access checks). Client components like
// StudentHomeworkSubmission need isSubmissionOpen for its due-date UI, and
// importing it from the server-only file would drag Prisma into the browser
// bundle - this file is safe for either side to import.

export function isSubmissionOpen(dueDate: Date): boolean {
  const todayStr = new Date().toISOString().slice(0, 10)
  const dueStr = dueDate.toISOString().slice(0, 10)
  return todayStr <= dueStr
}

export function isSubmissionLate(submittedAt: Date, dueDate: Date): boolean {
  const submittedStr = submittedAt.toISOString().slice(0, 10)
  const dueStr = dueDate.toISOString().slice(0, 10)
  return submittedStr > dueStr
}
