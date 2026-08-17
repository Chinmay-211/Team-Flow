import prisma from '../config/database';
import { AppError, NotFoundError } from '../utils/errors';
import { S3Service } from './s3.service';
import { SNSService } from './sns.service';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export class AttachmentService {
  static async uploadAttachment(taskId: string, userId: string, file: Express.Multer.File) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new AppError('File type not supported. Allowed formats: PDF, PNG, JPG, DOCX, TXT', 400);
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { id: true, name: true } } }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const { key, url } = await S3Service.uploadFile(file);

    const attachment = await prisma.attachment.create({
      data: {
        taskId,
        uploadedBy: userId,
        fileName: file.originalname,
        s3Key: key,
        contentType: file.mimetype,
        fileSize: file.size
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });

    await prisma.activity.create({
      data: {
        projectId: task.projectId,
        userId,
        action: 'ATTACHMENT_UPLOADED',
        entityType: 'task',
        entityId: taskId,
        metadata: { fileName: file.originalname, fileSize: file.size }
      }
    });

    await SNSService.publishEvent({
      eventType: 'ATTACHMENT_UPLOADED',
      taskId,
      projectId: task.projectId,
      userId,
      assignedTo: task.assignedTo || undefined,
      title: 'New Attachment Uploaded',
      message: `Attachment "${file.originalname}" was added to task "${task.title}".`
    });

    return {
      ...attachment,
      downloadUrl: url
    };
  }

  static async getAttachmentsByTask(taskId: string) {
    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return Promise.all(
      attachments.map(async (att) => ({
        ...att,
        downloadUrl: await S3Service.getSignedDownloadUrl(att.s3Key)
      }))
    );
  }

  static async deleteAttachment(attachmentId: string, userId: string) {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { task: { select: { projectId: true } } }
    });

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    await S3Service.deleteFile(attachment.s3Key);
    await prisma.attachment.delete({ where: { id: attachmentId } });

    await prisma.activity.create({
      data: {
        projectId: attachment.task.projectId,
        userId,
        action: 'ATTACHMENT_DELETED',
        entityType: 'task',
        entityId: attachment.taskId,
        metadata: { fileName: attachment.fileName }
      }
    });

    return { message: 'Attachment deleted successfully' };
  }
}
