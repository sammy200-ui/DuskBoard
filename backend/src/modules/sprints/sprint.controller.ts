import { NextFunction, Request, Response } from 'express';
import { AppError, UnauthorizedError } from '../../shared/errors';
import sprintService from './sprint.service';

const readParam = (value: string | string[] | undefined, key: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError(`Missing route param: ${key}`, 400);
  }

  return value;
};

class SprintController {
  listSprints = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const sprints = await sprintService.listSprints(userId, projectId);
      res.status(200).json(sprints);
    } catch (error) {
      next(error);
    }
  };

  createSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const sprint = await sprintService.createSprint(userId, projectId, req.body);
      res.status(201).json(sprint);
    } catch (error) {
      next(error);
    }
  };

  updateSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const sprintId = readParam(req.params.id, 'id');
      const sprint = await sprintService.updateSprint(userId, projectId, sprintId, req.body);
      res.status(200).json(sprint);
    } catch (error) {
      next(error);
    }
  };

  startSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const sprintId = readParam(req.params.id, 'id');
      const sprint = await sprintService.startSprint(userId, projectId, sprintId);
      res.status(200).json(sprint);
    } catch (error) {
      next(error);
    }
  };

  completeSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const sprintId = readParam(req.params.id, 'id');
      const result = await sprintService.completeSprint(userId, projectId, sprintId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  listSprintTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const sprintId = readParam(req.params.id, 'id');
      const tasks = await sprintService.listSprintTasks(userId, projectId, sprintId);
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  };

  addTaskToSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const sprintId = readParam(req.params.id, 'id');
      const taskId = readParam(req.params.taskId, 'taskId');

      const task = await sprintService.addTaskToSprint(userId, projectId, sprintId, taskId);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  };

  removeTaskFromSprint = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.projectId, 'projectId');
      const sprintId = readParam(req.params.id, 'id');
      const taskId = readParam(req.params.taskId, 'taskId');

      const task = await sprintService.removeTaskFromSprint(userId, projectId, sprintId, taskId);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  };
}

const sprintController = new SprintController();

export default sprintController;