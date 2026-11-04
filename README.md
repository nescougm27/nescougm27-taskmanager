# NESCO 2027 — Web Development Workspace

A responsive committee workspace built from `PRD.md` and `auth.md`: task boards, shared calendars, activity notes, and an integrated Feedback Center. Forest Green, Sage, and Mint identity with light/dark themes, keyboard search, mobile navigation, accessible dialogs, and self-hosted Inter, Plus Jakarta Sans, and JetBrains Mono fonts.

## Run locally

Requires Node.js 22+ and pnpm 10.

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000/dashboard. With `DEMO_MODE=true`, sample records run **in memory in the current browser session**. Task, event, activity, and member changes reset on reload. Demo feedback supports drafts and a submission preview; final submission is disabled until Google Sheets is connected. No sample records are written to Google, and the public ICS endpoint never serves samples. Demo mode provides no access to protected APIs or real committee records.

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

Browser interaction tests use `pnpm test:e2e`. Install Chromium first with `pnpm exec playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an installed Chrome/Chromium executable. To use an existing demo server, set `PLAYWRIGHT_BASE_URL` to its URL. These tests intentionally require a demo workspace and never write real committee data.

## Stack and structure

Next.js App Router, TypeScript, Tailwind CSS 4, shadcn-style Radix UI primitives, Lucide, TanStack Query, React Hook Form, Zod, date-fns, Recharts, Auth.js / NextAuth 5, and Google Sheets API v4. No database server or database adapter is required. Auth.js 5 currently uses a beta package version, pinned in the lockfile.

```text
src/app/(workspace)/        Protected pages and shared layout
src/app/login/              Google-only sign-in
src/app/api/                Protected REST handlers and public ICS feed
src/auth.ts                 Auth.js Google provider and JWT sessions
src/components/             Workspace, views, forms, dialogs
src/components/ui/          Reusable button and accessible dialog primitives
src/lib/schema.ts           Zod schemas and spreadsheet headers
src/lib/permissions.ts      Shared assignment and role policy
src/lib/server/             Server-only Sheets, membership, auth, API handling
src/lib/ics.ts              RFC 5545 calendar generation
scripts/init-sheets.ts      Non-destructive worksheet initialization
tests/                      Validation, permission, and calendar tests
```

All real project data lives in **one Google Spreadsheet**. The browser talks only to Next.js Route Handlers. Google service account credentials never enter the client bundle. Browser storage is limited to theme/view preferences and unfinished feedback drafts.

## 1. Google Sheets and service account

1. Create or select a project in [Google Cloud Console](https://console.cloud.google.com/).
2. Enable **Google Sheets API** under APIs & Services → Library.
3. Under IAM & Admin → Service Accounts, create a service account. It does not need broad project administrator permissions.
4. Create a JSON key for that service account. Store it securely; never commit it.
5. Create one spreadsheet called **NESCO 2027 — Workspace Database**.
6. Share that spreadsheet with the service account’s `client_email` as **Editor**. Keep direct spreadsheet access limited to administrators: Sheets permissions are broader than the application’s roles.
7. Put the following values in `.env.local`:

```dotenv
GOOGLE_SPREADSHEET_ID=the_id_between_d_and_edit_in_the_sheet_url
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
BOOTSTRAP_ADMIN_EMAIL=your-exact-google-account-email
BOOTSTRAP_ADMIN_NAME=Your Name
```

Use `private_key` from the JSON key. Escaped `\n` sequences and actual newlines are supported. Never use `NEXT_PUBLIC_` for these variables.

## 2. Initialize the worksheets

```sh
pnpm sheets:init
```

This creates missing tabs, writes headers only into empty first rows, and preserves existing data. It stops if an existing header differs. It bootstraps the first active administrator only when no active administrator exists. After initialization, remove the two `BOOTSTRAP_ADMIN_*` variables if desired.

The seven tabs and exact column order are:

**Tasks**

```text
id, title, description, category, assignee, priority, status, start_date, due_date, module, subtasks_json, notes, reference_url, created_at, updated_at
```

**Events**

```text
id, title, description, start_datetime, end_datetime, category, location, responsible, visibility, created_at, updated_at
```

**Activities**

```text
id, title, type, date, description, related_tasks_json, responsible, notes, decisions, follow_ups_json, references_json, created_at, updated_at
```

**Feedback**

```text
id, type, submitter, division, title, module, slug, description, problem, expected_behavior, priority, status, rating_design, rating_ux, rating_responsiveness, rating_performance, rating_functionality, rating_reliability, strengths, weaknesses, recommendations, reference_url, extra_json, created_at, updated_at
```

**WWCParticipants**

```text
id, title, email, division, responsible, status, notes, answers_json, created_at, updated_at
```

**WWCQuestions**

```text
id, title, category, responsible, created_at, updated_at
```

**Members** (added by `auth.md`)

```text
id, name, email, role, status, joined_at
```

Feedback types are `evaluation`, `feature_request`, and `page_request`. Member roles are `admin`, `member`, `viewer`; status is `active` or `suspended`. UUIDs identify records; row positions never serve as record IDs. JSON columns store arrays or objects. Additional evaluation answers, proposed features, page sections, audience, required features, and shared additional notes live in `extra_json`.

## 3. Google OAuth and Auth.js

1. Configure the OAuth consent screen in the same Google Cloud project. For an external application still in testing, add committee Google accounts as test users.
2. Create an OAuth client ID with application type **Web application**.
3. Add the JavaScript origin `http://localhost:3000`.
4. Add this exact authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

