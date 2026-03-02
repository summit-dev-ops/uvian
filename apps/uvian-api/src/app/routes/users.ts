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
  };
}

interface UserSearchResult {
  userId: string;
  profileId: string;
  displayName: string;
  avatarUrl: string | null;
  type: 'human' | 'agent';
}

export default async function usersRoutes(fastify: FastifyInstance) {
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
        const { q, page = 1, limit = 10 } = request.query || {};

        let query = adminSupabase
          .from('profiles')
          .select('id, user_id, display_name, avatar_url', { count: 'exact' });

        if (q) {
          query = query.ilike('display_name', `%${q}%`);
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
