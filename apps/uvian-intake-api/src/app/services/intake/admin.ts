import { ServiceClients } from './types';
import { IntakeAdminService, Intake, Submission } from './types';

export function createIntakeAdminService(
  clients: ServiceClients
): IntakeAdminService {
  return {
    async getIntakeById(id: string): Promise<Intake | null> {
      const { data, error } = await clients.adminClient
        .schema('core_intake')
        .from('intakes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to get intake: ${error.message}`);
      }

      return data as Intake;
    },

    async getIntakeByToken(tokenId: string): Promise<Intake | null> {
      const { data, error } = await clients.adminClient
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

      return data as Intake;
    },

    async listAllIntakes(): Promise<Intake[]> {
      const { data, error } = await clients.adminClient
        .schema('core_intake')
        .from('intakes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list intakes: ${error.message}`);
      }

      return data || [];
    },

    async getAllIntakeSchemas(): Promise<
      Array<{
        id: string;
        title: string;
        description: string | null;
        submitLabel: string;
        publicKey: string;
        schema: Intake['schema'];
        requiresAuth: boolean;
        status: Intake['status'];
        expiresAt: string;
      }>
    > {
      const { data, error } = await clients.adminClient
        .schema('core_intake')
        .from('intakes')
        .select(
          'id, title, description, submit_label, public_key, schema, requires_auth, status, expires_at'
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list intakes: ${error.message}`);
      }

      return (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        submitLabel: row.submit_label,
        publicKey: row.public_key,
        schema: row.schema,
        requiresAuth: row.requires_auth ?? false,
        status: row.status,
        expiresAt: row.expires_at,
      }));
    },

    async getSubmissionById(id: string): Promise<Submission | null> {
      const { data, error } = await clients.adminClient
        .schema('core_intake')
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to get submission: ${error.message}`);
      }

      return data as Submission;
    },

    async listAllSubmissions(): Promise<Submission[]> {
      const { data, error } = await clients.adminClient
        .schema('core_intake')
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list submissions: ${error.message}`);
      }

      return data || [];
    },

    async listSubmissionsByIntakeId(intakeId: string): Promise<Submission[]> {
      const { data, error } = await clients.adminClient
        .schema('core_intake')
        .from('submissions')
        .select('*')
        .eq('intake_id', intakeId)
        .order('submitted_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to list submissions: ${error.message}`);
      }

      return data || [];
    },
  };
}
