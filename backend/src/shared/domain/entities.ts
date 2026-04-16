import { Priority, ProjectRole, SprintStatus, TaskStatus, TaskType } from './enums';

export type UserEntity = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
};

export type ProjectEntity = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

export type ProjectMemberEntity = {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
};

export type SprintEntity = {
  id: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: Date | null;
  endDate: Date | null;
};

export type TaskEntity = {
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

export type AuditLogEntity = {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  metadata: unknown;
  createdAt: Date;
};
