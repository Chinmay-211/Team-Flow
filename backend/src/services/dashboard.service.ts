import prisma from '../config/database';
import { TaskStatus } from '@prisma/client';
import { RedisService } from './redis.service';

export class DashboardService {
  static async getDashboardData(userId: string) {
    const cacheKey = `dashboard:user:${userId}`;
    const cached = await RedisService.get<any>(cacheKey);
    if (cached) {
      return { ...cached, _cached: true };
    }

    // Get project IDs user belongs to
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    });
    const userProjectIds = memberships.map((m) => m.projectId);

    const totalProjects = userProjectIds.length;

    const myTasksCount = await prisma.task.count({
      where: { assignedTo: userId }
    });

    const completedTasksCount = await prisma.task.count({
      where: { assignedTo: userId, status: TaskStatus.DONE }
    });

    const pendingTasksCount = await prisma.task.count({
      where: { assignedTo: userId, status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] } }
    });

    const recentProjects = await prisma.project.findMany({
      where: { id: { in: userProjectIds } },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { members: true, tasks: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    const recentActivities = await prisma.activity.findMany({
      where: { projectId: { in: userProjectIds } },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const myRecentTasks = await prisma.task.findMany({
      where: { assignedTo: userId, status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] } },
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true, attachments: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    });

    const dashboardData = {
      summary: {
        totalProjects,
        myTasks: myTasksCount,
        completedTasks: completedTasksCount,
        pendingTasks: pendingTasksCount
      },
      recentProjects,
      recentActivities,
      myRecentTasks
    };

    await RedisService.set(cacheKey, dashboardData, 60);

    return { ...dashboardData, _cached: false };
  }
}
