import 'server-only';
import { createHash } from 'node:crypto';
import { memberSchema, sheetHeaders, type MemberRecord, type SessionUser } from '../schema';
import { listRecords, readRows, sheetsRequest, withLock } from './sheets';
import { AppError } from '../errors';
import { findActiveMembership } from '../permissions';
const version = (row: Record<string, string>) =>
  createHash('sha256')
    .update(JSON.stringify(sheetHeaders.members.map((k) => row[k] || '')))
    .digest('hex');
export async function listMembers(): Promise<MemberRecord[]> {
  const rows = await listRecords('members');
  return rows.flatMap((row) => {
    const result = memberSchema.safeParse(row);
    return result.success
      ? [{ ...result.data, id: row.id, joined_at: row.joined_at, version: version(row) }]
      : [];
  });
}
export async function activeMember(email: string) {
  return findActiveMembership(await listMembers(), email);
}
export async function createMember(data: ReturnType<typeof memberSchema.parse>) {
  return withLock('members', async () => {
    if ((await listMembers()).some((m) => m.email === data.email))
      throw new AppError(409, 'This email is already listed in Members.');
    const row = { ...data, id: crypto.randomUUID(), joined_at: new Date().toISOString() };
    await sheetsRequest(
      '/values/Members!A:F:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',
      {
        method: 'POST',
        body: JSON.stringify({
          values: [sheetHeaders.members.map((k) => row[k as keyof typeof row])],
        }),
      },
    );
    return { ...row, version: version(row) };
  });
}
export async function changeMember(
  id: string,
  expectedVersion: string,
  update: ReturnType<typeof memberSchema.parse> | null,
  user: SessionUser,
) {
  return withLock('members', async () => {
    const rows = await readRows('members');
    const current = rows.find((r) => r.record.id === id);
    if (!current) throw new AppError(404, 'Member not found.');
    if (version(current.record) !== expectedVersion)
      throw new AppError(
        409,
        'This member was changed by another administrator. Reload the member directory.',
      );
    if (
      current.record.email === user.email &&
      (!update || update.role !== 'admin' || update.status !== 'active')
    )
      throw new AppError(
        400,
        'Keep your own administrator account active. Ask another administrator to change it.',
      );
    if (
      update &&
      rows.some((r) => r.record.id !== id && r.record.email.toLowerCase() === update.email)
    )
      throw new AppError(409, 'This email is already listed in Members.');
    const range = encodeURIComponent(`Members!A${current.row}:F${current.row}`);
    if (!update) {
      await sheetsRequest(`/values/${range}:clear`, { method: 'POST', body: '{}' });
      return null;
    }
    const row: Record<string, string> = { ...current.record, ...update, id };
    await sheetsRequest(`/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      body: JSON.stringify({ values: [sheetHeaders.members.map((k) => row[k])] }),
    });
    return { ...row, version: version(row) };
  });
}
