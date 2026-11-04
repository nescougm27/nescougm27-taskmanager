import { importPKCS8, SignJWT } from 'jose';
import { sheetHeaders, sheets } from '../src/lib/schema';

async function main() {
  const {
    GOOGLE_SPREADSHEET_ID: id,
    GOOGLE_SERVICE_ACCOUNT_EMAIL: email,
    GOOGLE_PRIVATE_KEY: key,
  } = process.env;
  if (!id || !email || !key)
    throw Error(
      'Set GOOGLE_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in .env.local.',
    );
  const privateKey = await importPKCS8(key.replace(/\\n/g, '\n'), 'RS256');
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/spreadsheets' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);
  const auth = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!auth.ok) throw Error('Service account authentication failed. Check the server credentials.');
  const { access_token: accessToken } = await auth.json();
  async function request(path: string, init: RequestInit = {}) {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok)
      throw Error(
        `Google Sheets returned ${response.status}. Check the spreadsheet ID, sharing permissions, and API activation.`,
      );
    return response.json();
  }
  const metadata = await request('?fields=sheets.properties');
  const existing = new Set(
    metadata.sheets.map((s: { properties: { title: string } }) => s.properties.title),
  );
  const missing = Object.values(sheets).filter((title) => !existing.has(title));
  if (missing.length)
    await request(':batchUpdate', {
      method: 'POST',
      body: JSON.stringify({
        requests: missing.map((title) => ({
          addSheet: {
            properties: {
              title,
              gridProperties: { rowCount: 5002, columnCount: 52, frozenRowCount: 1 },
            },
          },
        })),
      }),
    });
  const expansions = metadata.sheets
    .filter(
      (s: {
        properties: { title: string; gridProperties: { rowCount: number; columnCount: number } };
      }) =>
        Object.values(sheets).includes(
          s.properties.title as (typeof sheets)[keyof typeof sheets],
        ) &&
        (s.properties.gridProperties.rowCount < 5002 ||
          s.properties.gridProperties.columnCount < 52),
    )
    .map(
      (s: {
        properties: { sheetId: number; gridProperties: { rowCount: number; columnCount: number } };
      }) => ({
        updateSheetProperties: {
          properties: {
            sheetId: s.properties.sheetId,
            gridProperties: {
              rowCount: Math.max(5002, s.properties.gridProperties.rowCount),
              columnCount: Math.max(52, s.properties.gridProperties.columnCount),
            },
          },
          fields: 'gridProperties.rowCount,gridProperties.columnCount',
        },
      }),
    );
  if (expansions.length)
    await request(':batchUpdate', {
      method: 'POST',
      body: JSON.stringify({ requests: expansions }),
    });
  for (const resource of Object.keys(sheets) as (keyof typeof sheets)[]) {
    const title = sheets[resource];
    const headers = sheetHeaders[resource];
    const range = encodeURIComponent(`${title}!A1:AZ1`);
    const current = await request(`/values/${range}`);
    const values = current.values?.[0] || [];
    if (values.length && headers.some((header, i) => values[i] !== header))
      throw Error(
        `${title} contains different headers. Existing data was preserved; reconcile the columns manually before rerunning.`,
      );
    if (!values.length)
      await request(`/values/${range}?valueInputOption=RAW`, {
        method: 'PUT',
        body: JSON.stringify({ values: [headers] }),
      });
    console.log(`${title}: headers ready.`);
  }
  const memberRows = await request('/values/Members!A2:F5001');
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const adminName = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  if (
    !(memberRows.values || []).some((row: string[]) => row[3] === 'admin' && row[4] === 'active')
  ) {
    if (!adminEmail || !adminName)
      throw Error(
        'No active admin exists. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_NAME, then rerun. All existing worksheet data was preserved.',
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail))
      throw Error('BOOTSTRAP_ADMIN_EMAIL must be a full Google account email.');
    if ((memberRows.values || []).some((row: string[]) => row[2]?.toLowerCase() === adminEmail))
      throw Error(
        'The bootstrap email already exists. Update its role to admin and status to active directly in Members.',
      );
    await request('/values/Members!A:F:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS', {
      method: 'POST',
      body: JSON.stringify({
        values: [
          [crypto.randomUUID(), adminName, adminEmail, 'admin', 'active', new Date().toISOString()],
        ],
      }),
    });
    console.log('First administrator initialized.');
  }
  console.log(
    'Workspace ready. Set DEMO_MODE=false, restart, and sign in with an active member’s Google account.',
  );
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Initialization failed.');
  process.exitCode = 1;
});
