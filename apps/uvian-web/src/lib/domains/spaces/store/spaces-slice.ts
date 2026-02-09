/**
 * Spaces Domain Store Slice
 *
 * Zustand slice for local UI state management.
 * Manages active space, spaces list, loading states, and error handling.
 */

import type { StateCreator } from 'zustand';
import type { SpaceUI } from '../types';

// ============================================================================
// Slice State
// ============================================================================

export interface SpacesSlice {
  // State
  spaces: SpaceUI[];
  activeSpaceId: string | null;
  spacesLoading: boolean;
  spacesError: string | null;
  selectedMemberIds: string[]; // For bulk operations
  spaceCreationDialogOpen: boolean;

  // Actions
  setSpaces: (spaces: SpaceUI[]) => void;
  addSpace: (space: SpaceUI) => void;
  updateSpace: (space: SpaceUI) => void;
  removeSpace: (spaceId: string) => void;
  setActiveSpace: (spaceId: string | null) => void;
  setSpacesLoading: (loading: boolean) => void;
  setSpacesError: (error: string | null) => void;
  clearSpacesError: () => void;

  // Selection actions for bulk operations
  toggleMemberSelection: (memberId: string) => void;
  selectAllMembers: () => void;
  clearMemberSelection: () => void;

  // UI state
  setSpaceCreationDialogOpen: (open: boolean) => void;
}

// ============================================================================
// Slice Creator
// ============================================================================

export const createSpacesSlice: StateCreator<SpacesSlice> = (set, get) => ({
  // Initial state
  spaces: [],
  activeSpaceId: null,
  spacesLoading: false,
  spacesError: null,
  selectedMemberIds: [],
  spaceCreationDialogOpen: false,

  // Core actions
  setSpaces: (spaces) => set({ spaces }),

  addSpace: (space) =>
    set((state) => ({
      spaces: [space, ...state.spaces],
    })),

  updateSpace: (updatedSpace) =>
    set((state) => ({
      spaces: state.spaces.map((space) =>
        space.id === updatedSpace.id ? updatedSpace : space
      ),
    })),

  removeSpace: (spaceId) =>
    set((state) => ({
      spaces: state.spaces.filter((space) => space.id !== spaceId),
      activeSpaceId:
        state.activeSpaceId === spaceId ? null : state.activeSpaceId,
    })),

  setActiveSpace: (spaceId) => set({ activeSpaceId: spaceId }),

  setSpacesLoading: (loading) => set({ spacesLoading: loading }),

  setSpacesError: (error) => set({ spacesError: error }),

  clearSpacesError: () => set({ spacesError: null }),

  // Selection actions
  toggleMemberSelection: (memberId) =>
    set((state) => ({
      selectedMemberIds: state.selectedMemberIds.includes(memberId)
        ? state.selectedMemberIds.filter((id) => id !== memberId)
        : [...state.selectedMemberIds, memberId],
    })),

  selectAllMembers: () =>
    set(() => ({
      selectedMemberIds: [], // This would need to be populated with actual member IDs
    })),

  clearMemberSelection: () => set({ selectedMemberIds: [] }),

  // UI state
  setSpaceCreationDialogOpen: (open) => set({ spaceCreationDialogOpen: open }),
});
