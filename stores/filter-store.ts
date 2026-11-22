import { create } from "zustand";
import type { BookAvailabilityMode, BookCondition } from "@/types/book";

export type SortOption =
  | "rating"
  | "newest"
  | "price_low"
  | "price_high"
  | "distance";

type FilterState = {
  mode: BookAvailabilityMode | null;
  categories: string[];
  conditions: BookCondition[];
  priceMin: number | null;
  priceMax: number | null;
  distanceKm: number | null;
  sortBy: SortOption;
  searchQuery: string;

  // Actions
  setMode: (mode: BookAvailabilityMode | null) => void;
  setCategories: (categories: string[]) => void;
  toggleCategory: (category: string) => void;
  setConditions: (conditions: BookCondition[]) => void;
  toggleCondition: (condition: BookCondition) => void;
  setPriceRange: (min: number | null, max: number | null) => void;
  setDistanceKm: (km: number | null) => void;
  setSortBy: (sort: SortOption) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  getActiveFilterCount: () => number;
  buildQueryParams: () => Record<string, string>;
};

const initialState = {
  mode: null,
  categories: [],
  conditions: [],
  priceMin: null,
  priceMax: null,
  distanceKm: null,
  sortBy: "newest" as SortOption,
  searchQuery: "",
};

export const useFilterStore = create<FilterState>()((set, get) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  setCategories: (categories) => set({ categories }),

  toggleCategory: (category) =>
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories.filter((c) => c !== category)
        : [...state.categories, category],
    })),

  setConditions: (conditions) => set({ conditions }),

  toggleCondition: (condition) =>
    set((state) => ({
      conditions: state.conditions.includes(condition)
        ? state.conditions.filter((c) => c !== condition)
        : [...state.conditions, condition],
    })),

  setPriceRange: (min, max) => set({ priceMin: min, priceMax: max }),

  setDistanceKm: (km) => set({ distanceKm: km }),

  setSortBy: (sortBy) => set({ sortBy }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  resetFilters: () => set(initialState),

  getActiveFilterCount: () => {
    const state = get();
    let count = 0;
    if (state.mode) count++;
    if (state.categories.length > 0) count++;
    if (state.conditions.length > 0) count++;
    if (state.priceMin !== null || state.priceMax !== null) count++;
    if (state.distanceKm !== null) count++;
    if (state.sortBy !== "newest") count++;
    return count;
  },

  buildQueryParams: () => {
    const state = get();
    const params: Record<string, string> = {};

    if (state.mode) params.type = state.mode;
    if (state.categories.length > 0) params.category = state.categories.join(",");
    if (state.conditions.length > 0) params.condition = state.conditions.join(",");
    if (state.priceMin !== null) params.price_min = String(state.priceMin);
    if (state.priceMax !== null) params.price_max = String(state.priceMax);
    if (state.distanceKm !== null) params.radius = String(state.distanceKm);
    if (state.sortBy) params.ordering = state.sortBy;
    if (state.searchQuery.trim()) params.q = state.searchQuery.trim();

    return params;
  },
}));
