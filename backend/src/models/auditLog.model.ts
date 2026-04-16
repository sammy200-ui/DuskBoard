import { randomUUID } from 'node:crypto';
import { Schema, model } from 'mongoose';
import { AuditLogEntity } from '../shared/domain/entities';

type AuditLogDocument = {
  _id: string;
  taskId: string;
  userId: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  metadata: unknown;
  createdAt: Date;
};

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },
    taskId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    fromValue: {
      type: String,
      default: null,
    },
    toValue: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
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

auditLogSchema.index({ taskId: 1, createdAt: -1 });

export const AuditLogModel = model<AuditLogDocument>('AuditLog', auditLogSchema);

export const toAuditLogEntity = (doc: AuditLogDocument): AuditLogEntity => ({
  id: doc._id,
  taskId: doc.taskId,
  userId: doc.userId,
  action: doc.action,
  fromValue: doc.fromValue,
  toValue: doc.toValue,
  metadata: doc.metadata,
  createdAt: doc.createdAt,
});
