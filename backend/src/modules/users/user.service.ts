import { z } from 'zod';
import { AppError, NotFoundError } from '../../shared/errors';
import userRepository from './user.repository';
import { UpdateProfileInput, UserProfile } from './user.types';

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    email: z.string().trim().email().optional(),
  })
  .refine((payload) => payload.name !== undefined || payload.email !== undefined, {
    message: 'At least one field is required',
    path: ['name'],
  });

class UserService {
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    return this.toProfile(user);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<UserProfile> {
    const payload = this.parseUpdateInput(input);
    const currentUser = await userRepository.findById(userId);

    if (!currentUser) {
      throw new NotFoundError('User');
    }

    const nextEmail = payload.email?.toLowerCase();
    if (nextEmail && nextEmail !== currentUser.email) {
      const existingOwner = await userRepository.findByEmail(nextEmail);
      if (existingOwner && existingOwner.id !== userId) {
        throw new AppError('Email is already in use', 409);
      }
    }

    const updated = await userRepository.updateById(userId, {
      name: payload.name,
      email: nextEmail,
    });

    return this.toProfile(updated);
  }

  private parseUpdateInput(input: UpdateProfileInput): UpdateProfileInput {
    const result = updateProfileSchema.safeParse(input);
    if (!result.success) {
      const issueMessage = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'field'}: ${issue.message}`)
        .join(', ');

      throw new AppError(`Validation failed: ${issueMessage}`, 400);
    }

    return result.data;
  }

  private toProfile(user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  }): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}

const userService = new UserService();

export default userService;