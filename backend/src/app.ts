import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import errorHandler from './middlewares/errorHandler';
import requestLogger from './middlewares/requestLogger';
import authRoutes from './modules/auth/auth.routes';
import { NotFoundError } from './shared/errors';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(requestLogger);
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

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
