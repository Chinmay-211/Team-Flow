import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import logger from '../config/logger';

let s3Client: S3Client | null = null;
const useRealS3 = Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY);

if (useRealS3) {
  s3Client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
    }
  });
  logger.info('Initialized AWS S3 Client with provided credentials');
} else {
  logger.info('AWS S3 credentials not provided. Using local disk fallback for attachments.');
  if (!fs.existsSync(env.UPLOAD_DIR)) {
    fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
  }
}

export class S3Service {
  static async uploadFile(file: Express.Multer.File, keyPrefix: string = 'attachments'): Promise<{ key: string; url: string }> {
    const fileExtension = path.extname(file.originalname);
    const key = `${keyPrefix}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}${fileExtension}`;

    if (useRealS3 && s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype
        });
        await s3Client.send(command);
        const signedUrl = await this.getSignedDownloadUrl(key);
        return { key, url: signedUrl };
      } catch (error: any) {
        logger.error('Error uploading file to AWS S3, using fallback:', error.message);
      }
    }

    // Local Storage Fallback
    const localPath = path.join(env.UPLOAD_DIR, key.replace(/\//g, '_'));
    await fs.promises.writeFile(localPath, file.buffer);
    const localUrl = `/api/attachments/local/${key.replace(/\//g, '_')}`;
    return { key, url: localUrl };
  }

  static async deleteFile(key: string): Promise<void> {
    if (useRealS3 && s3Client) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key
        });
        await s3Client.send(command);
        return;
      } catch (error: any) {
        logger.warn('Error deleting file from AWS S3:', error.message);
      }
    }

    // Local Storage Fallback Delete
    const localPath = path.join(env.UPLOAD_DIR, key.replace(/\//g, '_'));
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath);
    }
  }

  static async getSignedDownloadUrl(key: string): Promise<string> {
    if (useRealS3 && s3Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: env.AWS_S3_BUCKET,
          Key: key
        });
        return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      } catch (error: any) {
        logger.warn('Error generating S3 presigned URL:', error.message);
      }
    }
    return `/api/attachments/local/${key.replace(/\//g, '_')}`;
  }
}
