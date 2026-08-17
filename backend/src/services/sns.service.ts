import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import prisma from '../config/database';
import { env } from '../config/env';
import logger from '../config/logger';

let snsClient: SNSClient | null = null;
const useRealSNS = Boolean(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_SNS_TOPIC_ARN);

if (useRealSNS) {
  snsClient = new SNSClient({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!
    }
  });
  logger.info('Initialized AWS SNS Client');
} else {
  logger.info('AWS SNS topic not configured. Events will fallback to direct in-app processing.');
}

export interface EventPayload {
  eventType: 'TASK_CREATED' | 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'COMMENT_ADDED' | 'ATTACHMENT_UPLOADED';
  taskId?: string;
  projectId?: string;
  userId?: string;
  assignedTo?: string;
  createdBy?: string;
  title?: string;
  message?: string;
  metadata?: any;
}

export class SNSService {
  static async publishEvent(event: EventPayload): Promise<void> {
    logger.info(`[SNS] Publishing event: ${event.eventType}`, event);

    if (useRealSNS && snsClient && env.AWS_SNS_TOPIC_ARN) {
      try {
        const command = new PublishCommand({
          TopicArn: env.AWS_SNS_TOPIC_ARN,
          Message: JSON.stringify(event),
          MessageAttributes: {
            eventType: {
              DataType: 'String',
              StringValue: event.eventType
            }
          }
        });
        await snsClient.send(command);
        logger.info(`Successfully published ${event.eventType} to SNS Topic`);
        return;
      } catch (error: any) {
        logger.error('Failed to publish to SNS, using fallback:', error.message);
      }
    }

    // Local Fallback Event Processor (simulates SNS -> SQS -> Worker flow locally)
    await this.processEventDirectly(event);
  }

  private static async processEventDirectly(event: EventPayload): Promise<void> {
    try {
      if (event.eventType === 'TASK_ASSIGNED' && event.assignedTo) {
        await prisma.notification.create({
          data: {
            userId: event.assignedTo,
            type: event.eventType,
            title: event.title || 'Task Assigned',
            message: event.message || `You were assigned a task.`
          }
        });
      } else if (event.eventType === 'COMMENT_ADDED' && event.assignedTo && event.userId !== event.assignedTo) {
        await prisma.notification.create({
          data: {
            userId: event.assignedTo,
            type: event.eventType,
            title: event.title || 'New Comment',
            message: event.message || 'Someone commented on your task.'
          }
        });
      } else if (event.eventType === 'TASK_STATUS_CHANGED' && event.assignedTo && event.userId !== event.assignedTo) {
        await prisma.notification.create({
          data: {
            userId: event.assignedTo,
            type: event.eventType,
            title: event.title || 'Task Status Updated',
            message: event.message || 'A task assigned to you changed status.'
          }
        });
      }
    } catch (err: any) {
      logger.error('Error executing direct event notification fallback:', err.message);
    }
  }
}
