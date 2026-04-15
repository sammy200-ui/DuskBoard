import { ProjectRole } from '@prisma/client';

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
};

export type AddMemberInput = {
  userId: string;
  role: ProjectRole;
};

export type UpdateMemberRoleInput = {
  role: ProjectRole;
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  myRole: ProjectRole;
};

export type ProjectMemberView = {
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
};