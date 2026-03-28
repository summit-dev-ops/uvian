import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { assetService } from '../services/asset.service';
import { adminSupabase } from '../clients/supabase.client';
import {
  CreateAssetRequest,
  GetAssetRequest,
  DeleteAssetRequest,
  GetUploadUrlRequest,
  ResolveAssetsRequest,
} from '../types/asset.types';

function getClients(request: any) {
  return {
    adminClient: adminSupabase,
    userClient: request.supabase,
  };
}

export default async function assetsRoutes(fastify: FastifyInstance) {
  // GET /assets - List user's assets
  fastify.get(
    '/api/assets',
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

        const { page, limit, type } = request.query as {
          page?: string;
          limit?: string;
          type?: string;
        };

        const result = await assetService.getAssets(getClients(request), {
          page: page ? parseInt(page) : 1,
          limit: limit ? parseInt(limit) : 20,
          type,
        });

        reply.send(result);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to fetch assets' });
      }
    }
  );

  // GET /assets/:assetId - Get single asset
  fastify.get<GetAssetRequest>(
    '/api/assets/:assetId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['assetId'],
          properties: {
            assetId: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (request: FastifyRequest<GetAssetRequest>, reply: FastifyReply) => {
      try {
        const { assetId } = request.params;

        const asset = await assetService.getAsset(getClients(request), assetId);

        reply.send(asset);
      } catch (error: any) {
        if (error.message.includes('not found')) {
          reply.code(404).send({ error: 'Asset not found' });
        } else {
          reply.code(400).send({ error: 'Failed to fetch asset' });
        }
      }
    }
  );

  // POST /assets - Create asset record (after upload)
  fastify.post<CreateAssetRequest>(
    '/api/assets',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['type', 'url'],
          properties: {
            type: { type: 'string' },
            url: { type: 'string' },
            filename: { type: 'string' },
            mimeType: { type: 'string' },
            fileSizeBytes: { type: 'number' },
            storageType: { type: 'string', enum: ['supabase', 'external'] },
            metadata: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<CreateAssetRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const asset = await assetService.createAsset(
          getClients(request),
          userId,
          request.body
        );

        fastify.services.eventEmitter.emitAssetUploaded(
          {
            assetId: asset.id,
            filename: asset.filename || '',
            mimeType: asset.mimeType || '',
            sizeBytes: asset.fileSizeBytes || 0,
            uploadedBy: userId,
          },
          userId
        );

        reply.code(201).send(asset);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to create asset' });
      }
    }
  );

  // DELETE /assets/:assetId - Delete asset
  fastify.delete<DeleteAssetRequest>(
    '/api/assets/:assetId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        params: {
          type: 'object',
          required: ['assetId'],
          properties: {
            assetId: { type: 'string' },
          },
          additionalProperties: false,
        },
        querystring: {
          type: 'object',
          properties: {
            hard: { type: 'string', enum: ['true', 'false'] },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<DeleteAssetRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { assetId } = request.params;
        const hardDelete = request.query?.hard === 'true';

        await assetService.deleteAsset(
          getClients(request),
          userId,
          assetId,
          hardDelete
        );

        fastify.services.eventEmitter.emitAssetDeleted(
          { assetId, deletedBy: userId },
          userId
        );

        reply.code(204).send();
      } catch (error: any) {
        if (error.message.includes('not found')) {
          reply.code(404).send({ error: 'Asset not found' });
        } else if (error.message.includes('Insufficient permissions')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply.code(400).send({ error: 'Failed to delete asset' });
        }
      }
    }
  );

  // POST /assets/upload-url - Get upload path for direct upload
  fastify.post<GetUploadUrlRequest>(
    '/api/assets/upload-url',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['filename', 'contentType'],
          properties: {
            filename: { type: 'string' },
            contentType: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<GetUploadUrlRequest>,
      reply: FastifyReply
    ) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          reply.code(401).send({ error: 'Not authenticated' });
          return;
        }

        const { filename, contentType } = request.body;

        const result = await assetService.getUploadUrl(
          getClients(request),
          userId,
          filename,
          contentType
        );

        reply.send(result);
      } catch (error: any) {
        if (error.message.includes('do not have access')) {
          reply.code(403).send({ error: error.message });
        } else {
          reply.code(400).send({ error: 'Failed to get upload URL' });
        }
      }
    }
  );

  // POST /assets/resolve - Resolve asset IDs to URLs
  fastify.post<ResolveAssetsRequest>(
    '/api/assets/resolve',
    {
      preHandler: [fastify.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['assetIds'],
          properties: {
            assetIds: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          additionalProperties: false,
        },
      },
    },
    async (
      request: FastifyRequest<ResolveAssetsRequest>,
      reply: FastifyReply
    ) => {
      try {
        const { assetIds } = request.body;

        const resolved = await assetService.resolveAssets(
          getClients(request),
          assetIds
        );

        reply.send(resolved);
      } catch (error: any) {
        reply.code(400).send({ error: 'Failed to resolve assets' });
      }
    }
  );
}
