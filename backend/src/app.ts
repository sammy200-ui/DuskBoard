import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import requestLogger from './middlewares/requestLogger';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(requestLogger);
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`backend running on port ${port}`);
});

export default app;
