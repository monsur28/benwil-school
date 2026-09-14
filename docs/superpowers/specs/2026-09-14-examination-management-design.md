# Phase 5 — Examination Management: Design Spec

Date: 2026-09-14
Status: Approved for implementation planning

## 1. Purpose

Add a simple, reliable examination module (exam types, exams, exam schedules,
marks entry, marks-entry authorization, a completion overview, and a real
student-profile Results tab) for Classes 1–10, reusing the existing
School/AcademicYear/Class/Section/Subject/ClassSubject/TeacherAssignment/
Student/Attendance foundation. No report cards, GPA/ranking, promotion, or
student/guardian portal in this phase (see full exclusion list in the
original phase brief, preserved verbatim in the conversation that produced
this spec).

## 2. Prisma schema additions

All new models follow existing conventions: `id String @id @default(cuid())`,
`schoolId` + `@@index([schoolId])` on every school-owned row, `isActive`
soft-flag where deactivation-over-deletion applies, `@@map("snake_case")`
table names, a short rationale comment above each model (matching the style
of every existing model in `prisma/schema.prisma`).

```prisma
model ExamType {
  id        String   @id @default(cuid())
  schoolId  String
  name      String
  nameBn    String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  school School @relation(fields: [schoolId], references: [id])
  exams  Exam[]

  @@unique([schoolId, name])
  @@index([schoolId])
  @@map("exam_types")
}

model Exam {
  id             String   @id @default(cuid())
  schoolId       String
  academicYearId String
  examTypeId     String
  name           String
  nameBn         String?
  startDate      DateTime @db.Date
  endDate        DateTime @db.Date
  isActive       Boolean  @default(true)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  school       School         @relation(fields: [schoolId], references: [id])
  academicYear AcademicYear   @relation(fields: [academicYearId], references: [id])
  examType     ExamType       @relation(fields: [examTypeId], references: [id])
  schedules    ExamSchedule[]

  @@index([schoolId])
  @@index([schoolId, academicYearId])
  @@map("exams")
}

model ExamSchedule {
  id        String    @id @default(cuid())
  schoolId  String
  examId    String
  classId   String
  subjectId String
  examDate  DateTime  @db.Date
  startTime DateTime? @db.Time
  endTime   DateTime? @db.Time
  room      String?
  fullMarks Int
  passMarks Int
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  school  School    @relation(fields: [schoolId], references: [id])
  exam    Exam      @relation(fields: [examId], references: [id])
  class   Class     @relation(fields: [classId], references: [id])
  subject Subject   @relation(fields: [subjectId], references: [id])
  marks   ExamMark[]

  @@unique([examId, classId, subjectId])
  @@index([schoolId])
  @@index([classId, subjectId])
  @@map("exam_schedules")
}

model ExamMark {
  id              String   @id @default(cuid())
  schoolId        String
  examScheduleId  String
  studentId       String
  marks           Float?
  isAbsent        Boolean  @default(false)
  enteredById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  school       School       @relation(fields: [schoolId], references: [id])
  examSchedule ExamSchedule @relation(fields: [examScheduleId], references: [id], onDelete: Cascade)
  student      Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  enteredBy    User         @relation("ExamMarksEntered", fields: [enteredById], references: [id])

  @@unique([examScheduleId, studentId])
  @@index([schoolId])
  @@index([studentId])
  @@map("exam_marks")
}
```

Back-relations to add on existing models (additive only, no existing field
changes): `School.examTypes/exams/examSchedules/examMarks`,
`AcademicYear.exams`, `Class.examSchedules`, `Subject.examSchedules`,
`Student.examMarks`, `User.examMarksEntered` (named relation
`"ExamMarksEntered"`, mirroring `"AttendanceMarkedBy"`).

**Design decision — no denormalized class/section/year on `ExamMark`:**
`Attendance` denormalizes classId/sectionId/academicYearId onto each row so a
later promotion never rewrites history. Phase 5 explicitly excludes
promotion, so `ExamMark` stays exactly as specified in the phase brief
(id, schoolId, examScheduleId, studentId, marks, isAbsent, enteredById,
timestamps) — no speculative fields. Revisit if a future phase adds
promotion.

**Migration:** additive only (`prisma migrate dev`), no changes to existing
tables/columns. Verify after migration (per phase brief §16) that students,
guardians, attendance, academic years, classes, sections, subjects, and
teacher assignments are all unchanged — a row-count/spot-check against Neon
before and after is sufficient, no data migration script needed since
nothing existing is touched.

