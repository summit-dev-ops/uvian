import { nanoid } from 'nanoid';
import { ServiceClients } from './types';
import {
  IntakeScopedService,
  Intake,
  Submission,
  CreateIntakeInput,
} from './types';

const INTAKE_BASE_URL =
  process.env.INTAKE_BASE_URL || 'https://intake.uvian.com';

function generateTokenId(): string {
  return `int_${nanoid(21)}`;
}

function generateSubmissionId(): string {
  return `sub_${nanoid(21)}`;
}

export function createIntakeScopedService(
  clients: ServiceClients
): IntakeScopedService {
  return {
    async createIntake(
      userId: string,
      input: CreateIntakeInput
    ): Promise<{ tokenId: string; url: string }> {
      const tokenId = generateTokenId();
      const expiresAt = new Date(
        Date.now() + (input.expiresInSeconds ?? 3600) * 1000
      ).toISOString();

      const { error } = await clients.adminClient
        .schema('core_intake')
        .from('intakes')
        .insert({
          id: tokenId,
          title: input.title,
          description: input.description || null,
          submit_label: input.submitLabel || 'Submit',
          public_key: input.publicKey,
          schema: input.schema,
          metadata: input.metadata || {},
          status: 'pending',
          expires_at: expiresAt,
          created_by: input.createdBy,
          requires_auth: input.requiresAuth ?? false,
        });

      if (error) {
        throw new Error(`Failed to create intake: ${error.message}`);
      }

      return {
        tokenId,
        url: `${INTAKE_BASE_URL}/t/${tokenId}`,
      };
    },

    async getIntakeStatus(tokenId: string): Promise<{
      status: Intake['status'];
      expiresAt: string;
    } | null> {
      const { data, error } = await clients.adminClient
        .schema('core_intake')
        .from('intakes')
        .select('status, expires_at')
        .eq('id', tokenId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to get intake: ${error.message}`);
      }

      if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
        await clients.adminClient
          .schema('core_intake')
          .from('intakes')
          .update({ status: 'expired' })
          .eq('id', tokenId);
        return { status: 'expired', expiresAt: data.expires_at };
      }

      return { status: data.status, expiresAt: data.expires_at };
    },

    async listIntakes(userId: string): Promise<
      Array<{
        id: string;
        title: string;
        description: string | null;
        status: Intake['status'];
        expiresAt: string;
        createdAt: string;
      }>
    > {
      const { data, error } = await clients.userClient
        .schema('core_intake')
        .from('intakes')
        .select('id, title, description, status, expires_at, created_at')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list intakes: ${error.message}`);
      }

      return (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
      }));
    },

    async getIntakeSchema(tokenId: string): Promise<{
      title: string;
      description: string | null;
      submitLabel: string;
      publicKey: string;
      schema: Intake['schema'];
      requiresAuth: boolean;
    } | null> {
      const { data, error } = await clients.adminClient
        .schema('core_intake')
        .from('intakes')
        .select(
          'title, description, submit_label, public_key, schema, status, expires_at, requires_auth'
        )
        .eq('id', tokenId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to get intake: ${error.message}`);
      }

      if (data.status === 'pending' && new Date(data.expires_at) < new Date()) {
        await clients.adminClient
          .schema('core_intake')
          .from('intakes')
          .update({ status: 'expired' })
          .eq('id', tokenId);
        return null;
      }

      if (data.status !== 'pending') {
        return null;
      }

      return {
        title: data.title,
        description: data.description,
        submitLabel: data.submit_label,
        publicKey: data.public_key,
        schema: data.schema,
        requiresAuth: data.requires_auth ?? false,
      };
    },

    async submitIntake(
      tokenId: string,
      payload: Record<string, unknown>,
      userId?: string
    ): Promise<{ submissionId: string }> {
      const { data: intake, error: intakeError } = await clients.adminClient
        .schema('core_intake')
        .from('intakes')
        .select('*')
        .eq('id', tokenId)
        .single();

      if (intakeError || !intake) {
        throw new Error('Intake not found');
      }

      if (intake.status !== 'pending') {
        throw new Error('Intake is no longer valid');
      }

      if (new Date(intake.expires_at) < new Date()) {
        await clients.adminClient
          .schema('core_intake')
          .from('intakes')
          .update({ status: 'expired' })
          .eq('id', tokenId);
        throw new Error('Intake has expired');
      }

      const submissionId = generateSubmissionId();
      const expiryDays = Number(process.env.SUBMISSION_EXPIRY_DAYS) || 30;
      const expiresAt = new Date(
        Date.now() + expiryDays * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error: submissionError } = await clients.adminClient
        .schema('core_intake')
        .from('submissions')
        .insert({
          id: submissionId,
          intake_id: tokenId,
          payload,
          expires_at: expiresAt,
          submitted_by: userId || null,
        });

      if (submissionError) {
        throw new Error(
          `Failed to store submission: ${submissionError.message}`
        );
      }

      await clients.adminClient
        .schema('core_intake')
        .from('intakes')
        .update({ status: 'completed', submission_id: submissionId })
        .eq('id', tokenId);

      return { submissionId };
    },

    async getSubmission(
      submissionId: string,
      userId: string
    ): Promise<Submission | null> {
      const { data, error } = await clients.userClient
        .schema('core_intake')
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to get submission: ${error.message}`);
      }

      if (new Date(data.expires_at) < new Date()) {
        return null;
      }

      return data as Submission;
    },

    async getSubmissionsByIntakeId(
      intakeId: string,
      userId: string
    ): Promise<Submission[]> {
      const { data: intake, error: intakeError } = await clients.userClient
        .schema('core_intake')
        .from('intakes')
        .select('created_by')
        .eq('id', intakeId)
        .single();

      if (intakeError || !intake || intake.created_by !== userId) {
        throw new Error('Access denied');
      }

      const { data, error } = await clients.userClient
        .schema('core_intake')
        .from('submissions')
        .select('*')
        .eq('intake_id', intakeId)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        throw new Error(`Failed to get submissions: ${error.message}`);
      }

      return data as Submission[];
    },

    async revokeIntake(tokenId: string, userId: string): Promise<boolean> {
      const { data: intake, error: intakeError } = await clients.adminClient
        .schema('core_intake')
        .from('intakes')
        .select('*')
        .eq('id', tokenId)
        .single();

      if (intakeError || !intake) {
        return false;
      }

      if (intake.created_by !== userId) {
        throw new Error('Access denied');
      }

      if (intake.status !== 'pending') {
        return false;
      }

      const { error } = await clients.adminClient
        .schema('core_intake')
        .from('intakes')
        .update({ status: 'revoked' })
        .eq('id', tokenId);

      if (error) {
        throw new Error(`Failed to revoke intake: ${error.message}`);
      }

      return true;
    },
  };
}
