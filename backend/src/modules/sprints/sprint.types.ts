import { Priority, SprintStatus, TaskStatus, TaskType } from '@prisma/client';

export type CreateSprintInput = {
  name: string;
  goal?: string;
  startDate?: string | Date;
  endDate?: string | Date;
};

export type UpdateSprintInput = {
  name?: string;
  goal?: string;
  startDate?: string | Date;
  endDate?: string | Date;
};

export type SprintView = {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: Date | null;
  endDate: Date | null;
};

export type SprintCompletionResult = {
  sprint: SprintView;
  movedTasks: number;
  destinationSprintId: string | null;
};

export type SprintTaskView = {
  id: string;
  projectId: string;
  sprintId: string | null;
  assigneeId: string | null;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
};