import { FastifyPluginAsync } from 'fastify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { intakeService, secretsService } from '../services';
import {
  generateRSAKeyPair,
  decryptRSA,
  decryptHybridSubmission,
  type HybridEncryptedSubmission,
} from '@org/utils-encryption';
import { adminSupabase } from '../clients/supabase.client';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

const jwtCache = new Map<
  string,
  { userId: string; accountId: string; jwt: string; expiresAt: number }
>();
const JWT_TTL_MS = 50 * 60 * 1000;

async function authenticateWithApiKey(
  apiKey: string
): Promise<{ userId: string; accountId: string; jwt: string } | null> {
  if (!apiKey.startsWith('sk_agent_')) {
    return null;
  }

  const apiKeyPrefix = apiKey.substring(0, 16);

  const cached = jwtCache.get(apiKeyPrefix);
  if (cached && cached.expiresAt > Date.now()) {
    return {
      userId: cached.userId,
      accountId: cached.accountId,
      jwt: cached.jwt,
    };
  }

  const { data: apiKeyRecord, error } = await adminSupabase
    .from('agent_api_keys')
    .select('id, user_id, api_key_hash, is_active, service')
    .eq('api_key_prefix', apiKeyPrefix)
    .eq('is_active', true)
    .eq('service', 'intake-api')
    .single();

  if (error || !apiKeyRecord) {
    return null;
  }

  const isValid = await bcrypt.compare(apiKey, apiKeyRecord.api_key_hash);
  if (!isValid) {
    return null;
  }

  const { data: userData, error: userError } =
    await adminSupabase.auth.admin.getUserById(apiKeyRecord.user_id);
  if (userError || !userData.user) {
    return null;
  }

  const accountId = await secretsService
    .admin({ adminClient: adminSupabase, userClient: adminSupabase })
    .getAccountIdForUser(userData.user.id);
  if (!accountId) {
    return null;
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    return null;
  }

  const payload = {
    aud: 'authenticated',
    role: 'authenticated',
    sub: userData.user.id,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    iss: 'supabase',
  };

  const newJwt = jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });

  jwtCache.set(apiKeyPrefix, {
    userId: userData.user.id,
    accountId,
    jwt: newJwt,
    expiresAt: Date.now() + JWT_TTL_MS,
  });

  return {
    userId: userData.user.id,
    accountId,
    jwt: newJwt,
  };
}

const CreateIntakeInputSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  submitLabel: z.string().optional(),
  publicKey: z.string().min(1, 'Public key is required for E2E encryption'),
  fields: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['text', 'password', 'email', 'select', 'textarea']),
      label: z.string(),
      required: z.boolean().optional(),
      options: z
        .array(
          z.object({
            value: z.string(),
            label: z.string(),
          })
        )
        .optional(),
      placeholder: z.string().optional(),
      secret: z.boolean().optional(),
    })
  ),
  metadata: z.record(z.string(), z.unknown()).optional(),
  expiresInSeconds: z.number().optional(),
  requiresAuth: z.boolean().optional(),
});

const GetIntakeStatusInputSchema = z.object({
  tokenId: z.string(),
});

const ListIntakesInputSchema = z.object({});

const RevokeIntakeInputSchema = z.object({
  tokenId: z.string(),
});

const GetSubmissionInputSchema = z.object({
  submissionId: z.string(),
});

const GetSubmissionsByIntakeInputSchema = z.object({
  tokenId: z.string(),
});

const GenerateRsaKeypairInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const GetSecretInputSchema = z.object({
  secretId: z.string(),
});

const ListSecretsInputSchema = z.object({});

const DeleteSecretInputSchema = z.object({
  secretId: z.string(),
});

const DecryptDataInputSchema = z.object({
  secretId: z.string(),
  ciphertext: z.string(),
});

const DecryptSubmissionInputSchema = z.object({
  secretId: z.string(),
  submissionId: z.string(),
});

