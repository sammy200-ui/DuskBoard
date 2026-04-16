import { EventEmitter } from 'node:events';

const taskEvents = {
  statusChanged: 'task:statusChanged',
  assigned: 'task:assigned',
  sprintMoved: 'task:sprintMoved',
} as const;

type TaskEventMetadata = unknown;

type BaseTaskEvent = {
  taskId: string;
  userId: string;
  fromValue?: string | null;
  toValue?: string | null;
  metadata?: TaskEventMetadata;
};

type TaskStatusChangedEvent = BaseTaskEvent;
type TaskAssignedEvent = BaseTaskEvent;
type TaskSprintMovedEvent = BaseTaskEvent;

const taskEventEmitter = new EventEmitter();

const emitTaskStatusChanged = (payload: TaskStatusChangedEvent): void => {
  taskEventEmitter.emit(taskEvents.statusChanged, payload);
};

const emitTaskAssigned = (payload: TaskAssignedEvent): void => {
  taskEventEmitter.emit(taskEvents.assigned, payload);
};

const emitTaskSprintMoved = (payload: TaskSprintMovedEvent): void => {
  taskEventEmitter.emit(taskEvents.sprintMoved, payload);
};

export {
  taskEventEmitter,
  taskEvents,
  emitTaskStatusChanged,
  emitTaskAssigned,
  emitTaskSprintMoved,
};

export type {
  TaskEventMetadata,
  TaskStatusChangedEvent,
  TaskAssignedEvent,
  TaskSprintMovedEvent,
};