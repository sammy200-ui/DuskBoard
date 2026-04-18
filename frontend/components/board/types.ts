export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'CODE_REVIEW' | 'QA' | 'DONE' | 'BLOCKED';

export type TaskType = 'STORY' | 'BUG' | 'TASK';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type BoardTask = {
  id: string;
  projectId: string;
  sprintId: string | null;
  assigneeId: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
};

export type TaskTransitionLookup = Record<string, TaskStatus[]>;
