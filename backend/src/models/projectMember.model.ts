import { randomUUID } from 'node:crypto';
import { Schema, model } from 'mongoose';
import { ProjectMemberEntity } from '../shared/domain/entities';
import { ProjectRole } from '../shared/domain/enums';

type ProjectMemberDocument = {
  _id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
};

const projectMemberSchema = new Schema<ProjectMemberDocument>(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    projectId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(ProjectRole),
      required: true,
    },
  },
  {
    versionKey: false,
  },
);

projectMemberSchema.index({ userId: 1, projectId: 1 }, { unique: true });

export const ProjectMemberModel = model<ProjectMemberDocument>('ProjectMember', projectMemberSchema);

export const toProjectMemberEntity = (doc: ProjectMemberDocument): ProjectMemberEntity => ({
  id: doc._id,
  userId: doc.userId,
  projectId: doc.projectId,
  role: doc.role,
});
