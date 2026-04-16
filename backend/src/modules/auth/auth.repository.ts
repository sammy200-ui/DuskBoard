import { UserModel, toUserEntity } from '../../models';
import { UserEntity } from '../../shared/domain/entities';

class AuthRepository {
  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await UserModel.findOne({ email: email.toLowerCase() }).lean();
    return user ? toUserEntity(user) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await UserModel.findById(id).lean();
    return user ? toUserEntity(user) : null;
  }

  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    const user = await UserModel.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
    });

    return toUserEntity(user.toObject());
  }
}

const authRepository = new AuthRepository();

export default authRepository;