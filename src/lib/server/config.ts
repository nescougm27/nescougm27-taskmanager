import 'server-only';
export const sheetsConfigured = () =>
  !!(
    process.env.GOOGLE_SPREADSHEET_ID &&
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY
  );
export const demoMode = () =>
  process.env.DEMO_MODE === 'true' || (!sheetsConfigured() && process.env.DEMO_MODE !== 'false');
export function appOrigin() {
  return new URL(process.env.APP_URL || 'http://localhost:3000').origin;
}
