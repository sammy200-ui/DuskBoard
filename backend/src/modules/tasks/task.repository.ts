import {
  AuditLogModel,
  ProjectMemberModel,
  TaskModel,
  UserModel,
  toProjectMemberEntity,
  toTaskEntity,
  toUserEntity,
} from '../../models';
import { ProjectMemberEntity, TaskEntity, UserEntity } from '../../shared/domain/entities';
import { Priority, TaskStatus, TaskType } from '../../shared/domain/enums';

type CreateTaskData = {
  projectId: string;
  title: string;
  description?: string;
  type?: TaskType;
  priority?: Priority;
  assigneeId?: string;
  sprintId?: string;
};

type UpdateTaskData = {
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: Priority;
  status?: TaskStatus;
  assigneeId?: string | null;
  sprintId?: string | null;
};

type TaskAuditLogWithActor = {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  metadata: unknown;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

class TaskRepository {
  async listByProject(projectId: string): Promise<TaskEntity[]> {
    const tasks = await TaskModel.find({ projectId }).sort({ createdAt: -1 }).lean();
    return tasks.map((task) => toTaskEntity(task));
  }

  async createTask(data: CreateTaskData): Promise<TaskEntity> {
    const task = await TaskModel.create({
      projectId: data.projectId,
      title: data.title,
      description: data.description ?? null,
      type: data.type,
      priority: data.priority,
      assigneeId: data.assigneeId ?? null,
      sprintId: data.sprintId ?? null,
    });

    return toTaskEntity(task.toObject());
  }

  async findTaskById(taskId: string): Promise<TaskEntity | null> {
    const task = await TaskModel.findById(taskId).lean();
    return task ? toTaskEntity(task) : null;
  }

  async findTaskByIdAndProject(taskId: string, projectId: string): Promise<TaskEntity | null> {
    const task = await TaskModel.findOne({ _id: taskId, projectId }).lean();
    return task ? toTaskEntity(task) : null;
  }

  async updateTaskById(taskId: string, data: UpdateTaskData): Promise<TaskEntity> {
    const updatePayload: {
      title?: string;
      description?: string | null;
      type?: TaskType;
      priority?: Priority;
      status?: TaskStatus;
      assigneeId?: string | null;
      sprintId?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) {
      updatePayload.title = data.title;
    }

    if (data.description !== undefined) {
      updatePayload.description = data.description;
    }

    if (data.type !== undefined) {
      updatePayload.type = data.type;
    }

    if (data.priority !== undefined) {
      updatePayload.priority = data.priority;
    }

    if (data.status !== undefined) {
      updatePayload.status = data.status;
    }

    if (data.assigneeId !== undefined) {
      updatePayload.assigneeId = data.assigneeId;
    }

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

  async deleteTaskById(taskId: string): Promise<void> {
    await TaskModel.findByIdAndDelete(taskId);
  }

  async findMembership(userId: string, projectId: string): Promise<ProjectMemberEntity | null> {
    const membership = await ProjectMemberModel.findOne({ userId, projectId }).lean();
    return membership ? toProjectMemberEntity(membership) : null;
  }

  async findUserById(userId: string): Promise<UserEntity | null> {
    const user = await UserModel.findById(userId).lean();
    return user ? toUserEntity(user) : null;
  }

  async listAuditLogsByTask(taskId: string): Promise<TaskAuditLogWithActor[]> {
    const logs = await AuditLogModel.find({ taskId }).sort({ createdAt: -1 }).lean();
    if (logs.length === 0) {
      return [];
    }

    const userIds = logs.map((log) => log.userId);
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();
    const userById = new Map(users.map((user) => [user._id, user]));

    const result: TaskAuditLogWithActor[] = [];

    for (const log of logs) {
      const user = userById.get(log.userId);
      if (!user) {
        continue;
      }

      result.push({
        id: log._id,
        taskId: log.taskId,
        userId: log.userId,
        action: log.action,
        fromValue: log.fromValue,
        toValue: log.toValue,
        metadata: log.metadata as unknown,
        createdAt: log.createdAt,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    }

    return result;
  }
}

const taskRepository = new TaskRepository();

export default taskRepository;
