import crypto from 'crypto';
import prisma from '../config/database';
import { OpenSearchService } from './opensearch.service';
import { RedisService } from './redis.service';

export class SearchService {
  static async search(query: string, userId: string) {
    if (!query || query.trim().length === 0) {
      return { results: [], total: 0, _cached: false };
    }

    const cleanQuery = query.trim();
    const hash = crypto.createHash('md5').update(`${userId}:${cleanQuery}`).digest('hex');
    const cacheKey = `search:${hash}`;

    const cached = await RedisService.get<any>(cacheKey);
    if (cached) {
      return { ...cached, _cached: true };
    }

    // Get project IDs user is authorized to access
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    });
    const userProjectIds = memberships.map((m) => m.projectId);

    if (userProjectIds.length === 0) {
      return { results: [], total: 0, _cached: false };
    }

    const results = await OpenSearchService.search(cleanQuery, userProjectIds);

    const response = {
      query: cleanQuery,
      total: results.length,
      results
    };

    await RedisService.set(cacheKey, response, 120);

    return { ...response, _cached: false };
  }
}
