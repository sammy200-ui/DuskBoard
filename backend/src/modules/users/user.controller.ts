import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../../shared/errors';
import userService from './user.service';

class UserController {
  getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const profile = await userService.getProfile(userId);
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  };

  updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const profile = await userService.updateProfile(userId, req.body);
      res.status(200).json(profile);
    } catch (error) {
      next(error);
    }
  };
}

const userController = new UserController();

export default userController;