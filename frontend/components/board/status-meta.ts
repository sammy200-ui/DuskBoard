import { Priority, TaskStatus, TaskType } from './types';

export const STATUS_ORDER: TaskStatus[] = [
  'OPEN',
  'IN_PROGRESS',
  'CODE_REVIEW',
  'QA',
  'DONE',
  'BLOCKED',
];

export const statusLabelMap: Record<TaskStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  CODE_REVIEW: 'Code Review',
  QA: 'QA',
  DONE: 'Done',
  BLOCKED: 'Blocked',
};

export const statusToneMap: Record<TaskStatus, string> = {
  OPEN: 'border-zinc-300/30 text-zinc-200 bg-zinc-300/10',
  IN_PROGRESS: 'border-sky-300/40 text-sky-200 bg-sky-300/10',
  CODE_REVIEW: 'border-cyan-300/40 text-cyan-200 bg-cyan-300/10',
  QA: 'border-amber-300/40 text-amber-200 bg-amber-300/10',
  DONE: 'border-emerald-300/40 text-emerald-200 bg-emerald-300/10',
  BLOCKED: 'border-rose-300/40 text-rose-200 bg-rose-300/10',
};

export const typeToneMap: Record<TaskType, string> = {
  STORY: 'border-violet-300/40 bg-violet-300/10 text-violet-200',
  BUG: 'border-rose-300/40 bg-rose-300/10 text-rose-200',
  TASK: 'border-zinc-300/35 bg-zinc-300/10 text-zinc-200',
};

export const priorityDotMap: Record<Priority, string> = {
  LOW: 'bg-teal-300',
  MEDIUM: 'bg-sky-300',
  HIGH: 'bg-amber-300',
  CRITICAL: 'bg-rose-300',
};

export const toInitials = (name: string): string => {
  const chunks = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (chunks.length === 0) {
    return '--';
  }

  return chunks.map((chunk) => chunk[0]?.toUpperCase() ?? '').join('');
};
