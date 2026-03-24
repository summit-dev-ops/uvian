import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import {
  IntakeCompletedData,
  IntakeCreatedData,
  IntakeRevokedData,
  IntakeEvents,
} from '@org/uvian-events';
import { createCloudEvent } from '@org/uvian-events';

export interface IntakeField {
  name: string;
  type: 'text' | 'password' | 'email' | 'select' | 'textarea';
  label: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  secret?: boolean;
}

export interface IntakeSchema {
  fields: IntakeField[];
}

export interface CreateIntakeInput {
  title: string;
  description?: string;
  submitLabel?: string;
  publicKey: string;
  schema: IntakeSchema;
  metadata?: Record<string, unknown>;
  expiresInSeconds?: number;
  createdBy: string;
  requiresAuth?: boolean;
}

export interface IntakeRecord {
  id: string;
  title: string;
  description: string | null;
  submit_label: string;
  public_key: string;
  schema: IntakeSchema;
  metadata: Record<string, unknown>;
  status: 'pending' | 'completed' | 'revoked' | 'expired';
  expires_at: string;
  created_by: string;
  created_at: string;
  requires_auth: boolean;
}

export interface SubmissionRecord {
  id: string;
  intake_id: string;
  payload: Record<string, unknown>;
  submitted_at: string;
  expires_at: string;
  submitted_by: string | null;
}

export class IntakeService {
  constructor(private fastify: FastifyInstance) {}

  private generateTokenId(): string {
    return `int_${nanoid(21)}`;
  }

  async createIntake(
    input: CreateIntakeInput
  ): Promise<{ tokenId: string; url: string }> {
    const tokenId = this.generateTokenId();
    const expiresAt = new Date(
      Date.now() + (input.expiresInSeconds ?? 3600) * 1000
    ).toISOString();

    const baseUrl = process.env.INTAKE_BASE_URL || 'https://intake.uvian.com';

    const { error } = await this.fastify.supabase
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
      this.fastify.log.error({ error }, 'Failed to create intake');
      throw new Error(`Failed to create intake: ${error.message}`);
    }

    this.emitIntakeCreated({
      intakeId: tokenId,
      title: input.title,
      publicKey: input.publicKey,
      expiresAt,
      createdBy: input.createdBy,
    });

