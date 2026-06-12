import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import type { Readable } from 'stream';
import { config } from '../config/index.js';

let s3Client: S3Client | null = null;

function getClient(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID ?? '',
        secretAccessKey: config.R2_SECRET_ACCESS_KEY ?? '',
      },
    });
  }
  return s3Client;
}

function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    stream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export async function uploadPdf(
  key: string,
  buffer: Buffer,
  contentType = 'application/pdf'
): Promise<string> {
  if (!config.R2_BUCKET_NAME || !config.R2_ACCESS_KEY_ID) {
    return '';
  }

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  if (config.R2_PUBLIC_URL) {
    return `${config.R2_PUBLIC_URL}/${key}`;
  }

  return key;
}

export async function getPdf(key: string): Promise<Buffer | null> {
  if (!config.R2_BUCKET_NAME || !config.R2_ACCESS_KEY_ID) {
    return null;
  }

  try {
    const client = getClient();
    const response = await client.send(
      new GetObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: key,
      })
    );
    if (!response.Body) return null;
    return await streamToBuffer(response.Body as Readable);
  } catch {
    return null;
  }
}