5. Fill in the server environment:

```dotenv
APP_URL=http://localhost:3000
AUTH_URL=http://localhost:3000
AUTH_SECRET=at-least-32-characters-of-random-secret
GOOGLE_CLIENT_ID=your-oauth-client-id
GOOGLE_CLIENT_SECRET=your-oauth-client-secret
DEMO_MODE=false
```

Generate a strong secret with `openssl rand -base64 48`. Restart the dev server. Visit `/login` and continue with Google. A successful login redirects to `/dashboard`.

Auth.js uses encrypted, database-free JWT sessions with an eight-hour maximum age, server-managed HTTP-only cookies, secure cookies on HTTPS, and PKCE/state/nonce checks. The Google provider validates the identity; the sign-in callback additionally requires `email_verified === true` and an exact active email match in Members. Domains, form names, and client-provided role values never grant access. No password registration or public account creation exists.

Every protected REST request invokes Auth.js and reads Members again with caching disabled. Suspended, removed, or ambiguously duplicated member entries lose access on the next protected request even if an old JWT remains. If Google Sheets cannot verify membership, access fails closed. The client session endpoint also revalidates membership. A page already loaded may retain previously downloaded content until refresh; revocation prevents subsequent API access.

### Permissions

| Action                                           | Admin             | Member                | Viewer |
| ------------------------------------------------ | ----------------- | --------------------- | ------ |
| Read tasks, events, activities, shared requests  | Yes               | Yes                   | Yes    |
| Create task/event/activity assigned to own email | Yes, any assignee | Yes                   | No     |
| Update task/event/activity                       | All               | Assigned records only | No     |
| Submit feedback or requests                      | Yes               | Yes                   | No     |
| Read private evaluations                         | Yes               | No                    | No     |
| Change request review status                     | Yes               | No                    | No     |
| Delete shared records                            | Yes               | No                    | No     |
| Manage member roles and access                   | Yes               | No                    | No     |

Task `assignee` is the assigned member’s **exact Google email**. For events and activities, `responsible` contains one or more comma-separated Google emails. Member updates must retain the member’s own assignment; only an admin can move work entirely to someone else. An admin cannot remove, suspend, or demote their own account, protecting against accidental lockout.

### Add official committee members

Sign in as admin → profile dropdown or sidebar settings → **Manage members**. Add the person’s exact Google email, name, role, and `active` status. This is the source of truth, not an environment email/domain allowlist. You can also add valid rows directly in Members, using a new UUID and ISO `joined_at` timestamp. Only trusted administrators should have direct spreadsheet editing permissions.

## Wawancara (WWC)

Open **Wawancara (WWC)** in the sidebar (`/wwc`) to manage interview candidates independently of committee login accounts. Add candidates with their name, optional email and preferred division, interviewer email, and interview status. Open **Detail & jawaban** to record answers and interviewer notes; partial answers can be saved and continued later.

The **Bank pertanyaan** tab supports adding and editing questions with custom categories. **Tambahkan pertanyaan awal** adds six Indonesian prompts covering introductions, motivation, division fit, teamwork, time commitment, and problem solving. Existing starter questions are skipped. In demo mode the six questions are available immediately, and all changes reset on reload.

Saved answers keep a snapshot of the original question wording, including after a question is edited or deleted from the bank. New questions appear the next time a candidate is opened. Clearing an answer removes its saved snapshot. Candidate and question records use the same version checks and Google Sheets persistence as tasks.

Admins can edit and delete all WWC records and assign an interviewer/owner by exact member email. Members can add records and edit those assigned to their own verified email; viewers can read only. All active committee members can view the candidate list, questions, notes, and answers. Candidates do not receive workspace access by being added here.

