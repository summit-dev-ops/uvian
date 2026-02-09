import type { ChatSlice } from '~/lib/domains/chat/store';
import type { UserSlice } from '~/lib/domains/user/store';
import type { SpacesSlice } from '~/lib/domains/spaces/store';

export type AppState = ChatSlice &
  UserSlice &
  SpacesSlice & {
    // Other slices can be added here
  };
