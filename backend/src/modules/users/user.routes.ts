import { Router } from 'express';
import requireAuth from '../../middlewares/requireAuth';
import userController from './user.controller';

const userRoutes = Router();

userRoutes.use(requireAuth);
userRoutes.get('/me', userController.getMyProfile);
userRoutes.put('/me', userController.updateMyProfile);

export default userRoutes;