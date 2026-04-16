import { ProjectRole } from '../domain/enums';

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