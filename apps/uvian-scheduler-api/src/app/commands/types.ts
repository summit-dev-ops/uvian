import type { ServiceClients } from '../services/schedule/types';

export interface CommandContext {
  eventEmitter?: {
    emitScheduleCreated: (data: unknown, actorId: string) => void;
    emitScheduleUpdated: (data: unknown, actorId: string) => void;
    emitScheduleCancelled: (data: unknown, actorId: string) => void;
  };
}

export type { ServiceClients };
