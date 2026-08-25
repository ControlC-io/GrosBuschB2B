import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const S3_CONFIG = {
  region: 'us-east-1',
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED' as const,
  responseChecksumValidation: 'WHEN_REQUIRED' as const,
};

function createS3Client(endpoint: string): S3Client {
  const accessKeyId = process.env.MINIO_ACCESS_KEY;
  const secretAccessKey = process.env.MINIO_SECRET_KEY;
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('MinIO is not configured. Set MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY in .env.');
  }
  return new S3Client({ ...S3_CONFIG, endpoint, credentials: { accessKeyId, secretAccessKey } });
}

let _client: S3Client | undefined;
let _signingClient: S3Client | undefined;

function getClient(): S3Client {
  if (!_client) _client = createS3Client(process.env.MINIO_ENDPOINT ?? 'http://minio:9000');
  return _client;
}

function getSigningClient(): S3Client {
  const publicUrl = process.env.MINIO_PUBLIC_URL?.trim();
  const endpoint = publicUrl ?? process.env.MINIO_ENDPOINT ?? 'http://minio:9000';
  if (!_signingClient) _signingClient = createS3Client(endpoint);
  return _signingClient;
}

function getBucket(): string {
  return process.env.MINIO_BUCKET ?? 'grosbuschb2b-documents';
}

export async function checkMinioHealth(): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const start = Date.now();
  try {
    await getClient().send(new HeadBucketCommand({ Bucket: getBucket() }));
    const latencyMs = Date.now() - start;
    return { ok: true, latencyMs, message: `Connected (${latencyMs}ms)` };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Connection failed';
    return { ok: false, latencyMs, message };
  }
}

export async function createSignedUploadUrl(
  filePath: string,
  expiresInSeconds = 3600,
): Promise<{ signedUrl: string }> {
  const cmd = new PutObjectCommand({ Bucket: getBucket(), Key: filePath });
  const signedUrl = await getSignedUrl(getSigningClient(), cmd, { expiresIn: expiresInSeconds });
  return { signedUrl };
}

export async function createSignedUrl(
  filePath: string,
  expiresInSeconds = 3600,
): Promise<{ signedUrl: string }> {
  const cmd = new GetObjectCommand({ Bucket: getBucket(), Key: filePath });
  const signedUrl = await getSignedUrl(getSigningClient(), cmd, { expiresIn: expiresInSeconds });
  return { signedUrl };
}

export async function uploadFile(
  filePath: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  const cmd = new PutObjectCommand({
    Bucket: getBucket(),
    Key: filePath,
    Body: body,
    ContentType: contentType,
    ContentLength: body.length,
  });
  await getClient().send(cmd);
}

export async function downloadFile(filePath: string): Promise<Buffer> {
  const cmd = new GetObjectCommand({ Bucket: getBucket(), Key: filePath });
  const res = await getClient().send(cmd);
  if (!res.Body) throw new Error(`Storage: empty response body for key "${filePath}"`);
  const chunks: Uint8Array[] = [];
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function deleteFile(filePath: string): Promise<void> {
  const cmd = new DeleteObjectCommand({ Bucket: getBucket(), Key: filePath });
  await getClient().send(cmd);
}

export function getInternalS3Client(): S3Client {
  return getClient();
}

export function getStorageBucket(): string {
  return getBucket();
}
