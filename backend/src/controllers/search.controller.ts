import { Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';
import { AuthRequest } from '../types';

export class SearchController {
  static async search(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = (req.query.q as string) || '';
      const result = await SearchService.search(query, req.user!.userId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
