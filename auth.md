## Authentication & Authorization — NESCO 2027

Add a secure Google OAuth authentication system to the existing Next.js workspace.

Use Auth.js (NextAuth) with the Google provider, database-free JWT sessions, and server-side role-based authorization.

### Login Experience

- Create a dedicated `/login` page.
- Use the Forest Green, Sage, and Mint design system.
- Display NESCO 2027 branding.
- Provide a "Continue with Google" button.
- No email/password registration.
- No public account creation.
- Add a logout option and user profile dropdown.

### User Management

Add a `Members` worksheet to the existing Google Spreadsheet.

Columns:
id, name, email, role, status, joined_at

Supported roles:

- admin
- member
- viewer

Only allow Google accounts whose verified email addresses match active entries in the Members worksheet.

Do not authorize access based solely on the email domain or user-supplied email strings.

### Permissions

- Admin: full CRUD, member management, and feedback review.
- Member: create/update assigned tasks, manage permitted activities, submit feedback and requests.
- Viewer: read-only access to authorized workspace content.

Only admins may change member roles, delete shared records, and approve or reject requests.

### Security

- Verify authentication and authorization in every protected Route Handler.
- Validate Google OAuth identity and verified email.
- Use secure server-managed sessions.
- Keep Google credentials and session secrets server-side.
- Do not rely on client-side route hiding for security.
- Prevent suspended or removed members from continuing to use protected APIs.
- Never expose service account private keys.
- Handle unauthorized access using proper HTTP responses.

### UX

- Redirect unauthenticated users to `/login`.
- After login, redirect to `/dashboard`.
- Provide clear unauthorized-account messages.
- Display the logged-in user's avatar, name, and role in the sidebar.
- Support logout.
- Maintain the existing responsive green visual design.

Keep the solution compatible with Vercel and Google Sheets without adding another database.
