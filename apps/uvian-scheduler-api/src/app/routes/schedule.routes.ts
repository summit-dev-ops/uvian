import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase, createUserClient } from '../clients/supabase.client';
import { scheduleService } from '../services/factory';

interface CreateScheduleBody {
  agentId: string;
  description: string;
  scheduledFor: string;
  scheduleType?: 'one_time' | 'recurring';
  cronExpression?: string;
}

interface ListSchedulesQuery {
  status?: string;
  limit?: number;
  cursor?: string;
}

interface ScheduleParams {
  id: string;
}

export default async function scheduleRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateScheduleBody }>(
    '/api/schedules',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['agentId', 'description', 'scheduledFor'],
          properties: {
            agentId: { type: 'string', format: 'uuid' },
            description: { type: 'string' },
            scheduledFor: { type: 'string' },
            scheduleType: { type: 'string', enum: ['one_time', 'recurring'] },
            cronExpression: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateScheduleBody }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const clients = {
          adminClient: adminSupabase,
          userClient: createUserClient(
            request.headers.authorization?.replace('Bearer ', '') || ''
          ),
        };

        const schedule = await scheduleService
          .scoped(clients)
          .createSchedule(userId, request.body);
        reply.code(201).send(schedule);
      } catch (error: any) {
        console.error('Failed to create schedule:', error);
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create schedule' });
      }
    }
  );

  fastify.get<{ Querystring: ListSchedulesQuery }>(
    '/api/schedules',
    {
      preHandler: [fastify.authenticate],
      schema: {
        querystring: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            limit: { type: 'number' },
            cursor: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: ListSchedulesQuery }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const clients = {
          adminClient: adminSupabase,
          userClient: createUserClient(
            request.headers.authorization?.replace('Bearer ', '') || ''
          ),
        };

        const result = await scheduleService
          .scoped(clients)
          .listSchedules(userId, {
            status: request.query.status as any,
            limit: request.query.limit,
            cursor: request.query.cursor,
          });
        reply.send(result);
      } catch (error: any) {
        console.error('Failed to list schedules:', error);
        reply.code(400).send({ error: 'Failed to list schedules' });
      }
    }
  );

  fastify.get<{ Params: ScheduleParams }>(
    '/api/schedules/:id',
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
    async (
      request: FastifyRequest<{ Params: ScheduleParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const clients = {
          adminClient: adminSupabase,
          userClient: createUserClient(
            request.headers.authorization?.replace('Bearer ', '') || ''
          ),
        };

        const schedule = await scheduleService
          .scoped(clients)
          .getSchedule(userId, request.params.id);
        reply.send(schedule);
      } catch (error: any) {
        if (error.message === 'Schedule not found') {
          reply.code(404).send({ error: 'Schedule not found' });
        } else if (error.message === 'Not authorized to access this schedule') {
          reply
            .code(403)
            .send({ error: 'Not authorized to access this schedule' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch schedule' });
        }
      }
    }
  );

  fastify.delete<{ Params: ScheduleParams }>(
    '/api/schedules/:id',
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
    async (
      request: FastifyRequest<{ Params: ScheduleParams }>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const clients = {
          adminClient: adminSupabase,
          userClient: createUserClient(
            request.headers.authorization?.replace('Bearer ', '') || ''
          ),
        };

        await scheduleService
          .scoped(clients)
          .cancelSchedule(userId, request.params.id);
        reply.code(204).send();
      } catch (error: any) {
        if (error.message === 'Schedule not found') {
          reply.code(404).send({ error: 'Schedule not found' });
        } else if (error.message.includes('Not authorized')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply
            .code(400)
            .send({ error: error.message || 'Failed to cancel schedule' });
        }
      }
    }
  );
}
