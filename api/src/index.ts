import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import healthDbRouter from './routes/healthDb';
import aiProxyRouter from './routes/ai/proxy';
import exercisesRouter from './routes/exercises';
import usersRouter from './routes/users';

const app = express();

// Security + body parsing
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

// Health checks
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});
app.use('/health/db', healthDbRouter);

// Routes
app.use('/ai', aiProxyRouter);
app.use('/exercises', exercisesRouter);
app.use('/users', usersRouter);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = parseInt(process.env.PORT ?? '3000', 10);
app.listen(PORT, () => {
  console.log('[gym-coach-api] listening on port ' + PORT);
});

export { app };
