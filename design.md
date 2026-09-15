---
version: "1.0"
name: "Benwil School Management Design System"
description: "A premium, modern, colorful and minimal SaaS design system for Benwil Model School Management System. Inspired by contemporary EdTech dashboards with colorful analytics, soft surfaces, strong information hierarchy and highly usable administrative workflows."

brand:
  name: "Benwil Model School"
  primary: "#18315a"
  primary-dark: "#102344"
  primary-light: "#eaf0f8"
  accent: "#bb1f23"
  accent-dark: "#92191d"
  accent-light: "#fbeaec"

colors:
  background: "#F6F7FB"
  surface: "#FFFFFF"
  surface-soft: "#FAFBFD"

  text:
    primary: "#172033"
    secondary: "#667085"
    muted: "#98A2B3"
    inverse: "#FFFFFF"

  border:
    default: "#E8EBF0"
    light: "#F0F2F5"

  semantic:
    success: "#20A66A"
    success-light: "#E8F7F0"

    warning: "#E9A23B"
    warning-light: "#FFF5E5"

    danger: "#D64545"
    danger-light: "#FCEBEC"

    info: "#3B82D0"
    info-light: "#EAF3FC"

  dashboard:
    purple: "#7C6FF2"
    purple-light: "#EEECFF"

    blue: "#4DA3DF"
    blue-light: "#EAF6FD"

    yellow: "#F4C84B"
    yellow-light: "#FFF8DF"

    green: "#55B98A"
    green-light: "#EAF8F1"

    orange: "#F29A55"
    orange-light: "#FFF0E5"

    pink: "#E9789B"
    pink-light: "#FCEBF1"

typography:
  fontFamily: "Poppins, Inter, sans-serif"

  display:
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"

  pageTitle:
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"

  sectionTitle:
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.4

  cardTitle:
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4

  body:
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6

  small:
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5

  metric:
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"

spacing:
  base: "4px"

  scale:
    xs: "4px"
    sm: "8px"
    md: "12px"
    lg: "16px"
    xl: "20px"
    2xl: "24px"
    3xl: "32px"
    4xl: "40px"
    5xl: "48px"

radius:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "999px"

shadows:
  none: "none"
  card: "0 1px 3px rgba(16, 24, 40, 0.04)"
  elevated: "0 8px 24px rgba(16, 24, 40, 0.08)"
  modal: "0 20px 50px rgba(16, 24, 40, 0.15)"

motion:
  fast: "150ms"
  base: "220ms"
  slow: "350ms"
  easing: "cubic-bezier(0.4, 0, 0.2, 1)"

layout:
  sidebarWidth: "240px"
  sidebarCollapsedWidth: "72px"
  headerHeight: "68px"
  contentMaxWidth: "1600px"
  pagePaddingDesktop: "28px"
  pagePaddingTablet: "20px"
  pagePaddingMobile: "16px"

breakpoints:
  mobile: "480px"
  tablet: "768px"
  laptop: "1024px"
  desktop: "1280px"
  wide: "1440px"
---

# Benwil School Management Design System

## 1. Design Philosophy

The Benwil School Management System must feel like a **premium modern EdTech SaaS product**.

The visual direction combines:

- Modern SaaS dashboards
- Contemporary EdTech products
- Colorful data visualization
- Minimal administrative interfaces
- Strong typography
- Generous whitespace
- Soft pastel surfaces
- Clear information hierarchy

The dashboard should take visual inspiration from modern school-management dashboards where colorful cards and charts are used to make data easier to understand.

### Core principle

**Minimal structure + colorful data.**

The interface itself should remain clean and neutral.

Data visualization should provide the color.

Do NOT create a dashboard where every element is brightly colored.

---

# 2. Visual Personality

The product should feel:

- Modern
- Premium
- Friendly
- Intelligent
- Colorful
- Professional
- Trustworthy
- Organized
- Fast
- Easy to scan

It should NOT feel:

- Like an old ERP
- Like a government administration system
- Like a Bootstrap template
- Like a financial accounting application
- Overly corporate
- Overly playful
- Overly glassmorphic
- Overly minimal
- Visually flat

---

# 3. Color Philosophy

Benwil's brand identity is based on:

Primary Navy:

`#18315a`

Brand Red:

`#bb1f23`

These colors should establish the identity of the application.

However, the dashboard should NOT use only navy and red.

The reference visual direction uses multiple soft colors for different information categories.

Use a controlled dashboard palette:

Purple → Students / academics

Blue → Attendance / information

Yellow → Teachers / activities

Green → Success / healthy metrics

Orange → Examinations

Red → Alerts / urgent items

