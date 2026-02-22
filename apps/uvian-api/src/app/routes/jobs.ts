import { FastifyInstance } from 'fastify';
import { queueService } from '../services/queue.service';
import { jobService } from '../services/job.service';
import { profileService } from '../services/profile.service';
import {
  CancelJobRequest,
  CreateJobRequest,
  CreateJobResponse,
  DeleteJobRequest,
  GetJobRequest,
  GetJobsRequest,
  GetSpaceJobsRequest,
  GetConversationJobsRequest,
  JobFilters,
  PaginationOptions,
  RetryJobRequest,
  GetJobMetricsRequest,
} from '../types/job.types';

export default async function (fastify: FastifyInstance) {
  // Create job with resource scope support
  fastify.post<CreateJobRequest>('/api/jobs', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['type', 'input', 'resourceScopeId'],
        properties: {
          type: { type: 'string' },
          input: { type: 'object' },
          resourceScopeId: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            status: { type: 'string' },
            resourceScopeId: { type: 'string' },
            spaceId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            conversationId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );

        const payload = request.body as {
          type: 'chat' | 'task' | 'agent';
          input: any;
          resourceScopeId: string;
        };

        // Validate request: resourceScopeId is required and must be the only scope identifier
        if (!payload.resourceScopeId) {
          reply.code(400).send({ error: 'resourceScopeId is required' });
          return;
        }

        // Create job in database with resource scope assignment
        const jobId = require('crypto').randomUUID();
        const job = await jobService.createJob(
          request.supabase,
          authProfileId,
          {
            id: jobId,
            type: payload.type,
            input: payload.input,
            resourceScopeId: payload.resourceScopeId,
          }
        );

        // Add to queue
        await queueService.addJob('main-queue', payload.type || 'generic-job', {
          jobId: jobId,
        });

        const response: CreateJobResponse = {
          jobId,
          status: 'queued',
          resourceScopeId: job.resourceScopeId,
          spaceId: job.spaceId,
          conversationId: job.conversationId,
        };

        reply.code(201).send(response);
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes('does not have access') ||
            error.message.includes('Unauthorized')
          ) {
            reply.code(403).send({ error: error.message });
          } else if (
            error.message.includes('Either spaceId or conversationId')
          ) {
            reply.code(400).send({ error: error.message });
          } else {
            reply.code(500).send({ error: 'Internal server error' });
          }
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // List jobs with filtering and pagination (enhanced version)
  fastify.get<GetJobsRequest>('/api/jobs', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          type: { type: 'string' },
          dateFrom: { type: 'string' },
          dateTo: { type: 'string' },
          spaceId: { type: 'string' },
          conversationId: { type: 'string' },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            jobs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  status: { type: 'string' },
                  input: { type: 'object' },
                  output: { anyOf: [{ type: 'object' }, { type: 'null' }] },
                  errorMessage: {
                    anyOf: [{ type: 'string' }, { type: 'null' }],
                  },
                  resourceScopeId: { type: 'string' },
                  spaceId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                  conversationId: {
                    anyOf: [{ type: 'string' }, { type: 'null' }],
                  },
                  scopeType: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  startedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                  completedAt: {
                    anyOf: [{ type: 'string' }, { type: 'null' }],
                  },
                },
              },
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            hasMore: { type: 'boolean' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const query = request.query as JobFilters & PaginationOptions;

      const page = query.page || 1;
      const limit = query.limit || 20;

      const result = await jobService.listJobs(
        request.supabase,
        {
          status: query.status,
          type: query.type,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
          spaceId: query.spaceId,
          conversationId: query.conversationId,
        },
        { page, limit }
      );

      reply.send(result);
    },
  });

  // Get jobs for a specific space
  fastify.get<GetSpaceJobsRequest>('/api/spaces/:spaceId/jobs', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          spaceId: { type: 'string' },
        },
        required: ['spaceId'],
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          type: { type: 'string' },
          dateFrom: { type: 'string' },
          dateTo: { type: 'string' },
          page: { type: 'integer', minimum: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            jobs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  status: { type: 'string' },
                  input: { type: 'object' },
                  output: { anyOf: [{ type: 'object' }, { type: 'null' }] },
                  errorMessage: {
                    anyOf: [{ type: 'string' }, { type: 'null' }],
                  },
                  resourceScopeId: { type: 'string' },
                  spaceId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                  conversationId: {
                    anyOf: [{ type: 'string' }, { type: 'null' }],
                  },
                  scopeType: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  startedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                  completedAt: {
                    anyOf: [{ type: 'string' }, { type: 'null' }],
                  },
                },
              },
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            hasMore: { type: 'boolean' },
          },
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );

        const { spaceId } = request.params;
        const query = request.query;

        const result = await jobService.listSpaceJobs(
          request.supabase,
          spaceId,
          authProfileId,
          {
            status: query.status,
            type: query.type as 'chat' | 'task' | 'agent',
            dateFrom: query.dateFrom,
            dateTo: query.dateTo,
          },
          { page: query.page || 1, limit: query.limit || 20 }
        );

        reply.send(result);
      } catch (error: any) {
        if (
          error instanceof Error &&
          (error.message.includes('does not have access') ||
            error.message.includes('Unauthorized'))
        ) {
          reply.code(403).send({ error: error.message });
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // Get jobs for a specific conversation
  fastify.get<GetConversationJobsRequest>(
    '/api/conversations/:conversationId/jobs',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            conversationId: { type: 'string' },
          },
          required: ['conversationId'],
        },
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            type: { type: 'string' },
            dateFrom: { type: 'string' },
            dateTo: { type: 'string' },
            page: { type: 'integer', minimum: 1 },
            limit: { type: 'integer', minimum: 1, maximum: 100 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              jobs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    status: { type: 'string' },
                    input: { type: 'object' },
                    output: { anyOf: [{ type: 'object' }, { type: 'null' }] },
                    errorMessage: {
                      anyOf: [{ type: 'string' }, { type: 'null' }],
                    },
                    resourceScopeId: { type: 'string' },
                    spaceId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                    conversationId: {
                      anyOf: [{ type: 'string' }, { type: 'null' }],
                    },
                    scopeType: {
                      anyOf: [{ type: 'string' }, { type: 'null' }],
                    },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                    startedAt: {
                      anyOf: [{ type: 'string' }, { type: 'null' }],
                    },
                    completedAt: {
                      anyOf: [{ type: 'string' }, { type: 'null' }],
                    },
                  },
                },
              },
              total: { type: 'integer' },
              page: { type: 'integer' },
              limit: { type: 'integer' },
              hasMore: { type: 'boolean' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
      handler: async (request, reply) => {
        try {
          const authProfileId =
            await profileService.getCurrentProfileFromRequest(request);

          const { conversationId } = request.params;
          const query = request.query;

          const result = await jobService.listConversationJobs(
            request.supabase,
            conversationId,
            authProfileId,
            {
              status: query.status,
              type: query.type as 'chat' | 'task' | 'agent',
              dateFrom: query.dateFrom,
              dateTo: query.dateTo,
            },
            { page: query.page || 1, limit: query.limit || 20 }
          );

          reply.send(result);
        } catch (error: any) {
          if (
            error instanceof Error &&
            (error.message.includes('does not have access') ||
              error.message.includes('Unauthorized'))
          ) {
            reply.code(403).send({ error: error.message });
          } else {
            reply.code(500).send({ error: 'Internal server error' });
          }
        }
      },
    }
  );

  // Get job details (enhanced version)
  fastify.get<GetJobRequest>('/api/jobs/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            status: { type: 'string' },
            input: { type: 'object' },
            output: { anyOf: [{ type: 'object' }, { type: 'null' }] },
            errorMessage: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            resourceScopeId: { type: 'string' },
            spaceId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            conversationId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            scopeType: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
            startedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            completedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );

        const { id } = request.params as { id: string };

        const job = await jobService.getJob(
          request.supabase,
          id,
          authProfileId
        );
        reply.send(job);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('not found')) {
            reply.code(404).send({ error: 'Job not found' });
          } else if (error.message.includes('does not have access')) {
            reply.code(403).send({ error: 'Access denied' });
          } else {
            reply.code(500).send({ error: 'Internal server error' });
          }
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // Get job metrics
  fastify.get<GetJobMetricsRequest>('/api/jobs/metrics', {
    preHandler: [fastify.authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          dateFrom: { type: 'string' },
          dateTo: { type: 'string' },
          spaceId: { type: 'string' },
          conversationId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            queued: { type: 'integer' },
            processing: { type: 'integer' },
            completed: { type: 'integer' },
            failed: { type: 'integer' },
            cancelled: { type: 'integer' },
            averageProcessingTime: { type: 'number' },
          },
        },
        403: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const authProfileId = await profileService.getCurrentProfileFromRequest(
          request
        );

        const query = request.query as {
          dateFrom?: string;
          dateTo?: string;
          spaceId?: string;
          conversationId?: string;
        };

        // If spaceId or conversationId is provided, validate access
        if (query.spaceId) {
          await jobService.listSpaceJobs(
            request.supabase,
            query.spaceId,
            authProfileId,
            {},
            { page: 1, limit: 1 }
          );
        } else if (query.conversationId) {
          await jobService.listConversationJobs(
            request.supabase,
            query.conversationId,
            authProfileId,
            {},
            { page: 1, limit: 1 }
          );
        }

        const metrics = await jobService.getJobMetrics(
          request.supabase,
          authProfileId,
          query.dateFrom,
          query.dateTo,
          query.spaceId,
          query.conversationId
        );

        reply.send(metrics);
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('does not have access')
        ) {
          reply.code(403).send({ error: error.message });
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // Cancel job
  fastify.patch<CancelJobRequest>('/api/jobs/:id/cancel', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            status: { type: 'string' },
            updatedAt: { type: 'string' },
            completedAt: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const authProfileId = await profileService.getCurrentProfileFromRequest(
        request
      );

      const { id } = request.params as { id: string };

      try {
        const job = await jobService.cancelJob(
          request.supabase,
          id,
          authProfileId
        );
        reply.send(job);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot cancel')) {
          reply.code(400).send({ error: error.message });
        } else if (
          error instanceof Error &&
          error.message.includes('not found')
        ) {
          reply.code(404).send({ error: 'Job not found' });
        } else if (
          error instanceof Error &&
          (error.message.includes('does not have access') ||
            error.message.includes('Unauthorized'))
        ) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // Retry job
  fastify.patch<RetryJobRequest>('/api/jobs/:id/retry', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string' },
            status: { type: 'string' },
            errorMessage: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            updatedAt: { type: 'string' },
            startedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            completedAt: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const authProfileId = await profileService.getCurrentProfileFromRequest(
        request
      );

      const { id } = request.params as { id: string };

      try {
        const job = await jobService.retryJob(
          request.supabase,
          id,
          authProfileId
        );

        // Re-add to queue for processing
        await queueService.addJob('main-queue', job.type, {
          jobId: id,
        });

        reply.send(job);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot retry')) {
          reply.code(400).send({ error: error.message });
        } else if (
          error instanceof Error &&
          error.message.includes('not found')
        ) {
          reply.code(404).send({ error: 'Job not found' });
        } else if (
          error instanceof Error &&
          (error.message.includes('does not have access') ||
            error.message.includes('Unauthorized'))
        ) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });

  // Delete job
  fastify.delete<DeleteJobRequest>('/api/jobs/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        204: { type: 'null' },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const authProfileId = await profileService.getCurrentProfileFromRequest(
        request
      );

      const { id } = request.params as { id: string };

      try {
        await jobService.deleteJob(request.supabase, id, authProfileId);
        reply.code(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot delete')) {
          reply.code(400).send({ error: error.message });
        } else if (
          error instanceof Error &&
          error.message.includes('not found')
        ) {
          reply.code(404).send({ error: 'Job not found' });
        } else if (
          error instanceof Error &&
          (error.message.includes('does not have access') ||
            error.message.includes('Unauthorized'))
        ) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(500).send({ error: 'Internal server error' });
        }
      }
    },
  });
}
