import { randomUUID } from 'node:crypto';
import { Schema, model } from 'mongoose';
import { TaskEntity } from '../shared/domain/entities';
import { Priority, TaskStatus, TaskType } from '../shared/domain/enums';

type TaskDocument = {
  _id: string;
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
};

const taskSchema = new Schema<TaskDocument>(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    sprintId: {
      type: String,
      default: null,
      index: true,
    },
    assigneeId: {
      type: String,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(TaskType),
      default: TaskType.STORY,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.OPEN,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(Priority),
      default: Priority.MEDIUM,
      required: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
    updatedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    versionKey: false,
  },
);

taskSchema.index({ projectId: 1, createdAt: -1 });

export const TaskModel = model<TaskDocument>('Task', taskSchema);

export const toTaskEntity = (doc: TaskDocument): TaskEntity => ({
  id: doc._id,
  projectId: doc.projectId,
  sprintId: doc.sprintId,
  assigneeId: doc.assigneeId,
  title: doc.title,
  description: doc.description,
  type: doc.type,
  status: doc.status,
  priority: doc.priority,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});
