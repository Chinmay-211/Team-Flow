import prisma from '../config/database';
import { NotFoundError } from '../utils/errors';
import { OpenSearchService } from './opensearch.service';
import { SNSService } from './sns.service';

export class CommentService {
  static async addComment(taskId: string, userId: string, content: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { id: true, name: true } } }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });

    await prisma.activity.create({
      data: {
        projectId: task.projectId,
        userId,
        action: 'COMMENT_ADDED',
        entityType: 'task',
        entityId: taskId,
        metadata: { commentId: comment.id, taskTitle: task.title, snippet: content.substring(0, 50) }
      }
    });

    await OpenSearchService.indexDocument({
      id: comment.id,
      type: 'comment',
      projectId: task.projectId,
      projectName: task.project.name,
      title: `Comment on "${task.title}"`,
      content: comment.content,
      createdAt: comment.createdAt
    });

    await SNSService.publishEvent({
      eventType: 'COMMENT_ADDED',
      taskId,
      projectId: task.projectId,
      userId,
      assignedTo: task.assignedTo || undefined,
      title: 'New Comment on Task',
      message: `${comment.user.name} commented on "${task.title}": ${content.substring(0, 60)}`
    });

    return comment;
  }

  static async getCommentsByTask(taskId: string) {
    return prisma.comment.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}
