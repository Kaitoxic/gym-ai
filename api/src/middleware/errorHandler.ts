import { ErrorRequestHandler } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = (err as any).status ?? (err as any).statusCode ?? 500;
  const message = err.message ?? 'Internal server error';
  res.status(status).json({ error: message });
};
