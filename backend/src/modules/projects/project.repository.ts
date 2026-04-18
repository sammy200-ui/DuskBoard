import {
  ProjectMemberModel,
  ProjectModel,
  SprintModel,
  TaskModel,
  UserModel,
  toProjectEntity,
  toProjectMemberEntity,
  toUserEntity,
} from '../../models';
import { ProjectEntity, ProjectMemberEntity, UserEntity } from '../../shared/domain/entities';
import { ProjectRole } from '../../shared/domain/enums';

type ProjectMembershipWithProject = {
  project: ProjectEntity;
  role: ProjectRole;
};

type ProjectMemberWithUser = {
  role: ProjectRole;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

class ProjectRepository {
  async listForUser(userId: string): Promise<ProjectMembershipWithProject[]> {
    const memberships = await ProjectMemberModel.find({ userId }).lean();
    if (memberships.length === 0) {
      return [];
    }

    const projectIds = memberships.map((membership) => membership.projectId);
    const projects = await ProjectModel.find({ _id: { $in: projectIds } }).lean();

    const projectById = new Map(projects.map((project) => [project._id, toProjectEntity(project)]));

    return memberships
      .map((membership) => {
        const project = projectById.get(membership.projectId);
        if (!project) {
          return null;
        }

        return {
          project,
          role: membership.role,
        };
      })
      .filter((value): value is ProjectMembershipWithProject => value !== null)
      .sort((a, b) => b.project.createdAt.getTime() - a.project.createdAt.getTime());
  }

  async createProjectForOwner(
    ownerId: string,
    data: {
      name: string;
      description?: string;
    },
  ): Promise<ProjectEntity> {
    const project = await ProjectModel.create({
      name: data.name,
      description: data.description ?? null,
    });

    try {
      await ProjectMemberModel.create({
        userId: ownerId,
        projectId: project._id,
        role: ProjectRole.ADMIN,
      });
    } catch (error) {
      await ProjectModel.findByIdAndDelete(project._id);
      throw error;
    }

    return toProjectEntity(project.toObject());
  }

  async findProjectById(projectId: string): Promise<ProjectEntity | null> {
    const project = await ProjectModel.findById(projectId).lean();
    return project ? toProjectEntity(project) : null;
  }

  async findProjectForUser(
    projectId: string,
    userId: string,
  ): Promise<
    | {
        project: ProjectEntity;
        role: ProjectRole;
      }
    | null
  > {
    const membership = await ProjectMemberModel.findOne({ userId, projectId }).lean();
    if (!membership) {
      return null;
    }

    const project = await ProjectModel.findById(projectId).lean();
    if (!project) {
      return null;
    }

    return {
      project: toProjectEntity(project),
      role: membership.role,
    };
  }

  async updateProjectById(
    projectId: string,
    data: {
      name?: string;
      description?: string;
    },
  ): Promise<ProjectEntity> {
    const updatePayload: {
      name?: string;
      description?: string | null;
    } = {};

    if (data.name !== undefined) {
      updatePayload.name = data.name;
    }

    if (data.description !== undefined) {
      updatePayload.description = data.description;
    }

    const updated = await ProjectModel.findByIdAndUpdate(projectId, updatePayload, {
      new: true,
    }).lean();

    if (!updated) {
      throw new Error('Project not found during update');
    }

    return toProjectEntity(updated);
  }

  async deleteProjectById(projectId: string): Promise<void> {
    await ProjectModel.findByIdAndDelete(projectId);
  }

  async hasRelatedRecords(projectId: string): Promise<boolean> {
    const [memberCount, sprintCount, taskCount] = await Promise.all([
      ProjectMemberModel.countDocuments({ projectId }),
      SprintModel.countDocuments({ projectId }),
      TaskModel.countDocuments({ projectId }),
    ]);

    return memberCount > 0 || sprintCount > 0 || taskCount > 0;
  }

  async findMembership(userId: string, projectId: string): Promise<ProjectMemberEntity | null> {
    const membership = await ProjectMemberModel.findOne({ userId, projectId }).lean();
    return membership ? toProjectMemberEntity(membership) : null;
  }

  async listMembers(projectId: string): Promise<ProjectMemberWithUser[]> {
    const members = await ProjectMemberModel.find({ projectId }).lean();
    if (members.length === 0) {
      return [];
    }

    const userIds = members.map((member) => member.userId);
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();
    const userById = new Map(users.map((user) => [user._id, user]));

    return members
      .map((member) => {
        const user = userById.get(member.userId);
        if (!user) {
          return null;
        }

        return {
          role: member.role,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        };
      })
      .filter((value): value is ProjectMemberWithUser => value !== null)
      .sort((a, b) => a.user.name.localeCompare(b.user.name));
  }

  async addMember(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMemberWithUser> {
    await ProjectMemberModel.create({
      projectId,
      userId,
      role,
    });

    const user = await UserModel.findById(userId).lean();
    if (!user) {
      throw new Error('User not found during member add');
    }

    return {
      role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async updateMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMemberWithUser> {
    await ProjectMemberModel.findOneAndUpdate(
      {
        projectId,
        userId,
      },
      {
        role,
      },
    );

    const user = await UserModel.findById(userId).lean();
    if (!user) {
      throw new Error('User not found during member role update');
    }

    return {
      role,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await ProjectMemberModel.findOneAndDelete({ projectId, userId });
  }

  async countMembersByRole(projectId: string, role: ProjectRole): Promise<number> {
    return ProjectMemberModel.countDocuments({ projectId, role });
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    const user = await UserModel.findById(userId).lean();
    return user ? toUserEntity(user) : null;
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    return user ? toUserEntity(user) : null;
  }
}

const projectRepository = new ProjectRepository();

export default projectRepository;
