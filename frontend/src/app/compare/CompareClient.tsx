'use client';

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useSeasonStore } from '@/store/season-store';
import { useCompareStore } from '@/store/compare-store';
import { Check, Plus, X, ChevronDown, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function CompareClient() {
    const { currentSeason } = useSeasonStore();
    const { selectedLocations, addLocation, removeLocation } = useCompareStore();
    const [locationOptions, setLocationOptions] = useState<any[]>([]);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const t = useTranslations('Compare');
    const tSeasons = useTranslations('Seasons');

    // Merge stored locations with fresh data from Firestore to ensure images/data are up-to-date
    const freshSelectedLocations = selectedLocations.map(storedLoc => {
        const freshLoc = locationOptions.find(opt => opt.id === storedLoc.id);
        return freshLoc || storedLoc;
    });

    // Sync horizontal scroll between header and content
    useEffect(() => {
        const content = scrollRef.current;
        const header = headerRef.current;
        if (!content || !header) return;

        const handleScroll = () => {
            header.scrollLeft = content.scrollLeft;
        };

        content.addEventListener('scroll', handleScroll);
        return () => content.removeEventListener('scroll', handleScroll);
    }, [freshSelectedLocations]);

    // Dettagli Toggles State (all closed by default)
    const [showDetails, setShowDetails] = useState<{
        tourism: boolean;
        accommodation: boolean;
        infrastructure: boolean;
        sport: boolean;
        info: boolean;
        general: boolean;
    }>({
        tourism: false,
        accommodation: false,
        infrastructure: false,
        sport: false,
        info: false,
        general: false
    });

    useEffect(() => {
        const fetchLocs = async () => {
            try {
                const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const q = query(collection(db, 'locations'), orderBy('name'));
                const querySnapshot = await getDocs(q);

                const docs = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as any))
                    .filter(loc => loc.status === 'published');

                setLocationOptions(docs);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLocs();
    }, []);

    const toggleLocation = (location: any) => {
        if (selectedLocations.find((l) => l.id === location.id)) {
            removeLocation(location.id);
        } else {
            if (selectedLocations.length >= 3) {
                alert(t('select_max'));
                return;
            }
            addLocation(location);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            // On mobile use the full column width, on desktop use fixed amount
            const isMobile = window.innerWidth < 1024;
            const columnWidth = isMobile ? window.innerWidth - 32 : 330;
            const offset = direction === 'left' ? -columnWidth : columnWidth;
            scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
        }
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="pt-32 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-slate-900">
                            {t('title')}
                        </h1>
                        <p className="text-slate-600 mt-2">
                            {t('season_analysis')}{' '}
                            <span className="font-bold text-primary capitalize">
                                {tSeasons(currentSeason)}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all font-medium ${isSelectorOpen ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-primary text-white hover:bg-opacity-90'}`}
                    >
                        {isSelectorOpen ? <X size={18} /> : <Plus size={18} />}
                        {isSelectorOpen ? t('close_selector') : t('add_location')}
                    </button>
                </div>

                {/* Selection Modal / Dropdown Area */}
                <AnimatePresence>
                    {isSelectorOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-8 overflow-hidden"
                        >
                            <div className="p-6 bg-white rounded-xl shadow-lg border border-slate-100">
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">{t('select_max')}</h4>
                                {loading ? (
                                    <div className="text-center py-4 text-slate-400">{t('loading_list')}</div>
                                ) : locationOptions.length === 0 ? (
                                    <div className="text-center py-4 text-slate-400">{t('no_locations_db')}</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        {locationOptions.map((loc) => {
                                            const isSelected = !!selectedLocations.find(
                                                (l) => l.id === loc.id
                                            );
                                            return (
                                                <button
                                                    key={loc.id}
                                                    onClick={() => toggleLocation(loc)}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${isSelected
                                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                        : 'border-slate-200 hover:border-primary/50'
                                                        }`}
                                                >
                                                    <img
                                                        src={loc.seasonalImages?.[currentSeason] || loc.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'}
                                                        alt={loc.name}
                                                        className="w-12 h-12 rounded-md object-cover"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-bold text-slate-900 text-sm line-clamp-1">
                                                            {loc.name}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {loc.country || 'IT'}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="text-primary">
                                                            <Check size={16} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Comparison Table */}
                {freshSelectedLocations.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500 text-lg">
                            {t('start_comparison')}
                        </p>
                    </div>
                ) : (
                    <div className="relative group/table">
                        {/* Fixed Scroll Controls (Mobile/Tablet) - Attached to edges at 3/4 height */}
                        <div className="fixed top-[75%] -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none z-[100] lg:hidden">
                            <button
                                onClick={() => scroll('left')}
                                className="w-10 h-14 bg-white/90 backdrop-blur-md shadow-lg rounded-r-2xl flex items-center justify-center text-primary transition-all pointer-events-auto border-y border-r border-slate-200 active:scale-90 shadow-primary/10 pl-1"
                                aria-label="Scroll left"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <button
                                onClick={() => scroll('right')}
                                className="w-10 h-14 bg-white/90 backdrop-blur-md shadow-lg rounded-l-2xl flex items-center justify-center text-primary transition-all pointer-events-auto border-y border-l border-slate-200 active:scale-90 shadow-primary/10 pr-1"
                                aria-label="Scroll right"
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>

                        {/* STICKY HEADER CONTAINER (Names Only) */}
                        <div className="sticky top-[64px] lg:top-[72px] z-40 bg-white shadow-md border-b border-slate-200 overflow-hidden">
                            <div ref={headerRef} className="overflow-x-auto no-scrollbar snap-x snap-mandatory">
                                <table className="w-full text-left border-separate border-spacing-0 min-w-max">
                                    <thead>
                                        {/* Mobile Section Title - Hidden on Desktop */}
                                        <tr className="lg:hidden bg-slate-50/50">
                                            <th colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                LOCALITÀ
                                            </th>
                                        </tr>
                                        <tr className="bg-white/95 backdrop-blur-md">
                                            {/* Labels Column - Desktop only */}
                                            <th className="hidden lg:table-cell p-4 w-40 border-r border-slate-100 bg-white sticky left-0 z-10 shrink-0">
                                                <div className="flex flex-col justify-center">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</span>
                                                </div>
                                            </th>
                                            {selectedLocations.map((loc) => (
                                                <th key={`header-name-${loc.id}`} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-middle border-r border-slate-100 last:border-r-0 bg-white relative group">
                                                    <button
                                                        onClick={() => toggleLocation(loc)}
                                                        className="absolute top-2 right-2 p-1 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity z-50"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                    <h3 className="text-sm md:text-xl font-bold text-slate-900 leading-tight pr-6">
                                                        {loc.name}
                                                    </h3>
                                                    <p className="text-[10px] md:text-sm text-slate-500 font-medium truncate pr-6">
                                                        {loc.region || 'Alpi'}, {loc.country || 'IT'}
                                                    </p>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                </table>
                            </div>
                        </div>

                        {/* MAIN DATA CONTAINER (Images + Data) */}
                        <div ref={scrollRef} className="overflow-x-auto no-scrollbar scroll-smooth bg-white rounded-b-xl border-x border-b border-slate-200 snap-x snap-mandatory">
                            <table className="w-full text-left border-separate border-spacing-0 min-w-max">
                                <tbody className="text-slate-700">
                                    {/* Images Row - Hidden on mobile, visible on desktop */}
                                    <tr className="bg-slate-50 hidden lg:table-row">
                                        <td className="p-4 w-40 border-r border-b border-slate-100 sticky left-0 z-10 bg-slate-50"></td>
                                        {selectedLocations.map((loc) => (
                                            <td key={`img-row-${loc.id}`} className="p-4 w-[330px] min-w-[330px] border-r border-b border-slate-100 last:border-r-0">
                                                <div className="relative group">
                                                    <div className="aspect-video rounded-lg overflow-hidden shadow-sm bg-slate-100 ring-1 ring-slate-200/50">
                                                        <img
                                                            src={loc.seasonalImages?.[currentSeason] || loc.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'}
                                                            alt={loc.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* Altitude */}
                                    <tr className="lg:hidden bg-slate-50/30">
                                        <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            {t('altitude')}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100">
                                            {t('altitude')}
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top font-mono text-sm text-slate-700 border-r border-slate-100 last:border-r-0">
                                                {loc.altitude ? `${loc.altitude}m` : 'N/D'}
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Seasonal Description */}
                                    <tr className="lg:hidden bg-slate-50/30">
                                        <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            {t('seasonal_description')}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 text-slate-700">
                                        <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100">
                                            {t('seasonal_description')}
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                <p className="text-sm leading-relaxed text-slate-600">
                                                    {loc.description?.[currentSeason] ||
                                                        t('desc_unavailable')}
                                                </p>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Highlights */}
                                    <tr className="lg:hidden bg-yellow-50/30">
                                        <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            {t('highlights')}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 lg:bg-yellow-50/30">
                                        <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100">
                                            {t('highlights')}
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                <div className="flex flex-wrap gap-2">
                                                    {loc.tags?.highlights?.map((t: string) => (
                                                        <span key={t} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md border border-yellow-200">{t}</span>
                                                    )) || <span className="text-slate-400 text-xs italic">-</span>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Atmosphere & Target */}
                                    <tr className="lg:hidden bg-slate-50/30">
                                        <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            {t('atmosphere_target')}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100">
                                        <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100">
                                            {t('atmosphere_target')}
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0 space-y-3">
                                                <div>
                                                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block mb-1">{t('vibe')}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {loc.tags?.vibe?.map((t: string) => (
                                                            <span key={t} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100">{t}</span>
                                                        )) || <span className="text-slate-400 text-xs italic">-</span>}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">{t('target')}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {loc.tags?.target?.map((t: string) => (
                                                            <span key={t} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">{t}</span>
                                                        )) || <span className="text-slate-400 text-xs italic">-</span>}
                                                    </div>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>

                                    {/* 2. ATTIVITÀ (Tourism) */}
                                    <tr>
                                        <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                            {t('tourism_activities')}
                                        </td>
                                    </tr>
                                    {/* Tourism Tags */}
                                    <tr className="lg:hidden bg-slate-50/10">
                                        <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            {t('tag_tourism')}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 lg:bg-slate-50/10">
                                        <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100">
                                            {t('tag_tourism')}
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                <div className="flex flex-wrap gap-1">
                                                    {loc.tags?.tourism?.map((t: string) => (
                                                        <span key={t} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded border border-green-100">{t}</span>
                                                    )) || <span className="text-slate-400 text-xs italic">-</span>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Toggler Dettagli */}
                                    <tr
                                        className="cursor-pointer transition-all border-b border-slate-100 bg-slate-50 hover:bg-slate-100"
                                        onClick={() => setShowDetails(prev => ({ ...prev, tourism: !prev.tourism }))}
                                    >
                                        <td className="hidden lg:table-cell w-40 bg-slate-50/50 border-r border-slate-100"></td>
                                        <td colSpan={selectedLocations.length} className="p-0">
                                            <div className="flex items-center justify-center gap-2 py-3 px-4 group transition-all">
                                                <div className={`flex items-center gap-2 px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest shadow-sm transition-all ${showDetails.tourism ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 group-hover:border-primary group-hover:text-primary'}`}>
                                                    {showDetails.tourism ? <ChevronDown size={16} className="mt-0.5" /> : <Plus size={16} />}
                                                    {showDetails.tourism ? t('hide_details') : t('show_details')}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {showDetails.tourism && (
                                        <>
                                            <tr className="lg:hidden bg-slate-50/20">
                                                <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                    {t('details_tourism')}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-200 bg-slate-50/20">
                                                <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100 align-top">
                                                    {t('details_tourism')}
                                                </td>
                                                {selectedLocations.map((loc) => (
                                                    <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                        <div className="space-y-4">
                                                            {loc.services?.filter((s: any) => s.category === 'tourism').length > 0 ? (
                                                                loc.services?.filter((s: any) => s.category === 'tourism').map((s: any, i: number) => (
                                                                    <div key={i} className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                                                        <div className="font-bold text-slate-800 text-sm mb-1">{s.name}</div>
                                                                        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{s.description}</div>
                                                                    </div>
                                                                ))
                                                            ) : <span className="text-slate-400 text-xs italic">-</span>}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    )}

                                    {/* 3. OSPITALITÀ (Accommodation) */}
                                    <tr>
                                        <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                            {t('hospitality')}
                                        </td>
                                    </tr>
                                    {/* Accommodation Tags */}
                                    <tr className="lg:hidden bg-slate-50/10">
                                        <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            {t('tag_accommodation')}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 lg:bg-slate-50/10">
                                        <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100">
                                            {t('tag_accommodation')}
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                <div className="flex flex-wrap gap-1">
                                                    {loc.tags?.accommodation?.map((t: string) => (
                                                        <span key={t} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded border border-orange-100">{t}</span>
                                                    )) || <span className="text-slate-400 text-xs italic">-</span>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Toggler Dettagli */}
                                    <tr
                                        className="cursor-pointer transition-all border-b border-slate-100 bg-slate-50 hover:bg-slate-100"
                                        onClick={() => setShowDetails(prev => ({ ...prev, accommodation: !prev.accommodation }))}
                                    >
                                        <td className="hidden lg:table-cell w-40 bg-slate-50/50 border-r border-slate-100"></td>
                                        <td colSpan={selectedLocations.length} className="p-0">
                                            <div className="flex items-center justify-center gap-2 py-3 px-4 group transition-all">
                                                <div className={`flex items-center gap-2 px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest shadow-sm transition-all ${showDetails.accommodation ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 group-hover:border-primary group-hover:text-primary'}`}>
                                                    {showDetails.accommodation ? <ChevronDown size={16} className="mt-0.5" /> : <Plus size={16} />}
                                                    {showDetails.accommodation ? t('hide_details') : t('show_details')}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {showDetails.accommodation && (
                                        <>
                                            <tr className="lg:hidden bg-slate-50/20">
                                                <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                    {t('details_accommodation')}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-200 bg-slate-50/20">
                                                <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100 align-top">
                                                    {t('details_accommodation')}
                                                </td>
                                                {selectedLocations.map((loc) => (
                                                    <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                        <div className="space-y-4">
                                                            {loc.services?.filter((s: any) => s.category === 'accommodation').length > 0 ? (
                                                                loc.services?.filter((s: any) => s.category === 'accommodation').map((s: any, i: number) => (
                                                                    <div key={i} className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                                                        <div className="font-bold text-slate-800 text-sm mb-1">{s.name}</div>
                                                                        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{s.description}</div>
                                                                    </div>
                                                                ))
                                                            ) : <span className="text-slate-400 text-xs italic">-</span>}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    )}

                                    {/* 4. IMPIANTI (Infrastructure) */}
                                    <tr>
                                        <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                            {t('infrastructure')}
                                        </td>
                                    </tr>
                                    {/* Infrastructure Tags */}
                                    <tr className="lg:hidden bg-slate-50/10">
                                        <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            {t('tag_infrastructure')}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 lg:bg-slate-50/10">
                                        <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100">
                                            {t('tag_infrastructure')}
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                <div className="flex flex-wrap gap-1">
                                                    {loc.tags?.infrastructure?.map((t: string) => (
                                                        <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">{t}</span>
                                                    )) || <span className="text-slate-400 text-xs italic">-</span>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Toggler Dettagli */}
                                    <tr
                                        className="cursor-pointer transition-all border-b border-slate-100 bg-slate-50 hover:bg-slate-100"
                                        onClick={() => setShowDetails(prev => ({ ...prev, infrastructure: !prev.infrastructure }))}
                                    >
                                        <td className="hidden lg:table-cell w-40 bg-slate-50/50 border-r border-slate-100"></td>
                                        <td colSpan={selectedLocations.length} className="p-0">
                                            <div className="flex items-center justify-center gap-2 py-3 px-4 group transition-all">
                                                <div className={`flex items-center gap-2 px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest shadow-sm transition-all ${showDetails.infrastructure ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 group-hover:border-primary group-hover:text-primary'}`}>
                                                    {showDetails.infrastructure ? <ChevronDown size={16} className="mt-0.5" /> : <Plus size={16} />}
                                                    {showDetails.infrastructure ? t('hide_details') : t('show_details')}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {showDetails.infrastructure && (
                                        <>
                                            <tr className="lg:hidden bg-slate-50/20">
                                                <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                    {t('details_infrastructure')}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-200 bg-slate-50/20">
                                                <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100 align-top">
                                                    {t('details_infrastructure')}
                                                </td>
                                                {selectedLocations.map((loc) => (
                                                    <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                        <div className="space-y-4">
                                                            {loc.services?.filter((s: any) => s.category === 'infrastructure').length > 0 ? (
                                                                loc.services?.filter((s: any) => s.category === 'infrastructure').map((s: any, i: number) => (
                                                                    <div key={i} className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                                                        <div className="font-bold text-slate-800 text-sm mb-1">{s.name}</div>
                                                                        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{s.description}</div>
                                                                    </div>
                                                                ))
                                                            ) : <span className="text-slate-400 text-xs italic">-</span>}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    )}

                                    {/* 5. SPORT */}
                                    <tr>
                                        <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                            {t('sport_wellness')}
                                        </td>
                                    </tr>
                                    {/* Sport Tags */}
                                    <tr className="lg:hidden bg-slate-50/10">
                                        <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            {t('tag_sport')}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 lg:bg-slate-50/10">
                                        <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100">
                                            {t('tag_sport')}
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                <div className="flex flex-wrap gap-1">
                                                    {loc.tags?.sport?.map((t: string) => (
                                                        <span key={t} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded border border-red-100">{t}</span>
                                                    )) || <span className="text-slate-400 text-xs italic">-</span>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Toggler Dettagli */}
                                    <tr
                                        className="cursor-pointer transition-all border-b border-slate-100 bg-slate-50 hover:bg-slate-100"
                                        onClick={() => setShowDetails(prev => ({ ...prev, sport: !prev.sport }))}
                                    >
                                        <td className="hidden lg:table-cell w-40 bg-slate-50/50 border-r border-slate-100"></td>
                                        <td colSpan={selectedLocations.length} className="p-0">
                                            <div className="flex items-center justify-center gap-2 py-3 px-4 group transition-all">
                                                <div className={`flex items-center gap-2 px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest shadow-sm transition-all ${showDetails.sport ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 group-hover:border-primary group-hover:text-primary'}`}>
                                                    {showDetails.sport ? <ChevronDown size={16} className="mt-0.5" /> : <Plus size={16} />}
                                                    {showDetails.sport ? t('hide_details') : t('show_details')}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {showDetails.sport && (
                                        <>
                                            <tr className="lg:hidden bg-slate-50/20">
                                                <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                    {t('details_sport')}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-200 bg-slate-50/20">
                                                <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100 align-top">
                                                    {t('details_sport')}
                                                </td>
                                                {selectedLocations.map((loc) => (
                                                    <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                        <div className="space-y-4">
                                                            {loc.services?.filter((s: any) => s.category === 'sport').length > 0 ? (
                                                                loc.services?.filter((s: any) => s.category === 'sport').map((s: any, i: number) => (
                                                                    <div key={i} className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                                                        <div className="font-bold text-slate-800 text-sm mb-1">{s.name}</div>
                                                                        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{s.description}</div>
                                                                    </div>
                                                                ))
                                                            ) : <span className="text-slate-400 text-xs italic">-</span>}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    )}

                                    {/* 6. INFO */}
                                    <tr>
                                        <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                            {t('useful_info')}
                                        </td>
                                    </tr>
                                    {/* Info Tags */}
                                    <tr className="lg:hidden bg-slate-50/10">
                                        <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            {t('tag_info')}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 lg:bg-slate-50/10">
                                        <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100">
                                            {t('tag_info')}
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                <div className="flex flex-wrap gap-1">
                                                    {loc.tags?.info?.map((t: string) => (
                                                        <span key={t} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded border border-indigo-100">{t}</span>
                                                    )) || <span className="text-slate-400 text-xs italic">-</span>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Toggler Dettagli */}
                                    <tr
                                        className="cursor-pointer transition-all border-b border-slate-100 bg-slate-50 hover:bg-slate-100"
                                        onClick={() => setShowDetails(prev => ({ ...prev, info: !prev.info }))}
                                    >
                                        <td className="hidden lg:table-cell w-40 bg-slate-50/50 border-r border-slate-100"></td>
                                        <td colSpan={selectedLocations.length} className="p-0">
                                            <div className="flex items-center justify-center gap-2 py-3 px-4 group transition-all">
                                                <div className={`flex items-center gap-2 px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest shadow-sm transition-all ${showDetails.info ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 group-hover:border-primary group-hover:text-primary'}`}>
                                                    {showDetails.info ? <ChevronDown size={16} className="mt-0.5" /> : <Plus size={16} />}
                                                    {showDetails.info ? t('hide_details') : t('show_details')}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {showDetails.info && (
                                        <>
                                            <tr className="lg:hidden bg-slate-50/20">
                                                <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                    {t('details_info')}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-200 bg-slate-50/20">
                                                <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100 align-top">
                                                    {t('details_info')}
                                                </td>
                                                {selectedLocations.map((loc) => (
                                                    <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                        <div className="space-y-4">
                                                            {loc.services?.filter((s: any) => s.category === 'info').length > 0 ? (
                                                                loc.services?.filter((s: any) => s.category === 'info').map((s: any, i: number) => (
                                                                    <div key={i} className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                                                        <div className="font-bold text-slate-800 text-sm mb-1">{s.name}</div>
                                                                        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{s.description}</div>
                                                                    </div>
                                                                ))
                                                            ) : <span className="text-slate-400 text-xs italic">-</span>}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    )}

                                    {/* 7. GENERALE (General) */}
                                    <tr>
                                        <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                            {t('general_services')}
                                        </td>
                                    </tr>
                                    {/* General Tags */}
                                    <tr className="lg:hidden bg-slate-50/10">
                                        <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                            {t('tag_general')}
                                        </td>
                                    </tr>
                                    <tr className="border-b border-slate-100 lg:bg-slate-50/10">
                                        <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100">
                                            {t('tag_general')}
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                <div className="flex flex-wrap gap-1">
                                                    {loc.tags?.general?.map((t: string) => (
                                                        <span key={t} className="px-2 py-0.5 bg-slate-50 text-slate-700 text-xs rounded border border-slate-200">{t}</span>
                                                    )) || <span className="text-slate-400 text-xs italic">-</span>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Toggler Dettagli */}
                                    <tr
                                        className="cursor-pointer transition-all border-b border-slate-100 bg-slate-50 hover:bg-slate-100"
                                        onClick={() => setShowDetails(prev => ({ ...prev, general: !prev.general }))}
                                    >
                                        <td className="hidden lg:table-cell w-40 bg-slate-50/50 border-r border-slate-100"></td>
                                        <td colSpan={selectedLocations.length} className="p-0">
                                            <div className="flex items-center justify-center gap-2 py-3 px-4 group transition-all">
                                                <div className={`flex items-center gap-2 px-6 py-2 rounded-full text-[12px] font-black uppercase tracking-widest shadow-sm transition-all ${showDetails.general ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200 group-hover:border-primary group-hover:text-primary'}`}>
                                                    {showDetails.general ? <ChevronDown size={16} className="mt-0.5" /> : <Plus size={16} />}
                                                    {showDetails.general ? t('hide_details') : t('show_details')}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    {showDetails.general && (
                                        <>
                                            <tr className="lg:hidden bg-slate-50/20">
                                                <td colSpan={selectedLocations.length} className="p-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                                    {t('details_general')}
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-200 bg-slate-50/20">
                                                <td className="hidden lg:table-cell p-4 font-bold text-slate-900 bg-slate-50/50 w-40 sticky left-0 z-10 border-r border-slate-100 align-top">
                                                    {t('details_general')}
                                                </td>
                                                {selectedLocations.map((loc) => (
                                                    <td key={loc.id} className="snap-start p-4 w-[calc(100vw-32px)] lg:w-[330px] lg:min-w-[330px] align-top border-r border-slate-100 last:border-r-0">
                                                        <div className="space-y-4">
                                                            {loc.services?.filter((s: any) => s.category === 'general').length > 0 ? (
                                                                loc.services?.filter((s: any) => s.category === 'general').map((s: any, i: number) => (
                                                                    <div key={i} className="bg-white p-3 rounded border border-slate-100 shadow-sm">
                                                                        <div className="font-bold text-slate-800 text-sm mb-1">{s.name}</div>
                                                                        <div className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{s.description}</div>
                                                                    </div>
                                                                ))
                                                            ) : <span className="text-slate-400 text-xs italic">-</span>}
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    )}

                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
