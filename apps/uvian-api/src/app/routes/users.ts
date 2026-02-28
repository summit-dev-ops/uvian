import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { profileService } from '../services/profile.service';

interface GetUserProfileParams {
  userId: string;
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
}
