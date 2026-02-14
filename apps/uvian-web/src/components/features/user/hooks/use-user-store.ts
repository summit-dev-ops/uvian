'use client';

import { useAppStore } from '~/components/providers/store/store-provider';

export const useUserSessionStore = () => {
  const activeProfileId = useAppStore((state) => state.activeProfileId);
  const setActiveProfile = useAppStore((state) => state.setActiveProfile);

  return {
    activeProfileId,
    setActiveProfile,
  };
};
