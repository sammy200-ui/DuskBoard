import { AuditLogModel } from '../../models';
import {
  TaskAssignedEvent,
  TaskSprintMovedEvent,
  TaskStatusChangedEvent,
  taskEventEmitter,
  taskEvents,
} from './taskEvents';

type AuditWriteInput = {
  taskId: string;
  userId: string;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  metadata?: unknown;
};

class AuditObserver {
  private started = false;

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;

    taskEventEmitter.on(taskEvents.statusChanged, (payload: TaskStatusChangedEvent) => {
      void this.writeAuditLog({
        taskId: payload.taskId,
        userId: payload.userId,
        action: 'STATUS_CHANGED',
        fromValue: payload.fromValue,
        toValue: payload.toValue,
        metadata: payload.metadata,
      });
    });

    taskEventEmitter.on(taskEvents.assigned, (payload: TaskAssignedEvent) => {
      void this.writeAuditLog({
        taskId: payload.taskId,
        userId: payload.userId,
        action: 'ASSIGNED',
        fromValue: payload.fromValue,
        toValue: payload.toValue,
        metadata: payload.metadata,
      });
    });

    taskEventEmitter.on(taskEvents.sprintMoved, (payload: TaskSprintMovedEvent) => {
      void this.writeAuditLog({
        taskId: payload.taskId,
        userId: payload.userId,
        action: 'SPRINT_MOVED',
        fromValue: payload.fromValue,
        toValue: payload.toValue,
        metadata: payload.metadata,
      });
    });
  }

  private async writeAuditLog(input: AuditWriteInput): Promise<void> {
    try {
      await AuditLogModel.create({
        taskId: input.taskId,
        userId: input.userId,
        action: input.action,
        fromValue: input.fromValue ?? null,
        toValue: input.toValue ?? null,
        metadata: input.metadata ?? null,
      });
    } catch (error) {
      console.error('Failed to write audit log', error);
    }
  }
}

const auditObserver = new AuditObserver();

export { AuditObserver };
export default auditObserver;