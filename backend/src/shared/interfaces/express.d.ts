import { ProjectRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        projectRole?: ProjectRole;
      };
    }
  }
}

export {};