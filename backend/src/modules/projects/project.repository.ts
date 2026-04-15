import { Prisma, ProjectRole, User } from '@prisma/client';
import prisma from '../../config/prisma';

class ProjectRepository {
  async listForUser(userId: string) {
    return prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: true,
      },
      orderBy: {
        project: {
          createdAt: 'desc',
        },
      },
    });
  }

  async createProjectForOwner(ownerId: string, data: Prisma.ProjectCreateInput) {
    return prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data,
      });

      await tx.projectMember.create({
        data: {
          userId: ownerId,
          projectId: project.id,
          role: ProjectRole.ADMIN,
        },
      });

      return project;
    });
  }

  async findProjectById(projectId: string) {
    return prisma.project.findUnique({
      where: { id: projectId },
    });
  }

  async findProjectForUser(projectId: string, userId: string) {
    return prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        project: true,
      },
    });
  }

  async updateProjectById(projectId: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({
      where: { id: projectId },
      data,
    });
  }

  async deleteProjectById(projectId: string) {
    return prisma.project.delete({
      where: { id: projectId },
    });
  }

  async findMembership(userId: string, projectId: string) {
    return prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });
  }

  async listMembers(projectId: string) {
    return prisma.projectMember.findMany({
      where: { projectId },
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
        user: {
          name: 'asc',
        },
      },
    });
  }

  async addMember(projectId: string, userId: string, role: ProjectRole) {
    return prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateMemberRole(projectId: string, userId: string, role: ProjectRole) {
    return prisma.projectMember.update({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      data: {
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async removeMember(projectId: string, userId: string) {
    return prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });
  }

  async countMembersByRole(projectId: string, role: ProjectRole) {
    return prisma.projectMember.count({
      where: {
        projectId,
        role,
      },
    });
  }

  async findUserById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  }
}

const projectRepository = new ProjectRepository();

export default projectRepository;