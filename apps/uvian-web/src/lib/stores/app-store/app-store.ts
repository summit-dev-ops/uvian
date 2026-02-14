import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { AppState } from './types';
import { createChatSlice } from '~/lib/domains/chat/store';
import { createUserSlice } from '~/lib/domains/user/store';
import { createSpacesSlice } from '~/lib/domains/spaces/store';
import { createProfileSlice } from '~/lib/domains/profile/store';

export const createAppStore = () => {
  return createStore<AppState>()(
    immer((set, get, api) => ({
      ...createChatSlice(set, get, api),
      ...createUserSlice(set, get, api),
      ...createSpacesSlice(set, get, api),
      ...createProfileSlice(set, get, api),
    }))
  );
};
