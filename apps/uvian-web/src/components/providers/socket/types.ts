/**
 * Type definitions for Socket.io events used between the client and the server.
 * These definitions ensure type‑safety when emitting or listening to events.
 */
export interface JoinConversationPayload {
  conversationId: string;
}

export interface SendMessagePayload {
  conversationId: string;
  text: string;
  sender: string;
}

/**
 * Chat-specific socket event payloads for real-time messaging.
 */
export interface SocketMessageEvent {
  conversationId: string;
  message: {
    id: string;
    conversationId: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    createdAt: string;
    updatedAt: string;
  };
  isDelta?: boolean;
  isComplete?: boolean;
}

export interface SocketTokenEvent {
  conversationId: string;
  messageId: string;
  token: string;
  isComplete: boolean;
}

export interface SocketConversationUpdateEvent {
  conversationId: string;
  title?: string;
}

/**
 * Mapping of event names to their listener signatures.
 * The generic parameter of `Socket` from `socket.io-client` uses this map.
 */
export interface SocketEvents {
  join_conversation: (payload: JoinConversationPayload) => void;
  send_message: (payload: SendMessagePayload) => void;
  new_message: (payload: SocketMessageEvent) => void;
  conversation_updated: (payload: SocketConversationUpdateEvent) => void;
}
