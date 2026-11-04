import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function displayDate(value: string, pattern = 'MMM d') {
  if (!value) return 'No date';
  try {
    const date = parseISO(value);
    return format(
      value.includes('T')
        ? new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
        : date,
      pattern,
    );
  } catch {
    return 'Invalid date';
  }
}
export function jakartaDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
export function overdue(task: Record<string, string | undefined>, today = jakartaDate()) {
  return !!task.due_date && task.due_date < today && task.status !== 'Done';
}
export function initials(name: string) {
  return (
    name
      .split(/[\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0])
      .join('')
      .toUpperCase() || '—'
  );
}
