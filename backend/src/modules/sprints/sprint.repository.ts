import { Prisma, ProjectMember, Sprint, Task } from '@prisma/client';
import prisma from '../../config/prisma';

class SprintRepository {
  async findMembership(userId: string, projectId: string): Promise<ProjectMember | null> {
    return prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });
  }

  async listByProject(projectId: string): Promise<Sprint[]> {
    return prisma.sprint.findMany({
      where: { projectId },
      orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
    });
  }

  async createSprint(data: Prisma.SprintCreateInput): Promise<Sprint> {
    return prisma.sprint.create({
      data,
    });
  }

  async findByIdAndProject(sprintId: string, projectId: string): Promise<Sprint | null> {
    return prisma.sprint.findFirst({
      where: {
        id: sprintId,
        projectId,
      },
    });
  }

  async updateSprintById(sprintId: string, data: Prisma.SprintUpdateInput): Promise<Sprint> {
    return prisma.sprint.update({
      where: { id: sprintId },
      data,
    });
  }

  async findFirstActiveSprint(projectId: string, excludingSprintId: string): Promise<Sprint | null> {
    return prisma.sprint.findFirst({
      where: {
        projectId,
        status: 'ACTIVE',
        id: { not: excludingSprintId },
      },
      orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
    });
  }

  async findFirstPlannedSprint(projectId: string, excludingSprintId: string): Promise<Sprint | null> {
    return prisma.sprint.findFirst({
      where: {
        projectId,
        status: 'PLANNED',
        id: { not: excludingSprintId },
      },
      orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
    });
  }

  async listRolloverTasks(projectId: string, sprintId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: {
        projectId,
        sprintId,
        status: {
          notIn: ['DONE', 'BLOCKED'],
        },
      },
    });
  }

  async listTasksForSprint(projectId: string, sprintId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: {
        projectId,
        sprintId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findTaskByIdAndProject(taskId: string, projectId: string): Promise<Task | null> {
    return prisma.task.findFirst({
      where: {
        id: taskId,
        projectId,
      },
    });
  }

  async updateTaskById(taskId: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    return prisma.task.update({
      where: { id: taskId },
      data,
    });
  }
}

const sprintRepository = new SprintRepository();

export default sprintRepository;