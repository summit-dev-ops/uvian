import type { ServiceClients } from '../services/llm/types';
import type { AutomationEventEmitter } from '../plugins/event-emitter';

export interface CommandContext {
  eventEmitter?: AutomationEventEmitter;
}

export type { ServiceClients };
