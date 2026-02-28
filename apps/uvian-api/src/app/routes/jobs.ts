import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { jobService } from '../services/job.service';
import {
  CreateJobRequest,
  GetJobsRequest,
  GetSpaceJobsRequest,
  GetConversationJobsRequest,
  GetJobRequest,
  GetJobMetricsRequest,
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
          required: ['type', 'input', 'resourceScopeId'],
          properties: {
            type: { type: 'string' },
            input: { type: 'object' },
            resourceScopeId: { type: 'string' },
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

        const { type, input, resourceScopeId } = request.body || {};

        if (!resourceScopeId) {
          reply.code(400).send({ error: 'resourceScopeId is required' });
          return;
        }

        const result = await jobService.createJob(request.supabase, userId, {
          type,
          input,
          resourceScopeId,
        });

        reply.code(201).send(result);
      } catch (error: any) {
        if (error.message.includes('Not a member')) {
          reply
            .code(403)
            .send({ error: 'Not a member of this space or conversation' });
        } else {
          reply.code(400).send({ error: 'Failed to create job' });
        }
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
            spaceId: { type: 'string' },
            conversationId: { type: 'string' },
            status: { type: 'string' },
            type: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<GetJobsRequest>, reply: FastifyReply) => {
      try {
        const { spaceId, conversationId, status, type } = request.query || {};

        if (!spaceId && !conversationId) {
          reply.code(400).send({
            error: 'Either spaceId or conversationId is required',
          });
          return;
        }

        const result = await jobService.listJobs(request.supabase, {
          spaceId,
          conversationId,
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

  fastify.get<GetSpaceJobsRequest>(
    '/api/spaces/:spaceId/jobs',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            spaceId: { type: 'string' },
          },
          additionalProperties: false,
        },
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
      request: FastifyRequest<GetSpaceJobsRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { spaceId } = request.params;
        const { status, type } = request.query || {};

        const result = await jobService.listJobs(request.supabase, {
          spaceId,
          status,
          type,
        });

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch space jobs' });
      }
    }
  );

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
          additionalProperties: false,
        },
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
      request: FastifyRequest<GetConversationJobsRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { conversationId } = request.params;
        const { status, type } = request.query || {};

        const result = await jobService.listJobs(request.supabase, {
          conversationId,
          status,
          type,
        });

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch conversation jobs' });
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

  fastify.get<GetJobMetricsRequest>(
    '/api/jobs/metrics',
    {
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
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetJobMetricsRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { spaceId, conversationId } = request.query || {};
        const scopeId = spaceId || conversationId;
        if (!scopeId) {
          reply.code(400).send({
            error: 'Either spaceId or conversationId is required',
          });
          return;
        }

        const metrics = await jobService.getJobMetrics(
          request.supabase,
          scopeId as string
        );

        reply.send(metrics);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch job metrics' });
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
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(400).send({ error: 'Failed to cancel job' });
        }
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
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(400).send({ error: 'Failed to retry job' });
        }
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
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: 'Access denied' });
        } else {
          reply.code(400).send({ error: 'Failed to delete job' });
        }
      }
    }
  );
}
