import { Response, NextFunction } from 'express';
import { TaskService } from '../services/task.service';
import { AuthRequest } from '../types';
import { getParam } from '../utils/param';

export class TaskController {
  static async createTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.createTask(
        req.user!.userId,
        getParam(req.params.projectId),
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTasksByProject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tasks = await TaskService.getTasksByProject(getParam(req.params.projectId), {
        status: req.query.status as any,
        assignedTo: req.query.assignedTo as any
      });
      res.status(200).json({
        success: true,
        data: tasks
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const task = await TaskService.getTaskById(getParam(req.params.id));
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updated = await TaskService.updateTask(getParam(req.params.id), req.user!.userId, req.body);
      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await TaskService.deleteTask(getParam(req.params.id), req.user!.userId);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updated = await TaskService.updateTaskStatus(getParam(req.params.id), req.user!.userId, req.body.status);
      res.status(200).json({
        success: true,
        message: 'Task status updated',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAssignee(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const updated = await TaskService.updateTaskAssignee(getParam(req.params.id), req.user!.userId, req.body.assignedTo);
      res.status(200).json({
        success: true,
        message: 'Task assignee updated',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
