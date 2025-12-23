'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useSeasonStore } from '@/store/season-store';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { SuggestLocationBanner } from '@/components/ui/SuggestLocationBanner';
import { useCompareStore } from '@/store/compare-store';
import { Search, SortAsc, TrendingUp, Layers, ArrowRight, Globe, Sparkles, Star, Check } from 'lucide-react';
import { CompareAddedModal } from '@/components/ui/CompareAddedModal';
import { CompareLimitModal } from '@/components/ui/CompareLimitModal';


export default function LocationsClient() {
    const { currentSeason } = useSeasonStore();
    const { selectedLocations, addLocation, removeLocation } = useCompareStore();
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'name' | 'altitude' | 'services' | 'country'>('name');
    const t = useTranslations('Locations');
    const tCommon = useTranslations('LocationDetail');

    const [modalOpen, setModalOpen] = useState(false);
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const [lastAddedLocation, setLastAddedLocation] = useState('');

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const { collection, getDocs, query } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const q = query(collection(db, 'locations'));
                const querySnapshot = await getDocs(q);

                const docs = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as any))
                    .filter(loc => loc.status === 'published' && (loc.language === 'en' || !loc.language));

                setLocations(docs);
            } catch (e) {
                console.error("Error loading locations:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLocations();
    }, []);

    const sortedLocations = [...locations].sort((a, b) => {
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'altitude') return (b.altitude || 0) - (a.altitude || 0);
        if (sortBy === 'services') {
            const countA = a.servicesCount ?? a.services?.length ?? 0;
            const countB = b.servicesCount ?? b.services?.length ?? 0;
            return countB - countA;
        }
        if (sortBy === 'country') return (a.country || '').localeCompare(b.country || '');
        return 0;
    });

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="pt-24 pb-16 px-6 lg:px-12 max-w-7xl mx-auto">
                <header className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">
                                {t('title')}
                            </h1>
                            <p className="text-lg text-slate-600 max-w-2xl">
                                {t('subtitle')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">

                            <Link
                                href="/match"
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 group"
                            >
                                <Sparkles size={18} />
                                {t('match_cta')}
                                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                        <SortAsc size={18} />
                        <span className="text-sm font-bold uppercase tracking-wider">{t('sort_by')}:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'name', label: t('sort_alphabetical'), icon: <SortAsc size={14} /> },
                            { id: 'country', label: t('sort_country'), icon: <Globe size={14} /> },
                            { id: 'altitude', label: t('sort_altitude'), icon: <TrendingUp size={14} /> },
                            { id: 'services', label: t('sort_services'), icon: <Layers size={14} /> }
                        ].map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSortBy(option.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${sortBy === option.id
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                {option.icon}
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-96 rounded-2xl bg-slate-200 animate-pulse" />
                        ))}
                    </div>
                ) : locations.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500 text-lg">{t('no_results')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sortedLocations.map((location) => {
                            const isSelected = selectedLocations.some(l => l.id === location.id);
                            return (
                                <div key={location.id} className="relative group">
                                    <Link
                                        href={`/locations/${location.name}`}
                                        className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                    >
                                        <div className="aspect-[4/3] relative overflow-hidden bg-slate-200">
                                            <img
                                                src={location.seasonalImages?.[currentSeason] || location.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'}
                                                alt={location.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                            <div className="absolute bottom-4 left-4 right-4">
                                                <div className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">
                                                    {location.region}, {location.country}
                                                </div>
                                                <h3 className="text-2xl font-display font-bold text-white">
                                                    {location.name}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <p className="text-slate-600 line-clamp-3 mb-4 text-sm leading-relaxed">
                                                {location.description?.[currentSeason] || location.description?.['winter'] || t('no_description')}
                                            </p>

                                            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-400 uppercase font-bold">{t('altitude')}</span>
                                                    <span className="text-sm font-bold text-slate-800">
                                                        {location.altitude ? `${location.altitude}m` : 'N/D'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-400 uppercase font-bold">{t('services')}</span>
                                                    <span className="text-sm font-bold text-slate-800">
                                                        {location.servicesCount ?? location.services?.length ?? 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Quick Compare Button */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (isSelected) {
                                                removeLocation(location.id);
                                            } else {
                                                if (selectedLocations.length >= 3) {
                                                    setLimitModalOpen(true);
                                                    return;
                                                }
                                                addLocation(location);
                                                setLastAddedLocation(location.name);
                                                setModalOpen(true);
                                            }
                                        }}
                                        className={`absolute top-4 right-4 p-2 rounded-xl transition-all z-10 shadow-lg backdrop-blur-md ${isSelected
                                            ? 'bg-primary text-white'
                                            : 'bg-white/80 text-slate-600 hover:bg-white hover:text-primary'
                                            }`}
                                        title={isSelected ? tCommon('remove_from_compare') : tCommon('add_to_compare')}
                                    >
                                        {isSelected ? <Check size={20} /> : <Star size={20} />}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <SuggestLocationBanner />
            </main>

            <CompareAddedModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                locationName={lastAddedLocation}
            />

            <CompareLimitModal
                isOpen={limitModalOpen}
                onClose={() => setLimitModalOpen(false)}
                selectedLocations={selectedLocations}
                onRemove={removeLocation}
            />
        </div>
    );
}
