'use client';

import React, { createContext, useContext, useRef } from 'react';
import { useStore } from 'zustand';
import { createAppStore } from '~/lib/stores';
import type { AppState } from '~/lib/stores/app-store/types';

type AppStore = ReturnType<typeof createAppStore>;

const StoreContext = createContext<AppStore | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>(null);

  if (!storeRef.current) {
    storeRef.current = createAppStore();
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

export function useAppStore<T>(selector: (state: AppState) => T): T {
  const storeContext = useContext(StoreContext);

  if (!storeContext) {
    throw new Error('useAppStore must be used within StoreProvider');
  }

  return useStore(storeContext, selector);
}

export function useStoreApi() {
  const storeContext = useContext(StoreContext);

  if (!storeContext) {
    throw new Error('useStoreApi must be used within StoreProvider');
  }

  return storeContext;
}
