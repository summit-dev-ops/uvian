import type { ChatSlice } from '~/lib/domains/chat/store';

export type AppState = ChatSlice & {
  // Other slices can be added here
};
