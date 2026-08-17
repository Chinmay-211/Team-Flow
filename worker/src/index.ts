import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { PrismaClient } from '@prisma/client';
import winston from 'winston';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'teamflow-worker' },
  transports: [new winston.transports.Console()]
});

const prisma = new PrismaClient();

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const QUEUE_URL = process.env.AWS_SQS_QUEUE_URL || '';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

let sqsClient: SQSClient | null = null;
const useRealSQS = Boolean(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && QUEUE_URL);

if (useRealSQS) {
  sqsClient = new SQSClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID!,
      secretAccessKey: AWS_SECRET_ACCESS_KEY!
    }
  });
  logger.info(`Worker connected to SQS Queue: ${QUEUE_URL}`);
} else {
  logger.info('AWS SQS Queue URL not configured. Worker operating in local standby monitoring mode.');
}

async function processMessageBody(bodyStr: string): Promise<boolean> {
  try {
    let payload = JSON.parse(bodyStr);
    // If wrapped by SNS envelope
    if (payload.Message && typeof payload.Message === 'string') {
      payload = JSON.parse(payload.Message);
    }

    const { eventType, taskId, projectId, assignedTo, userId, title, message } = payload;
    logger.info(`Processing event in worker: ${eventType}`, { taskId, assignedTo, userId });

    if (!eventType) {
      logger.warn('Skipping invalid event without eventType');
      return true;
    }

    // Idempotent processing logic for Notifications
    if (eventType === 'TASK_ASSIGNED' && assignedTo) {
      await prisma.notification.create({
        data: {
          userId: assignedTo,
          type: eventType,
          title: title || 'Task Assigned',
          message: message || 'You were assigned a new task.'
        }
      });
    } else if (eventType === 'COMMENT_ADDED' && assignedTo && userId !== assignedTo) {
      await prisma.notification.create({
        data: {
          userId: assignedTo,
          type: eventType,
          title: title || 'New Comment',
          message: message || 'A comment was added to your task.'
        }
      });
    } else if (eventType === 'TASK_STATUS_CHANGED' && assignedTo && userId !== assignedTo) {
      await prisma.notification.create({
        data: {
          userId: assignedTo,
          type: eventType,
          title: title || 'Task Status Updated',
          message: message || 'A task assigned to you updated its status.'
        }
      });
    }

    return true;
  } catch (error: any) {
    logger.error('Error processing SQS event payload:', error.message);
    return false; // Retain message in queue for retry/DLQ
  }
}

async function pollSQSQueue() {
  if (!useRealSQS || !sqsClient || !QUEUE_URL) {
    logger.info('Worker standby heartbeat (local fallback mode active)');
    return;
  }

  try {
    const receiveCommand = new ReceiveMessageCommand({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: 10,
      VisibilityTimeout: 30
    });

    const response = await sqsClient.send(receiveCommand);

    if (response.Messages && response.Messages.length > 0) {
      logger.info(`Received ${response.Messages.length} messages from SQS`);

      for (const msg of response.Messages) {
        if (!msg.Body || !msg.ReceiptHandle) continue;

        const success = await processMessageBody(msg.Body);
        if (success) {
          // Delete processed message from SQS
          const deleteCommand = new DeleteMessageCommand({
            QueueUrl: QUEUE_URL,
            ReceiptHandle: msg.ReceiptHandle
          });
          await sqsClient.send(deleteCommand);
          logger.info(`Deleted message ${msg.MessageId} from SQS`);
        }
      }
    }
  } catch (error: any) {
    logger.error('Error polling SQS queue:', error.message);
  }
}

async function startWorker() {
  logger.info('🚀 TeamFlow SQS Notification Worker Service Started');
  while (true) {
    await pollSQSQueue();
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

startWorker().catch((err) => logger.error('Fatal worker error:', err));
