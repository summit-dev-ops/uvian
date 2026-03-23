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
  title: string;
  description?: string | null;
  submitLabel?: string;
  publicKey: string;
  schema: {
    fields: IntakeField[];
  };
}

export interface IntakeStatus {
  status: 'pending' | 'completed' | 'revoked' | 'expired';
  expiresAt: string;
}
