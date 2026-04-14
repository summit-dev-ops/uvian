import type { ServiceClients } from '../services/intake/types';

export interface CommandContext {
  eventEmitter?: {
    emitIntakeCreated: (data: unknown) => void;
    emitIntakeCompleted: (data: unknown) => void;
    emitIntakeRevoked: (data: unknown) => void;
    emitIntakeDeleted: (data: unknown) => void;
  };
}

export type { ServiceClients };
