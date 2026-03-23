import { FastifyPluginAsync } from 'fastify';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { IntakeService } from '../services/intake.service';

type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

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
});

const GetIntakeStatusInputSchema = z.object({
  tokenId: z.string(),
});

const RevokeIntakeInputSchema = z.object({
  tokenId: z.string(),
});

export const mcpPlugin: FastifyPluginAsync = async (fastify) => {
  const intakeService = new IntakeService(fastify);

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
        const result = await intakeService.createIntake({
          title: args.title,
          description: args.description,
          submitLabel: args.submitLabel,
          publicKey: args.publicKey,
          schema: { fields: args.fields },
          metadata: args.metadata,
          expiresInSeconds: args.expiresInSeconds,
          createdBy: 'mcp-agent',
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
        const status = await intakeService.getIntakeStatus(args.tokenId);
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
        const revoked = await intakeService.revokeIntake(args.tokenId);
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

  fastify.post('/v1/mcp', async (request, reply) => {
    const apiKey = request.headers['x-api-key'];
    const expectedKey = process.env.MCP_API_KEY;

    if (!expectedKey) {
      fastify.log.error('MCP_API_KEY not configured');
      return reply.code(500).send({ error: 'Server misconfiguration' });
    }

    if (apiKey !== expectedKey) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    try {
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
