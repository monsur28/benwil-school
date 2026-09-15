# School Management System — Engineering Rules

## 1. Project Overview

This is a School Management System for Bangladeshi schools covering Classes 1–10.

The application is an internal school management system for:

* School administrators
* Principals
* Teachers
* Accountants
* Librarians
* HR staff
* Students
* Guardians

The system must remain:

> Simple on the surface, solid underneath.

Prioritize usability, reliability, security, and maintainability over technical complexity.

---

# 2. Technology Stack

Use the existing project stack.

* Next.js 16
* Next.js App Router
* React 19
* TypeScript
* Tailwind CSS v4
* shadcn/ui
* Prisma 7
* PostgreSQL
* `@prisma/adapter-pg`
* Zod
* React Hook Form
* `@hookform/resolvers`
* `iron-session`
* `bcryptjs`
* `next-intl`
* TanStack Table when table functionality is actually needed

Do not replace the existing stack.

Do not introduce a new framework or architecture without a strong reason.

---

# 3. Architecture

## Server Components

Use React Server Components by default.

Use Client Components only when interactivity requires them.

Examples:

* form interactions
* dropdown state
* tabs requiring client state
* dialogs
* interactive tables
* filters
* date pickers
* charts

Do not add `"use client"` unnecessarily.

---

# 4. Data Fetching

Prefer server-side data fetching.

Use:

* Server Components
* Server Actions
* existing server-side libraries

Do not create internal REST APIs for normal CRUD operations.

Do not introduce GraphQL.

Do not introduce unnecessary API abstraction layers.

---

# 5. Mutations

Use Server Actions for mutations.

Every mutation must:

1. Validate authentication.
2. Validate role/permission.
3. Validate input using Zod.
4. Validate school ownership.
5. Validate related record ownership.
6. Perform the mutation.
7. Revalidate affected paths when necessary.
8. Return a predictable success/error result.

Never trust:

* client-side role
* client-provided user ID
* client-provided school ID
* URL parameters
* hidden form fields
* disabled inputs
* UI visibility

All important authorization must happen on the server.

---

# 6. Authentication

Use the existing authentication system.

Authentication is based on:

* `iron-session`
* bcrypt password hashing
* server-side session checks

Use the existing central authentication/DAL helpers.

Do not create a second authentication system.

Do not create module-specific authentication.

Do not duplicate session logic throughout the application.

---

# 7. Roles

Current roles:

* SUPER_ADMIN
* SCHOOL_ADMIN
* PRINCIPAL
* TEACHER
* ACCOUNTANT
* LIBRARIAN
* HR
* STUDENT
* GUARDIAN

Always use the existing role system.

Do not invent new roles for a module unless explicitly required.

Prefer existing role helpers such as:

* `requireAuth()`
* `requireRole(...)`

Follow the existing project implementation rather than creating duplicate helpers.

---

# 8. Multi-School Security

The application is designed to support multiple schools.

Every school-owned database record must be scoped by:

```text
schoolId
```

Never retrieve a school-owned record by ID alone when authorization matters.

Bad:

```ts
prisma.student.findUnique({
  where: { id: studentId }
})
```

Preferred:

```ts
prisma.student.findFirst({
  where: {
    id: studentId,
    schoolId: session.schoolId,
  },
})
```

Or use the project's existing ownership helpers.

Always assume IDs may be manipulated.

---

# 9. URL Tampering Protection

Never trust IDs from:

* URL params
* search params
* forms
* hidden inputs

Example:

```text
/results/EXAM_ID/CLASS_ID/SECTION_ID
```

All IDs must be revalidated against the authenticated user's permitted records.

A user must not gain access simply by changing:

```text
?classId=...
```

or:

```text
/[id]
```

in the URL.

This is especially important for:

* students
* guardians
* teachers
* exams
* marks
* results
* fees
* notices
* homework
* reports

---

# 10. Teacher Authorization

Teachers must only access academic records that belong to their assignments.

Use the existing:

```text
TeacherAssignment
```

system.

Where applicable, validate the exact combination of:

* teacher
* class
* section
* subject
* school

Do not assume that because a user has the `TEACHER` role they can access every class.

Admins/principals may have broader access according to existing project rules.

