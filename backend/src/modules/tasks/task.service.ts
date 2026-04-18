import { Priority, ProjectRole, TaskStatus, TaskType } from '../../shared/domain/enums';
import { z } from 'zod';
import { emitTaskAssigned, emitTaskStatusChanged } from '../../core/audit';
import workflowEngine from '../../core/workflow/WorkflowEngine';
import { AppError, NotFoundError, WorkflowViolationError } from '../../shared/errors';
import taskRepository from './task.repository';
import {
  AssignTaskInput,
  CreateTaskInput,
  TaskAuditLogView,
  TaskValidTransitionsView,
  TaskView,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from './task.types';

const createTaskSchema = z.object({
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(2000).optional(),
  type: z.nativeEnum(TaskType).optional(),
  priority: z.nativeEnum(Priority).optional(),
  assigneeId: z.string().uuid().optional(),
  sprintId: z.string().uuid().optional(),
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(2000).optional(),
    type: z.nativeEnum(TaskType).optional(),
    priority: z.nativeEnum(Priority).optional(),
    sprintId: z.string().uuid().nullable().optional(),
  })
  .refine(
    (payload) =>
      payload.title !== undefined ||
      payload.description !== undefined ||
      payload.type !== undefined ||
      payload.priority !== undefined ||
      payload.sprintId !== undefined,
    {
      message: 'At least one field is required',
      path: ['title'],
    },
  );

const updateStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

const assignTaskSchema = z.object({
  assigneeId: z.string().uuid().nullable(),
});

class TaskService {
  async listTasks(userId: string, projectId: string): Promise<TaskView[]> {
    await this.ensureMembership(userId, projectId);

    const tasks = await taskRepository.listByProject(projectId);
    return tasks.map((task) => this.toView(task));
  }

  async createTask(userId: string, projectId: string, input: CreateTaskInput): Promise<TaskView> {
    await this.ensureMembership(userId, projectId);
    const payload = this.parseOrThrow(createTaskSchema, input);

    if (payload.assigneeId) {
      await this.ensureAssignableMember(payload.assigneeId, projectId);
    }

    const task = await taskRepository.createTask({
      projectId,
      title: payload.title,
      description: payload.description,
      type: payload.type,
      priority: payload.priority,
      assigneeId: payload.assigneeId,
      sprintId: payload.sprintId,
    });

    return this.toView(task);
  }

  async getTask(userId: string, projectId: string, taskId: string): Promise<TaskView> {
    await this.ensureMembership(userId, projectId);
    const task = await taskRepository.findTaskByIdAndProject(taskId, projectId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    return this.toView(task);
  }

  async getTaskAuditLogs(userId: string, projectId: string, taskId: string): Promise<TaskAuditLogView[]> {
    await this.ensureMembership(userId, projectId);

    const task = await taskRepository.findTaskByIdAndProject(taskId, projectId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const logs = await taskRepository.listAuditLogsByTask(task.id);
    return logs.map((log) => ({
      id: log.id,
      taskId: log.taskId,
      userId: log.userId,
      action: log.action,
      fromValue: log.fromValue,
      toValue: log.toValue,
      metadata: log.metadata,
      createdAt: log.createdAt,
      actor: {
        id: log.user.id,
        name: log.user.name,
        email: log.user.email,
      },
    }));
  }

  async getTaskValidTransitions(
    userId: string,
    projectId: string,
    taskId: string,
  ): Promise<TaskValidTransitionsView> {
    const membership = await this.ensureMembership(userId, projectId);

    const task = await taskRepository.findTaskByIdAndProject(taskId, projectId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const validTransitions = workflowEngine
      .getValidTransitions(task.status, membership.role)
      .filter((status) => {
        if (
          task.status === TaskStatus.IN_PROGRESS &&
          status === TaskStatus.CODE_REVIEW &&
          membership.role === ProjectRole.DEVELOPER &&
          task.assigneeId !== userId
        ) {
          return false;
        }

        return true;
      });

    return {
      taskId: task.id,
      currentStatus: task.status,
      validTransitions,
    };
  }

  async updateTask(userId: string, projectId: string, taskId: string, input: UpdateTaskInput): Promise<TaskView> {
    await this.ensureMembership(userId, projectId);
    const payload = this.parseOrThrow(updateTaskSchema, input);

    const task = await taskRepository.findTaskByIdAndProject(taskId, projectId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const updated = await taskRepository.updateTaskById(task.id, {
      title: payload.title,
      description: payload.description,
      type: payload.type,
      priority: payload.priority,
      sprintId: payload.sprintId,
    });

    return this.toView(updated);
  }

  async deleteTask(userId: string, projectId: string, taskId: string): Promise<void> {
    await this.ensureMembership(userId, projectId);

    const task = await taskRepository.findTaskByIdAndProject(taskId, projectId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    await taskRepository.deleteTaskById(task.id);
  }

  async transitionTaskStatus(
    userId: string,
    projectId: string,
    taskId: string,
    input: UpdateTaskStatusInput,
  ): Promise<TaskView> {
    const membership = await this.ensureMembership(userId, projectId);
    const payload = this.parseOrThrow(updateStatusSchema, input);

    const task = await taskRepository.findTaskByIdAndProject(taskId, projectId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const fromStatus = task.status;
    const toStatus = payload.status;

    if (fromStatus === toStatus) {
      return this.toView(task);
    }

    if (
      fromStatus === TaskStatus.IN_PROGRESS &&
      toStatus === TaskStatus.CODE_REVIEW &&
      membership.role === ProjectRole.DEVELOPER &&
      task.assigneeId !== userId
    ) {
      throw new AppError('Only the assignee can move task to code review', 403);
    }

    if (!workflowEngine.canTransition(fromStatus, toStatus, membership.role)) {
      throw new WorkflowViolationError(fromStatus, toStatus, membership.role);
    }

    const updated = await taskRepository.updateTaskById(task.id, {
      status: toStatus,
    });

    emitTaskStatusChanged({
      taskId: task.id,
      userId,
      fromValue: fromStatus,
      toValue: toStatus,
    });

    return this.toView(updated);
  }

  async assignTask(
    userId: string,
    projectId: string,
    taskId: string,
    input: AssignTaskInput,
  ): Promise<TaskView> {
    await this.ensureMembership(userId, projectId);
    const payload = this.parseOrThrow(assignTaskSchema, input);

    const task = await taskRepository.findTaskByIdAndProject(taskId, projectId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    if (payload.assigneeId) {
      await this.ensureAssignableMember(payload.assigneeId, projectId);
    }

    const updated = await taskRepository.updateTaskById(task.id, {
      assigneeId: payload.assigneeId,
    });

    emitTaskAssigned({
      taskId: task.id,
      userId,
      fromValue: task.assigneeId,
      toValue: payload.assigneeId,
    });

    return this.toView(updated);
  }

  private async ensureMembership(userId: string, projectId: string) {
    const membership = await taskRepository.findMembership(userId, projectId);
    if (!membership) {
      throw new AppError('You are not a member of this project', 403);
    }

    return membership;
  }

  private async ensureAssignableMember(assigneeId: string, projectId: string): Promise<void> {
    const user = await taskRepository.findUserById(assigneeId);
    if (!user) {
      throw new NotFoundError('Assignee user');
    }

    const membership = await taskRepository.findMembership(assigneeId, projectId);
    if (!membership) {
      throw new AppError('Assignee must be a member of this project', 400);
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

  private toView(task: {
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
  }): TaskView {
    return {
      id: task.id,
      projectId: task.projectId,
      sprintId: task.sprintId,
      assigneeId: task.assigneeId,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      priority: task.priority,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}

const taskService = new TaskService();

export default taskService;