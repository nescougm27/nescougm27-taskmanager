import type { WorkspaceRecord } from './schema';
export function escapeICS(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}
export function foldLine(line: string) {
  const lines: string[] = [];
  let current = '';
  for (const ch of line) {
    if (new TextEncoder().encode(current + ch).length > 75) {
      lines.push(current);
      current = ' ' + ch;
    } else current += ch;
  }
  lines.push(current);
  return lines.join('\r\n');
}
const utc = (date: string) =>
  new Date(date)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
export function generateICS(events: WorkspaceRecord[], now = new Date()) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NESCO 2027//Web Development Workspace//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:NESCO 2027',
    'X-WR-TIMEZONE:Asia/Jakarta',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];
  for (const e of events.filter((e) => e.visibility === 'Public')) {
    if (
      !Number.isFinite(Date.parse(e.start_datetime)) ||
      !Number.isFinite(Date.parse(e.end_datetime))
    )
      continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeICS(e.id)}@nesco-workspace`,
      `DTSTAMP:${utc(now.toISOString())}`,
      `DTSTART:${utc(e.start_datetime)}`,
      `DTEND:${utc(e.end_datetime)}`,
      `LAST-MODIFIED:${utc(e.updated_at)}`,
      `SUMMARY:${escapeICS(e.title)}`,
      `DESCRIPTION:${escapeICS(e.description || '')}`,
      `LOCATION:${escapeICS(e.location || '')}`,
      `CATEGORIES:${escapeICS(e.category || '')}`,
      'STATUS:CONFIRMED',
      'TRANSP:OPAQUE',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
