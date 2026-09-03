import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dbHealthCheck } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import operationRoutes from './routes/operations.routes.js';
import resourceRoutes from './routes/resources.routes.js';
import stateRoutes from './routes/state.routes.js';
import financeRoutes from './routes/finance.routes.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app = express();
const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../Frontend');
// The existing ERP uses inline onclick/onchange handlers. Keep CSP protection
// while explicitly permitting those legacy handlers until the UI is refactored.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'http://127.0.0.1:4000', 'http://localhost:4000']
    }
  }
}));
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(',') || true, methods: ['GET','POST','PATCH','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(frontendDir));

app.get('/api/health', async (req, res, next) => {
  try { await dbHealthCheck(); res.json({ status: 'ok' }); } catch (error) { next(error); }
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/state', stateRoutes);
app.use('/api/finance', financeRoutes);
app.use(notFound);
app.use(errorHandler);
export default app;
