import cors from 'cors';
import express from 'express';
import { pool } from './config/database.js';
import { directoryRoutes } from './routes/directory-routes.js';
import { reviewRoutes } from './routes/reviews-routes.js';
import { authenticationRoutes } from './routes/authentication-routes.js';
import { accountsRoutes } from './routes/accounts-routes.js';
import { favoritesRoutes } from './routes/favorites-routes.js';
import { chatRoutes } from './routes/chat-routes.js';
import { requireAllowedOrigin } from './middlewares/same-origin.js';
import { errorHandler } from './middlewares/error-handler.js';

export const app = express();
const apiOrigin = (process.env.API_ORIGIN ?? `http://localhost:${process.env.PORT ?? 3000}`)
  .trim()
  .replace(/\/+$/, '');
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:4200')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.disable('x-powered-by');
if (allowedOrigins.some((origin) => origin !== apiOrigin)) {
  app.use(cors({ origin: allowedOrigins, credentials: true }));
}
app.use(express.json({ limit: '32kb' }));
app.use(requireAllowedOrigin);

app.get('/api/v1/health', async (_request, response, next) => {
  try {
    await pool.query('SELECT 1');
    response.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.use('/api/v1', directoryRoutes);
app.use('/api/v1', authenticationRoutes);
app.use('/api/v1', accountsRoutes);
app.use('/api/v1', favoritesRoutes);
app.use('/api/v1', reviewRoutes);
app.use('/api/v1', chatRoutes);
app.use((_request, response) => {
  response.status(404).json({ code: 'NOT_FOUND', message: 'La ruta solicitada no existe.' });
});
app.use(errorHandler);
