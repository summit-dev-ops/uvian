import {
  createCloudEvent,
  DiscordEvents,
  DiscordMessageCreatedData,
} from '@org/uvian-events';

export function emitDiscordMessageCreated(
  data: DiscordMessageCreatedData,
  actorId: string,
  source: string
): void {
  const resolvedActorId = actorId || 'external';

  const event = createCloudEvent({
    type: DiscordEvents.MESSAGE_CREATED,
    source,
    data: {
      ...data,
      actorId: resolvedActorId,
    },
    subject: resolvedActorId,
  });

  console.log(
    '[Discord-Connector] Emitting event:',
    JSON.stringify(event, null, 2)
  );
}

export const eventEmitter = {
  emitMessageCreated: emitDiscordMessageCreated,
};
