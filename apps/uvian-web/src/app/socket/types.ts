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

export interface NewMessagePayload {
  conversationId: string;
  text: string;
  sender: string;
}

/**
 * Mapping of event names to their listener signatures.
 * The generic parameter of `Socket` from `socket.io-client` uses this map.
 */
export interface SocketEvents {
  join_conversation: (payload: JoinConversationPayload) => void;
  send_message: (payload: SendMessagePayload) => void;
  new_message: (payload: NewMessagePayload) => void;
}
