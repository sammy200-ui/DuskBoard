import { ProjectMemberModel, SprintModel, TaskModel, toProjectMemberEntity, toSprintEntity, toTaskEntity } from '../../models';
import { ProjectMemberEntity, SprintEntity, TaskEntity } from '../../shared/domain/entities';
import { SprintStatus, TaskStatus } from '../../shared/domain/enums';

type CreateSprintData = {
  projectId: string;
  name: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
};

type UpdateSprintData = {
  name?: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  status?: SprintStatus;
};

type UpdateTaskData = {
  sprintId?: string | null;
};

class SprintRepository {
  async findMembership(userId: string, projectId: string): Promise<ProjectMemberEntity | null> {
    const membership = await ProjectMemberModel.findOne({ userId, projectId }).lean();
    return membership ? toProjectMemberEntity(membership) : null;
  }

  async listByProject(projectId: string): Promise<SprintEntity[]> {
    const sprints = await SprintModel.find({ projectId }).sort({ startDate: 1, name: 1 }).lean();
    return sprints.map((sprint) => toSprintEntity(sprint));
  }

  async createSprint(data: CreateSprintData): Promise<SprintEntity> {
    const sprint = await SprintModel.create({
      projectId: data.projectId,
      name: data.name,
      goal: data.goal ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
    });

    return toSprintEntity(sprint.toObject());
  }

  async findByIdAndProject(sprintId: string, projectId: string): Promise<SprintEntity | null> {
    const sprint = await SprintModel.findOne({ _id: sprintId, projectId }).lean();
    return sprint ? toSprintEntity(sprint) : null;
  }

  async updateSprintById(sprintId: string, data: UpdateSprintData): Promise<SprintEntity> {
    const updatePayload: {
      name?: string;
      goal?: string | null;
      startDate?: Date | null;
      endDate?: Date | null;
      status?: SprintStatus;
    } = {};

    if (data.name !== undefined) {
      updatePayload.name = data.name;
    }

    if (data.goal !== undefined) {
      updatePayload.goal = data.goal;
    }

    if (data.startDate !== undefined) {
      updatePayload.startDate = data.startDate;
    }

    if (data.endDate !== undefined) {
      updatePayload.endDate = data.endDate;
    }

    if (data.status !== undefined) {
      updatePayload.status = data.status;
    }

    const sprint = await SprintModel.findByIdAndUpdate(sprintId, updatePayload, {
      new: true,
    }).lean();

    if (!sprint) {
      throw new Error('Sprint not found during update');
    }

    return toSprintEntity(sprint);
  }

  async findFirstActiveSprint(projectId: string, excludingSprintId: string): Promise<SprintEntity | null> {
    const sprint = await SprintModel.findOne({
      projectId,
      status: SprintStatus.ACTIVE,
      _id: { $ne: excludingSprintId },
    })
      .sort({ startDate: 1, name: 1 })
      .lean();

    return sprint ? toSprintEntity(sprint) : null;
  }

  async findFirstPlannedSprint(projectId: string, excludingSprintId: string): Promise<SprintEntity | null> {
    const sprint = await SprintModel.findOne({
      projectId,
      status: SprintStatus.PLANNED,
      _id: { $ne: excludingSprintId },
    })
      .sort({ startDate: 1, name: 1 })
      .lean();

    return sprint ? toSprintEntity(sprint) : null;
  }

  async listRolloverTasks(projectId: string, sprintId: string): Promise<TaskEntity[]> {
    const tasks = await TaskModel.find({
      projectId,
      sprintId,
      status: {
        $nin: [TaskStatus.DONE, TaskStatus.BLOCKED],
      },
    }).lean();

    return tasks.map((task) => toTaskEntity(task));
  }

  async listTasksForSprint(projectId: string, sprintId: string): Promise<TaskEntity[]> {
    const tasks = await TaskModel.find({ projectId, sprintId }).sort({ createdAt: -1 }).lean();
    return tasks.map((task) => toTaskEntity(task));
  }

  async findTaskByIdAndProject(taskId: string, projectId: string): Promise<TaskEntity | null> {
    const task = await TaskModel.findOne({ _id: taskId, projectId }).lean();
    return task ? toTaskEntity(task) : null;
  }

  async updateTaskById(taskId: string, data: UpdateTaskData): Promise<TaskEntity> {
    const updatePayload: {
      sprintId?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.sprintId !== undefined) {
      updatePayload.sprintId = data.sprintId;
    }

    const task = await TaskModel.findByIdAndUpdate(taskId, updatePayload, {
      new: true,
    }).lean();

    if (!task) {
      throw new Error('Task not found during update');
    }

    return toTaskEntity(task);
  }
}

const sprintRepository = new SprintRepository();

export default sprintRepository;
