import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { AppError, UnauthorizedError } from '../../shared/errors';
import authRepository from './auth.repository';
import {
  AuthResponse,
  AuthUser,
  LoginInput,
  RefreshTokenInput,
  RegisterInput,
  TokenSet,
} from './auth.types';

type AccessTokenPayload = {
  sub: string;
  email: string;
  tokenType: 'access';
};

type RefreshJwtPayload = JwtPayload & {
  sub: string;
  tokenType: 'refresh';
};

const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

class AuthService {
  private accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';
  private refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret';
  private accessExpiry = (process.env.JWT_ACCESS_EXPIRES_IN ?? '15m') as SignOptions['expiresIn'];
  private refreshExpiry = (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'];

  async register(input: RegisterInput): Promise<AuthResponse> {
    const payload = this.parseOrThrow(registerSchema, input);
    const email = payload.email.toLowerCase();

    const existingUser = await authRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email is already in use', 409);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await authRepository.createUser({
      name: payload.name,
      email,
      passwordHash,
    });

    return {
      user: this.toAuthUser(user),
      tokens: this.createTokenSet(user.id, user.email),
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const payload = this.parseOrThrow(loginSchema, input);
    const email = payload.email.toLowerCase();

    const user = await authRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError();
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError();
    }

    return {
      user: this.toAuthUser(user),
      tokens: this.createTokenSet(user.id, user.email),
    };
  }

  async refresh(input: RefreshTokenInput): Promise<TokenSet> {
    const payload = this.parseOrThrow(refreshSchema, input);
    const decoded = this.verifyRefreshToken(payload.refreshToken);

    const user = await authRepository.findById(decoded.sub);
    if (!user) {
      throw new UnauthorizedError();
    }

    return this.createTokenSet(user.id, user.email);
  }

  async logout(): Promise<void> {
    // Stateless JWT logout is handled client-side by dropping tokens.
    return;
  }

  private parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input);

    if (!result.success) {
      const issueMessage = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'field'}: ${issue.message}`)
        .join(', ');

      throw new AppError(`Validation failed: ${issueMessage}`, 400);
    }

    return result.data;
  }

  private verifyRefreshToken(token: string): RefreshJwtPayload {
    try {
      const decoded = jwt.verify(token, this.refreshSecret);

      if (typeof decoded === 'string') {
        throw new UnauthorizedError();
      }

      if (decoded.tokenType !== 'refresh' || typeof decoded.sub !== 'string') {
        throw new UnauthorizedError();
      }

      return decoded as RefreshJwtPayload;
    } catch {
      throw new UnauthorizedError();
    }
  }

  private createTokenSet(userId: string, email: string): TokenSet {
    const accessPayload: AccessTokenPayload = {
      sub: userId,
      email,
      tokenType: 'access',
    };

    const accessToken = jwt.sign(accessPayload, this.accessSecret, {
      expiresIn: this.accessExpiry,
    });

    const refreshToken = jwt.sign(
      {
        sub: userId,
        tokenType: 'refresh',
      },
      this.refreshSecret,
      {
        expiresIn: this.refreshExpiry,
      },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
    };
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  }): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
  }
}

const authService = new AuthService();

export default authService;