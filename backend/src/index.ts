import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before any module that reads them
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { S3Client, HeadBucketCommand, CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import prisma from './lib/prisma';
import { loadAuthConfig } from './lib/auth';
import { swaggerSpec } from './lib/swagger';
import { checkMinioHealth } from './lib/storage';
import { jwtAuth } from './middleware/jwtAuth';
import { adminAuth } from './middleware/adminAuth';
import authRouter from './routes/auth';
import betterAuthProxyRouter from './routes/betterAuthProxy';
import adminRouter from './routes/admin';
import rolesRouter from './routes/roles';
import counterRouter from './routes/counter';
import uploadRouter from './routes/upload';
import documentsRouter from './routes/documents';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Swagger UI (public) ───────────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api:
 *   get:
 *     summary: API status
 *     tags:
 *       - Status
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Backend API is running
 */
app.get('/api', (_req, res) => {
  res.json({ message: 'Backend API is running' });
});

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check with live service status
 *     tags:
 *       - Status
 *     responses:
 *       200:
 *         description: All services healthy
 *       503:
 *         description: One or more services degraded
 */
app.get('/api/health', async (_req, res) => {
  const timestamp = new Date().toISOString();

  const dbStart = Date.now();
  let dbOk = false;
  let dbLatencyMs = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    dbLatencyMs = Date.now() - dbStart;
  } catch {
    dbLatencyMs = Date.now() - dbStart;
  }

  const minioHealth = await checkMinioHealth();

  const allOk = dbOk && minioHealth.ok;

  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    timestamp,
    services: {
      api: { ok: true, message: 'Express API is running' },
      database: {
        ok: dbOk,
        latencyMs: dbLatencyMs,
        message: dbOk ? `Connected (${dbLatencyMs}ms)` : 'Connection failed',
      },
      minio: {
        ok: minioHealth.ok,
        latencyMs: minioHealth.latencyMs,
        message: minioHealth.message,
      },
    },
  });
});

// ─── Public Auth Routes ────────────────────────────────────────────────────────
// /api/auth/token must be mounted BEFORE jwtAuth so it is not gated
app.use('/api/auth', authRouter);

// Better Auth routes (session-based; not gated by jwtAuth)
app.use('/api/auth', betterAuthProxyRouter);

// ─── Centralized JWT + RBAC Middleware ────────────────────────────────────────
// Applied globally; public routes are skipped inside the middleware itself.
app.use(jwtAuth);

// ─── Counter Routes (JWT protected) ──────────────────────────────────────────
app.use('/api/counter', counterRouter);

// ─── Document Upload & Storage Routes (JWT protected) ─────────────────────────
app.use('/api/upload', uploadRouter);
app.use('/api/documents', documentsRouter);

// ─── Admin API Routes (x-admin-secret auth; jwtAuth skips /api/admin via PUBLIC_ROUTES) ─
app.use('/api/admin', adminAuth);
app.use('/api/admin', adminRouter);
app.use('/api/admin', rolesRouter);

// ─── 404 for API (no route matched) ─────────────────────────────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path, method: req.method });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

async function ensureMinioReady(): Promise<void> {
  const endpoint = process.env.MINIO_ENDPOINT ?? 'http://minio:9000';
  const bucket = process.env.MINIO_BUCKET ?? 'apptemplate-documents';
  const client = new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
      secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
    },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`MinIO: bucket "${bucket}" ready`);
  } catch {
    try {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`MinIO: created bucket "${bucket}"`);
    } catch (createErr) {
      console.warn(`MinIO: could not create bucket "${bucket}":`, createErr instanceof Error ? createErr.message : createErr);
    }
  }

  try {
    await client.send(new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: {
        CORSRules: [{
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        }],
      },
    }));
    console.log(`MinIO: CORS configured on bucket "${bucket}"`);
  } catch (corsErr) {
    console.warn(`MinIO: could not set CORS on "${bucket}":`, corsErr instanceof Error ? corsErr.message : corsErr);
  }
}

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await loadAuthConfig();
    await ensureMinioReady();

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
      console.log('Auth error responses (4xx/5xx) are normalized to JSON with X-Auth-Error-Normalized header');
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api/docs`);
      console.log(`Auth endpoints available at /api/auth/*`);
      console.log(`Admin endpoints available at /api/admin/*`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
