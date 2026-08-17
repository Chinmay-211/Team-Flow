import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/teamflow?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'teamflow_super_secret_jwt_key_interview_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'teamflow-attachments-bucket',
  AWS_SNS_TOPIC_ARN: process.env.AWS_SNS_TOPIC_ARN || '',
  AWS_SQS_QUEUE_URL: process.env.AWS_SQS_QUEUE_URL || '',
  OPENSEARCH_ENDPOINT: process.env.OPENSEARCH_ENDPOINT || '',
  UPLOAD_DIR: path.resolve(__dirname, '../../uploads')
};
