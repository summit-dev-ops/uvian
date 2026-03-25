export * from './messaging.js';
export * from './spaces.js';
export * from './content.js';
export * from './jobs.js';
export * from './tickets.js';
export * from './users.js';
export * from './accounts.js';
export * from './agents.js';
export * from './intake.js';
export * from './core.js';

import { MessagingEvents } from './messaging.js';
import { SpaceEvents } from './spaces.js';
import { ContentEvents } from './content.js';
import { JobEvents } from './jobs.js';
import { TicketEvents } from './tickets.js';
import { UserEvents } from './users.js';
import { AccountEvents } from './accounts.js';
import { AgentEvents } from './agents.js';
import { IntakeEvents } from './intake.js';
import { CoreEvents } from './core.js';

export const AllEvents = {
  ...MessagingEvents,
  ...SpaceEvents,
  ...ContentEvents,
  ...JobEvents,
  ...TicketEvents,
  ...UserEvents,
  ...AccountEvents,
  ...AgentEvents,
  ...IntakeEvents,
  ...CoreEvents,
} as const;

export type UvianEventType =
  | import('./messaging.js').MessagingEventType
  | import('./spaces.js').SpaceEventType
  | import('./content.js').ContentEventType
  | import('./jobs.js').JobEventType
  | import('./tickets.js').TicketEventType
  | import('./users.js').UserEventType
  | import('./accounts.js').AccountEventType
  | import('./agents.js').AgentEventType
  | import('./intake.js').IntakeEventType
  | import('./core.js').CoreEventType;

export type UvianEventData =
  | import('./messaging.js').MessagingEventData
  | import('./spaces.js').SpaceEventData
  | import('./content.js').ContentEventData
  | import('./jobs.js').JobEventData
  | import('./tickets.js').TicketEventData
  | import('./users.js').UserEventData
  | import('./accounts.js').AccountEventData
  | import('./agents.js').AgentEventData
  | import('./intake.js').IntakeEventData
  | import('./core.js').CoreEventData;
