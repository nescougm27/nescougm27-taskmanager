import 'server-only';
import { importPKCS8, SignJWT } from 'jose';
import { AppError } from '../errors';
import { sheetHeaders, sheets, type Resource, type WorkspaceRecord } from '../schema';
import { sheetsConfigured } from './config';
let accessToken: { value: string; expires: number } | null = null;
async function token() {
  if (accessToken && accessToken.expires > Date.now() + 60000) return accessToken.value;
  if (!sheetsConfigured())
    throw new AppError(
      503,
      'Google Sheets is not configured. Ask an administrator to complete the environment setup.',
    );
  const key = await importPKCS8(process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'), 'RS256');
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/spreadsheets' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    throw new AppError(
      503,
      'Google authentication failed. Check the service account configuration.',
    );
  const data = await response.json();
  accessToken = { value: data.access_token, expires: Date.now() + Number(data.expires_in) * 1000 };
  return accessToken.value;
}
export async function sheetsRequest(path: string, init: RequestInit = {}) {
  const auth = await token();
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(process.env.GOOGLE_SPREADSHEET_ID!)}${path}`,
      {
        ...init,
        headers: {
          Authorization: `Bearer ${auth}`,
          'Content-Type': 'application/json',
          ...init.headers,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(20000),
      },
    );
    if (response.ok) return response.status === 204 ? {} : response.json();
    // Retry reads only; retrying an append after an uncertain response can duplicate a record.
    if (
      (!init.method || init.method === 'GET') &&
      (response.status === 429 || response.status >= 500) &&
      attempt < 2
    ) {
      await new Promise((r) => setTimeout(r, 400 * 2 ** attempt + Math.random() * 200));
      continue;
    }
    if (response.status === 429)
      throw new AppError(429, 'Google Sheets is busy. Wait a moment, then retry your change.');
    if (response.status === 401) accessToken = null;
    throw new AppError(
      503,
      'Unable to access Google Sheets. Check spreadsheet sharing and worksheet headers, then retry.',
    );
  }
  throw new AppError(503, 'Google Sheets could not be reached.');
}
type SheetRow = { row: number; record: WorkspaceRecord };
export async function readRows(resource: Resource | 'members'): Promise<SheetRow[]> {
  const data = await sheetsRequest(
    `/values/${encodeURIComponent(`${sheets[resource]}!A1:AZ5002`)}`,
  );
  const rows: string[][] = data.values || [];
  const expected = sheetHeaders[resource];
  if (!rows[0] || expected.some((v, i) => rows[0][i] !== v))
    throw new AppError(
      503,
      `${sheets[resource]} headers do not match. Run pnpm sheets:init to initialize missing worksheets safely.`,
    );
  if (rows.length > 5001)
    throw new AppError(
      503,
      'This worksheet exceeds the 5,000-row workspace limit. Archive old rows before continuing.',
    );
  return rows
    .slice(1)
    .flatMap((values, i) =>
      values[0]
        ? [
            {
              row: i + 2,
              record: Object.fromEntries(
                expected.map((h, j) => [h, String(values[j] ?? '')]),
              ) as WorkspaceRecord,
            },
          ]
        : [],
    );
}
export async function listRecords(resource: Resource | 'members') {
  return (await readRows(resource)).map((r) => r.record);
}
const locks = new Map<string, Promise<unknown>>();
export async function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = locks.get(key) || Promise.resolve();
  const run = previous.catch(() => {}).then(fn);
  locks.set(key, run);
  try {
    return await run;
  } finally {
    if (locks.get(key) === run) locks.delete(key);
  }
}
export async function createRecord(resource: Resource, record: WorkspaceRecord) {
  return withLock(resource, async () => {
    const existing = (await readRows(resource)).find((r) => r.record.id === record.id);
    if (existing) {
      if (
        sheetHeaders[resource].some(
          (k) =>
            !['created_at', 'updated_at'].includes(k) &&
            (existing.record[k] || '') !== (record[k] || ''),
        )
      )
        throw new AppError(
          409,
          'This submission ID already belongs to a different record. Refresh before creating another record.',
        );
      return existing.record;
    }
    await sheetsRequest(
      `/values/${encodeURIComponent(`${sheets[resource]}!A:AZ`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        body: JSON.stringify({ values: [sheetHeaders[resource].map((h) => record[h] || '')] }),
      },
    );
    return record;
  });
}
export async function updateRecord(
  resource: Resource,
  id: string,
  expectedVersion: string,
  update: Record<string, string> | null,
) {
  return withLock(resource, async () => {
    const item = (await readRows(resource)).find((r) => r.record.id === id);
    if (!item) throw new AppError(404, 'This record no longer exists.');
    if (item.record.updated_at !== expectedVersion)
      throw new AppError(
        409,
        'Someone updated this record while you were editing. Close this editor, refresh, and apply your changes again.',
      );
    const range = encodeURIComponent(`${sheets[resource]}!A${item.row}:AZ${item.row}`);
    // Clear the row instead of shifting other records; UUIDs remain the identity.
    if (!update) {
      await sheetsRequest(`/values/${range}:clear`, { method: 'POST', body: '{}' });
      return item.record;
    }
    const updated: WorkspaceRecord = {
      ...item.record,
      ...update,
      id,
      updated_at: new Date().toISOString(),
    };
    await sheetsRequest(`/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      body: JSON.stringify({ values: [sheetHeaders[resource].map((h) => updated[h] || '')] }),
    });
    return updated;
  });
}
