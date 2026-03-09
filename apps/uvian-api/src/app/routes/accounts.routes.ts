import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { accountService } from '../services/account.service';
import {
  CreateAccountRequest,
  UpdateAccountRequest,
  GetAccountRequest,
  CreateAccountMemberRequest,
  UpdateAccountMemberRequest,
  DeleteAccountMemberRequest,
  GetAccountMembersRequest,
} from '../types/account.types';

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

        const accounts = await accountService.getAccounts(userId);
        reply.send({ accounts });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch accounts' });
      }
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { name, settings } = request.body || {};
        const account = await accountService.createAccount(userId, {
          name,
          settings,
        });
        reply.code(201).send(account);
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to create account' });
      }
    }
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
        const account = await accountService.getAccount(accountId, userId);
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
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const { name, settings } = request.body || {};
        const account = await accountService.updateAccount(accountId, userId, {
          name,
          settings,
        });
        reply.send(account);
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply
            .code(400)
            .send({ error: error.message || 'Failed to update account' });
        }
      }
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const members = await accountService.getAccountMembers(
          accountId,
          userId
        );
        reply.send({ members });
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply
            .code(400)
            .send({
              error: error.message || 'Failed to fetch account members',
            });
        }
      }
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId } = request.params;
        const { userId: newMemberUserId, role } = request.body || {};

        const member = await accountService.addAccountMember(
          accountId,
          userId,
          newMemberUserId,
          role || { name: 'member', permissions: [] }
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
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, userId: targetUserId } = request.params;
        const { role } = request.body || {};

        const member = await accountService.updateAccountMember(
          accountId,
          userId,
          targetUserId,
          role
        );
        reply.send(member);
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply
            .code(400)
            .send({
              error: error.message || 'Failed to update account member',
            });
        }
      }
    }
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
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { accountId, userId: targetUserId } = request.params;
        await accountService.removeAccountMember(
          accountId,
          userId,
          targetUserId
        );
        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('access denied')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply
            .code(400)
            .send({
              error: error.message || 'Failed to remove account member',
            });
        }
      }
    }
  );
}