    return {
      tokenId,
      url: `${baseUrl}/t/${tokenId}`,
    };
  }

  async getIntakeStatus(tokenId: string): Promise<{
    status: IntakeRecord['status'];
    expiresAt: string;
  } | null> {
    const { data, error } = await this.fastify.supabase
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
      await this.markAsExpired(tokenId);
      return { status: 'expired', expiresAt: data.expires_at };
    }

    return { status: data.status, expiresAt: data.expires_at };
  }

  async listIntakes(userId: string): Promise<
    Array<{
      id: string;
      title: string;
      description: string | null;
      status: IntakeRecord['status'];
      expiresAt: string;
      createdAt: string;
    }>
  > {
    const { data, error } = await this.fastify.supabase
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
  }

  async getIntakeSchema(tokenId: string): Promise<{
    title: string;
    description: string | null;
    submitLabel: string;
    publicKey: string;
    schema: IntakeSchema;
    requiresAuth: boolean;
  } | null> {
    const { data, error } = await this.fastify.supabase
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
      await this.markAsExpired(tokenId);
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
  }

  async submitIntake(
    tokenId: string,
    payload: Record<string, unknown>,
    submittedBy?: string
  ): Promise<{ submissionId: string }> {
    const intake = await this.getIntakeRecord(tokenId);
    if (!intake) {
      throw new Error('Intake not found');
    }

    if (intake.status !== 'pending') {
      throw new Error('Intake is no longer valid');
    }

    if (new Date(intake.expires_at) < new Date()) {
      await this.markAsExpired(tokenId);
      throw new Error('Intake has expired');
    }

    const submissionId = await this.storeSubmission(
      tokenId,
      payload,
      submittedBy
    );

    await this.markAsCompleted(tokenId, submissionId);

    const eventData: IntakeCompletedData = {
      intakeId: tokenId,
      submissionId,
      title: intake.title,
      submittedAt: new Date().toISOString(),
      createdBy: intake.created_by,
    };

    const event = createCloudEvent({
      type: IntakeEvents.INTAKE_COMPLETED,
      source: '/intakes',
      subject: tokenId,
      data: eventData,
    });

    const queueName = process.env.EVENTS_QUEUE_NAME || 'uvian-events';
    this.fastify.log.info(
      { eventId: event.id, eventType: event.type, queueName },
      'Adding INTAKE_COMPLETED event to queue'
    );

    try {
      const job = await this.fastify.queueService.addJob(
        queueName,
        'event',
        event,
        this.fastify.log
      );
      this.fastify.log.info(
        { jobId: job?.id, queueName },
        'INTAKE_COMPLETED event added to queue successfully'
      );
    } catch (err) {
      this.fastify.log.error(
        { err, queueName },
        'Failed to add INTAKE_COMPLETED event to queue'
      );
    }

    return { submissionId };
  }

  async getSubmission(submissionId: string): Promise<SubmissionRecord | null> {
    const { data, error } = await this.fastify.supabase
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

    return data as SubmissionRecord;
  }

  async getSubmissionsByIntakeId(
    intakeId: string
  ): Promise<SubmissionRecord[]> {
    const { data, error } = await this.fastify.supabase
      .schema('core_intake')
      .from('submissions')
      .select('*')
      .eq('intake_id', intakeId)
      .gt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to get submissions: ${error.message}`);
    }

    return data as SubmissionRecord[];
  }

  async revokeIntake(tokenId: string): Promise<boolean> {
    const intake = await this.getIntakeRecord(tokenId);
    if (!intake) {
      return false;
    }

    if (intake.status !== 'pending') {
      return false;
    }

    const { error } = await this.fastify.supabase
      .schema('core_intake')
      .from('intakes')
      .update({ status: 'revoked' })
      .eq('id', tokenId);

    if (error) {
      throw new Error(`Failed to revoke intake: ${error.message}`);
    }

    const eventData: IntakeRevokedData = {
      intakeId: tokenId,
      revokedBy: 'system',
    };

    const event = createCloudEvent({
      type: IntakeEvents.INTAKE_REVOKED,
      source: '/intakes',
      subject: tokenId,
      data: eventData,
    });

    const queueName = process.env.EVENTS_QUEUE_NAME || 'uvian-events';
    this.fastify.log.info(
      { eventId: event.id, eventType: event.type, queueName },
      'Adding INTAKE_REVOKED event to queue'
    );

    try {
      const job = await this.fastify.queueService.addJob(
        queueName,
        'event',
        event,
        this.fastify.log
      );
      this.fastify.log.info(
        { jobId: job?.id, queueName },
        'INTAKE_REVOKED event added to queue successfully'
      );
    } catch (err) {
      this.fastify.log.error(
        { err, queueName },
        'Failed to add INTAKE_REVOKED event to queue'
      );
    }

    return true;
  }

  async getIntakeRecord(tokenId: string): Promise<IntakeRecord | null> {
    const { data, error } = await this.fastify.supabase
      .schema('core_intake')
      .from('intakes')
      .select('*')
      .eq('id', tokenId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get intake: ${error.message}`);
    }

    return data as IntakeRecord;
  }

  private async markAsExpired(tokenId: string): Promise<void> {
    const { error } = await this.fastify.supabase
      .schema('core_intake')
      .from('intakes')
      .update({ status: 'expired' })
      .eq('id', tokenId);

    if (error) {
      this.fastify.log.error({ error }, 'Failed to mark intake as expired');
    }
  }

  private async markAsCompleted(
    tokenId: string,
    submissionId: string
  ): Promise<void> {
    const { error } = await this.fastify.supabase
      .schema('core_intake')
      .from('intakes')
      .update({ status: 'completed', submission_id: submissionId })
      .eq('id', tokenId);

    if (error) {
      this.fastify.log.error({ error }, 'Failed to mark intake as completed');
    }
  }

  private async storeSubmission(
    intakeId: string,
    payload: Record<string, unknown>,
    submittedBy?: string
  ): Promise<string> {
    const submissionId = `sub_${nanoid(21)}`;
    const expiryDays = Number(process.env.SUBMISSION_EXPIRY_DAYS) || 30;
    const expiresAt = new Date(
      Date.now() + expiryDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error } = await this.fastify.supabase
      .schema('core_intake')
      .from('submissions')
      .insert({
        id: submissionId,
        intake_id: intakeId,
        payload,
        expires_at: expiresAt,
        submitted_by: submittedBy || null,
      });

    if (error) {
      this.fastify.log.error({ error }, 'Failed to store submission');
      throw new Error(`Failed to store submission: ${error.message}`);
    }

    return submissionId;
  }

  private emitIntakeCreated(data: IntakeCreatedData): void {
    this.fastify.log.info(
      { intakeId: data.intakeId },
      'Emitting INTAKE_CREATED event'
    );

    const event = createCloudEvent({
      type: IntakeEvents.INTAKE_CREATED,
      source: '/intakes',
      subject: data.intakeId,
      data,
    });

    this.fastify.log.info(
      { eventId: event.id, eventType: event.type },
      'CloudEvent created'
    );

    const queueName = process.env.EVENTS_QUEUE_NAME || 'uvian-events';
    this.fastify.log.info({ queueName }, 'Adding event to queue');

    this.fastify.queueService
      .addJob(queueName, 'event', event, this.fastify.log)
      .then((job) => {
        this.fastify.log.info(
          { jobId: job?.id, queueName },
          'Event added to queue successfully'
        );
      })
      .catch((err) => {
        this.fastify.log.error(
          { err, queueName },
          'Failed to add intake created event to queue'
        );
      });
  }
}
