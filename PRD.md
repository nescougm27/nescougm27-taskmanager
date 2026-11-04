# NESCO 2027 — Web Development Workspace

Act as a senior frontend engineer, product designer, and full-stack Next.js architect.

Build a production-quality internal project management workspace for the **NESCO 2027 Web Development Committee**.

The application should help committee members organize development tasks, coordinate activities, manage deadlines, subscribe to the official calendar, evaluate the previous year's website, and submit feature or page requests.

The product should feel like a thoughtfully crafted developer workspace, not a generic admin template.

## 1. Tech Stack

Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React
- Google Sheets API v4
- Google Service Account
- Next.js Route Handlers
- TanStack Query
- React Hook Form + Zod
- date-fns
- Recharts where meaningful
- pnpm

### Important Architecture Constraints

Google Sheets must function as the primary shared database.

Do not use Supabase, Firebase, PostgreSQL, Prisma, or a separate database server.

Use Next.js Route Handlers to securely communicate with Google Sheets. Keep all Google credentials server-side.

The complete application should be deployable as one Next.js project on Vercel.

Use localStorage only for temporary form drafts and noncritical UI preferences.

All real project data must persist in Google Sheets and be accessible across authorized committee members.

## 2. Visual Design System

Create a premium, contemporary workspace using a sophisticated green color family.

### Color Palette

- Forest Green: #103D2F — Primary sidebar and major surfaces
- Pine Green: #166534 — Primary buttons and active navigation
- Fern Green: #3F8F68 — Secondary accents
- Sage Green: #A8D5BA — Soft highlights
- Mint Green: #E8F4EA — Selected and subtle background states
- Off White: #F7FAF7 — Main application background
- Pure White: #FFFFFF — Cards and form surfaces
- Dark Text: #1C3026 — Primary text
- Muted Text: #708277 — Secondary text
- Border: #E1EAE3 — Dividers and outlines

Use muted amber for warnings and restrained red for destructive actions and overdue deadlines.

Do not force green onto every component. Maintain sufficient neutral space to create visual balance.

### Typography

- Plus Jakarta Sans for headings
- Inter for interfaces and body text
- JetBrains Mono for technical metadata, IDs, and code references

### Visual Principles

- Modern developer productivity application
- Editorial-quality typography and hierarchy
- Carefully controlled spacing
- Minimal and purposeful iconography
- Soft borders and subtle shadows
- No excessive gradients
- No glowing effects or unnecessary glassmorphism
- Avoid generic AI-generated dashboard aesthetics
- Professional, distinctive, and responsive

### Layout

Desktop:
- Fixed forest-green sidebar
- Light main content background
- Minimal topbar with breadcrumb, title, and actions
- Well-structured content grid
- Responsive cards and data tables

Mobile:
- Collapsible navigation
- Adaptive layouts
- Touch-friendly interactions

Support light and dark themes with consistent green identity.

## 3. Navigation

Create five main navigation items:

1. Overview
2. Task Manager
3. Calendar
4. Activities
5. Feedback Center

Use matching Lucide icons.

The active sidebar item should have a subtle sage or mint treatment with strong contrast.

Do not create separate Evaluation and Feature Request navigation pages. Both belong inside Feedback Center.

## 4. Overview Dashboard

Create an information-rich but visually calm dashboard.

### Header
- NESCO 2027
- Web Development Workspace
- Current date
- Short contextual greeting

### Statistics
- Total Tasks
- In Progress
- Completed
- Overdue
- Upcoming Activities
- Overall Project Progress

### Development Progress

Display progress by category:
- UI/UX Design
- Frontend Development
- Website Integration
- Testing & QA
- Deployment

Calculate actual progress based on task completion.

### Focus Section

Display tasks that need immediate attention:
- Due Today
- Due This Week
- High Priority
- Overdue

### Additional Widgets
- Upcoming meetings and deadlines
- Recent project activity
- Latest feature/page requests
- Quick actions for adding tasks, events, or submitting feedback

All dashboard metrics must reflect Google Sheets data.

## 5. Task Manager

Implement a complete task management experience.

### Task Fields
- Unique UUID
- Title
- Description
- Category
- Assigned member
- Priority: Low, Medium, High, Urgent
- Status: Backlog, To Do, In Progress, In Review, Done
- Start Date
- Due Date
- Related module
- Subtasks
- Notes
- Reference URL
- Created At
- Updated At

### Views

**Kanban View**
- Columns grouped by status
- Drag-and-drop status changes, where accessible and reliable
- Task cards with priority, assignee, and due dates

