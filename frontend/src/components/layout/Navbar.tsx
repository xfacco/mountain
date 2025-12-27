'use client';

import Link from 'next/link';
import { SeasonSelector } from '@/components/ui/SeasonSelector';
import { useState, useEffect } from 'react';
import { Menu, Search, X, Heart } from 'lucide-react';

import { useTranslations } from 'next-intl';

import { useCompareStore } from '@/store/compare-store';

export function Navbar() {
    const t = useTranslations('Navbar');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { selectedLocations } = useCompareStore();
    const compareCount = selectedLocations.length;

    const [highlightsCount, setHighlightsCount] = useState(0);
    const [matchesCount, setMatchesCount] = useState(0);

    useEffect(() => {
        const calculateTotals = () => {
            // Highlights count
            let totalDestinations = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('alpematch_highlights_')) {
                    try {
                        const items = JSON.parse(localStorage.getItem(key) || '[]');
                        if (items.length > 0) {
                            totalDestinations++;
                        }
                    } catch (e) {
                        console.error("Error parsing highlights for count", e);
                    }
                }
            }

            // Matches count
            let matchesTotal = 0;
            try {
                const historyStr = localStorage.getItem('match_history') || '[]';
                const history = JSON.parse(historyStr);
                matchesTotal = Array.isArray(history) ? history.length : 0;
            } catch (e) {
                console.error("Error parsing match history for count", e);
            }

            // Wrap in timeout to prevent "Cannot update a component while rendering another" error
            setTimeout(() => {
                setHighlightsCount(totalDestinations);
                setMatchesCount(matchesTotal);
            }, 0);
        };

        calculateTotals();

        window.addEventListener('storage', calculateTotals);

        const handleRefresh = () => calculateTotals();
        window.addEventListener('highlightsUpdated', handleRefresh);
        window.addEventListener('matchesUpdated', handleRefresh);

        return () => {
            window.removeEventListener('storage', calculateTotals);
            window.removeEventListener('highlightsUpdated', handleRefresh);
            window.removeEventListener('matchesUpdated', handleRefresh);
        };
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/70 backdrop-blur-lg border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
                        <img
                            src="/logo_alpematch.png"
                            alt="Alpe Match Logo"
                            className="h-12 w-auto object-contain group-hover:scale-105 transition-transform"
                        />
                        <span className="font-display font-bold text-xl text-slate-800 group-hover:text-primary transition-colors">
                            Alpe Match
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/match" className="text-primary font-bold hover:text-primary-dark transition-colors flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                            Match
                            {matchesCount > 0 && (
                                <span className="flex items-center justify-center bg-primary text-white text-[9px] font-black min-w-[14px] h-[14px] px-1 rounded-full shadow-sm">
                                    {matchesCount}
                                </span>
                            )}
                        </Link>
                        <Link href="/locations" className="text-slate-600 hover:text-primary transition-colors font-medium">{t('destinations')}</Link>
                        <Link href="/compare" className="text-slate-600 hover:text-primary transition-colors font-medium flex items-center gap-1.5">
                            {t('compare')}
                            {compareCount > 0 && (
                                <span className="flex items-center justify-center bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full">
                                    {compareCount}
                                </span>
                            )}
                        </Link>
                        <Link href="/map" className="text-slate-600 hover:text-primary transition-colors font-medium">{t('map')}</Link>

                        <div className="flex items-center gap-6 pl-4 border-l border-slate-100">
                            <Link href="/favorites" className="relative text-slate-400 hover:text-rose-500 transition-all" title="Your Favorites">
                                <Heart size={22} className={highlightsCount > 0 ? "fill-rose-500 text-rose-500" : ""} />
                                {highlightsCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center bg-rose-500 text-white text-[9px] font-black min-w-[14px] h-[14px] px-1 rounded-full shadow-sm ring-2 ring-white animate-in zoom-in duration-300">
                                        {highlightsCount}
                                    </span>
                                )}
                            </Link>
                            <Link href="/search" className="text-slate-400 hover:text-primary transition-colors" title="Search">
                                <Search size={22} />
                            </Link>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <SeasonSelector />
                        <button
                            className="md:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                    <Link
                        href="/match"
                        className="p-3 rounded-lg hover:bg-slate-50 font-bold text-primary flex items-center justify-between transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
                            Match
                        </div>
                        {matchesCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                {matchesCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/favorites"
                        className="p-3 rounded-lg hover:bg-rose-50 font-bold text-rose-600 flex items-center justify-between transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <div className="flex items-center gap-2">
                            <Heart size={18} className="fill-current" />
                            Preferiti
                        </div>
                        {highlightsCount > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                {highlightsCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/locations"
                        className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700 hover:text-primary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {t('destinations')}
                    </Link>
                    <Link
                        href="/compare"
                        className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700 hover:text-primary transition-colors flex items-center justify-between"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <span>{t('compare')}</span>
                        {compareCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {compareCount}
                            </span>
                        )}
                    </Link>
                    <Link
                        href="/map"
                        className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700 hover:text-primary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {t('map')}
                    </Link>
                    <Link
                        href="/search"
                        className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700 hover:text-primary transition-colors flex items-center gap-2"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <Search size={18} /> Cerca
                    </Link>
                </div>
            )}
        </nav>
    );
}
