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
import programsRouter from './routes/programs';
import workoutsRouter from './routes/workouts';
import nutritionRouter from './routes/nutrition';
import cardioRouter from './routes/cardio';
import chatRouter from './routes/chat';
import subscriptionsRouter from './routes/subscriptions';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));

// Stripe webhook needs raw body — register BEFORE express.json()
app.use('/subscriptions/webhook', express.raw({ type: 'application/json' }));

// Body parsing for all other routes
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
app.use('/programs', programsRouter);
app.use('/workouts', workoutsRouter);
app.use('/nutrition', nutritionRouter);
app.use('/cardio', cardioRouter);
app.use('/chat', chatRouter);
app.use('/subscriptions', subscriptionsRouter);

// Global error handler (must be last)
app.use(errorHandler);

const PORT = parseInt(process.env.PORT ?? '3000', 10);
app.listen(PORT, () => {
  console.log('[gym-coach-api] listening on port ' + PORT);
});

export { app };