**List View**
- Search
- Sort by deadline or priority
- Filter by assignee, status, and category
- Show overdue tasks clearly

**Task Detail**
- Edit task details
- Update status
- Add and complete subtasks
- Add notes and references
- Delete tasks with confirmation

### Persistence
All changes must be saved to the `Tasks` worksheet.

Use optimistic UI updates when safe, and rollback on failed mutations.

Display actionable error messages if Google Sheets is unavailable.

## 6. Calendar

Create a committee calendar system.

### Calendar Views
- Month
- Week
- Agenda

### Event Types
- Committee Meeting
- Development Sprint
- Design Review
- Internal Deadline
- Website Testing
- Deployment
- General Activity

### Event Fields
- UUID
- Title
- Description
- Start Date and Time
- End Date and Time
- Category
- Location / Meeting URL
- Responsible Member
- Visibility (Public / Internal)

Store events in the `Events` worksheet.

### Subscribe Calendar Feature

Implement a genuinely subscribable iCalendar feed.

Create a Next.js Route Handler:

`/api/calendar.ics`

Generate a standards-compliant ICS response from published events in Google Sheets.

Requirements:
- Stable event UIDs
- Correct DTSTART and DTEND
- Proper Asia/Jakarta timezone handling
- Escaped event descriptions
- Calendar-compatible HTTP response
- Sensible caching
- Public feed includes only events marked public

Provide:
- Subscribe to Calendar
- Copy Calendar URL
- Download .ics
- Instructions for subscribing through Google Calendar and Apple Calendar

The feed should reflect future spreadsheet edits when the calendar provider refreshes its subscription.

Do not misrepresent downloading an ICS file as a continuously updating subscription.

## 7. Activities

Create a dedicated activity management page.

Use an organized timeline and list-based layout.

Activity properties:
- Activity title
- Type
- Date
- Description
- Related tasks
- Responsible members
- Meeting notes
- Decisions
- Follow-up actions
- Reference links

Support:
- Create activity
- Read activity details
- Edit activity
- Delete activity
- Filter by date and category
- Link activities with relevant tasks

Store all activity records in the `Activities` worksheet.

## 8. Feedback Center — Combined Evaluation & Requests

Create ONE integrated page named:

**Feedback Center**

Subtitle:
"Evaluate the past. Shape what's next."

This page must combine previous-year website evaluations, feature requests, and page requests into a single coherent user experience.

### Main Interface

At the top, display a concise introduction about improving NESCO 2027 through structured feedback.

Create three selectable tabs or segmented options:

1. Evaluation 2026
2. Feature Request
3. Page Request

Switching types must update the form dynamically without navigating to another page.

Keep one consistent form shell, with shared fields and conditional fields.

### Shared Form Fields

All submission types should support:
- Submitter name
- Committee role / division
- Submission type
- Description
- Additional notes

### Type A — Evaluation 2026

Purpose:
Collect structured feedback about the previous year's NESCO website and web development process.

Fields:
- Respondent name
- Previous committee role
- Website design rating (1–5)
- User experience rating (1–5)
- Responsiveness rating (1–5)
- Loading performance rating (1–5)
- Feature functionality rating (1–5)
- Technical reliability rating (1–5)
- What worked well?
- What problems occurred?
- What features should be maintained?
- What should be improved?
- What should be avoided in NESCO 2027?
- Recommendations for the next development team

Use accessible rating controls, textareas, clear grouping, and helpful descriptions.

### Type B — Feature Request

Fields:
- Feature title
- Requester name
- Related website module
- Problem to solve
- Proposed feature
- Expected behavior
- Priority
- Reference URL
- Additional details

### Type C — Page Request

Fields:
- Proposed page title
- Suggested URL slug
- Requester name
- Purpose
- Target audience
- Required sections
- Required features
- Priority
- Content/design references
- Additional notes

### Form User Experience

- Smooth switching between submission types
- Strong field hierarchy
- Clear validation messages
- Save unfinished drafts locally
- Review submission before final confirmation
- Disable duplicate submissions
- Actual submission to Google Sheets
- Confirmation state after successful saving
- Error handling with retry options

Do not fake successful submissions.

### Unified Feedback Directory

Below the form, or in an adjacent subview, provide a directory of submissions.

Features:
- Search feedback records
- Filter by Evaluation, Feature Request, or Page Request
- Filter by submission status
- Filter by priority
- View details
- Review request status
- Display submission dates