**Existing installations:** run `pnpm sheets:init` once before opening WWC with real data. It adds `WWCParticipants` and `WWCQuestions` and preserves existing worksheet data. Existing workspace pages do not request WWC worksheets until `/wwc` is opened. Real persistence requires configured Google Sheets; demo changes are stored only in memory.

WWC endpoints are `GET/POST /api/wwc-participants`, `GET/PATCH/DELETE /api/wwc-participants/[id]`, and the equivalent `/api/wwc-questions` routes. All require an active committee session.

## 4. Official events and calendar subscriptions

Create events in Calendar. Enter start/end times in **Asia/Jakarta (WIB, UTC+7)**. Mark an event **Public** only when it belongs in the public calendar; keep internal meetings Internal. The server exposes `/api/calendar.ics` without authentication, containing only public rows from Events.

ICS uses stable UUID-based UIDs, UTC DTSTART/DTEND converted from the stored offsets, DTSTAMP, LAST-MODIFIED, proper escaping, UTF-8 line folding at 75 octets, and CRLF endings. The calendar identifies Asia/Jakarta. Responses are `text/calendar; charset=utf-8`, with a five-minute shared cache and stale revalidation.

- **Google Calendar:** Other calendars → + → From URL → paste `https://your-domain/api/calendar.ics`.
- **Apple Calendar:** File → New Calendar Subscription → paste the same URL, or use the webcal subscription link in the UI.
- **Download .ics:** imports a one-time snapshot. It is not a subscription.

Future spreadsheet edits appear when the provider refreshes its URL subscription. The application cannot force Google or Apple’s refresh frequency. The feed returns an actionable 503 if Sheets is unavailable; it never silently substitutes sample data.

## 5. REST API

`GET/POST /api/{tasks,events,activities,feedback}` and `GET/PATCH/DELETE /api/{resource}/[id]` require a valid active-member session. Members management uses `GET/POST /api/members` and `GET/PATCH/DELETE /api/members/[id]` and requires admin. `/api/auth/[...nextauth]` is handled by Auth.js. The public calendar is the only data endpoint that omits committee authentication.

Collection GET accepts `limit` (1–5000, default 500) and `offset`. The UI loads up to 5000 rows per worksheet. Invalid headers or a larger worksheet produce a clear error rather than silently truncating dashboard totals. Archive rows before exceeding this limit.

POST accepts a stable client-generated `id` UUID for idempotent retries. PATCH/DELETE require `if_unmodified_since` matching `updated_at`; stale writes receive 409 and must be reopened/refreshed before retry. Members use a content-derived `version` because their required schema has no updated timestamp. Server mutation validation uses Zod. Requests from another origin are rejected. Writes use `RAW` to avoid spreadsheet formula execution. Transient read failures have bounded backoff; uncertain appends are not blindly retried. Safe UI mutations are optimistic and roll back on failures.

**Concurrency limit:** Google Sheets has no atomic compare-and-swap or transactions. Updates use a fresh UUID lookup/version check plus an in-process lock. This detects ordinary stale edits and serializes writes inside one instance, but simultaneous writes across Vercel instances or direct spreadsheet edits can still race. Avoid editing/sorting rows manually while mutations are running; retain worksheet backups. A strict distributed transaction guarantee would require infrastructure outside this PRD’s Sheets-only architecture.

## 6. Deploy to Vercel

1. Push the source to your Git host and import it into Vercel as a Next.js project.
2. Select Node.js 22+, install with `pnpm install --frozen-lockfile`, and build with `pnpm build`.
3. Set `APP_URL` and `AUTH_URL` to the same canonical HTTPS production URL. Set `AUTH_SECRET`, Google OAuth credentials, and all Google Sheets credentials as server environment variables. Set **`DEMO_MODE=false`**.
4. Add `https://your-domain/api/auth/callback/google` as an authorized Google OAuth redirect URI and the domain as an authorized origin.
5. Initialize Sheets from a trusted local machine and verify the first admin is active in Members.
6. Deploy, sign in, verify a real task save, and test the public ICS feed.

For preview domains, configure a dedicated OAuth client/callback and matching environment URLs if sign-in is needed. Avoid pointing preview environments at production Sheets when testing mutations. No separate database, background worker, or Supabase/Firebase account is needed.

## Verification boundaries

Automated tests cover validation, task assignment/role rules, member matching, and calendar privacy/time/escaping behavior. Local preview can be exercised without Google credentials. Real OAuth callbacks, real spreadsheet writes, and production subscription refresh require your own configured Google project and have to be verified after configuration. Successful submissions are displayed only after the real API confirms persistence.
