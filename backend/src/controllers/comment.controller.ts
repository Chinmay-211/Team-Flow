import { Response, NextFunction } from 'express';
import { CommentService } from '../services/comment.service';
import { AuthRequest } from '../types';
import { getParam } from '../utils/param';

export class CommentController {
  static async addComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comment = await CommentService.addComment(
        getParam(req.params.taskId),
        req.user!.userId,
        req.body.content
      );
      res.status(201).json({
        success: true,
        message: 'Comment added',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  static async getComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const comments = await CommentService.getCommentsByTask(getParam(req.params.taskId));
      res.status(200).json({
        success: true,
        data: comments
      });
    } catch (error) {
      next(error);
    }
  }
}
