import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { createSignedUrl, deleteFile } from '../lib/storage';
import { createAuditLog } from '../middleware/auditLog';

const router = Router();

const documentSelect = {
  id: true,
  filename: true,
  mimeType: true,
  fileSize: true,
  filePath: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
} as const;

function serializeDocument<T extends { fileSize: bigint }>(doc: T): Omit<T, 'fileSize'> & { fileSize: string } {
  return {
    ...doc,
    fileSize: doc.fileSize.toString(),
  };
}

async function findOwnedDocument(id: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id },
    select: documentSelect,
  });
  if (!doc || doc.userId !== userId) return null;
  return doc;
}

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List current user documents
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document list
 *       401:
 *         description: Unauthorized
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const docs = await prisma.document.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        mimeType: true,
        fileSize: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    res.json(docs.map((doc) => serializeDocument(doc)));
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get a single document
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Document not found
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const doc = await findOwnedDocument(req.params.id, req.user.userId);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    const { filePath: _filePath, ...rest } = doc;
    res.json(serializeDocument(rest));
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * @swagger
 * /api/documents/{id}/url:
 *   post:
 *     summary: Get a presigned download URL
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Presigned URL generated
 *       404:
 *         description: Document not found
 */
router.post('/:id/url', async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const doc = await findOwnedDocument(req.params.id, req.user.userId);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const { signedUrl } = await createSignedUrl(doc.filePath, 3600);
    res.json({ url: signedUrl, filename: doc.filename });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags:
 *       - Documents
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Document deleted
 *       404:
 *         description: Document not found
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const doc = await findOwnedDocument(req.params.id, req.user.userId);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    await deleteFile(doc.filePath);
    await prisma.document.delete({ where: { id: doc.id } });
    await createAuditLog('document.delete', req.user.userId, {
      documentId: doc.id,
      filename: doc.filename,
    });

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

export default router;
