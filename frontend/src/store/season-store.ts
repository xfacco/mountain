import { create } from 'zustand';

export type Season = 'winter' | 'summer' | 'spring' | 'autumn';

interface SeasonState {
    currentSeason: Season;
    setSeason: (season: Season) => void;
}

export const useSeasonStore = create<SeasonState>((set) => ({
    currentSeason: 'winter', // Default
    setSeason: (season) => set({ currentSeason: season }),
}));
