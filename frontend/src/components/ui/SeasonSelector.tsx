'use client';

import { useState } from 'react';

import { useSeasonStore } from '@/store/season-store';
import { Season } from '@/types';
import { Sun, Snowflake, CloudRain, Wind } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export function SeasonSelector() {
    const { currentSeason, setSeason } = useSeasonStore();
    const t = useTranslations('Seasons');

    const seasons: { id: Season; icon: React.ReactNode; label: string }[] = [
        { id: 'winter', icon: <Snowflake size={18} />, label: t('winter') },
        { id: 'spring', icon: <CloudRain size={18} />, label: t('spring') },
        { id: 'summer', icon: <Sun size={18} />, label: t('summer') },
        { id: 'autumn', icon: <Wind size={18} />, label: t('autumn') },
    ];

    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Desktop View */}
            <div className="hidden md:flex bg-white/20 backdrop-blur-md p-1 rounded-full border border-white/30 shadow-sm">
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

            {/* Mobile View */}
            <div className="relative md:hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-2 rounded-full border border-slate-200 text-slate-700 shadow-sm active:scale-95 transition-all"
                >
                    {seasons.find(s => s.id === currentSeason)?.icon}
                    <span className="text-xs font-bold uppercase">{seasons.find(s => s.id === currentSeason)?.label}</span>
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 min-w-[140px] z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-200">
                            {seasons.map((season) => (
                                <button
                                    key={season.id}
                                    onClick={() => {
                                        setSeason(season.id);
                                        setIsOpen(false);
                                    }}
                                    className={clsx(
                                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left',
                                        currentSeason === season.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-slate-600 hover:bg-slate-50'
                                    )}
                                >
                                    {season.icon}
                                    {season.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
