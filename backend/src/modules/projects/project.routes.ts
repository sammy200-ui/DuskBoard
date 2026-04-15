import { Router } from 'express';
import requireAuth from '../../middlewares/requireAuth';
import requirePermission from '../../middlewares/requirePermission';
import projectController from './project.controller';

const projectRoutes = Router();

projectRoutes.use(requireAuth);

projectRoutes.get('/', projectController.listProjects);
projectRoutes.post('/', projectController.createProject);
projectRoutes.get('/:id', projectController.getProject);
projectRoutes.put('/:id', requirePermission('project:settings'), projectController.updateProject);
projectRoutes.delete('/:id', requirePermission('project:settings'), projectController.deleteProject);

projectRoutes.get('/:id/members', projectController.listMembers);
projectRoutes.post('/:id/members', requirePermission('user:manage'), projectController.addMember);
projectRoutes.put('/:id/members/:userId', requirePermission('user:manage'), projectController.updateMemberRole);
projectRoutes.delete(
  '/:id/members/:userId',
  requirePermission('user:manage'),
  projectController.removeMember,
);

export default projectRoutes;