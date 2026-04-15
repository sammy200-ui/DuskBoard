import { NextFunction, Request, Response } from 'express';
import { AppError, UnauthorizedError } from '../../shared/errors';
import projectService from './project.service';

const readParam = (value: string | string[] | undefined, key: string): string => {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError(`Missing route param: ${key}`, 400);
  }

  return value;
};

class ProjectController {
  listProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projects = await projectService.listProjects(userId);
      res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  };

  createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const project = await projectService.createProject(userId, req.body);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  };

  getProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.id, 'id');
      const project = await projectService.getProject(userId, projectId);
      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = readParam(req.params.id, 'id');
      const project = await projectService.updateProject(projectId, req.body);
      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = readParam(req.params.id, 'id');
      await projectService.deleteProject(projectId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  listMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.id, 'id');
      const members = await projectService.listProjectMembers(userId, projectId);
      res.status(200).json(members);
    } catch (error) {
      next(error);
    }
  };

  addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.id, 'id');
      const member = await projectService.addProjectMember(userId, projectId, req.body);
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  };

  updateMemberRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.id, 'id');
      const targetUserId = readParam(req.params.userId, 'userId');

      const member = await projectService.updateProjectMemberRole(
        userId,
        projectId,
        targetUserId,
        req.body,
      );

      res.status(200).json(member);
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        throw new UnauthorizedError();
      }

      const projectId = readParam(req.params.id, 'id');
      const targetUserId = readParam(req.params.userId, 'userId');

      await projectService.removeProjectMember(userId, projectId, targetUserId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}

const projectController = new ProjectController();

export default projectController;