Request workflow:
Submitted → Under Review → Approved → Planned → In Development → Completed

Also support Rejected status.

Evaluation responses must be presented separately from the request approval workflow.

### Feedback Dashboard

At the top of the Feedback Center, show useful summaries:
- Total Evaluations
- Feature Requests
- Page Requests
- Pending Review

When sufficient evaluation responses exist, display an average-rating summary.

Do not show fabricated feedback statistics.

### Privacy and Permissions

Evaluation responses should be visible only to authorized reviewers.

Ordinary committee members may submit feedback and view requests according to their assigned permissions.

Only authorized administrators can change review statuses or delete shared feedback records.

## 9. Google Sheets Architecture

Use one spreadsheet:

**NESCO 2027 — Workspace Database**

Create four worksheets:

### Tasks
id, title, description, category, assignee, priority, status, start_date, due_date, module, subtasks_json, notes, reference_url, created_at, updated_at

### Events
id, title, description, start_datetime, end_datetime, category, location, responsible, visibility, created_at, updated_at

### Activities
id, title, type, date, description, related_tasks_json, responsible, notes, decisions, follow_ups_json, references_json, created_at, updated_at

### Feedback
id, type, submitter, division, title, module, slug, description, problem, expected_behavior, priority, status, rating_design, rating_ux, rating_responsiveness, rating_performance, rating_functionality, rating_reliability, strengths, weaknesses, recommendations, reference_url, extra_json, created_at, updated_at

For Feedback, use the type values:
- evaluation
- feature_request
- page_request

Unused type-specific columns may remain empty.

All records require stable UUIDs.

Never treat worksheet row indices as permanent record identifiers.

Encapsulate the Google Sheets integration in reusable data access functions.

## 10. Next.js API

Implement appropriate REST-style Route Handlers.

Endpoints:

- GET/POST `/api/tasks`
- GET/PATCH/DELETE `/api/tasks/[id]`
- GET/POST `/api/events`
- GET/PATCH/DELETE `/api/events/[id]`
- GET/POST `/api/activities`
- GET/PATCH/DELETE `/api/activities/[id]`
- GET/POST `/api/feedback`
- GET/PATCH/DELETE `/api/feedback/[id]`
- GET `/api/calendar.ics`

All mutations must use Zod validation.

Secure the Google Sheets service account using server-only environment variables.

Add authentication for committee members using Google OAuth and database-free signed sessions.

Implement an allowlist and role-based authorization for internal actions.

Never expose service account credentials or unrestricted CRUD endpoints to the browser.

Prevent unauthorized access to evaluation responses.

Use pagination or bounded reads when necessary.

Handle Google Sheets rate limits and API errors gracefully.

For concurrent changes, implement version checks where feasible and clearly handle editing conflicts.

## 11. UI Components

Build reusable components:

- Sidebar
- Topbar
- Metric Card
- Task Card
- Kanban Column
- Task Detail Drawer
- Calendar Grid
- Calendar Event Modal
- Activity Timeline
- Feedback Type Selector
- Evaluation Rating Input
- Dynamic Feedback Form
- Submission Preview
- Feedback Directory
- Request Status Control
- Search and Filter Bar
- Confirmation Modal
- Empty State
- Loading Skeleton
- Toast Notifications
- Theme Toggle

All interactive controls must be functional.

## 12. Experience & Quality

Important requirements:

- Responsive on mobile, tablet, and desktop
- Accessible semantic HTML
- Keyboard navigation
- Visible focus indicators
- Clear validation and error states
- No hydration errors
- No decorative fake controls
- No excessive animations
- No unnecessary dependencies
- Consistent layouts and typography
- Strong TypeScript typing
- Clean component architecture

Use realistic sample data for development but clearly label it as sample data. Do not invent real committee schedules or member names.

## 13. Setup & Deployment

Provide:
- Complete Next.js source code
- `.env.example`
- Google Sheets API setup documentation
- Service account setup instructions
- Google OAuth setup instructions
- Spreadsheet header initialization instructions
- Vercel deployment instructions
- README
- Clear guidance for adding official events and committee members

## Final Goal

Deliver a polished and genuinely functional internal workspace for the NESCO 2027 Web Development Committee.

The application must support collaborative task management, committee activities, live Google Sheets-backed CRUD operations, public calendar subscriptions, and a unified Feedback Center.

The final interface should express a distinctive Forest Green, Sage, and Mint visual identity.

Prioritize functionality, thoughtful UX, secure data handling, and maintainable architecture over unnecessary decoration.