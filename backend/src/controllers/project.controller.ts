import { Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { AuthRequest } from '../types';
import { getParam } from '../utils/param';

export class ProjectController {
  static async createProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await ProjectService.createProject(req.user!.userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProjects(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const projects = await ProjectService.getProjectsForUser(req.user!.userId);
      res.status(200).json({
        success: true,
        data: projects
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProjectById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const project = await ProjectService.getProjectById(getParam(req.params.id), req.user!.userId);
      res.status(200).json({
        success: true,
        data: project
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updated = await ProjectService.updateProject(getParam(req.params.id), req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ProjectService.deleteProject(getParam(req.params.id), req.user!.userId);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const members = await ProjectService.getMembers(getParam(req.params.id));
      res.status(200).json({
        success: true,
        data: members
      });
    } catch (error) {
      next(error);
    }
  }

  static async addMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const member = await ProjectService.addMember(
        getParam(req.params.id),
        req.user!.userId,
        req.body.email,
        req.body.role
      );
      res.status(201).json({
        success: true,
        message: 'Member added to project',
        data: member
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ProjectService.removeMember(
        getParam(req.params.id),
        req.user!.userId,
        getParam(req.params.userId)
      );
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }
}
