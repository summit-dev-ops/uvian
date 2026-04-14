export const IntakeEvents = {
  INTAKE_COMPLETED: 'com.uvian.intake.completed',
  INTAKE_CREATED: 'com.uvian.intake.created',
  INTAKE_REVOKED: 'com.uvian.intake.revoked',
  INTAKE_DELETED: 'com.uvian.intake.deleted',
} as const;

export type IntakeEventType = (typeof IntakeEvents)[keyof typeof IntakeEvents];

export interface IntakeCompletedData {
  intakeId: string;
  submissionId: string;
  title: string;
  submittedAt: string;
  createdBy: string;
}

export interface IntakeCreatedData {
  intakeId: string;
  title: string;
  publicKey: string;
  expiresAt: string;
  createdBy: string;
}

export interface IntakeRevokedData {
  intakeId: string;
  revokedBy: string;
}

export interface IntakeDeletedData {
  intakeId: string;
  deletedBy: string;
}

export type IntakeEventData =
  | { type: typeof IntakeEvents.INTAKE_COMPLETED; data: IntakeCompletedData }
  | { type: typeof IntakeEvents.INTAKE_CREATED; data: IntakeCreatedData }
  | { type: typeof IntakeEvents.INTAKE_REVOKED; data: IntakeRevokedData }
  | { type: typeof IntakeEvents.INTAKE_DELETED; data: IntakeDeletedData };
