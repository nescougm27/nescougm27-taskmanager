import type { SessionUser, MemberRecord } from './schema';
export function memberCanEdit(user: SessionUser, record: Record<string, string>, resource: string) {
  if (user.role === 'admin') return true;
  if (user.role === 'viewer') return false;
  const fields =
    resource === 'tasks' ? [record.assignee] : [...(record.responsible || '').split(',')];
  return fields.some((value) => value?.trim().toLowerCase() === user.email.toLowerCase());
}
export function findActiveMembership(members: MemberRecord[], email: string) {
  const matches = members.filter((m) => m.email.toLowerCase() === email.toLowerCase());
  return matches.length === 1 && matches[0].status === 'active' ? matches[0] : null;
}
export function verifiedGoogleEmail(
  provider: string | undefined,
  profile: Record<string, unknown> | undefined,
) {
  return provider === 'google' &&
    profile?.email_verified === true &&
    typeof profile.email === 'string'
    ? profile.email.toLowerCase()
    : null;
}
