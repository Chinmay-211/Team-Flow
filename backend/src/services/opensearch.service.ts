import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import prisma from '../config/database';
import { env } from '../config/env';
import logger from '../config/logger';

let osClient: Client | null = null;
const INDEX_NAME = 'teamflow-content';

if (env.OPENSEARCH_ENDPOINT) {
  try {
    osClient = new Client({
      ...AwsSigv4Signer({
        region: env.AWS_REGION || 'us-east-1',
        service: 'es',
        getCredentials: () => defaultProvider()()
      }),
      node: env.OPENSEARCH_ENDPOINT
    });
    logger.info(`Initialized OpenSearch Client with AWS SigV4 at ${env.OPENSEARCH_ENDPOINT}`);
  } catch (error: any) {
    logger.warn('Failed to initialize OpenSearch client:', error.message);
  }
} else {
  logger.info('OpenSearch endpoint not configured. Using PostgreSQL Full-Text Search fallback.');
}

export class OpenSearchService {
  static async ensureIndexExists(): Promise<void> {
    if (!osClient) return;
    try {
      const exists = await osClient.indices.exists({ index: INDEX_NAME });
      if (!exists.body) {
        await osClient.indices.create({
          index: INDEX_NAME,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                type: { type: 'keyword' },
                projectId: { type: 'keyword' },
                projectName: { type: 'text' },
                title: { type: 'text' },
                description: { type: 'text' },
                content: { type: 'text' },
                createdAt: { type: 'date' }
              }
            }
          }
        });
        logger.info(`Created OpenSearch index: ${INDEX_NAME}`);
      }
    } catch (error: any) {
      logger.warn('Error creating OpenSearch index:', error.message);
    }
  }

  static async indexDocument(doc: {
    id: string;
    type: 'project' | 'task' | 'comment';
    projectId?: string;
    projectName?: string;
    title: string;
    description?: string;
    content?: string;
    createdAt?: Date;
  }): Promise<void> {
    if (!osClient) return;
    try {
      await this.ensureIndexExists();
      await osClient.index({
        index: INDEX_NAME,
        id: `${doc.type}_${doc.id}`,
        body: {
          ...doc,
          createdAt: doc.createdAt || new Date()
        },
        refresh: true
      });
      logger.info(`Indexed ${doc.type} (${doc.id}) into OpenSearch`);
    } catch (error: any) {
      logger.warn(`OpenSearch indexing failed for ${doc.type} ${doc.id}:`, error.message);
    }
  }

  static async search(query: string, userProjectIds: string[]): Promise<any[]> {
    if (osClient && env.OPENSEARCH_ENDPOINT) {
      try {
        const response = await osClient.search({
          index: INDEX_NAME,
          body: {
            query: {
              bool: {
                must: [
                  {
                    multi_match: {
                      query,
                      fields: ['title^3', 'projectName^2', 'description', 'content'],
                      fuzziness: 'AUTO'
                    }
                  }
                ],
                filter: [
                  {
                    terms: { projectId: userProjectIds }
                  }
                ]
              }
            },
            highlight: {
              fields: {
                title: {},
                description: {},
                content: {}
              }
            }
          }
        });

        const hits = response.body.hits.hits || [];
        return hits.map((hit: any) => ({
          ...hit._source,
          score: hit._score,
          highlight: hit.highlight
        }));
      } catch (error: any) {
        logger.warn('OpenSearch query failed, using PostgreSQL FTS fallback:', error.message);
      }
    }

    // PostgreSQL Fallback Search
    const tasks = await prisma.task.findMany({
      where: {
        projectId: { in: userProjectIds },
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        project: { select: { id: true, name: true } }
      },
      take: 20
    });

    const projects = await prisma.project.findMany({
      where: {
        id: { in: userProjectIds },
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10
    });

    const comments = await prisma.comment.findMany({
      where: {
        content: { contains: query, mode: 'insensitive' },
        task: { projectId: { in: userProjectIds } }
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
            project: { select: { name: true } }
          }
        }
      },
      take: 10
    });

    const results: any[] = [];

    projects.forEach((p) => {
      results.push({
        id: p.id,
        type: 'project',
        projectId: p.id,
        projectName: p.name,
        title: p.name,
        description: p.description,
        createdAt: p.createdAt
      });
    });

    tasks.forEach((t) => {
      results.push({
        id: t.id,
        type: 'task',
        projectId: t.projectId,
        projectName: t.project.name,
        title: t.title,
        description: t.description,
        createdAt: t.createdAt
      });
    });

    comments.forEach((c) => {
      results.push({
        id: c.id,
        type: 'comment',
        projectId: c.task.projectId,
        projectName: c.task.project.name,
        title: `Comment on "${c.task.title}"`,
        content: c.content,
        createdAt: c.createdAt
      });
    });

    return results;
  }
}
