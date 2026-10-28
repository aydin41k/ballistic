import type { Item } from '@/types';

export type Urgency = 'none' | 'overdue' | 'soon' | 'upcoming';

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function fromDateKey(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function formatDateKey(value: string, withYear = false): string {
  return fromDateKey(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: withYear ? 'numeric' : undefined,
  });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeAgo(value: string): string {
  const difference = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(difference / 60_000);
  const hours = Math.floor(difference / 3_600_000);
  const days = Math.floor(difference / 86_400_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDateKey(toDateKey(new Date(value)), true);
}

export function getUrgency(item: Item): Urgency {
  if (!item.due_date || item.status === 'done' || item.status === 'wontdo') return 'none';

  const now = new Date();
  const today = toDateKey(now);
  const due = fromDateKey(item.due_date);
  due.setHours(23, 59, 59, 999);

  if (item.due_date < today) return 'overdue';
  if (due.getTime() <= now.getTime() + 72 * 60 * 60 * 1000) return 'soon';
  return 'upcoming';
}

export function sortByUrgency(items: Item[]): Item[] {
  const ranks: Record<Urgency, number> = { overdue: 1, soon: 2, upcoming: 3, none: 4 };
  return [...items].sort((left, right) => {
    const rankDifference = ranks[getUrgency(left)] - ranks[getUrgency(right)];
    if (rankDifference !== 0) return rankDifference;
    if (left.due_date && right.due_date) return left.due_date.localeCompare(right.due_date);
    if (left.due_date) return -1;
    if (right.due_date) return 1;
    return left.position - right.position;
  });
}
