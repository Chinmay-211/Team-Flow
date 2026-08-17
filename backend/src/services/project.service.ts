import prisma from '../config/database';
import { Role } from '@prisma/client';
import { AppError, ForbiddenError, NotFoundError } from '../utils/errors';
import { OpenSearchService } from './opensearch.service';
import { RedisService } from './redis.service';

export class ProjectService {
  static async createProject(userId: string, data: { name: string; description?: string }) {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: Role.OWNER
          }
        },
        activities: {
          create: {
            userId,
            action: 'PROJECT_CREATED',
            entityType: 'project',
            entityId: '', // updated after creation
            metadata: { name: data.name }
          }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          }
        }
      }
    });

    // Update entityId in activity
    await prisma.activity.updateMany({
      where: { projectId: project.id, entityId: '' },
      data: { entityId: project.id }
    });

    // Index to OpenSearch
    await OpenSearchService.indexDocument({
      id: project.id,
      type: 'project',
      projectId: project.id,
      projectName: project.name,
      title: project.name,
      description: project.description || '',
      createdAt: project.createdAt
    });

    // Invalidate Redis dashboard cache
    await RedisService.invalidateDashboard(userId);

    return project;
  }

  static async getProjectsForUser(userId: string) {
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
            _count: {
              select: {
                members: true,
                tasks: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return memberships.map((m) => ({
      ...m.project,
      role: m.role,
      memberCount: m.project._count.members,
      taskCount: m.project._count.tasks
    }));
  }

  static async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
            creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
            _count: { select: { comments: true, attachments: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 15
        }
      }
    });

    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const userMembership = project.members.find((m) => m.userId === userId);
    if (!userMembership) {
      throw new ForbiddenError('You are not a member of this project');
    }

    return {
      ...project,
      userRole: userMembership.role
    };
  }

  static async updateProject(projectId: string, userId: string, data: { name?: string; description?: string }) {
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description })
      }
    });

    await prisma.activity.create({
      data: {
        projectId,
        userId,
        action: 'PROJECT_UPDATED',
        entityType: 'project',
        entityId: projectId,
        metadata: data
      }
    });

    await RedisService.invalidateDashboard();
    return updated;
  }

  static async deleteProject(projectId: string, userId: string) {
    await prisma.project.delete({
      where: { id: projectId }
    });

    await RedisService.invalidateDashboard();
    await RedisService.invalidateSearch();
    return { message: 'Project deleted successfully' };
  }

  static async getMembers(projectId: string) {
    return prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });
  }

  static async addMember(projectId: string, inviterUserId: string, email: string, role: Role = Role.MEMBER) {
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!targetUser) {
      throw new NotFoundError('User with this email was not found');
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: targetUser.id }
      }
    });

    if (existingMember) {
      throw new AppError('User is already a member of this project', 400);
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUser.id,
        role
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });

    await prisma.activity.create({
      data: {
        projectId,
        userId: inviterUserId,
        action: 'MEMBER_ADDED',
        entityType: 'user',
        entityId: targetUser.id,
        metadata: { addedEmail: email, role }
      }
    });

    await RedisService.invalidateDashboard(targetUser.id);
    return newMember;
  }

  static async removeMember(projectId: string, inviterUserId: string, targetUserId: string) {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId: targetUserId }
      }
    });

    await prisma.activity.create({
      data: {
        projectId,
        userId: inviterUserId,
        action: 'MEMBER_REMOVED',
        entityType: 'user',
        entityId: targetUserId
      }
    });

    await RedisService.invalidateDashboard(targetUserId);
    return { message: 'Member removed successfully' };
  }
}
