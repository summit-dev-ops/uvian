import { SupabaseClient } from '@supabase/supabase-js';

export interface ServiceClients {
  adminClient: SupabaseClient;
  userClient: SupabaseClient;
}

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

export interface Intake {
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
  submission_id: string | null;
}

export interface Submission {
  id: string;
  intake_id: string;
  payload: Record<string, unknown>;
  submitted_at: string;
  expires_at: string;
  submitted_by: string | null;
}

export interface CreateIntakeServiceConfig {}

export interface IntakeScopedService {
  createIntake(
    userId: string,
    input: CreateIntakeInput,
  ): Promise<{ id: string; tokenId: string; url: string }>;
  getIntakeStatus(tokenId: string): Promise<{
    status: Intake['status'];
    expiresAt: string;
  } | null>;
  listIntakes(userId: string): Promise<
    Array<{
      id: string;
      title: string;
      description: string | null;
      status: Intake['status'];
      expiresAt: string;
      createdAt: string;
    }>
  >;
  getIntakeSchema(tokenId: string): Promise<{
    title: string;
    description: string | null;
    submitLabel: string;
    publicKey: string;
    schema: IntakeSchema;
    requiresAuth: boolean;
  } | null>;
  submitIntake(
    tokenId: string,
    payload: Record<string, unknown>,
    userId?: string,
  ): Promise<{ submissionId: string }>;
  getSubmission(
    submissionId: string,
    userId: string,
  ): Promise<Submission | null>;
  getSubmissionsByIntakeId(
    intakeId: string,
    userId: string,
  ): Promise<Submission[]>;
  revokeIntake(tokenId: string, userId: string): Promise<boolean>;
}

export interface IntakeAdminService {
  getIntakeById(id: string): Promise<Intake | null>;
  getIntakeByToken(tokenId: string): Promise<Intake | null>;
  listAllIntakes(): Promise<Intake[]>;
  getAllIntakeSchemas(): Promise<
    Array<{
      id: string;
      title: string;
      description: string | null;
      submitLabel: string;
      publicKey: string;
      schema: IntakeSchema;
      requiresAuth: boolean;
      status: Intake['status'];
      expiresAt: string;
    }>
  >;
  getSubmissionById(id: string): Promise<Submission | null>;
  listAllSubmissions(): Promise<Submission[]>;
  listSubmissionsByIntakeId(intakeId: string): Promise<Submission[]>;
}
