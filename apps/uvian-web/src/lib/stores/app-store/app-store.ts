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
      immer((set, get, api) => {
        const chatSlice = createChatSlice(set as any, get as any, api as any);
        const userSlice = createUserSlice(set as any, get as any, api as any);
        const spacesSlice = createSpacesSlice(
          set as any,
          get as any,
          api as any
        );
        const profileSlice = createProfileSlice(
          set as any,
          get as any,
          api as any
        );

        return {
          hasHydrated: false,
          setHasHydrated: (newState: boolean) => {
            set({ hasHydrated: newState });
          },
          ...chatSlice,
          ...userSlice,
          ...spacesSlice,
          ...profileSlice,
        };
      }),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          activeProfileId: state.activeProfileId,
        }),
        onRehydrateStorage: (state) => {
          return () => state.setHasHydrated(true);
        },
      }
    )
  );
};
