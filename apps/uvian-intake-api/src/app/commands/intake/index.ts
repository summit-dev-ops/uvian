import { ServiceClients, CreateIntakeInput } from '../../services/intake/types';
import { createIntakeService } from '../../services/intake';
import type { CommandContext } from '../../commands/types';

const intakeService = createIntakeService({});

export type CreateIntakeCommandInput = CreateIntakeInput & {
  createdBy: string;
};

export interface CreateIntakeCommandOutput {
  result: { tokenId: string; url: string };
}

export async function createIntake(
  clients: ServiceClients,
  input: CreateIntakeCommandInput,
  context?: CommandContext,
): Promise<CreateIntakeCommandOutput> {
  const result = await intakeService
    .scoped(clients)
    .createIntake(input.createdBy, input);

  if (context?.eventEmitter) {
    context.eventEmitter.emitIntakeCreated({
      intakeId: result.tokenId,
      title: input.title,
      publicKey: input.publicKey,
      expiresAt: new Date(
        Date.now() + (input.expiresInSeconds ?? 3600) * 1000,
      ).toISOString(),
      createdBy: input.createdBy,
    });
  }

  return { result };
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