Navy → Primary navigation and brand identity

Red → Primary brand actions and critical alerts

---

# 4. Color Usage Rules

Use color intentionally.

### GOOD

A white card containing:

- Purple icon
- Dark text
- Purple trend indicator
- Purple chart

### GOOD

A KPI card with a very light purple background and purple icon.

### BAD

A completely saturated purple card with white text and multiple competing colors.

### BAD

Every card using a different strong background.

Color should improve information hierarchy.

---

# 5. Dashboard Background

Use:

`#F6F7FB`

The dashboard should have a very subtle cool-gray background.

Cards should be white.

This creates a layered structure:

Background
↓
White content panels
↓
Colorful data elements

---

# 6. Sidebar

The sidebar should be approximately:

240px wide.

Use a white surface.

It should remain visually quiet.

Structure:

BENWIL MODEL SCHOOL

Overview
  Dashboard

People
  Students
  Teachers & Staff

Academics
  Classes & Sections
  Subjects
  Attendance
  Examinations
  Results
  Grading

Finance
  Fees
  Fee Structures
  Student Fees
  Payments
  Outstanding

Communication
  Notices
  Homework

Resources
  Library
  Transport

Insights
  Reports

System
  Settings

The sidebar should use:

- 14px text
- small clean icons
- 8–10px item spacing
- 10–12px radius for active item

Active navigation:

Very light brand-colored background.

For example:

`#EAF0F8`

with navy icon/text.

Do NOT make the entire active item bright red.

---

# 7. Dashboard Header

The header should be clean.

Left:

Good morning, Super Admin 👋

Below:

Here's what's happening at Benwil Model School today.

Right:

Search
Academic Session
Notifications
Profile

Primary action:

+ Add Student

The header should not contain excessive buttons.

---

# 8. Dashboard KPI Cards

Use four main KPI cards.

Layout:

4 columns on desktop.

2 columns on tablet.

1 column on mobile.

Recommended:

1. Total Students
2. Today's Attendance
3. Teachers & Staff
4. Fee Collection

Each KPI card:

- White or very lightly tinted surface
- 16px radius
- 20–24px padding
- Small colored icon
- Large metric
- Supporting text
- Trend indicator

Example:

Total Students

1,248

↑ 8.2% this term

Use purple for the student accent.

---

# 9. Colorful KPI Variant

A small number of KPI cards may use very soft pastel backgrounds.

Example:

Students:

Background:
`#EEECFF`

Icon:
Purple

Attendance:

Background:
`#EAF8F1`

Icon:
Green

Teachers:

Background:
`#FFF8DF`

Icon:
Yellow

Finance:

Background:
`#EAF6FD`

Icon:
Blue

IMPORTANT:

Pastel backgrounds only.

Never use fully saturated backgrounds.

---

# 10. Main Dashboard Analytics

The dashboard must contain real graphs.

Do NOT build a dashboard that is only:

- KPI cards
- tables
- lists

Charts are a major part of the visual experience.

Recommended dashboard structure:

### Row 1

4 KPI cards

### Row 2

Large Attendance Chart
+
Student Distribution

### Row 3

Fee Collection Chart
+
Upcoming Events

### Row 4

Exam Performance
+
Recent Activity

---

# 11. Attendance Chart

This should be one of the largest components.

Title:

Attendance Overview

Controls:

7 Days
30 Days
This Term

Use a line or area chart.

Data:

Present
Late
Absent

Use:

Green → Present

Yellow → Late

Red → Absent

The graph should have:

- smooth lines
- subtle grid
- clear tooltip
- readable labels
- small legend
- minimal visual noise

Do not make the chart overly decorative.

---

# 12. Student Distribution

Use a modern donut chart.

Center:

1,248

Total Students

Segments:

Primary
Secondary

or:

Boys
Girls

depending on the available data.

Use:

Purple
Blue
Yellow

The chart should be compact.

Below:

Primary 65%
Secondary 35%

---

# 13. Fee Collection Analytics

Title:

Fee Collection

Show:

Collected
Target
Pending

Main metric:

৳48.5L

Then show a monthly bar chart.

Months:

Jan
Feb
Mar
Apr
May
Jun
Jul
Aug
Sep

Use blue/purple bars.

Highlight the current month using the brand accent.

Do NOT use red for normal financial data.

Red should mean:

problem
overdue
warning

---

# 14. Examination Performance

Title:

Academic Performance

Use a horizontal bar chart.

Example:

Class 6    78%
Class 7    84%
Class 8    81%
Class 9    87%
Class 10   85%

Use a colorful but consistent palette.

