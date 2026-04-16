import { randomUUID } from 'node:crypto';
import { Schema, model } from 'mongoose';
import { UserEntity } from '../shared/domain/entities';

type UserDocument = {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    _id: {
      type: String,
      default: () => randomUUID(),
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
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

export const UserModel = model<UserDocument>('User', userSchema);

export const toUserEntity = (doc: UserDocument): UserEntity => ({
  id: doc._id,
  email: doc.email,
  passwordHash: doc.passwordHash,
  name: doc.name,
  createdAt: doc.createdAt,
});
