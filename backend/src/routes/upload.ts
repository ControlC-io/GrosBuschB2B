import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { uploadFile } from '../lib/storage';
import { createAuditLog } from '../middleware/auditLog';

const router = Router();

const COMBINING_MARKS = new RegExp(
  `[${String.fromCharCode(0x300)}-${String.fromCharCode(0x36f)}]`,
  'g',
);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 60 * 1024 * 1024 } });

const PrepareSchema = z.object({
  filename: z.string().min(1).max(500),
  mime_type: z.string().max(200),
  file_size: z.number().int().positive(),
});

/**
 * @swagger
 * /api/upload/prepare:
 *   post:
 *     summary: Prepare a document upload
 *     description: Generates a safe storage path for the upcoming file upload.
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - mime_type
 *               - file_size
 *             properties:
 *               filename:
 *                 type: string
 *               mime_type:
 *                 type: string
 *               file_size:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Upload path generated
 *       401:
 *         description: Unauthorized
 */
router.post('/prepare', async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = PrepareSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const { filename } = parsed.data;
    const safeName = filename.normalize('NFD').replace(COMBINING_MARKS, '').replace(/[^a-zA-Z0-9._-]/g, '_');
    const file_path = `${req.user.userId}/${Date.now()}-${safeName}`;
    res.json({ file_path });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * @swagger
 * /api/upload/file:
 *   post:
 *     summary: Upload a file via backend proxy
 *     description: Proxies multipart upload to MinIO storage.
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - file_path
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               file_path:
 *                 type: string
 *               mime_type:
 *                 type: string
 *     responses:
 *       200:
 *         description: File uploaded
 *       401:
 *         description: Unauthorized
 */
router.post('/file', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const filePath = req.body?.file_path as string;
    const mimeType = (req.body?.mime_type as string) || req.file?.mimetype || 'application/octet-stream';
    if (!filePath) {
      res.status(400).json({ error: 'file_path is required' });
      return;
    }
    if (!filePath.startsWith(`${req.user.userId}/`)) {
      res.status(403).json({ error: 'Forbidden: invalid file path' });
      return;
    }
    if (!req.file?.buffer) {
      res.status(400).json({ error: 'file is required' });
      return;
    }
    await uploadFile(filePath, req.file.buffer, mimeType);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

const ConfirmSchema = z.object({
  file_path: z.string().min(1),
  filename: z.string().min(1).max(500),
  mime_type: z.string().max(200),
  file_size: z.number().int().positive(),
});

/**
 * @swagger
 * /api/upload/confirm:
 *   post:
 *     summary: Confirm a document upload
 *     description: Registers uploaded file metadata in the database.
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - file_path
 *               - filename
 *               - mime_type
 *               - file_size
 *             properties:
 *               file_path:
 *                 type: string
 *               filename:
 *                 type: string
 *               mime_type:
 *                 type: string
 *               file_size:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Document registered
 *       401:
 *         description: Unauthorized
 */
router.post('/confirm', async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = ConfirmSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const { file_path, filename, mime_type, file_size } = parsed.data;
    if (!file_path.startsWith(`${req.user.userId}/`)) {
      res.status(403).json({ error: 'Forbidden: invalid file path' });
      return;
    }

    const doc = await prisma.document.create({
      data: {
        userId: req.user.userId,
        filename,
        filePath: file_path,
        mimeType: mime_type,
        fileSize: BigInt(file_size),
      },
      select: { id: true },
    });

    await createAuditLog('document.upload', req.user.userId, {
      documentId: doc.id,
      filename,
    });

    res.json({ ok: true, document_id: doc.id });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

export default router;
