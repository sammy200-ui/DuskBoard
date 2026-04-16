import { UserModel, toUserEntity } from '../../models';
import { UserEntity } from '../../shared/domain/entities';

class UserRepository {
  async findById(userId: string): Promise<UserEntity | null> {
    const user = await UserModel.findById(userId).lean();
    return user ? toUserEntity(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    return user ? toUserEntity(user) : null;
  }

  async updateById(
    userId: string,
    data: {
      name?: string;
      email?: string;
    },
  ): Promise<UserEntity> {
    const updated = await UserModel.findByIdAndUpdate(
      userId,
      {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
      },
      { new: true },
    ).lean();

    if (!updated) {
      throw new Error('User not found during update');
    }

    return toUserEntity(updated);
  }
}

const userRepository = new UserRepository();

export default userRepository;