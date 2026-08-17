import prisma from '../config/database';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { NotFoundError } from '../utils/errors';
import { OpenSearchService } from './opensearch.service';
import { RedisService } from './redis.service';
import { SNSService } from './sns.service';

export class TaskService {
  static async createTask(
    userId: string,
    projectId: string,
    data: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedTo?: string;
      dueDate?: string;
    }
  ) {
    const task = await prisma.task.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        status: data.status || TaskStatus.TODO,
        priority: data.priority || TaskPriority.MEDIUM,
        createdBy: userId,
        assignedTo: data.assignedTo || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true } }
      }
    });

    // Activity Log
    await prisma.activity.create({
      data: {
        projectId,
        userId,
        action: 'TASK_CREATED',
        entityType: 'task',
        entityId: task.id,
        metadata: { title: task.title, status: task.status, priority: task.priority }
      }
    });

    // OpenSearch Index
    await OpenSearchService.indexDocument({
      id: task.id,
      type: 'task',
      projectId: task.projectId,
      projectName: task.project.name,
      title: task.title,
      description: task.description || '',
      createdAt: task.createdAt
    });

    // Invalidate Caches
    await RedisService.invalidateDashboard(userId);
    if (data.assignedTo) {
      await RedisService.invalidateDashboard(data.assignedTo);
    }
    await RedisService.invalidateSearch();

    // SNS Event
    await SNSService.publishEvent({
      eventType: 'TASK_CREATED',
      taskId: task.id,
      projectId,
      createdBy: userId,
      assignedTo: task.assignedTo || undefined,
      title: 'New Task Created',
      message: `Task "${task.title}" was created.`
    });

    if (task.assignedTo) {
      await SNSService.publishEvent({
        eventType: 'TASK_ASSIGNED',
        taskId: task.id,
        projectId,
        createdBy: userId,
        assignedTo: task.assignedTo,
        title: 'Task Assigned to You',
        message: `You were assigned task "${task.title}".`
      });
    }

    return task;
  }

  static async getTasksByProject(projectId: string, filters?: { status?: TaskStatus; assignedTo?: string }) {
    return prisma.task.findMany({
      where: {
        projectId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.assignedTo && { assignedTo: filters.assignedTo })
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        _count: { select: { comments: true, attachments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getTaskById(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        attachments: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Fetch related activities for this task
    const activities = await prisma.activity.findMany({
      where: { entityId: taskId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return { ...task, activities };
  }

  static async updateTask(
    taskId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedTo?: string | null;
      dueDate?: string | null;
    }
  ) {
    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      throw new NotFoundError('Task not found');
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null })
      },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        project: { select: { id: true, name: true } }
      }
    });

    await prisma.activity.create({
      data: {
        projectId: updated.projectId,
        userId,
        action: 'TASK_UPDATED',
        entityType: 'task',
        entityId: taskId,
        metadata: data
      }
    });

    await RedisService.invalidateDashboard(userId);
    await RedisService.invalidateSearch();

    return updated;
  }

  static async deleteTask(taskId: string, userId: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    await prisma.task.delete({ where: { id: taskId } });

    await prisma.activity.create({
      data: {
        projectId: task.projectId,
        userId,
        action: 'TASK_DELETED',
        entityType: 'task',
        entityId: taskId,
        metadata: { title: task.title }
      }
    });

    await RedisService.invalidateDashboard(userId);
    await RedisService.invalidateSearch();

    return { message: 'Task deleted successfully' };
  }

  static async updateTaskStatus(taskId: string, userId: string, newStatus: TaskStatus) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { name: true } } }
    });
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const oldStatus = task.status;
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });

    // Activity Log
    await prisma.activity.create({
      data: {
        projectId: task.projectId,
        userId,
        action: 'TASK_STATUS_CHANGED',
        entityType: 'task',
        entityId: taskId,
        metadata: { oldStatus, newStatus, title: task.title }
      }
    });

    await RedisService.invalidateDashboard();

    // SNS Event
    await SNSService.publishEvent({
      eventType: newStatus === TaskStatus.DONE ? 'TASK_COMPLETED' : ('TASK_STATUS_CHANGED' as any),
      taskId,
      projectId: task.projectId,
      userId,
      assignedTo: task.assignedTo || undefined,
      title: `Task Status: ${newStatus}`,
      message: `Task "${task.title}" status changed from ${oldStatus} to ${newStatus}.`
    });

    return updated;
  }

  static async updateTaskAssignee(taskId: string, userId: string, assignedToUserId: string | null) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { name: true } } }
    });
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { assignedTo: assignedToUserId },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });

    await prisma.activity.create({
      data: {
        projectId: task.projectId,
        userId,
        action: 'TASK_ASSIGNED',
        entityType: 'task',
        entityId: taskId,
        metadata: { assignedTo: assignedToUserId, title: task.title }
      }
    });

    if (assignedToUserId) {
      await RedisService.invalidateDashboard(assignedToUserId);
      await SNSService.publishEvent({
        eventType: 'TASK_ASSIGNED',
        taskId,
        projectId: task.projectId,
        userId,
        assignedTo: assignedToUserId,
        title: 'Task Assigned to You',
        message: `Task "${task.title}" in project "${task.project.name}" was assigned to you.`
      });
    }

    return updated;
  }
}
