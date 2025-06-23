// File: stores/useFilterStore.ts
import { create } from 'zustand';

type LocationState = { name: string; latitude: number; longitude: number };

type FilterState = {
  location: LocationState | null;
  setLocation: (location: LocationState) => void;
  // We can add other filters here later
};

export const useFilterStore = create<FilterState>((set) => ({
  location: null,
  setLocation: (location) => set({ location }),
}));