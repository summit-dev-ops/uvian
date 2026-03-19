import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { jobService } from '../services/job.service';
import {
  CreateJobRequest,
  GetJobsRequest,
  GetJobRequest,
  CancelJobRequest,
  RetryJobRequest,
  DeleteJobRequest,
  GetJobsUsageRequest,
} from '../types/job.types';

export default async function (fastify: FastifyInstance) {
  fastify.post<CreateJobRequest>(
    '/api/jobs',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['type', 'input'],
          properties: {
            type: { type: 'string' },
            input: { type: 'object' },
            threadId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<CreateJobRequest>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { type, input, threadId } = request.body || {};

        const result = await jobService.createJob(request.supabase, userId, {
          type,
          input: { ...input, threadId },
        });

        reply.code(201).send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to create job' });
      }
    }
  );

  fastify.get<GetJobsRequest>(
    '/api/jobs',
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            type: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<GetJobsRequest>, reply: FastifyReply) => {
      try {
        const { status, type } = request.query || {};

        const result = await jobService.listJobs(request.supabase, {
          status,
          type,
        });

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch jobs' });
      }
    }
  );

  fastify.get<GetJobsUsageRequest>(
    '/api/jobs/usage',
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            type: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetJobsUsageRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { status, type } = request.query || {};

        const result = await jobService.getJobsForUser(request.supabase, {
          status,
          type,
        });

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch jobs usage' });
      }
    }
  );

  fastify.get<GetJobRequest>(
    '/api/jobs/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<GetJobRequest>, reply: FastifyReply) => {
      try {
        const { id } = request.params;

        const job = await jobService.getJob(request.supabase, id);

        reply.send(job);
      } catch (error: any) {
        if (error.message === 'Job not found') {
          reply.code(404).send({ error: 'Job not found' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch job' });
        }
      }
    }
  );

  fastify.patch<CancelJobRequest>(
    '/api/jobs/:id/cancel',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<CancelJobRequest>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        const result = await jobService.cancelJob(request.supabase, id);
        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to cancel job' });
      }
    }
  );

  fastify.patch<RetryJobRequest>(
    '/api/jobs/:id/retry',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<RetryJobRequest>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        const result = await jobService.retryJob(request.supabase, id);
        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to retry job' });
      }
    }
  );

  fastify.delete<DeleteJobRequest>(
    '/api/jobs/:id',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<DeleteJobRequest>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        await jobService.deleteJob(request.supabase, id);
        reply.code(204).send();
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to delete job' });
      }
    }
  );
}
