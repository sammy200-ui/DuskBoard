import { randomUUID } from 'node:crypto';
import { Schema, model } from 'mongoose';
import { ProjectEntity } from '../shared/domain/entities';

type ProjectDocument = {
  _id: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

const projectSchema = new Schema<ProjectDocument>(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    versionKey: false,
  },
);

export const ProjectModel = model<ProjectDocument>('Project', projectSchema);

export const toProjectEntity = (doc: ProjectDocument): ProjectEntity => ({
  id: doc._id,
  name: doc.name,
  description: doc.description,
  createdAt: doc.createdAt,
});
