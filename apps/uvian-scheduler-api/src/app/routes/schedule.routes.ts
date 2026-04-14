import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminSupabase, createUserClient } from '../clients/supabase.client';
import { scheduleService } from '../services/factory';
import { fireSchedule, SYNC_INTERVAL_MINUTES } from '../plugins/cron.plugin';
import { createSchedule, updateSchedule, cancelSchedule } from '../commands';

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
      reply: FastifyReply,
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
            request.headers.authorization?.replace('Bearer ', '') || '',
          ),
        };

        const { schedule } = await createSchedule(
          clients,
          { ...request.body, userId },
          { eventEmitter: fastify.schedulerEmitter as any },
        );

        const now = new Date();
        const windowEnd = new Date(
          now.getTime() + SYNC_INTERVAL_MINUTES * 60 * 1000,
        );
        const nextRun = new Date(schedule.nextRunAt);

        if (nextRun <= windowEnd) {
          try {
            await fireSchedule(
              schedule.id,
              userId,
              schedule.type,
              schedule.eventData || {},
              nextRun,
            );
            console.log(
              `[Immediate Fire] Schedule ${schedule.id} queued immediately`,
            );
          } catch (err) {
            console.error(
              `[Immediate Fire] Failed to fire schedule ${schedule.id}:`,
              err,
            );
          }
        }

        reply.code(201).send(schedule);
      } catch (error: any) {
        console.error('Failed to create schedule:', error);
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create schedule' });
      }
    },
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
      reply: FastifyReply,
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
            request.headers.authorization?.replace('Bearer ', '') || '',
          ),
        };

        const { schedule } = await updateSchedule(
          clients,
          { userId, scheduleId: request.params.id, ...request.body },
          { eventEmitter: fastify.schedulerEmitter as any },
        );

        const now = new Date();
        const windowEnd = new Date(
          now.getTime() + SYNC_INTERVAL_MINUTES * 60 * 1000,
        );
        const nextRun = new Date(schedule.nextRunAt);

        if (nextRun <= windowEnd) {
          try {
            await fireSchedule(
              schedule.id,
              userId,
              schedule.type,
              schedule.eventData || {},
              nextRun,
            );
            console.log(
              `[Immediate Fire] Schedule ${schedule.id} queued immediately on update`,
            );
          } catch (err) {
            console.error(
              `[Immediate Fire] Failed to fire schedule ${schedule.id}:`,
              err,
            );
          }
        }

        reply.send(schedule);
      } catch (error: any) {
        console.error('Failed to update schedule:', error);
        reply
          .code(400)
          .send({ error: error.message || 'Failed to update schedule' });
      }
    },
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
      reply: FastifyReply,
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
            request.headers.authorization?.replace('Bearer ', '') || '',
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
    },
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
      reply: FastifyReply,
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
            request.headers.authorization?.replace('Bearer ', '') || '',
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
    },
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
      reply: FastifyReply,
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
            request.headers.authorization?.replace('Bearer ', '') || '',
          ),
        };

        await cancelSchedule(
          clients,
          { userId, scheduleId: request.params.id },
          { eventEmitter: fastify.schedulerEmitter as any },
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
    },
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
      reply: FastifyReply,
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
            request.headers.authorization?.replace('Bearer ', '') || '',
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
    },
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
      reply: FastifyReply,
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
            request.headers.authorization?.replace('Bearer ', '') || '',
          ),
        };

        const schedule = await scheduleService
          .scoped(clients)
          .resumeSchedule(userId, request.params.id);

        const now = new Date();
        const windowEnd = new Date(
          now.getTime() + SYNC_INTERVAL_MINUTES * 60 * 1000,
        );
        const nextRun = new Date(schedule.nextRunAt);

        if (nextRun <= windowEnd) {
          try {
            await fireSchedule(
              schedule.id,
              userId,
              schedule.type,
              schedule.eventData || {},
              nextRun,
            );
            console.log(
              `[Immediate Fire] Schedule ${schedule.id} queued immediately on resume`,
            );
          } catch (err) {
            console.error(
              `[Immediate Fire] Failed to fire schedule ${schedule.id}:`,
              err,
            );
          }
        }

        reply.send(schedule);
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to resume schedule' });
      }
    },
  );

  // PATCH /api/schedules/:id/execute - Mark schedule as executed
  fastify.patch<{ Params: ScheduleParams; Body: { success?: boolean } }>(
    '/api/schedules/:id/execute',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            success: { type: 'boolean', default: true },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: ScheduleParams;
        Body: { success?: boolean };
      }>,
      reply: FastifyReply,
    ) => {
      const { id } = request.params;
      const { success = true } = request.body || {};

      try {
        const authHeader = request.headers.authorization;
        const clients = {
          adminClient: adminSupabase,
          userClient: createUserClient(authHeader || ''),
        };
        const svc = scheduleService.scoped(clients);

        await svc.markExecuted(id, success);

        return { success: true };
      } catch (error: any) {
        return reply
          .code(400)
          .send({ error: error.message || 'Failed to mark schedule executed' });
      }
    },
  );
}