export const mcpPlugin: FastifyPluginAsync = async (fastify) => {
  function createServer(userId: string, accountId: string, jwt: string) {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const clients = { adminClient: adminSupabase, userClient };

    const server = new McpServer(
      { name: 'uvian-intake', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    server.registerTool(
      'create_intake',
      {
        inputSchema: CreateIntakeInputSchema,
      },
      async (args) => {
        try {
          const result = await intakeService
            .scoped(clients)
            .createIntake(userId, {
              title: args.title,
              description: args.description,
              submitLabel: args.submitLabel,
              publicKey: args.publicKey,
              schema: { fields: args.fields },
              metadata: args.metadata,
              expiresInSeconds: args.expiresInSeconds,
              requiresAuth: args.requiresAuth,
              createdBy: userId,
            });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'get_intake_status',
      {
        inputSchema: GetIntakeStatusInputSchema,
      },
      async (args) => {
        try {
          const status = await intakeService
            .scoped(clients)
            .getIntakeStatus(args.tokenId);
          if (!status) {
            return {
              content: [{ type: 'text', text: 'Intake not found' }],
              isError: true,
            } as ToolResult;
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(status),
              },
            ],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'revoke_intake',
      {
        inputSchema: RevokeIntakeInputSchema,
      },
      async (args) => {
        try {
          const revoked = await intakeService
            .scoped(clients)
            .revokeIntake(args.tokenId, userId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: revoked }),
              },
            ],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'list_intakes',
      {
        inputSchema: ListIntakesInputSchema,
      },
      async () => {
        try {
          const intakes = await intakeService
            .scoped(clients)
            .listIntakes(userId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(intakes),
              },
            ],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'get_submission',
      {
        inputSchema: GetSubmissionInputSchema,
      },
      async (args) => {
        try {
          const submission = await intakeService
            .scoped(clients)
            .getSubmission(args.submissionId, userId);
          if (!submission) {
            return {
              content: [
                { type: 'text', text: 'Submission not found or expired' },
              ],
              isError: true,
            } as ToolResult;
          }
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  id: submission.id,
                  intakeId: submission.intake_id,
                  payload: submission.payload,
                  submittedAt: submission.submitted_at,
                  submittedBy: submission.submitted_by,
                }),
              },
            ],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'get_submissions_by_intake',
      {
        inputSchema: GetSubmissionsByIntakeInputSchema,
      },
      async (args) => {
        try {
          const submissions = await intakeService
            .scoped(clients)
            .getSubmissionsByIntakeId(args.tokenId, userId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  submissions.map((s) => ({
                    id: s.id,
                    intakeId: s.intake_id,
                    payload: s.payload,
                    submittedAt: s.submitted_at,
                    submittedBy: s.submitted_by,
                  }))
                ),
              },
            ],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'generate_rsa_keypair',
      {
        inputSchema: GenerateRsaKeypairInputSchema,
      },
      async (args) => {
        try {
          const keyPair = generateRSAKeyPair();

          const secret = await secretsService
            .scoped(clients)
            .create(accountId, {
              name: `${args.name}_private_key`,
              valueType: 'text',
              value: keyPair.privateKey,
              metadata: {
                ...args.metadata,
                keyType: 'rsa_private_key',
                createdBy: 'mcp-intake-plugin',
              },
            });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  secretId: secret.id,
                  publicKey: keyPair.publicKey,
                  privateKeySecretName: `${args.name}_private_key`,
                }),
              },
            ],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'get_secret',
      {
        inputSchema: GetSecretInputSchema,
      },
      async (args) => {
        try {
          const secret = await secretsService
            .admin(clients)
            .getByIdWithDecryptedValue(args.secretId);
          if (!secret) {
            return {
              content: [{ type: 'text', text: 'Secret not found' }],
              isError: true,
            } as ToolResult;
          }
          return {
            content: [{ type: 'text', text: JSON.stringify(secret) }],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'list_secrets',
      {
        inputSchema: ListSecretsInputSchema,
      },
      async () => {
        try {
          const secrets = await secretsService.scoped(clients).list(accountId);
          return {
            content: [{ type: 'text', text: JSON.stringify(secrets) }],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'delete_secret',
      {
        inputSchema: DeleteSecretInputSchema,
      },
      async (args) => {
        try {
          await secretsService.scoped(clients).delete(accountId, args.secretId);
          return {
            content: [
              { type: 'text', text: JSON.stringify({ success: true }) },
            ],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'decrypt_data',
      {
        inputSchema: DecryptDataInputSchema,
      },
      async (args) => {
        try {
          const secret = await secretsService
            .admin(clients)
            .getByIdWithDecryptedValue(args.secretId);
          if (!secret) {
            return {
              content: [{ type: 'text', text: 'Secret not found' }],
              isError: true,
            } as ToolResult;
          }

          const privateKey = secret.value;
          const plaintext = decryptRSA(args.ciphertext, privateKey);

          return {
            content: [{ type: 'text', text: JSON.stringify({ plaintext }) }],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    server.registerTool(
      'decrypt_submission',
      {
        inputSchema: DecryptSubmissionInputSchema,
      },
      async (args) => {
        try {
          const secret = await secretsService
            .admin(clients)
            .getByIdWithDecryptedValue(args.secretId);
          if (!secret) {
            return {
              content: [{ type: 'text', text: 'Secret not found' }],
              isError: true,
            } as ToolResult;
          }

          const { data: submission, error } = await adminSupabase
            .schema('core_intake')
            .from('submissions')
            .select('payload')
            .eq('id', args.submissionId)
            .single();

          if (error || !submission) {
            return {
              content: [{ type: 'text', text: 'Submission not found' }],
              isError: true,
            } as ToolResult;
          }

          const privateKey = secret.value;
          const result = decryptHybridSubmission(
            submission.payload as HybridEncryptedSubmission,
            privateKey
          );

          return {
            content: [{ type: 'text', text: JSON.stringify(result.data) }],
          } as ToolResult;
        } catch (error) {
          return {
            content: [{ type: 'text', text: `Error: ${error}` }],
            isError: true,
          } as ToolResult;
        }
      }
    );

    return server;
  }
  fastify.post('/v1/mcp', async (request, reply) => {
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      return reply
        .code(401)
        .send({ error: 'Unauthorized', message: 'Missing API key' });
    }

    const authResult = await authenticateWithApiKey(apiKey);
    if (!authResult) {
      return reply
        .code(401)
        .send({ error: 'Unauthorized', message: 'Invalid API key' });
    }

    const { userId, accountId } = authResult;

    try {
      const server = createServer(userId, accountId, authResult.jwt);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);
      await transport.handleRequest(request.raw, reply.raw, request.body);
    } catch (error) {
      fastify.log.error({ error }, 'MCP handleRequest error');
      if (!reply.raw.writableEnded) {
        return reply.code(500).send({ error: 'MCP request failed' });
      }
    }
  });

  fastify.get('/v1/mcp', async (_, reply) => {
    return reply
      .code(405)
      .header('Allow', 'POST')
      .send('Method Not Allowed - Use POST for MCP requests');
  });

  fastify.log.info('MCP plugin registered');
};

export default mcpPlugin;
