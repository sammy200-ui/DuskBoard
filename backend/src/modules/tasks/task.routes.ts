import { Router } from 'express';
import requireAuth from '../../middlewares/requireAuth';
import requirePermission from '../../middlewares/requirePermission';
import taskController from './task.controller';

const taskRoutes = Router({ mergeParams: true });

taskRoutes.use(requireAuth);

taskRoutes.get('/', taskController.listTasks);
taskRoutes.post('/', requirePermission('task:create'), taskController.createTask);
taskRoutes.get('/:id', taskController.getTask);
taskRoutes.get('/:id/audit', taskController.getTaskAuditLogs);
taskRoutes.get('/:id/valid-transitions', taskController.getValidTransitions);
taskRoutes.put('/:id', taskController.updateTask);
taskRoutes.delete('/:id', requirePermission('task:delete'), taskController.deleteTask);
taskRoutes.patch('/:id/status', taskController.transitionStatus);
taskRoutes.put('/:id/assign', requirePermission('task:assign'), taskController.assignTask);

export default taskRoutes;