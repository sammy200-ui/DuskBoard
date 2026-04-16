import { Prisma, ProjectMember, Task, User } from '@prisma/client';
import prisma from '../../config/prisma';

class TaskRepository {
  async listByProject(projectId: string): Promise<Task[]> {
    return prisma.task.findMany({
      where: { projectId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createTask(data: Prisma.TaskCreateInput): Promise<Task> {
    return prisma.task.create({
      data,
    });
  }

  async findTaskById(taskId: string): Promise<Task | null> {
    return prisma.task.findUnique({
      where: { id: taskId },
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

  async deleteTaskById(taskId: string): Promise<Task> {
    return prisma.task.delete({
      where: { id: taskId },
    });
  }

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

  async findUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async listAuditLogsByTask(taskId: string) {
    return prisma.auditLog.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

const taskRepository = new TaskRepository();

export default taskRepository;