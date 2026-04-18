import { NextFunction, Request, Response } from 'express';
import { AppError, UnauthorizedError } from '../../shared/errors';
import taskService from './task.service';

const readParam = (value: string | string[] | undefined, key: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError(`Missing route param: ${key}`, 400);
  }

  return value;
};

class TaskController {
  listTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const tasks = await taskService.listTasks(userId, projectId);
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  };

  createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const task = await taskService.createTask(userId, projectId, req.body);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  };

  getTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const taskId = readParam(req.params.id, 'id');
      const task = await taskService.getTask(userId, projectId, taskId);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  };

  getTaskAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const taskId = readParam(req.params.id, 'id');
      const logs = await taskService.getTaskAuditLogs(userId, projectId, taskId);
      res.status(200).json(logs);
    } catch (error) {
      next(error);
    }
  };

  getValidTransitions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const taskId = readParam(req.params.id, 'id');
      const transitions = await taskService.getTaskValidTransitions(userId, projectId, taskId);
      res.status(200).json(transitions);
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const taskId = readParam(req.params.id, 'id');
      const task = await taskService.updateTask(userId, projectId, taskId, req.body);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const taskId = readParam(req.params.id, 'id');
      await taskService.deleteTask(userId, projectId, taskId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  transitionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const taskId = readParam(req.params.id, 'id');
      const task = await taskService.transitionTaskStatus(userId, projectId, taskId, req.body);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  };

  assignTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const taskId = readParam(req.params.id, 'id');
      const task = await taskService.assignTask(userId, projectId, taskId, req.body);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  };
}

const taskController = new TaskController();

export default taskController;