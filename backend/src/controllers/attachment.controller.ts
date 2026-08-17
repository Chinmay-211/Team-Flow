import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';
import { AttachmentService } from '../services/attachment.service';
import { AuthRequest } from '../types';
import { AppError, NotFoundError } from '../utils/errors';
import { getParam } from '../utils/param';

export class AttachmentController {
  static async uploadAttachment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No file provided for upload', 400);
      }
      const attachment = await AttachmentService.uploadAttachment(
        getParam(req.params.taskId),
        req.user!.userId,
        req.file
      );
      res.status(201).json({
        success: true,
        message: 'Attachment uploaded successfully',
        data: attachment
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAttachments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const attachments = await AttachmentService.getAttachmentsByTask(getParam(req.params.taskId));
      res.status(200).json({
        success: true,
        data: attachments
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAttachment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await AttachmentService.deleteAttachment(getParam(req.params.id), req.user!.userId);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  static async serveLocalFile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const fileName = getParam(req.params.fileName);
      const filePath = path.join(env.UPLOAD_DIR, fileName);

      if (!fs.existsSync(filePath)) {
        throw new NotFoundError('Local file attachment not found');
      }

      res.sendFile(filePath);
    } catch (error) {
      next(error);
    }
  }
}
