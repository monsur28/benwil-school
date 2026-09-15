@AGENTS.md
# Claude Development Guide

## Project

This is a Bangladeshi School Management System for Classes 1–10.

The application is already developed in multiple phases.

Do not treat the repository as a greenfield project.

Before implementing anything, understand and preserve the existing architecture.

---

# 1. Most Important Rule

## Work in small phases.

Never implement a large feature set all at once unless explicitly requested.

A large module should normally be divided into stages such as:

```text
Database
    ↓
Server actions / business logic
    ↓
Admin/teacher UI
    ↓
Student portal
    ↓
Guardian portal
    ↓
Dashboard
    ↓
Testing
```

Complete the requested stage before moving to the next stage.

If the prompt says:

> Stop after this stage.

Actually stop.

Do not proactively implement future stages.

---

# 2. Before Coding

First inspect:

```text
AGENTS.md
CLAUDE.md
package.json
prisma/schema.prisma
src/
```

Then identify:

* existing authentication
* existing role helpers
* existing DAL
* existing navigation
* existing i18n
* existing UI components
* related database models
* related Server Actions
* related tests

Do not immediately start rewriting files.

---

# 3. Reuse Existing Architecture

Before creating a new helper/component:

Search the repository.

Ask:

```text
Does an existing helper already solve this?
Does an existing component already solve this?
Does another module have the same pattern?
```

If yes, reuse it.

Do not duplicate:

* authentication
* authorization
* validation
* database access
* navigation
* translation logic
* UI components

---

# 4. Implementation Order

For a new feature, prefer this order:

### Step 1 — Understand

Inspect relevant existing code.

### Step 2 — Database

If required:

* update Prisma schema
* create migration
* generate Prisma client
* verify migration

### Step 3 — Server logic

Implement:

* validation
* authorization
* database queries
* Server Actions
* shared business logic

### Step 4 — UI

Implement the requested pages/components.

### Step 5 — Integration

Connect navigation, dashboard, profile or portals only when requested.

### Step 6 — Tests

Test the feature and its security boundaries.

### Step 7 — Quality

Run lint/build/typecheck and relevant E2E tests.

---

# 5. Do Not Trust Client Input

Every Server Action must independently validate authorization.

For example, never assume:

```text
teacherId
schoolId
studentId
classId
sectionId
subjectId
```

from the client are legitimate.

Resolve identity from the authenticated session whenever possible.

Then validate ownership/relationships from the database.

---

# 6. School Isolation

Every query involving school-owned data must enforce the current user's school.

Never write insecure code like:

```ts
findUnique({
  where: { id }
})
```

when the record is school-owned and the ID is user-controlled.

Use school-aware queries or existing access helpers.

Cross-school access must always fail safely.

---

# 7. Teacher Access

For teacher workflows, use:

```text
TeacherAssignment
```

Teacher authorization should normally verify the exact assignment.

For example:

```text
teacher
+
school
+
class
+
section
+
subject
```

Do not give all teachers access to all academic data simply because they have the `TEACHER` role.

---

# 8. Portal Access

## Student

Never trust a student ID supplied by the browser.

Derive the student account from the authenticated session.

## Guardian

Never trust a child ID supplied by the browser.

Verify the authenticated guardian's `StudentGuardian` relationship.

---

# 9. Database Changes

When modifying Prisma:

```text
1. Inspect current schema.
2. Add only required models/fields.
3. Preserve existing relations.
4. Create an additive migration.
5. Run Prisma generation.
6. Test existing functionality.
```

Do not reset the database.

Do not use destructive schema operations casually.

Do not delete existing records just to make a migration work.

---

# 10. Server Actions

Server Actions should follow the existing project pattern.

Typical flow:

```ts
const session = await requireAuth();

requireRole(...);

const parsed = schema.safeParse(input);

if (!parsed.success) {
  return {
    success: false,
    error: ...
  };
}

const record = await prisma...

// verify school ownership
// verify relationships
// perform mutation

revalidatePath(...);

return {
  success: true,
};
```

Use the actual conventions already present in the repository rather than blindly copying this example.

---

# 11. Forms

Use:

```text
React Hook Form
+
Zod
+
@hookform/resolvers
```

Forms should have:

* clear labels
* useful validation messages
* server error handling
* loading state
* disabled submit while saving
* mobile-friendly layout

Do not duplicate the same validation rules only in the frontend.

---

# 12. UI

Use existing shadcn/ui components.

Prefer:

```text
Page header
Card
Form
Table
Badge
Dialog
Tabs
Dropdown
Alert
```

where appropriate.

Keep pages visually consistent with the existing application.

Do not redesign the entire application while implementing one module.

---

# 13. Mobile

Always check the page around:

```text
390px
```

