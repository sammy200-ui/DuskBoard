import { randomUUID } from 'node:crypto';
import { Schema, model } from 'mongoose';
import { SprintEntity } from '../shared/domain/entities';
import { SprintStatus } from '../shared/domain/enums';

type SprintDocument = {
  _id: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startDate: Date | null;
  endDate: Date | null;
};

const sprintSchema = new Schema<SprintDocument>(
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    goal: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(SprintStatus),
      default: SprintStatus.PLANNED,
      required: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    versionKey: false,
  },
);

sprintSchema.index({ projectId: 1, status: 1, startDate: 1, name: 1 });

export const SprintModel = model<SprintDocument>('Sprint', sprintSchema);

export const toSprintEntity = (doc: SprintDocument): SprintEntity => ({
  id: doc._id,
  projectId: doc.projectId,
  name: doc.name,
  goal: doc.goal,
  status: doc.status,
  startDate: doc.startDate,
  endDate: doc.endDate,
});
