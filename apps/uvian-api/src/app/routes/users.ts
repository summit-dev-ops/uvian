import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { profileService } from '../services/profile.service';
import { adminSupabase } from '../clients/supabase.client';

interface GetUserProfileParams {
  userId: string;
}

interface UserSearchParams {
  Querystring: {
    q?: string;
    type?: string;
    page?: number;
    limit?: number;
    searchContext?: string;
  };
}

interface UserSearchResult {
  userId: string;
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  type: 'human' | 'agent';
}

interface SearchContext {
  type: 'space' | 'conversation';
  id: string;
}

interface AccountUser {
  userId: string;
  role: {
    name: string;
    permissions?: string[];
  };
}

export default async function usersRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/users',
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

        const { data: accountData, error: accountError } =
          await request.supabase.from('get_my_account').select('id').single();

        if (accountError || !accountData) {
          reply.code(404).send({ error: 'Account not found' });
          return;
        }

        const { data: members, error: membersError } = await adminSupabase
          .from('account_members')
          .select('user_id, role')
          .eq('account_id', accountData.id);

        if (membersError) {
          throw new Error(membersError.message);
        }

        const users: AccountUser[] = (members || []).map((m) => ({
          userId: m.user_id,
          role: m.role || { name: 'member' },
        }));

        reply.send({ users });
      } catch (error: any) {
        reply
          .code(400)
          .send({ error: error.message || 'Failed to fetch users' });
      }
    }
  );

  fastify.get<{ Params: GetUserProfileParams }>(
    '/api/users/:userId/profile',
    {
      preHandler: [fastify.authenticate],
    },
    async (
      request: FastifyRequest<{ Params: GetUserProfileParams }>,
      reply: FastifyReply
    ) => {
      try {
        const { userId } = request.params;

        const profile = await profileService.getProfileByUserId(
          request.supabase,
          userId
        );

        reply.send(profile);
      } catch (error: any) {
        if (error.message.includes('not found')) {
          reply.code(404).send({ error: 'Profile not found' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch profile' });
        }
      }
    }
  );

  fastify.get<UserSearchParams>(
    '/api/users/search',
    {
      preHandler: [fastify.authenticate],
    },
    async (request: FastifyRequest<UserSearchParams>, reply: FastifyReply) => {
      try {
        const { q, page = 1, limit = 10, searchContext } = request.query || {};

        const currentUserId = request.user?.id;

        let excludeUserIds: string[] = [];

        if (searchContext) {
          try {
            const context: SearchContext = JSON.parse(searchContext);

            if (context.type === 'conversation') {
              const { data: members } = await adminSupabase
                .schema('core_hub')
                .from('conversation_members')
                .select('user_id')
                .eq('conversation_id', context.id);

              excludeUserIds = (members || []).map((m) => m.user_id);
            } else if (context.type === 'space') {
              const { data: members } = await adminSupabase
                .schema('core_hub')
                .from('space_members')
                .select('user_id')
                .eq('space_id', context.id);

              excludeUserIds = (members || []).map((m) => m.user_id);
            }
          } catch (parseError) {
            console.error('Failed to parse searchContext:', parseError);
          }
        }

        if (currentUserId) {
          excludeUserIds.push(currentUserId);
        }

        let query = adminSupabase
          .schema('core_hub')
          .from('profiles')
          .select('id, user_id, display_name, avatar_url', { count: 'exact' });

        if (q) {
          query = query.ilike('display_name', `%${q}%`);
        }

        if (excludeUserIds.length > 0) {
          query = query.not('user_id', 'in', `(${excludeUserIds.join(',')})`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const {
          data: profiles,
          count,
          error,
        } = await query
          .range(from, to)
          .order('display_name', { ascending: true });

        if (error) {
          throw new Error(error.message);
        }

        const users: UserSearchResult[] = (profiles || []).map((p) => ({
          userId: p.user_id,
          profileId: p.id,
          displayName: p.display_name || 'Unknown',
          avatarUrl: p.avatar_url,
          type: 'human' as const,
        }));

        const total = count || 0;
        const totalPages = Math.ceil(total / limit);

        reply.send({
          users,
          pagination: {
            total,
            page,
            limit,
            hasMore: page < totalPages,
          },
          filters: {
            query: q || '',
            searchFields: ['displayName'],
          },
        });
      } catch (error: any) {
        reply.code(400).send({ error: error.message || 'Search failed' });
      }
    }
  );
}
