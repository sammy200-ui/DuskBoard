import { Prisma, ProjectRole } from '@prisma/client';
import { z } from 'zod';
import { AppError, NotFoundError } from '../../shared/errors';
import projectRepository from './project.repository';
import {
  AddMemberInput,
  CreateProjectInput,
  ProjectMemberView,
  ProjectSummary,
  UpdateMemberRoleInput,
  UpdateProjectInput,
} from './project.types';

const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .refine((payload) => payload.name !== undefined || payload.description !== undefined, {
    message: 'At least one field is required',
    path: ['name'],
  });

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(ProjectRole),
});

const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(ProjectRole),
});

class ProjectService {
  async listProjects(userId: string): Promise<ProjectSummary[]> {
    const memberships = await projectRepository.listForUser(userId);
    return memberships.map(({ project, role }) => this.toProjectSummary(project, role));
  }

  async createProject(userId: string, input: CreateProjectInput): Promise<ProjectSummary> {
    const payload = this.parseOrThrow(createProjectSchema, input);

    const project = await projectRepository.createProjectForOwner(userId, {
      name: payload.name,
      description: payload.description,
    });

    return this.toProjectSummary(project, ProjectRole.ADMIN);
  }

  async getProject(userId: string, projectId: string): Promise<ProjectSummary> {
    const membership = await projectRepository.findProjectForUser(projectId, userId);
    if (!membership) {
      throw new NotFoundError('Project');
    }

    return this.toProjectSummary(membership.project, membership.role);
  }

  async updateProject(projectId: string, input: UpdateProjectInput): Promise<ProjectSummary> {
    const payload = this.parseOrThrow(updateProjectSchema, input);

    const existing = await projectRepository.findProjectById(projectId);
    if (!existing) {
      throw new NotFoundError('Project');
    }

    const updated = await projectRepository.updateProjectById(projectId, {
      name: payload.name,
      description: payload.description,
    });

    return this.toProjectSummary(updated, ProjectRole.ADMIN);
  }

  async deleteProject(projectId: string): Promise<void> {
    const existing = await projectRepository.findProjectById(projectId);
    if (!existing) {
      throw new NotFoundError('Project');
    }

    try {
      await projectRepository.deleteProjectById(projectId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new AppError('Project has related records and cannot be deleted yet', 409);
      }

      throw error;
    }
  }

  async listProjectMembers(userId: string, projectId: string): Promise<ProjectMemberView[]> {
    await this.ensureMember(userId, projectId);

    const members = await projectRepository.listMembers(projectId);
    return members.map((member) => ({
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
    }));
  }

  async addProjectMember(userId: string, projectId: string, input: AddMemberInput): Promise<ProjectMemberView> {
    await this.ensureMember(userId, projectId);
    const payload = this.parseOrThrow(addMemberSchema, input);

    const user = await projectRepository.findUserById(payload.userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const existingMember = await projectRepository.findMembership(payload.userId, projectId);
    if (existingMember) {
      throw new AppError('User is already a project member', 409);
    }

    const member = await projectRepository.addMember(projectId, payload.userId, payload.role);
    return {
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role,
    };
  }

  async updateProjectMemberRole(
    userId: string,
    projectId: string,
    targetUserId: string,
    input: UpdateMemberRoleInput,
  ): Promise<ProjectMemberView> {
    await this.ensureMember(userId, projectId);
    const payload = this.parseOrThrow(updateMemberRoleSchema, input);

    const member = await projectRepository.findMembership(targetUserId, projectId);
    if (!member) {
      throw new NotFoundError('Project member');
    }

    if (member.role === ProjectRole.ADMIN && payload.role !== ProjectRole.ADMIN) {
      const adminCount = await projectRepository.countMembersByRole(projectId, ProjectRole.ADMIN);
      if (adminCount <= 1) {
        throw new AppError('Project must have at least one admin', 400);
      }
    }

    const updated = await projectRepository.updateMemberRole(projectId, targetUserId, payload.role);
    return {
      userId: updated.user.id,
      name: updated.user.name,
      email: updated.user.email,
      role: updated.role,
    };
  }

  async removeProjectMember(userId: string, projectId: string, targetUserId: string): Promise<void> {
    await this.ensureMember(userId, projectId);

    const member = await projectRepository.findMembership(targetUserId, projectId);
    if (!member) {
      throw new NotFoundError('Project member');
    }

    if (member.role === ProjectRole.ADMIN) {
      const adminCount = await projectRepository.countMembersByRole(projectId, ProjectRole.ADMIN);
      if (adminCount <= 1) {
        throw new AppError('Project must have at least one admin', 400);
      }
    }

    await projectRepository.removeMember(projectId, targetUserId);
  }

  private async ensureMember(userId: string, projectId: string): Promise<void> {
    const membership = await projectRepository.findMembership(userId, projectId);
    if (!membership) {
      throw new AppError('You are not a member of this project', 403);
    }
  }

  private parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input);
    if (!result.success) {
      const issueMessage = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'field'}: ${issue.message}`)
        .join(', ');

      throw new AppError(`Validation failed: ${issueMessage}`, 400);
    }

    return result.data;
  }

  private toProjectSummary(
    project: {
      id: string;
      name: string;
      description: string | null;
      createdAt: Date;
    },
    role: ProjectRole,
  ): ProjectSummary {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      myRole: role,
    };
  }
}

const projectService = new ProjectService();

export default projectService;