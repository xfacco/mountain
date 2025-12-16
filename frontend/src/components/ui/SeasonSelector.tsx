'use client';

import { useSeasonStore } from '@/store/season-store';
import { Season } from '@/types';
import { Sun, Snowflake, CloudRain, Wind } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export function SeasonSelector() {
    const { currentSeason, setSeason } = useSeasonStore();

    const seasons: { id: Season; icon: React.ReactNode; label: string }[] = [
        { id: 'winter', icon: <Snowflake size={18} />, label: 'Winter' },
        { id: 'spring', icon: <CloudRain size={18} />, label: 'Spring' },
        { id: 'summer', icon: <Sun size={18} />, label: 'Summer' },
        { id: 'autumn', icon: <Wind size={18} />, label: 'Autumn' },
    ];

    return (
        <div className="flex bg-white/20 backdrop-blur-md p-1 rounded-full border border-white/30 shadow-sm">
            {seasons.map((season) => {
                const isActive = currentSeason === season.id;
                return (
                    <button
                        key={season.id}
                        onClick={() => setSeason(season.id)}
                        className={clsx(
                            'relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
                            isActive
                                ? 'text-white'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeSeason"
                                className="absolute inset-0 bg-primary rounded-full shadow-md"
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            />
                        )}
                        <span className="relative z-10">{season.icon}</span>
                        <span className="relative z-10 hidden sm:inline">
                            {season.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
