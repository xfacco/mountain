import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareLocation {
    id: string;
    name: string;
    coverImage: string;
    region?: string;
    country?: string;
    [key: string]: any; // Allow other properties for flexibility
}

interface CompareState {
    selectedLocations: CompareLocation[];
    addLocation: (location: CompareLocation) => void;
    removeLocation: (id: string) => void;
    clearLocations: () => void;
}

export const useCompareStore = create<CompareState>()(
    persist(
        (set) => ({
            selectedLocations: [],
            addLocation: (location) => set((state) => {
                // Avoid duplicates
                if (state.selectedLocations.find(l => l.id === location.id)) {
                    return state;
                }
                // Limit to 3
                if (state.selectedLocations.length >= 3) {
                    // Optionally remove the first one to make room? Or just block?
                    // Let's block for now, user can remove manually. 
                    // Or actually, user experience usually prefers replacing or warning.
                    // Given the previous code limit, let's just stick to 3 max.
                    return state;
                }
                return { selectedLocations: [...state.selectedLocations, location] };
            }),
            removeLocation: (id) => set((state) => ({
                selectedLocations: state.selectedLocations.filter(l => l.id !== id)
            })),
            clearLocations: () => set({ selectedLocations: [] }),
        }),
        {
            name: 'compare-storage', // unique name
        }
    )
);
