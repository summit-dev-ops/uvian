import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState } from './types';
import { createChatSlice } from '~/lib/domains/chat/store';
import { createUserSlice } from '~/lib/domains/user/store';
import { createSpacesSlice } from '~/lib/domains/spaces/store';
import { createProfileSlice } from '~/lib/domains/profile/store';

export const createAppStore = () => {
  return createStore<AppState>()(
    persist(
      immer((set, get, api) => ({
        hasHydrated: false, // Add this flag
        setHasHydrated: (newState: boolean) => {
          set({ hasHydrated: newState });
        },
        ...createChatSlice(set, get, api),
        ...createUserSlice(set, get, api),
        ...createSpacesSlice(set, get, api),
        ...createProfileSlice(set, get, api),
      })),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => localStorage), 
        partialize: (state) => ({
          activeProfileId: state.activeProfileId,
        }),
        onRehydrateStorage: (state) => {
          return () => state.setHasHydrated(true);
        }
      }
    )
  );
};