## 3. Authorization

Extend `src/lib/academics/teacher-assignments.ts` with a subject-aware check
alongside the existing section-only one:

```ts
export async function isTeacherAssignedToSubjectInSection(
  teacherId: string,
  classId: string,
  sectionId: string,
  subjectId: string,
): Promise<boolean> {
  const match = await prisma.teacherAssignment.findFirst({
    where: { teacherId, classId, sectionId, subjectId },
    select: { id: true },
  })
  return Boolean(match)
}
```

Every marks-entry server action calls `requireRole(...CAN_ENTER_MARKS)` first
(`CAN_ENTER_MARKS = [SUPER_ADMIN, SCHOOL_ADMIN, PRINCIPAL, TEACHER]`), then —
exactly mirroring `save-attendance.ts`'s Phase 4 pattern — re-checks
`isTeacherAssignedToSubjectInSection` for `TEACHER` role only, independent of
what the UI submitted. Admin/Principal bypass this check but everything is
still re-scoped to `user.schoolId`.

Exam type / exam / schedule mutation actions use
`requireRole(SUPER_ADMIN, SCHOOL_ADMIN, PRINCIPAL)` only — teachers get no
create/edit/delete access to configuration, matching §13 of the phase brief.

Every ID coming from the client (examId, scheduleId, classId, sectionId,
subjectId, studentId) is re-validated against the database scoped to
`user.schoolId` before use — never trusted because it appeared in a
query param, route param, or form field. This mirrors the existing
`attendance/page.tsx` pattern of re-validating `searchParams` against the
role-filtered list before rendering, and `save-attendance.ts`'s pattern of
re-querying students from Prisma rather than trusting the posted list.

## 4. Routes

Following the existing `src/app/(dashboard)/<module>/...` convention (no
`[locale]` segment; locale is cookie-based):

| Route | Purpose | Roles |
|---|---|---|
| `/exams` | List exams (admin/principal); filtered list + link into marks entry (teacher) | ADMIN_ROLES + TEACHER |
| `/exams/types` | Exam Type CRUD | ADMIN_ROLES |
| `/exams/[examId]` | Exam detail: info, schedules, completion overview, add/edit/remove schedule | ADMIN_ROLES (teacher: none — teachers work from `/exams` → marks entry directly) |
| `/exams/[examId]/marks` | Marks entry: Class → Section → Subject/Schedule → marks sheet | ADMIN_ROLES + TEACHER |

**Nav decision (confirmed):** `NAV_ITEMS` already declares `/exams` for
`ADMIN_ROLES + TEACHER + STUDENT + GUARDIAN` (future-phase student portal).
Since this phase has no student/guardian portal, the `/exams` page's own
`requireRole` call is scoped to `ADMIN_ROLES + TEACHER` only — a
student/guardian following the existing nav link is redirected to
`/unauthorized`. The shared nav config itself is left untouched (out of
scope to edit for this phase); this is called out as a known limitation in
the final report.

Sub-nav (`/exams` vs `/exams/types`) follows the `academics-subnav.tsx`
client-component pattern, shown only for roles that can see both links.

## 5. Marks entry UX

Workflow: Select Class → Select Section → Select Subject/Schedule → enter
marks in one sheet (roll, admission number, name, marks input, absent
checkbox), Save. No per-student dialogs.

For a `TEACHER`, the Class/Section/Subject options are built directly from
their own `TeacherAssignment` rows (via a variant of the existing
`getTeacherClassSectionPairs`, extended to include subjectId) rather than
independent full-list dropdowns — so the UI cannot even present an
unassigned combination. The server re-validates regardless (§3).

