import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { AppState } from './types';
import { createChatSlice } from '~/lib/domains/chat/store';

export const createAppStore = () => {
  return createStore<AppState>()(
    immer((set, get, api) => ({
      ...createChatSlice(set, get, api),
    }))
  );
};
