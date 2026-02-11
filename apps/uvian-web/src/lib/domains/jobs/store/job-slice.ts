/**
 * Job Domain Store Slice
 *
 * Zustand slice for local UI state management.
 * Manages selected jobs, filters, sorting, and UI state.
 */

import type { StateCreator } from 'zustand';
import type {
  JobStatus,
  JobSortBy,
  JobSortOrder,
  JobSelectionState,
} from '../types';

// ============================================================================
// Slice State
// ============================================================================

export interface JobSlice {
  // Selection state
  selectedJobIds: string[];
  isSelecting: boolean;

  // Filter state
  filterStatus: JobStatus | null;
  filterType: string | null;
  filterDateFrom: Date | null;
  filterDateTo: Date | null;

  // Sort state
  sortBy: JobSortBy;
  sortOrder: JobSortOrder;

  // UI state
  showFilters: boolean;
  viewMode: 'list' | 'grid' | 'compact';

  // Actions
  setSelectedJobIds: (jobIds: string[]) => void;
  addSelectedJob: (jobId: string) => void;
  removeSelectedJob: (jobId: string) => void;
  toggleSelectedJob: (jobId: string) => void;
  clearSelection: () => void;
  selectAll: (jobIds: string[]) => void;

  // Filter actions
  setFilterStatus: (status: JobStatus | null) => void;
  setFilterType: (type: string | null) => void;
  setFilterDateFrom: (date: Date | null) => void;
  setFilterDateTo: (date: Date | null) => void;
  clearFilters: () => void;

  // Sort actions
  setSorting: (sortBy: JobSortBy, order: JobSortOrder) => void;
  toggleSort: (field: JobSortBy) => void;

  // UI actions
  setShowFilters: (show: boolean) => void;
  setViewMode: (mode: 'list' | 'grid' | 'compact') => void;

  // Computed getters
  getSelectionState: () => JobSelectionState;
  hasSelection: () => boolean;
  isJobSelected: (jobId: string) => boolean;
}

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SORT_BY: JobSortBy = 'createdAt';
const DEFAULT_SORT_ORDER: JobSortOrder = 'desc';

// ============================================================================
// Slice Creator
// ============================================================================

export const createJobSlice: StateCreator<JobSlice> = (set, get) => ({
  // Initial selection state
  selectedJobIds: [],
  isSelecting: false,

  // Initial filter state
  filterStatus: null,
  filterType: null,
  filterDateFrom: null,
  filterDateTo: null,

  // Initial sort state
  sortBy: DEFAULT_SORT_BY,
  sortOrder: DEFAULT_SORT_ORDER,

  // Initial UI state
  showFilters: false,
  viewMode: 'list',

  // Selection actions
  setSelectedJobIds: (jobIds) => {
    set({
      selectedJobIds: jobIds,
      isSelecting: jobIds.length > 0,
    });
  },

  addSelectedJob: (jobId) => {
    set((state) => ({
      selectedJobIds: state.selectedJobIds.includes(jobId)
        ? state.selectedJobIds
        : [...state.selectedJobIds, jobId],
      isSelecting: true,
    }));
  },

  removeSelectedJob: (jobId) => {
    set((state) => {
      const newSelectedJobIds = state.selectedJobIds.filter(
        (id) => id !== jobId
      );
      return {
        selectedJobIds: newSelectedJobIds,
        isSelecting: newSelectedJobIds.length > 0,
      };
    });
  },

  toggleSelectedJob: (jobId) => {
    const state = get();
    if (state.selectedJobIds.includes(jobId)) {
      state.removeSelectedJob(jobId);
    } else {
      state.addSelectedJob(jobId);
    }
  },

  clearSelection: () => {
    set({
      selectedJobIds: [],
      isSelecting: false,
    });
  },

  selectAll: (jobIds) => {
    set({
      selectedJobIds: jobIds,
      isSelecting: jobIds.length > 0,
    });
  },

  // Filter actions
  setFilterStatus: (status) => {
    set({ filterStatus: status });
  },

  setFilterType: (type) => {
    set({ filterType: type });
  },

  setFilterDateFrom: (date) => {
    set({ filterDateFrom: date });
  },

  setFilterDateTo: (date) => {
    set({ filterDateTo: date });
  },

  clearFilters: () => {
    set({
      filterStatus: null,
      filterType: null,
      filterDateFrom: null,
      filterDateTo: null,
    });
  },

  // Sort actions
  setSorting: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder });
  },

  toggleSort: (field) => {
    set((state) => {
      if (state.sortBy === field) {
        return {
          sortBy: field,
          sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
        };
      } else {
        return {
          sortBy: field,
          sortOrder: DEFAULT_SORT_ORDER,
        };
      }
    });
  },

  // UI actions
  setShowFilters: (show) => {
    set({ showFilters: show });
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
  },

  // Computed getters
  getSelectionState: () => ({
    selectedJobIds: get().selectedJobIds,
    isSelecting: get().isSelecting,
  }),

  hasSelection: () => {
    return get().selectedJobIds.length > 0;
  },

  isJobSelected: (jobId) => {
    return get().selectedJobIds.includes(jobId);
  },
});