Pay special attention to:

* tables
* filters
* forms
* action buttons
* dialogs
* page headers
* navigation
* cards

Avoid horizontal overflow.

---

# 14. English + Bangla

Every new user-facing feature must support both languages.

Follow the existing translation file structure.

When adding translations:

* add English
* add Bangla
* use the same translation keys

Do not hard-code text inside components when the existing project expects translations.

---

# 15. Testing

For each stage, test only the relevant scope first.

Example:

```text
Phase 10.1
→ database + schema tests

Phase 10.2
→ teacher CRUD + authorization

Phase 10.3
→ student portal

Phase 10.4
→ guardian portal

Phase 10.5
→ dashboard

Phase 10.6
→ full Phase 10 regression
```

This makes failures easier to identify.

---

# 16. Security Tests

Whenever a feature has authorization, test:

### Correct access

The intended user can access it.

### Wrong role

An unauthorized role cannot access it.

### Cross-school

A user from School A cannot access School B records.

### URL tampering

Changing IDs in the URL cannot bypass authorization.

### Relationship tampering

Changing student/class/section/subject IDs cannot bypass relationship checks.

### State tampering

Client attempts to modify protected states must fail server-side.

---

# 17. Do Not Over-Test Every Turn

During implementation, run focused tests first.

For example:

```text
implement
→ focused test
→ fix
→ focused test
```

After the entire phase:

```text
lint
→ build/typecheck
→ relevant E2E
→ regression suite
```

Do not repeatedly run the entire repository test suite after every tiny edit unless necessary.

This saves time.

---

# 18. Avoid Unnecessary Refactoring

If you see:

```text
unrelated lint issue
unrelated component issue
unrelated type issue
unrelated old code
```

do not automatically fix it.

Ask:

> Does this block the current requested feature?

If no:

* leave it alone
* mention it in the final report if relevant

---

# 19. Dependency Discipline

Before installing a package, check whether the existing stack can solve the problem.

Prefer existing dependencies.

Do not install libraries simply because they are convenient.

No new architecture without explicit justification.

---

# 20. Keep Files Focused

Avoid enormous files.

If a module naturally contains:

```text
actions
validation
access control
queries
components
```

separate them according to existing project conventions.

But do not split tiny code into dozens of unnecessary files.

---

# 21. Business Rules

Business rules belong on the server.

Examples:

```text
A finalized result cannot be edited.
A voided payment cannot be reused.
A teacher can only manage assigned subjects.
A guardian can only see linked children.
A student can only see their own data.
A draft notice is not visible to portals.
```

The UI may reflect these rules, but the server must enforce them.

---

# 22. Historical Data

Protect historical records.

Do not casually delete:

* attendance
* marks
* results
* payments
* receipts
* finalized records

Use the existing project's lifecycle patterns such as:

```text
draft
published
finalized
archived
voided
inactive
```

when appropriate.

---

# 23. When You Discover a Better Idea

Do not automatically implement it.

If you think:

> "This would be better if we also added X."

Ask whether X is actually part of the current stage.

If not, leave it out and mention it under:

```text
Possible future enhancement
```

This prevents scope creep.

---

# 24. Stop Conditions

When a prompt defines a scope, treat it as a hard boundary.

For example:

```text
Implement only database schema and migration.
```

means:

Do NOT build UI.

```text
Implement teacher homework management.
```

means:

Do NOT build student/guardian portal unless requested.

```text
Implement student portal.
```

means:

Do NOT redesign teacher/admin workflows.

---

# 25. Final Report

At the end of each stage, report briefly:

## Completed

* what was implemented

## Files Changed

* important files only

## Database

* migration name
* schema changes

## Security

* authorization implemented
* cross-school checks
* URL tampering protection

## Tests

* tests run
* result

## Known Issues

* only issues relevant to this stage

## Next Stage

* what should be implemented next

Do not claim tests passed if they were not actually run.

---

# 26. Recommended Workflow for This Project

Use this structure for future phases:

```text
PHASE X
│
├── X.1 Database
│
├── X.2 Core server logic
│
├── X.3 Admin/Teacher UI
│
├── X.4 Student portal
│
├── X.5 Guardian portal
│
├── X.6 Dashboard/integration
│
└── X.7 Security + E2E + regression
```

Not every phase needs every stage.

Use only the stages that are actually required.

---

# 27. Primary Goal

The goal is not to create the most technically sophisticated system.

The goal is to create a system that school staff can actually use every day.

Optimize for:

1. Correctness
2. Security
3. Simplicity
4. Maintainability
5. Usability
6. Performance

Avoid complexity for its own sake.

---

# 28. Golden Rule

Before adding complexity, ask:

> Can this be solved simply using the architecture we already have?

If yes:

Use the simple solution.
