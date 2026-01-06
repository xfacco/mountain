import { create } from 'zustand';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LocationState {
    locations: any[];
    loading: boolean;
    lastFetched: number | null;
    fetchLocations: (force?: boolean) => Promise<void>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
    locations: [],
    loading: false,
    lastFetched: null,
    fetchLocations: async (force = false) => {
        const { locations, lastFetched, loading } = get();

        // Cache for 10 minutes unless forced
        const CACHE_DURATION = 10 * 60 * 1000;
        const isCacheValid = lastFetched && (Date.now() - lastFetched < CACHE_DURATION);

        if (loading || (locations.length > 0 && isCacheValid && !force)) {
            return;
        }

        set({ loading: true });
        try {
            const q = query(
                collection(db, 'locations'),
                where('status', '==', 'published')
            );
            const querySnapshot = await getDocs(q);
            const fetchedLocations = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter((loc: any) => !loc.language || loc.language === 'en');

            set({
                locations: fetchedLocations,
                loading: false,
                lastFetched: Date.now()
            });
        } catch (error) {
            console.error("Error fetching locations:", error);
            set({ loading: false });
        }
    },
}));