---

# 11. Student Authorization

Student portal pages must derive the student identity from the authenticated session/account link.

Do not trust:

```text
?studentId=
```

or similar client-provided identity parameters.

A student must only see their own:

* profile
* attendance
* results
* report cards
* fees
* notices
* homework
* future portal modules

---

# 12. Guardian Authorization

Guardian pages must verify the guardian-child relationship server-side.

Use the existing:

```text
StudentGuardian
```

relationship.

Never trust a URL such as:

```text
/portal/guardian/children/[studentId]
```

without verifying that the authenticated guardian actually has access to that student.

Guardians may only access their linked children.

---

# 13. Prisma Rules

Use the existing Prisma setup.

Do not change the database provider.

Do not bypass Prisma unless explicitly necessary.

When adding schema changes:

1. Update `schema.prisma`.
2. Create a migration.
3. Run Prisma generation.
4. Verify TypeScript.
5. Verify existing functionality.

Prefer additive migrations.

Do not delete or alter existing production data unless explicitly required.

---

# 14. Database Design

Prefer simple relational models.

Use explicit relationships.

Use database constraints where useful:

* `@unique`
* composite unique constraints
* foreign keys
* enums

Do not solve database integrity problems entirely in frontend code.

Important business rules should be enforced server-side and, where appropriate, through database constraints.

---

# 15. Validation

Use Zod for Server Action input validation.

Forms should normally use:

* React Hook Form
* Zod
* `@hookform/resolvers`

Do not rely only on browser validation.

Server-side validation is mandatory.

---

# 16. UI/UX Principles

The primary users are school staff who may not be highly technical.

Therefore:

* Keep screens simple.
* Use clear labels.
* Avoid unnecessary options.
* Avoid excessive dialogs.
* Prefer obvious actions.
* Keep common tasks fast.
* Avoid deep navigation.
* Use consistent layouts.
* Show useful empty states.
* Show clear validation errors.
* Confirm destructive actions.
* Make important status information visually obvious.

Aim for common workflows to take approximately 1–3 clicks where practical.

---

# 17. Design System

Reuse existing shadcn/ui components.

Do not create a completely new design system for every module.

Maintain consistency with existing:

* buttons
* cards
* tables
* forms
* dialogs
* dropdowns
* tabs
* badges
* alerts
* breadcrumbs
* page headers

Before creating a new component, check whether an existing component can be reused.

---

# 18. Responsive Design

Every new page must work on:

* desktop
* tablet
* mobile

Primary mobile test width:

```text
390px
```

Do not allow:

* horizontal page overflow
* broken tables
* unusable forms
* clipped buttons
* inaccessible dialogs

For wide tables, use appropriate responsive table behavior rather than forcing the entire page wider.

---

# 19. Internationalization

The application supports:

* English
* Bangla

All user-facing text must support both languages.

Do not hard-code new visible English-only strings when the project already uses the translation system.

Follow the existing `next-intl` conventions.

Do not create a second translation system.

---

# 20. Navigation

Use the existing centralized navigation configuration.

Navigation visibility should be role-aware.

Do not create separate unrelated navigation systems for individual modules.

If a new module needs navigation:

1. Add it to the existing navigation configuration.
2. Apply the appropriate role filtering.
3. Preserve mobile navigation behavior.

---

# 21. Dashboard

Use the existing dashboard architecture.

New modules may add small useful widgets.

Do not turn the dashboard into an analytics-heavy system.

Prefer useful information such as:

* upcoming homework
* today's attendance
* outstanding fees
* recent notices
* upcoming exams

Avoid unnecessary charts and metrics.

---

# 22. Error Handling

Handle expected errors gracefully.

Examples:

* duplicate record
* unauthorized access
* invalid input
* missing record
* inactive record
* finalized record
* invalid relationship
* invalid date

Do not expose database internals to users.

Never show raw Prisma errors to normal users.

---

# 23. Loading and Empty States

Every data-heavy page should have appropriate:

* loading state
* empty state
* error state

Empty states should explain what the user can do next.

Example:

```text
No homework has been created yet.

Create Homework
```

rather than simply:

```text
No data.
```

---

# 24. Destructive Actions

