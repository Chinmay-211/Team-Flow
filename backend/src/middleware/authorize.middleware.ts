import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';

export const authorizeProjectRole = (allowedRoles: Role[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }

      const paramProj = req.params.projectId || req.params.id;
      let projectId = Array.isArray(paramProj) ? paramProj[0] : paramProj;

      if (!projectId && req.params.taskId) {
        const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          select: { projectId: true }
        });
        if (!task) {
          return next(new NotFoundError('Task not found'));
        }
        projectId = task.projectId;
      }

      if (!projectId) {
        return next(new ForbiddenError('Project ID is required for authorization check'));
      }

      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.userId
          }
        }
      });

      if (!membership) {
        return next(new ForbiddenError('You are not a member of this project'));
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
        return next(new ForbiddenError(`Requires one of the following roles: ${allowedRoles.join(', ')}`));
      }

      req.projectMembership = {
        projectId: membership.projectId,
        userId: membership.userId,
        role: membership.role
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
