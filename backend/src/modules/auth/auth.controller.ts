import { NextFunction, Request, Response } from 'express';
import authService from './auth.service';

class AuthController {
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await authService.login(req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokens = await authService.refresh(req.body);
      res.status(200).json(tokens);
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await authService.logout();
      res.status(200).json({ message: 'Logged out' });
    } catch (error) {
      next(error);
    }
  };
}

const authController = new AuthController();

export default authController;