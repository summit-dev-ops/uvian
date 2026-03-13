import { queueService } from '../queue.service';
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
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as PostCreatedData;

      console.log('Post published:', { postId: payload.postId });

      await queueService.addJob('main-queue', 'post.created', {
        eventId: envelope.id,
        postId: payload.postId,
        content: payload.content,
        authorId: payload.authorId,
        spaceId: payload.spaceId,
      });
    }
  );

  webhookHandler.registerHandler(
    ContentEvents.NOTE_UPDATED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as NoteUpdatedData;

      console.log('Note updated:', { noteId: payload.noteId });

      await queueService.addJob('main-queue', 'note.updated', {
        eventId: envelope.id,
        noteId: payload.noteId,
        title: payload.title,
        content: payload.content,
        updatedBy: payload.updatedBy,
      });
    }
  );

  webhookHandler.registerHandler(
    ContentEvents.ASSET_UPLOADED,
    async (envelope: WebhookEnvelope) => {
      const payload = envelope.data as AssetUploadedData;

      console.log('Asset uploaded:', { assetId: payload.assetId });

      await queueService.addJob('main-queue', 'asset.uploaded', {
        eventId: envelope.id,
        assetId: payload.assetId,
        filename: payload.filename,
        mimeType: payload.mimeType,
        sizeBytes: payload.sizeBytes,
        spaceId: payload.spaceId,
        conversationId: payload.conversationId,
      });
    }
  );
}