Marks sheet component follows `attendance-sheet.tsx`: `"use client"`,
`useTransition` calling the server action directly with a typed object (no
`useActionState`/FormData, consistent with this codebase's existing style),
local editable state, `toast.add` on success/failure, keyed by
`${classId}-${sectionId}-${scheduleId}` to force remount on selector change.

Validation (Zod, re-checked server-side regardless of client constraints):
present student → `0 <= marks <= fullMarks` (fullMarks read from the
schedule server-side, not trusted from the client); absent student →
`marks: null, isAbsent: true`. A "mark all absent" bulk action is provided
per the phase brief.

## 6. Completion overview

On `/exams/[examId]` (admin/principal, across all scheduled subjects/classes)
and on the marks-entry page (for the selected schedule): a single summary
line — `32 students | 28 entered | 2 absent | 2 pending` — computed via a
`groupBy`/count query against `ExamMark` joined to the schedule's expected
student roster (same roster-fetch used for marks entry: active students in
that class/section/academicYear). No charts/analytics.

## 7. Student profile Results tab

Replace the `ComingSoon` placeholder at
`src/app/(dashboard)/students/[studentId]/page.tsx`'s `results` tab with a
new `src/components/students/tabs/results-tab.tsx`, following the
`attendance-tab.tsx` shape exactly: `async function ResultsTab({ studentId })`
Server Component, queries `ExamMark` (joined through `ExamSchedule` → `Exam`)
directly via Prisma, groups by exam, renders exam name / subject / full
marks / pass marks / marks / absent status in a `<Card>` + `<Table>`, with
`EmptyState` when no results exist yet.

## 8. i18n

New `exams` top-level namespace in `src/i18n/messages/en.json` and `bn.json`,
mirroring the shape of the existing `academics` namespace: `fields`,
`status`, `actions`, `success`, per-page keys (`types`, `list`, `detail`,
`marks`), `errors`. Zod schema error messages store i18n key strings
(e.g. `"errors.fullMarksInvalid"`), resolved client-side via
`t(errors.field.message as never)`, exactly like `attendance.ts`'s
validation schema.

## 9. Reused UI/action conventions (no new abstractions)

- List pages: hand-rolled `<Table>` (no DataTable component exists or should
  be introduced).
- Create/edit dialogs: single component handling both add/edit via an
  optional prop, RHF + `zodResolver`, `setError("root")` for
  action-returned errors, `toast.add` + `router.refresh()` on success —
  copy `class-dialog.tsx`.
- Dependent selects (class→subject in schedule dialog, class→section→subject
  in marks entry): copy `teacher-assignment-dialog.tsx`'s `watch()`-driven
  filtering.
- Server actions: `"use server"` file-level, `requireRole` first line,
  `getTranslations` for messages, Zod `safeParse` (never `parse`), ownership
  re-validation via `findFirst` scoped to `schoolId`, `prisma-errors.ts`
  helpers (`isUniqueConstraintError`/`uniqueConstraintTouches`) for P2002
  handling, `revalidatePath(...)`, return `{}`/`{ ...data }` on success or
  `{ error }` on failure — never throw for expected/validation failures.
- Class → Subject dependent filtering in the schedule dialog uses
  `ClassSubject` as the source of truth; attempting to schedule a subject not
  assigned to the class is rejected both client-side (dropdown only shows
  valid subjects) and server-side (re-validated against `ClassSubject`).

## 10. Deletion / deactivation rules

- `ExamType`: deactivate via `isActive`, never hard-delete once referenced by
  an `Exam`.
- `Exam`: deactivate via `isActive`; prefer deactivation over deletion once
  any schedule/mark exists.
- `ExamSchedule`: hard-delete permitted only when it has zero `ExamMark`
  rows (checked server-side before allowing delete); otherwise the UI offers
  no delete action for that row (deactivation isn't modeled at the schedule
  level per the phase brief — schedules are either removable or permanent).

## 11. Out of scope (unchanged from phase brief)

Report-card PDFs, GPA/ranking/merit lists, promotion, fees, homework,
timetable, notifications, SMS/email, student/guardian portal, payroll,
library, transport, bulk Excel import, NCTB-specific grading rules,
advanced analytics dashboards.

## 12. Testing plan (summary — full detail in phase brief §18–19)

Real Neon Postgres, real browser via Playwright. Admin CRUD flows for all
four new entities, duplicate-schedule rejection, class→subject dependent
filtering, marks entry/update/absent handling, completion counts, student
profile results. Teacher flow: assignment-scoped access proven both through
normal UI navigation and by attempting direct URL/param manipulation and
direct server-action calls with unauthorized IDs (all must be rejected
server-side). Cross-school ID rejection. Regression check on existing
attendance/admission/academics/i18n/mobile. Mobile check at ~390px on exams
list, exam detail, schedule dialog, marks entry — no horizontal overflow.
`npm run lint` and `npm run build` must both pass with zero errors before
this phase is reported done.
