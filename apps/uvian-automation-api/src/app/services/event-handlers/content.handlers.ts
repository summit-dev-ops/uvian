import { jobService } from '../job.service';
import {
  WebhookEnvelope,
  ContentEvents,
  PostCreatedData,
  NoteUpdatedData,
  AssetUploadedData,
} from '@org/uvian-events';

export function registerContentHandlers(webhookHandler: any) {
  webhookHandler.registerHandler(
    ContentEvents.POST_CREATED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as PostCreatedData;

      console.log('Post published:', { postId: payload.postId, agentId });

      await jobService.createEventJob({
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'post.created',
          actor: { id: payload.authorId, type: 'user' },
          resource: {
            type: 'post',
            id: payload.postId,
            data: { content: payload.content },
          },
          context: { spaceId: payload.spaceId },
          agentId,
        },
      });
    }
  );

  webhookHandler.registerHandler(
    ContentEvents.NOTE_UPDATED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as NoteUpdatedData;

      console.log('Note updated:', { noteId: payload.noteId, agentId });

      await jobService.createEventJob({
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'note.updated',
          actor: { id: payload.updatedBy, type: 'user' },
          resource: {
            type: 'note',
            id: payload.noteId,
            data: { title: payload.title, content: payload.content },
          },
          context: {},
          agentId,
        },
      });
    }
  );

  webhookHandler.registerHandler(
    ContentEvents.ASSET_UPLOADED,
    async (envelope: WebhookEnvelope, agentId?: string) => {
      const payload = envelope.data as AssetUploadedData;

      console.log('Asset uploaded:', { assetId: payload.assetId, agentId });

      await jobService.createEventJob({
        type: 'agent',
        input: {
          eventId: envelope.id,
          eventType: 'asset.uploaded',
          actor: { id: 'system', type: 'system' },
          resource: {
            type: 'asset',
            id: payload.assetId,
            data: {
              filename: payload.filename,
              mimeType: payload.mimeType,
              sizeBytes: payload.sizeBytes,
            },
          },
          context: {
            spaceId: payload.spaceId,
            conversationId: payload.conversationId,
          },
          agentId,
        },
      });
    }
  );
}
