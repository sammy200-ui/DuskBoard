import { Priority, TaskStatus, TaskType } from '@prisma/client';

export type CreateTaskInput = {
  title: string;
  description?: string;
  type?: TaskType;
  priority?: Priority;
  assigneeId?: string;
  sprintId?: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: Priority;
  sprintId?: string | null;
};

export type UpdateTaskStatusInput = {
  status: TaskStatus;
};

export type AssignTaskInput = {
  assigneeId: string | null;
};

export type TaskView = {
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

export type TaskAuditLogView = {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  metadata: unknown;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    email: string;
  };
};