Use confirmation for destructive or irreversible actions.

Examples:

* delete
* void
* deactivate
* archive
* finalize
* reopen

If the project already has a preferred confirmation component, reuse it.

---

# 25. Business Data Integrity

Never silently overwrite important historical records.

Examples:

* payments
* exam marks
* finalized results
* attendance
* receipts

Follow existing module conventions.

For financial records, prefer void/reversal patterns over deletion.

For finalized academic results, respect the existing finalized/read-only workflow.

---

# 26. Audit Logs

Use audit logs for meaningful administrative mutations where the module requires them.

Do not add audit logging to every trivial UI interaction.

Examples of meaningful actions:

* finalizing results
* reopening results
* voiding payments
* changing important account state
* administrative configuration changes

Follow existing audit-log conventions.

---

# 27. Dependencies

Before adding a package, ask:

> Can the feature be implemented cleanly with the existing stack?

If yes, do not add a dependency.

Avoid unnecessary packages.

Do not introduce:

* Redis
* GraphQL
* Redux
* Zustand
* tRPC
* microservices
* event sourcing
* CQRS
* message queues

unless explicitly requested.

---

# 28. File Organization

Follow the existing project structure.

Typical organization:

```text
src/
  actions/
  app/
  components/
  lib/
```

Keep:

* database access in appropriate server-side libraries
* mutations in actions
* reusable UI in components
* validation near the relevant module
* authorization in shared server-side helpers

Do not create huge monolithic files when a module naturally separates into smaller files.

---

# 29. Avoid Unrelated Refactoring

When implementing a phase:

DO NOT:

* rewrite unrelated modules
* rename unrelated files
* change existing architecture
* replace working components
* upgrade dependencies
* reformat the entire repository
* "clean up" unrelated code

Only modify what is necessary for the requested phase.

If you discover an unrelated issue, mention it instead of fixing it unless it blocks the current work.

---

# 30. Next.js 16 Routing

This project uses Next.js 16.

The project uses:

```text
src/proxy.ts
```

for proxy behavior.

Do not introduce the old `middleware.ts` approach.

For Next.js-specific questions, inspect the project's existing conventions and the locally available Next.js documentation when necessary.

---

# 31. Testing Requirements

For every meaningful module:

Test at minimum:

### Functional

* create
* read
* update
* relevant delete/deactivate/archive behavior

### Authorization

* correct role
* incorrect role
* cross-school access
* URL tampering
* relationship validation

### UI

* desktop
* mobile around 390px
* empty states
* validation errors

### i18n

* English
* Bangla

Run:

```text
lint
typecheck/build
relevant E2E tests
```

Do not claim a feature is complete without testing the important server-side authorization paths.

---

# 32. Testing Existing Features

Never assume a new phase cannot break previous phases.

After meaningful schema or shared-code changes, run relevant regression tests.

Especially protect:

* authentication
* students
* attendance
* academics
* examinations
* results
* portals
* fees
* notices

---

# 33. Performance

Prefer straightforward server-side queries.

Avoid:

* N+1 queries
* unnecessary client fetching
* loading entire datasets when pagination/filtering is appropriate
* repeated identical database queries

Do not optimize prematurely.

Keep the implementation simple first.

---

# 34. Security Priority

Security is more important than convenience.

Always assume:

```text
The user can manipulate the browser.
The user can modify URLs.
The user can modify request payloads.
The user can inspect frontend code.
```

Therefore:

> Frontend restrictions are UX. Server-side restrictions are security.

---

# 35. Implementation Philosophy

Follow this rule:

> Simple on the surface, solid underneath.

Do not over-engineer.

Do not build future functionality before it is needed.

Implement the smallest clean solution that satisfies the current phase.

Future-ready does not mean feature-heavy.

---

# 36. Definition of Done

A phase is complete only when:

* schema is correct
* migration succeeds
* server actions are validated
* authorization is enforced server-side
* school isolation is enforced
* relevant UI is implemented
* mobile works
* English/Bangla works
* loading/empty/error states exist
* relevant E2E tests pass
* lint passes
* build/typecheck passes
* unrelated existing functionality is preserved
* no unnecessary dependencies were introduced

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
