import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import prisma from './lib/prisma';
import authRoutes from './routes/authRoutes';
import apiRoutes from './routes/api';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:80', 'http://localhost'];

app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
      callback(null, true);
    } else if (!isProd) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

if (!isProd) {
  app.use((req, _res, next) => {
    if (req.method !== 'GET') {
      console.log(`[${req.method}] ${req.url}`);
    }
    next();
  });
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 500 : 1000,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);
app.use('/auth', limiter);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', env: NODE_ENV });
  } catch {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
  res.json({
    name: 'Construction ERP API',
    version: '1.0.0',
    health: '/health',
  });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack || err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(!isProd && { error: err }),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Construction ERP API running on port ${PORT} (${NODE_ENV})`);
});
