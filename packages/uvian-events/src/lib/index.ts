export * from './domains/index.js';
export * from './constants.js';
import { CLOUDEVENTS_SPEC_VERSION } from './constants.js';

export interface CloudEvent<T = unknown> {
  specversion: typeof CLOUDEVENTS_SPEC_VERSION;
  type: string;
  source: string;
  id: string;
  time?: string;
  datacontenttype?: string;
  subject?: string;
  data: T;
}

export interface CloudEventInput<T = unknown> {
  type: string;
  source: string;
  data: T;
  subject?: string;
}

export function createCloudEvent<T>(input: CloudEventInput<T>): CloudEvent<T> {
  return {
    specversion: CLOUDEVENTS_SPEC_VERSION,
    id: `evt_${crypto.randomUUID()}`,
    type: input.type,
    source: input.source,
    time: new Date().toISOString(),
    datacontenttype: 'application/json',
    subject: input.subject,
    data: input.data,
  };
}

export interface SourcePath {
  type: string;
  id: string;
}

export function parseSourcePath(source: string): SourcePath | null {
  if (!source || !source.startsWith('/')) {
    return null;
  }

  const parts = source.slice(1).split('/');
  if (parts.length < 2) {
    return null;
  }

  const type = parts[0];
  const id = parts.slice(1).join('/');

  return { type, id };
}

export function buildSourcePath(type: string, id: string): string {
  return `/${type}/${id}`;
}

export function createActorSource(actorType: string, actorId: string): string {
  return `/${actorType}/${actorId}`;
}

export interface WebhookEnvelope<T = unknown> {
  specversion: '1.0';
  type: string;
  source: string;
  id: string;
  time?: string;
  datacontenttype?: string;
  subject?: string;
  data: T;
}

export interface WebhookResponse {
  accepted: boolean;
  event_id: string;
  message?: string;
}

export function toWebhookEnvelope<T>(event: CloudEvent<T>): WebhookEnvelope<T> {
  return {
    specversion: event.specversion,
    id: event.id,
    type: event.type,
    source: event.source,
    time: event.time,
    datacontenttype: event.datacontenttype,
    subject: event.subject,
    data: event.data,
  };
}

export function fromWebhookEnvelope<T>(
  envelope: WebhookEnvelope<T>
): CloudEvent<T> {
  return {
    specversion: envelope.specversion,
    id: envelope.id,
    type: envelope.type,
    source: envelope.source,
    time: envelope.time,
    datacontenttype: envelope.datacontenttype,
    subject: envelope.subject,
    data: envelope.data,
  };
}
