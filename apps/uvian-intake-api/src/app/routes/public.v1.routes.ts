import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { IntakeService } from '../services/intake.service';

interface TokenIdParams {
  tokenId: string;
}

interface SubmissionIdParams {
  submissionId: string;
}

interface SubmitBody {
  [key: string]: unknown;
}

interface JwtPayload {
  sub?: string;
  role?: string;
}

async function verifyJwt(token: string): Promise<string | null> {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    if (!decoded.sub || decoded.role !== 'authenticated') {
      return null;
    }
    return decoded.sub;
  } catch {
    return null;
  }
}

export async function publicV1Routes(fastify: FastifyInstance) {
  const intakeService = new IntakeService(fastify);

  fastify.get<{ Params: TokenIdParams }>(
    '/intakes/:tokenId',
    async (request, reply) => {
      try {
        const { tokenId } = request.params;

        if (!tokenId || !tokenId.startsWith('int_')) {
          return reply.code(400).send({ error: 'Invalid token format' });
        }

        const schema = await intakeService.getIntakeSchema(tokenId);

        if (!schema) {
          return reply.code(410).send({ error: 'Intake not found or expired' });
        }

        return reply.send(schema);
      } catch (error: unknown) {
        fastify.log.error({ error }, 'Failed to get intake schema');
        return reply.code(500).send({ error: 'Failed to retrieve form' });
      }
    }
  );

  fastify.get<{ Params: TokenIdParams }>(
    '/intakes/:tokenId/status',
    async (request, reply) => {
      try {
        const { tokenId } = request.params;

        if (!tokenId || !tokenId.startsWith('int_')) {
          return reply.code(400).send({ error: 'Invalid token format' });
        }

        const result = await intakeService.getIntakeStatus(tokenId);

        if (!result) {
          return reply.code(404).send({ error: 'Intake not found' });
        }

        return reply.send(result);
      } catch (error: unknown) {
        fastify.log.error({ error }, 'Failed to get intake status');
        return reply.code(500).send({ error: 'Failed to get intake status' });
      }
    }
  );

  fastify.post<{ Params: TokenIdParams; Body: SubmitBody }>(
    '/intakes/:tokenId/submit',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: true,
        },
      },
    },
    async (request, reply) => {
      try {
        const { tokenId } = request.params;

        if (!tokenId || !tokenId.startsWith('int_')) {
          return reply.code(400).send({ error: 'Invalid token format' });
        }

        const intake = await intakeService.getIntakeRecord(tokenId);
        if (!intake) {
          return reply.code(410).send({ error: 'Intake not found or expired' });
        }

        let submittedBy: string | undefined;
        const authHeader = request.headers.authorization;

        if (intake.requires_auth) {
          if (!authHeader?.startsWith('Bearer ')) {
            return reply.code(401).send({ error: 'Authentication required' });
          }
          const userId = await verifyJwt(authHeader.slice(7));
          if (!userId) {
            return reply.code(401).send({ error: 'Invalid token' });
          }
          submittedBy = userId;
        } else if (authHeader?.startsWith('Bearer ')) {
          const userId = await verifyJwt(authHeader.slice(7));
          if (userId) {
            submittedBy = userId;
          }
        }

        const result = await intakeService.submitIntake(
          tokenId,
          request.body,
          submittedBy
        );

        return reply.send({ success: true, submissionId: result.submissionId });
      } catch (error: unknown) {
        const err = error as Error;

        if (
          err.message.includes('not found') ||
          err.message.includes('expired')
        ) {
          return reply.code(410).send({ error: 'Intake not found or expired' });
        }

        if (err.message.includes('no longer valid')) {
          return reply
            .code(410)
            .send({ error: 'Intake has already been submitted' });
        }

        fastify.log.error({ error }, 'Failed to submit intake');
        return reply.code(500).send({ error: 'Failed to submit form' });
      }
    }
  );

  fastify.get<{ Params: SubmissionIdParams }>(
    '/submissions/:submissionId',
    async (request, reply) => {
      try {
        const { submissionId } = request.params;

        if (!submissionId || !submissionId.startsWith('sub_')) {
          return reply
            .code(400)
            .send({ error: 'Invalid submission ID format' });
        }

        const submission = await intakeService.getSubmission(submissionId);

        if (!submission) {
          return reply
            .code(404)
            .send({ error: 'Submission not found or expired' });
        }

        return reply.send({
          id: submission.id,
          intakeId: submission.intake_id,
          payload: submission.payload,
          submittedAt: submission.submitted_at,
          submittedBy: submission.submitted_by,
        });
      } catch (error: unknown) {
        fastify.log.error({ error }, 'Failed to get submission');
        return reply.code(500).send({ error: 'Failed to retrieve submission' });
      }
    }
  );
}
