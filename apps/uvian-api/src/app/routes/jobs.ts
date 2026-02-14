import { FastifyInstance } from 'fastify';
import { queueService } from '../services/queue.service';
import { jobService } from '../services/job.service';
import { userService } from '../services/user.service';
import {
  CancelJobRequest,
  CreateJobRequest,
  DeleteJobRequest,
  GetJobRequest,
  GetJobsRequest,
  JobFilters,
  PaginationOptions,
  RetryJobRequest,
} from '../types/job.types';

export default async function (fastify: FastifyInstance) {
  fastify.post<CreateJobRequest>('/api/jobs', {
    preHandler: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['type', 'input'],
        properties: {
          type: { type: 'string' },
          input: { type: 'object' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            status: { type: 'string' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      const userId = await userService.getCurrentUserFromRequest(request);
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const payload = request.body as { type: string; input: any };

      // Create job in database
      const jobId = require('crypto').randomUUID();
      await jobService.createJob(request.supabase, {
        id: jobId,
        type: payload.type,
        input: payload.input,
      });

      // Add to queue
      await queueService.addJob('main-queue', payload.type || 'generic-job', {
        jobId: jobId,
      });

      reply.code(201).send({ jobId, status: 'queued' });
    },
  });

  // List jobs with filtering and pagination
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
                  error_message: {
                    anyOf: [{ type: 'string' }, { type: 'null' }],
                  },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                  started_at: { anyOf: [{ type: 'string' }, { type: 'null' }] },
                  completed_at: {
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
      const userId = await userService.getCurrentUserFromRequest(request);
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

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
        },
        { page, limit }
      );

      reply.send(result);
    },
  });

  // Get job details
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
            error_message: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
            started_at: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            completed_at: { anyOf: [{ type: 'string' }, { type: 'null' }] },
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
      const userId = await userService.getCurrentUserFromRequest(request);
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };

      try {
        const job = await jobService.getJob(request.supabase, id);
        reply.send(job);
      } catch (error) {
        reply.code(404).send({ error: 'Job not found' });
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
            updated_at: { type: 'string' },
            completed_at: { type: 'string' },
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
      const userId = await userService.getCurrentUserFromRequest(request);
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };

      try {
        const job = await jobService.cancelJob(request.supabase, id);
        reply.send(job);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot cancel')) {
          reply.code(400).send({ error: error.message });
        } else {
          reply.code(404).send({ error: 'Job not found' });
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
            error_message: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            updated_at: { type: 'string' },
            started_at: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            completed_at: { anyOf: [{ type: 'string' }, { type: 'null' }] },
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
      const userId = await userService.getCurrentUserFromRequest(request);
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };

      try {
        const job = await jobService.retryJob(request.supabase, id);

        // Re-add to queue for processing
        await queueService.addJob('main-queue', job.type, {
          jobId: id,
        });

        reply.send(job);
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot retry')) {
          reply.code(400).send({ error: error.message });
        } else {
          reply.code(404).send({ error: 'Job not found' });
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
      const userId = await userService.getCurrentUserFromRequest(request);
      if (!userId) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { id } = request.params as { id: string };

      try {
        await jobService.deleteJob(request.supabase, id);
        reply.code(204).send();
      } catch (error) {
        if (error instanceof Error && error.message.includes('Cannot delete')) {
          reply.code(400).send({ error: error.message });
        } else {
          reply.code(404).send({ error: 'Job not found' });
        }
      }
    },
  });
}
