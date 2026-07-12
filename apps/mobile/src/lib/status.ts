import type { Status } from '@/types';

export const statusOrder: Status[] = ['todo', 'doing', 'done', 'wontdo'];

export const statusMeta: Record<
  Status,
  { label: string; shortLabel: string; symbol: string; colour: string; background: string }
> = {
  todo: {
    label: 'To do',
    shortLabel: 'To do',
    symbol: '○',
    colour: '#64748B',
    background: '#F1F5F9',
  },
  doing: {
    label: 'Doing',
    shortLabel: 'Doing',
    symbol: '◐',
    colour: '#2563EB',
    background: '#DBEAFE',
  },
  done: {
    label: 'Done',
    shortLabel: 'Done',
    symbol: '✓',
    colour: '#059669',
    background: '#D1FAE5',
  },
  wontdo: {
    label: "Won't do",
    shortLabel: 'Skipped',
    symbol: '×',
    colour: '#DC2626',
    background: '#FEE2E2',
  },
};

export function cycleStatus(status: Status): Status {
  const index = statusOrder.indexOf(status);
  return statusOrder[(index + 1) % statusOrder.length];
}