Highest-performing class may use the primary purple.

Do not use a rainbow gradient.

---

# 15. School Health

Create a compact health overview.

Metrics:

Attendance
94.8%

Fee Collection
82.4%

Exam Completion
87%

Teacher Activity
98%

Use horizontal progress indicators.

Each metric can use semantic colors.

Example:

Attendance → green

Fee Collection → blue

Exam Completion → purple

Teacher Activity → orange

---

# 16. Quick Actions

Quick Actions should be visible without scrolling excessively.

Actions:

Add Student
Take Attendance
Create Exam
Collect Fee
Create Notice

Use compact horizontal/vertical buttons.

Each action:

Icon
Title
Small description

Example:

+ Add Student

Admit a new student

Do NOT make Quick Actions giant cards.

---

# 17. Recent Activity

Use a timeline/feed.

Example:

New student admitted
Sultana Parvin · Class 8A
8 minutes ago

Fee payment received
৳12,500
24 minutes ago

Attendance completed
Class 7B
42 minutes ago

Exam created
Mid-Term Assessment
1 hour ago

Use small colored activity icons.

---

# 18. Upcoming Events

Use a compact calendar/timeline card.

Example:

SEP 18

Mid-Term Examination

Classes 6–10

SEP 22

Parent Teacher Meeting

Guardians

OCT 02

Annual Science & Culture Fair

School-wide

Date blocks can use soft pastel colors.

---

# 19. Notices Widget

The dashboard should show the latest 3–5 notices.

Example:

Recent Notices

🔴 Emergency School Closure
School-wide · Today

🟠 Parent Teacher Meeting
Guardians · Sep 14

🔵 Mid-Term Examination Routine
Classes 6–10 · Sep 12

View all →

Keep this compact.

The complete notice system belongs on `/notices`.

---

# 20. Cards

Default card:

Background:
White

Border:
1px solid #E8EBF0

Radius:
16px

Padding:
20–24px

Shadow:
Minimal

Cards should align to a consistent grid.

Avoid random card sizes.

Avoid excessive nested cards.

---

# 21. Charts

Charts should be:

- clean
- colorful
- interactive
- responsive
- easy to read

Use color to distinguish data series.

Avoid:

- 3D charts
- excessive gradients
- decorative charts
- unnecessary animation
- excessive grid lines

Charts should answer a question.

Examples:

How is attendance changing?

How much fee has been collected?

Which classes are performing best?

How are students distributed?

---

# 22. Tables

Tables should only be used when users need to compare or manage records.

Good table use:

Student directory
Payment records
Exam results

Bad table use:

Recent activity
Upcoming events
Dashboard summaries

Use cards/timelines for summaries.

---

# 23. Status Badges

Use small pills.

Published:

Green

Scheduled:

Orange

Draft:

Gray

Urgent:

Red

Important:

Orange

Normal:

Gray/Blue

Do not make badges huge.

---

# 24. Buttons

Primary button:

Brand red:

`#bb1f23`

Text:

White

Example:

+ Add Student

Secondary:

White

Border:

`#E8EBF0`

Text:

`#18315a`

Ghost:

Transparent.

Use rounded 8–10px corners.

Avoid pill-shaped buttons except filters/tags.

---

# 25. Icons

Use one consistent icon library.

Prefer:

Lucide

Icons should be:

16–20px.

Avoid mixing multiple icon styles.

Do not use icons purely for decoration when they do not communicate meaning.

---

# 26. Empty States

Empty states should be friendly.

Example:

No notices yet

School announcements will appear here.

[Create Notice]

Do not show huge illustrations unless appropriate.

---

# 27. Loading States

Use skeleton loaders.

Do not show blank white pages.

Skeletons should match the final component structure.

---

# 28. Responsive Design

Desktop:

Sidebar visible.

Dashboard uses 12-column grid.

Tablet:

Sidebar collapsible.

Dashboard uses 2-column grid.

Mobile:

Sidebar becomes drawer.

Cards stack.

Charts become full width.

KPI cards become single-column or 2-column depending on width.

Never allow horizontal scrolling.

Target:

390px

768px

1024px

1280px

1440px

---

# 29. Dashboard Grid

Desktop example:

12-column grid.

KPI:

3 columns each.

Attendance:

8 columns.

Student distribution:

4 columns.

Fee analytics:

8 columns.

Upcoming events:

4 columns.

Academic performance:

7 columns.

Recent activity:

5 columns.

This creates visual rhythm.

---

# 30. Whitespace

Whitespace is extremely important.

Do not fill every available pixel.

Use:

24–32px between major sections.

16–20px inside cards.

