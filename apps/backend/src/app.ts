import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import healthRoutes from './routes/health.js';
import authRoutes from './modules/auth/auth.routes.js';

const app: Express = express();

app.use(helmet());
app.use(
  cors({
    origin: [config.ADMIN_DASHBOARD_URL, config.MOBILE_APP_URL],
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

app.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'NewsFlow API',
      version: '1.0.0',
      environment: config.NODE_ENV,
    },
  });
});

app.use(config.API_PREFIX, healthRoutes);
app.use(`${config.API_PREFIX}/auth`, authRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
