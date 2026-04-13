import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { accountService } from '../services/factory';
import { adminSupabase } from '../clients/supabase.client';
import {
  createAccount,
  updateAccount,
  updateAccountMember,
  removeAccountMember,
} from '../commands/account';
import {
  CreateAccountRequest,
  UpdateAccountRequest,
  GetAccountRequest,
  CreateAccountMemberRequest,
  UpdateAccountMemberRequest,
  DeleteAccountMemberRequest,
  GetAccountMembersRequest,
} from '../types/account.types';

function getClients(request: FastifyRequest) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

export default async function accountsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/accounts',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const clients = getClients(request);
        const accounts = await accountService
          .scoped(clients)
          .getAccounts(userId);
        reply.send({ accounts });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch accounts' });
      }
    },
  );

  fastify.post<CreateAccountRequest>(
    '/api/accounts',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            settings: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<CreateAccountRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { name, settings } = request.body || {};
        const clients = getClients(request);
        const result = await createAccount(
          clients,
          { userId, name, settings },
          { eventEmitter: fastify.services.eventEmitter },
        );
        reply.code(201).send(result.account);
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create account' });
      }
    },
  );

  fastify.get<GetAccountRequest>(
    '/api/accounts/:accountId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['accountId'],
          properties: {
            accountId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<GetAccountRequest>, reply: FastifyReply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const clients = getClients(request);
        const account = await accountService
          .scoped(clients)
          .getAccount(accountId, userId);
        reply.send(account);
      } catch (error: any) {
        if (
          error.message.includes('not found') ||
          error.message.includes('access denied')
        ) {
          reply.code(404).send({ error: 'Account not found or access denied' });
        } else {
          reply
            .code(400)
            .send({ error: error.message || 'Failed to fetch account' });
        }
      }
    },
  );

  fastify.patch<UpdateAccountRequest>(
    '/api/accounts/:accountId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['accountId'],
          properties: {
            accountId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            settings: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UpdateAccountRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const { name, settings } = request.body || {};
        const clients = getClients(request);
        const result = await updateAccount(
          clients,
          { userId, accountId, name, settings },
          { eventEmitter: fastify.services.eventEmitter },
        );
        reply.send(result.account);
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply
            .code(400)
            .send({ error: error.message || 'Failed to update account' });
        }
      }
    },
  );

  fastify.get<GetAccountMembersRequest>(
    '/api/accounts/:accountId/members',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['accountId'],
          properties: {
            accountId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetAccountMembersRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const clients = getClients(request);
        const members = await accountService
          .scoped(clients)
          .getAccountMembers(accountId, userId);
        reply.send({ members });
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply.code(400).send({
            error: error.message || 'Failed to fetch account members',
          });
        }
      }
    },
  );

  fastify.post<CreateAccountMemberRequest>(
    '/api/accounts/:accountId/members',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['accountId'],
          properties: {
            accountId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: { type: 'string' },
            role: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<CreateAccountMemberRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const { userId: newMemberUserId, role } = request.body || {};

        const clients = getClients(request);
        const member = await accountService
          .scoped(clients)
          .addAccountMember(
            accountId,
            userId,
            newMemberUserId,
            role || { name: 'member', permissions: [] },
          );
        fastify.services.eventEmitter.emitAccountMemberAdded(
          {
            accountId,
            userId: newMemberUserId,
            role: (role?.name as 'member' | 'admin') || 'member',
            addedBy: userId,
          },
          userId,
        );
        reply.code(201).send(member);
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply
            .code(400)
            .send({ error: error.message || 'Failed to add account member' });
        }
      }
    },
  );

  fastify.patch<UpdateAccountMemberRequest>(
    '/api/accounts/:accountId/members/:userId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['accountId', 'userId'],
          properties: {
            accountId: { type: 'string' },
            userId: { type: 'string' },
          },
          additionalProperties: false,
        },
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<UpdateAccountMemberRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, userId: targetUserId } = request.params;
        const { role } = request.body || {};

        const clients = getClients(request);
        const result = await updateAccountMember(
          clients,
          { userId, accountId, targetUserId, role },
          { eventEmitter: fastify.services.eventEmitter },
        );
        reply.send(result.member);
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply.code(400).send({
            error: error.message || 'Failed to update account member',
          });
        }
      }
    },
  );

  fastify.delete<DeleteAccountMemberRequest>(
    '/api/accounts/:accountId/members/:userId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['accountId', 'userId'],
          properties: {
            accountId: { type: 'string' },
            userId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<DeleteAccountMemberRequest>,
      reply: FastifyReply,
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, userId: targetUserId } = request.params;
        const clients = getClients(request);
        await removeAccountMember(
          clients,
          { userId, accountId, targetUserId },
          { eventEmitter: fastify.services.eventEmitter },
        );
        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply.code(400).send({
            error: error.message || 'Failed to remove account member',
          });
        }
      }
    },
  );
}
