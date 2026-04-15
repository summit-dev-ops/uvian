import { ServiceClients, CreateIntakeInput } from '../../services/intake/types';
import { createIntakeService } from '../../services/intake';
import { subscriptionService } from '../../services/factory';
import type { CommandContext } from '../../commands/types';

const intakeService = createIntakeService({});

async function createSubscriptions(
  clients: ServiceClients,
  intakeId: string,
  subscriberIds: string[],
): Promise<void> {
  const subService = subscriptionService.admin(clients);

  const existingSubs = await subService.getSubscriptionsByResource(
    'uvian.intake',
    intakeId,
  );

  const existingUserIds = new Set(existingSubs.map((s: any) => s.user_id));
  const newSubscriberIds = subscriberIds.filter(
    (uid) => !existingUserIds.has(uid),
  );

  if (newSubscriberIds.length === 0) return;

  const scopedService = subscriptionService.scoped(clients);

  for (const userId of newSubscriberIds) {
    await scopedService.activateSubscription(userId, 'uvian.intake', intakeId);
  }
}

export type CreateIntakeCommandInput = CreateIntakeInput & {
  createdBy: string;
  subscriberIds?: string[];
};

export interface CreateIntakeCommandOutput {
  result: { tokenId: string; url: string };
  intake: { id: string; tokenId: string; url: string };
}

export async function createIntake(
  clients: ServiceClients,
  input: CreateIntakeCommandInput,
  context?: CommandContext,
): Promise<CreateIntakeCommandOutput> {
  const subscriberIds = input.subscriberIds ?? [];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { subscriberIds: _subscriberIds, ...inputWithoutSubscribers } = input;

  const intake = await intakeService
    .scoped(clients)
    .createIntake(
      input.createdBy,
      inputWithoutSubscribers as CreateIntakeInput,
    );

  if (subscriberIds.length > 0) {
    await createSubscriptions(clients, intake.id, subscriberIds);
  }

  if (context?.eventEmitter) {
    context.eventEmitter.emitIntakeCreated({
      intakeId: intake.tokenId,
      title: input.title,
      publicKey: input.publicKey,
      expiresAt: new Date(
        Date.now() + (input.expiresInSeconds ?? 3600) * 1000,
      ).toISOString(),
      createdBy: input.createdBy,
    });
  }

  return { result: { tokenId: intake.tokenId, url: intake.url }, intake };
}

export interface RevokeIntakeCommandInput {
  tokenId: string;
  userId: string;
}

export interface RevokeIntakeCommandOutput {
  success: boolean;
}

export async function revokeIntake(
  clients: ServiceClients,
  input: RevokeIntakeCommandInput,
  context?: CommandContext,
): Promise<RevokeIntakeCommandOutput> {
  const revoked = await intakeService
    .scoped(clients)
    .revokeIntake(input.tokenId, input.userId);

  if (context?.eventEmitter && revoked) {
    context.eventEmitter.emitIntakeRevoked({
      intakeId: input.tokenId,
      revokedBy: input.userId,
    });
  }

  return { success: !!revoked };
}

export interface CompleteIntakeCommandInput {
  tokenId: string;
  submittedBy: string | null | undefined;
  payload: Record<string, unknown>;
  title: string;
}

export interface CompleteIntakeCommandOutput {
  submissionId: string;
}

export async function completeIntake(
  clients: ServiceClients,
  input: CompleteIntakeCommandInput,
  context?: CommandContext,
): Promise<CompleteIntakeCommandOutput> {
  const { submissionId } = await intakeService
    .scoped(clients)
    .submitIntake(input.tokenId, input.payload, input.submittedBy || undefined);

  if (context?.eventEmitter) {
    context.eventEmitter.emitIntakeCompleted({
      intakeId: input.tokenId,
      submissionId,
      title: input.title,
      submittedAt: new Date().toISOString(),
      createdBy: input.submittedBy || '',
    });
  }

  return { submissionId };
}