8–12px between related elements.

The reference design should feel spacious rather than dense.

---

# 31. Typography Rules

Do not use uppercase labels everywhere.

Prefer:

Total Students

instead of:

TOTAL STUDENTS

Prefer:

Today's Attendance

instead of:

TODAY'S ATTENDANCE

Use bold typography only for hierarchy.

Do not make every piece of information bold.

---

# 32. Brand Usage

Benwil Navy:

`#18315a`

Use for:

- Logo
- Primary navigation
- headings where appropriate
- important controls
- links
- brand identity

Benwil Red:

`#bb1f23`

Use for:

- primary CTA
- urgent actions
- selected high-priority indicators
- important brand accents

Do NOT make the whole dashboard red.

---

# 33. Colorful Dashboard Rule

The dashboard should visually resemble a modern colorful EdTech product.

Use:

Soft purple KPI
Soft yellow KPI
Soft blue KPI
Soft green KPI

Colorful charts

Colorful status indicators

Pastel event blocks

But keep:

Background → neutral

Cards → white

Text → dark neutral

Navigation → white/navy

This creates the balance:

**80% clean neutral interface**
+
**20% colorful information**

---

# 34. Avoid These Design Patterns

DO NOT use:

- Giant gradients
- Glassmorphism
- Neon colors
- Excessive shadows
- Huge rounded rectangles
- Excessive pills
- Excessive borders
- Rainbow gradients
- 3D charts
- Tiny unreadable text
- Huge tables
- 20+ KPI cards
- Every feature as a separate card
- Every navigation item as a top-level item

---

# 35. Animation

Animations should be subtle.

Card hover:

150–200ms

Dropdown:

150–200ms

Modal:

200–300ms

Chart animation:

300–500ms

Use:

`cubic-bezier(0.4, 0, 0.2, 1)`

Avoid constant motion.

The application should feel fast.

---

# 36. Accessibility

Maintain:

- WCAG-friendly contrast
- visible focus states
- keyboard navigation
- accessible chart labels
- semantic buttons
- proper form labels
- aria labels for icon-only buttons

Do not use color as the only way to communicate status.

For example:

Urgent

should use:

red + text/icon

not red alone.

---

# 37. Dashboard Information Hierarchy

When an administrator opens the dashboard, they should understand these things within approximately five seconds:

1. How many students are enrolled?
2. How is today's attendance?
3. How many teachers/staff are active?
4. How much fee has been collected?
5. Is attendance improving?
6. How are students performing?
7. What important notices exist?
8. What is happening today?
9. What requires attention?
10. What action can I take immediately?

Everything else should be one click away.

---

# 38. Recommended Dashboard

Final layout:

--------------------------------------------------

HEADER

Good morning, Super Admin 👋

School overview for today.

                         + Add Student

--------------------------------------------------

KPI ROW

[ Students ] [ Attendance ] [ Teachers ] [ Fees ]

--------------------------------------------------

ANALYTICS

[        Attendance Overview        ] [ Student ]
[        Large Line Chart           ] [  Donut  ]

--------------------------------------------------

FINANCE

[          Fee Collection           ] [ Upcoming ]
[          Monthly Chart             ] [ Events   ]

--------------------------------------------------

ACADEMICS

[      Academic Performance         ] [ Recent  ]
[      Class Performance Chart      ] [ Activity ]

--------------------------------------------------

SCHOOL HEALTH

Attendance
Fee Collection
Exam Completion
Teacher Activity

--------------------------------------------------

QUICK ACTIONS

Add Student | Attendance | Exam | Fee | Notice

--------------------------------------------------

# 39. Important Implementation Rule

This design system is a visual and UX direction.

When implementing it in the existing application:

DO NOT blindly replace existing functionality.

Preserve:

- authentication
- authorization
- existing routes
- database
- server actions
- API calls
- existing business logic
- fee functionality
- student functionality
- attendance functionality
- exam functionality
- portal functionality

Change the visual presentation and information architecture without breaking the underlying system.

---

# 40. Final Quality Standard

The final dashboard should look like a premium commercial EdTech SaaS product.

The visual impression should be:

Modern
+
Colorful
+
Minimal
+
Data-rich
+
Professional

The dashboard should NOT look like an old school ERP.

It should feel like a product that a modern private school would proudly use every day.

The reference direction is:

**clean white interface + soft pastel cards + colorful analytics + strong typography + rounded modern components + professional spacing.**

Benwil branding must remain visible through:

`#18315a`

and

`#bb1f23`

while the dashboard analytics introduce:

purple
blue
yellow
green
orange

in a controlled and sophisticated way.
