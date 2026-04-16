import { Priority, SprintStatus, TaskStatus, TaskType } from '../../shared/domain/enums';
import { z } from 'zod';
import { emitTaskSprintMoved } from '../../core/audit';
import { AppError, NotFoundError } from '../../shared/errors';
import sprintRepository from './sprint.repository';
import {
  CreateSprintInput,
  SprintCompletionResult,
  SprintTaskView,
  SprintView,
  UpdateSprintInput,
} from './sprint.types';

const createSprintSchema = z.object({
  name: z.string().trim().min(2).max(100),
  goal: z.string().trim().max(500).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

const updateSprintSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    goal: z.string().trim().max(500).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (payload) =>
      payload.name !== undefined ||
      payload.goal !== undefined ||
      payload.startDate !== undefined ||
      payload.endDate !== undefined,
    {
      message: 'At least one field is required',
      path: ['name'],
    },
  );

class SprintService {
  async listSprints(userId: string, projectId: string): Promise<SprintView[]> {
    await this.ensureMembership(userId, projectId);

    const sprints = await sprintRepository.listByProject(projectId);
    return sprints.map((sprint) => this.toView(sprint));
  }

  async createSprint(userId: string, projectId: string, input: CreateSprintInput): Promise<SprintView> {
    await this.ensureMembership(userId, projectId);
    const payload = this.parseOrThrow(createSprintSchema, input);

    if (payload.startDate && payload.endDate && payload.endDate < payload.startDate) {
      throw new AppError('Sprint end date cannot be before start date', 400);
    }

    const sprint = await sprintRepository.createSprint({
      projectId,
      name: payload.name,
      goal: payload.goal,
      startDate: payload.startDate,
      endDate: payload.endDate,
    });

    return this.toView(sprint);
  }

  async updateSprint(
    userId: string,
    projectId: string,
    sprintId: string,
    input: UpdateSprintInput,
  ): Promise<SprintView> {
    await this.ensureMembership(userId, projectId);
    const payload = this.parseOrThrow(updateSprintSchema, input);

    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    const startDate = payload.startDate ?? sprint.startDate;
    const endDate = payload.endDate ?? sprint.endDate;
    if (startDate && endDate && endDate < startDate) {
      throw new AppError('Sprint end date cannot be before start date', 400);
    }

    const updated = await sprintRepository.updateSprintById(sprint.id, {
      name: payload.name,
      goal: payload.goal,
      startDate: payload.startDate,
      endDate: payload.endDate,
    });

    return this.toView(updated);
  }

  async startSprint(userId: string, projectId: string, sprintId: string): Promise<SprintView> {
    await this.ensureMembership(userId, projectId);

    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    if (sprint.status !== SprintStatus.PLANNED) {
      throw new AppError('Only planned sprints can be started', 400);
    }

    const anotherActiveSprint = await sprintRepository.findFirstActiveSprint(projectId, sprintId);
    if (anotherActiveSprint) {
      throw new AppError('Complete the active sprint before starting another', 400);
    }

    const started = await sprintRepository.updateSprintById(sprint.id, {
      status: SprintStatus.ACTIVE,
      startDate: sprint.startDate ?? new Date(),
    });

    return this.toView(started);
  }

  async completeSprint(userId: string, projectId: string, sprintId: string): Promise<SprintCompletionResult> {
    await this.ensureMembership(userId, projectId);

    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    if (sprint.status !== SprintStatus.ACTIVE) {
      throw new AppError('Only active sprints can be completed', 400);
    }

    const activeTarget = await sprintRepository.findFirstActiveSprint(projectId, sprint.id);
    const plannedTarget = activeTarget ? null : await sprintRepository.findFirstPlannedSprint(projectId, sprint.id);
    const destinationSprintId = activeTarget?.id ?? plannedTarget?.id ?? null;

    const rolloverTasks = await sprintRepository.listRolloverTasks(projectId, sprint.id);

    for (const task of rolloverTasks) {
      await sprintRepository.updateTaskById(task.id, {
        sprintId: destinationSprintId,
      });

      emitTaskSprintMoved({
        taskId: task.id,
        userId,
        fromValue: sprint.id,
        toValue: destinationSprintId,
        metadata: {
          reason: 'sprint_completed',
        },
      });
    }

    const completed = await sprintRepository.updateSprintById(sprint.id, {
      status: SprintStatus.COMPLETED,
      endDate: new Date(),
    });

    return {
      sprint: this.toView(completed),
      movedTasks: rolloverTasks.length,
      destinationSprintId,
    };
  }

  async listSprintTasks(userId: string, projectId: string, sprintId: string): Promise<SprintTaskView[]> {
    await this.ensureMembership(userId, projectId);

    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    const tasks = await sprintRepository.listTasksForSprint(projectId, sprint.id);
    return tasks.map((task) => this.toTaskView(task));
  }

  async addTaskToSprint(userId: string, projectId: string, sprintId: string, taskId: string): Promise<SprintTaskView> {
    await this.ensureMembership(userId, projectId);

    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    if (sprint.status === SprintStatus.COMPLETED) {
      throw new AppError('Cannot add tasks to a completed sprint', 400);
    }

    const task = await sprintRepository.findTaskByIdAndProject(taskId, projectId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    const updated = await sprintRepository.updateTaskById(task.id, {
      sprintId: sprint.id,
    });

    emitTaskSprintMoved({
      taskId: task.id,
      userId,
      fromValue: task.sprintId,
      toValue: sprint.id,
      metadata: {
        reason: 'added_to_sprint',
      },
    });

    return this.toTaskView(updated);
  }

  async removeTaskFromSprint(
    userId: string,
    projectId: string,
    sprintId: string,
    taskId: string,
  ): Promise<SprintTaskView> {
    await this.ensureMembership(userId, projectId);

    const sprint = await sprintRepository.findByIdAndProject(sprintId, projectId);
    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    const task = await sprintRepository.findTaskByIdAndProject(taskId, projectId);
    if (!task) {
      throw new NotFoundError('Task');
    }

    if (task.sprintId !== sprint.id) {
      throw new AppError('Task is not in this sprint', 400);
    }

    const updated = await sprintRepository.updateTaskById(task.id, {
      sprintId: null,
    });

    emitTaskSprintMoved({
      taskId: task.id,
      userId,
      fromValue: sprint.id,
      toValue: null,
      metadata: {
        reason: 'removed_from_sprint',
      },
    });

    return this.toTaskView(updated);
  }

  private async ensureMembership(userId: string, projectId: string) {
    const membership = await sprintRepository.findMembership(userId, projectId);
    if (!membership) {
      throw new AppError('You are not a member of this project', 403);
    }

    return membership;
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

  private toView(sprint: {
    id: string;
    projectId: string;
    name: string;
    goal: string | null;
    status: SprintStatus;
    startDate: Date | null;
    endDate: Date | null;
  }): SprintView {
    return {
      id: sprint.id,
      projectId: sprint.projectId,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
    };
  }

  private toTaskView(task: {
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
  }): SprintTaskView {
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

const sprintService = new SprintService();

export default sprintService;