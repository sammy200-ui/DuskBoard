import { JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import permissionChecker, { Permission } from '../core/rbac/PermissionChecker';
import { ProjectMemberModel } from '../models';
import { AppError, UnauthorizedError } from '../shared/errors';

type AccessTokenPayload = JwtPayload & {
  sub: string;
  tokenType: 'access';
};

const getBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
};

const getProjectId = (req: Request): string | null => {
  if (typeof req.params.projectId === 'string' && req.params.projectId.length > 0) {
    return req.params.projectId;
  }

  if (typeof req.params.id === 'string' && req.params.id.length > 0) {
    return req.params.id;
  }

  if (typeof req.body?.projectId === 'string' && req.body.projectId.length > 0) {
    return req.body.projectId;
  }

  if (typeof req.query.projectId === 'string' && req.query.projectId.length > 0) {
    return req.query.projectId;
  }

  return null;
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

const requirePermission = (permission: Permission) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = getBearerToken(req.headers.authorization);
      if (!token) {
        throw new UnauthorizedError();
      }

      const decoded = decodeAccessToken(token);
      const projectId = getProjectId(req);

      if (!projectId) {
        throw new AppError('Project context is required', 400);
      }

      const membership = await ProjectMemberModel.findOne({
        userId: decoded.sub,
        projectId,
      })
        .select({ role: 1 })
        .lean();

      if (!membership) {
        throw new AppError('You are not a member of this project', 403);
      }

      if (!permissionChecker.hasPermission(membership.role, permission)) {
        throw new AppError('Forbidden', 403);
      }

      req.auth = {
        userId: decoded.sub,
        projectRole: membership.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default requirePermission;