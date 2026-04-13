import { NextFunction, Request, Response } from 'express';

const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startedAt = Date.now();
  const { method, originalUrl } = req;

  res.on('finish', () => {
    const elapsedMs = Date.now() - startedAt;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${method} ${originalUrl} ${res.statusCode} ${elapsedMs}ms`);
  });

  next();
};

export default requestLogger;