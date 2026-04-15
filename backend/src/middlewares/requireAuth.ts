import { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../shared/errors';

type AccessTokenPayload = JwtPayload & {
  sub: string;
  tokenType: 'access';
};

const parseBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const decodeAccessToken = (token: string): AccessTokenPayload => {
  const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret';

  try {
    const decoded = jwt.verify(token, accessSecret);

    if (typeof decoded === 'string') {
      throw new UnauthorizedError();
    }

    if (decoded.tokenType !== 'access' || typeof decoded.sub !== 'string') {
      throw new UnauthorizedError();
    }

    return decoded as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError();
  }
};

const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = parseBearerToken(req.headers.authorization);
    if (!token) {
      throw new UnauthorizedError();
    }

    const decoded = decodeAccessToken(token);
    req.auth = {
      userId: decoded.sub,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default requireAuth;