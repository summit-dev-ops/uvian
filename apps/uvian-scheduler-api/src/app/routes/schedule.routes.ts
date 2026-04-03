import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase, createUserClient } from '../clients/supabase.client';
import { scheduleService, subscriptionService } from '../services/factory';
import { ScheduleEvents } from '@org/uvian-events';

interface CreateScheduleBody {
  type?: 'one_time' | 'recurring';
  start?: string;
  end?: string;
  cronExpression?: string;
  eventData?: Record<string, unknown>;
  subscriberIds: string[];
}

interface UpdateScheduleBody {
  start?: string;
  end?: string;
  cronExpression?: string;
  eventData?: Record<string, unknown>;
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
          properties: {
            type: { type: 'string', enum: ['one_time', 'recurring'] },
            start: { type: 'string' },
            end: { type: 'string' },
            cronExpression: { type: 'string' },
            eventData: { type: 'object', additionalProperties: true },
            subscriberIds: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
              minItems: 1,
            },
          },
          required: ['subscriberIds'],
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

        await createSubscriptions(schedule.id, request.body.subscriberIds);

        fastify.schedulerEmitter.emitEvent(
          ScheduleEvents.SCHEDULE_CREATED,
          `/schedules/${schedule.id}`,
          {
            scheduleId: schedule.id,
            type: schedule.type,
            cronExpression: schedule.cronExpression || undefined,
            subscriberIds: request.body.subscriberIds,
            createdBy: userId,
          },
          userId
        );

        reply.code(201).send(schedule);
      } catch (error: any) {
        console.error('Failed to create schedule:', error);
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create schedule' });
      }
    }
  );

  fastify.put<{ Params: ScheduleParams; Body: UpdateScheduleBody }>(
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
        body: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' },
            cronExpression: { type: 'string' },
            eventData: { type: 'object', additionalProperties: true },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: ScheduleParams;
        Body: UpdateScheduleBody;
      }>,
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
          .updateSchedule(userId, request.params.id, request.body);

        fastify.schedulerEmitter.emitEvent(
          ScheduleEvents.SCHEDULE_UPDATED,
          `/schedules/${schedule.id}`,
          {
            scheduleId: schedule.id,
            updatedBy: userId,
          },
          userId
        );

        reply.send(schedule);
      } catch (error: any) {
        console.error('Failed to update schedule:', error);
        reply
          .code(400)
          .send({ error: error.message || 'Failed to update schedule' });
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

        const schedule = await scheduleService
          .scoped(clients)
          .cancelSchedule(userId, request.params.id);

        fastify.schedulerEmitter.emitEvent(
          ScheduleEvents.SCHEDULE_CANCELLED,
          `/schedules/${schedule.id}`,
          {
            scheduleId: schedule.id,
            cancelledBy: userId,
          },
          userId
        );

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

  fastify.post<{ Params: ScheduleParams }>(
    '/api/schedules/:id/pause',
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
          .pauseSchedule(userId, request.params.id);
        reply.send(schedule);
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to pause schedule' });
      }
    }
  );

  fastify.post<{ Params: ScheduleParams }>(
    '/api/schedules/:id/resume',
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
          .resumeSchedule(userId, request.params.id);
        reply.send(schedule);
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to resume schedule' });
      }
    }
  );
}

async function createSubscriptions(
  scheduleId: string,
  subscriberIds: string[]
): Promise<void> {
  const clients = { adminClient: adminSupabase, userClient: adminSupabase };
  const subService = subscriptionService.admin(clients);

  const existingSubs = await subService.getSubscriptionsByResource(
    'uvian.schedule',
    scheduleId
  );

  const existingUserIds = new Set(existingSubs.map((s) => s.user_id));
  const newSubscriberIds = subscriberIds.filter(
    (uid) => !existingUserIds.has(uid)
  );

  if (newSubscriberIds.length === 0) return;

  const scopedService = subscriptionService.scoped(clients);

  for (const userId of newSubscriberIds) {
    await scopedService.activateSubscription(
      userId,
      'uvian.schedule',
      scheduleId
    );
  }
}
