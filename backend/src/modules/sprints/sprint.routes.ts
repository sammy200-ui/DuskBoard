import { Router } from 'express';
import requireAuth from '../../middlewares/requireAuth';
import requirePermission from '../../middlewares/requirePermission';
import sprintController from './sprint.controller';

const sprintRoutes = Router({ mergeParams: true });

sprintRoutes.use(requireAuth);

sprintRoutes.get('/', sprintController.listSprints);
sprintRoutes.post('/', requirePermission('sprint:create'), sprintController.createSprint);
sprintRoutes.put('/:id', requirePermission('sprint:create'), sprintController.updateSprint);
sprintRoutes.patch('/:id/start', requirePermission('sprint:start'), sprintController.startSprint);
sprintRoutes.patch('/:id/complete', requirePermission('sprint:complete'), sprintController.completeSprint);

sprintRoutes.get('/:id/tasks', sprintController.listSprintTasks);
sprintRoutes.post('/:id/tasks/:taskId', requirePermission('sprint:create'), sprintController.addTaskToSprint);
sprintRoutes.delete(
  '/:id/tasks/:taskId',
  requirePermission('sprint:create'),
  sprintController.removeTaskFromSprint,
);

export default sprintRoutes;