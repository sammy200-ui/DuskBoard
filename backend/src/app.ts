import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import { auditObserver } from './core/audit';
import errorHandler from './middlewares/errorHandler';
import requestLogger from './middlewares/requestLogger';
import authRoutes from './modules/auth/auth.routes';
import projectRoutes from './modules/projects/project.routes';
import taskRoutes from './modules/tasks/task.routes';
import userRoutes from './modules/users/user.routes';
import { NotFoundError } from './shared/errors';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

auditObserver.start();

app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/tasks', taskRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((_req, _res, next) => {
  next(new NotFoundError('Route'));
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`backend running on port ${port}`);
});

export default app;
