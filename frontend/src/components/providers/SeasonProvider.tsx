'use client';

import { useSeasonStore } from '@/store/season-store';
import { useEffect } from 'react';

export default function SeasonProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { currentSeason } = useSeasonStore();

    useEffect(() => {
        // Apply dataset attribute to body or root for CSS variable switching
        document.documentElement.setAttribute('data-season', currentSeason);
    }, [currentSeason]);

    return <>{children}</>;
}
