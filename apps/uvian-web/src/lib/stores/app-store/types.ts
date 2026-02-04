import type { ChatSlice } from '~/lib/domains/chat/store';
import type { UserSlice } from '~/lib/domains/user/store';

export type AppState = ChatSlice &
  UserSlice & {
    // Other slices can be added here
  };
