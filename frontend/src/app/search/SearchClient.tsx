'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Search as SearchIcon, MapPin, X, Loader2, SlidersHorizontal, ChevronRight, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';
import { useSeasonStore } from '@/store/season-store';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { SuggestLocationBanner } from '@/components/ui/SuggestLocationBanner';

// Helper to normalize strings for search (remove accents, lowercase)
const normalize = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

export default function SearchClient() {
    const { currentSeason } = useSeasonStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [openCategories, setOpenCategories] = useState<string[]>(['vibe', 'target']);

    const t = useTranslations('Search');
    const tLoc = useTranslations('Locations');

    const searchParams = useSearchParams();

    // Load Data & Handle Query Params
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { collection, getDocs } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const querySnapshot = await getDocs(collection(db, 'locations'));
                const locs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLocations(locs);
            } catch (error) {
                console.error("Error loading locations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Initialize from URL
        const q = searchParams.get('q');
        const tag = searchParams.get('tag');

        if (q) setSearchTerm(q);
        if (tag) {
            // Optional: if you want strict tag filtering from URL
            setSelectedTags([tag]);
            // OR just use search term for broader matching:
            // setSearchTerm(tag); 
        }
    }, [searchParams]);

    // Extract unique tags grouped by category
    const tagsByCategory = useMemo(() => {
        const categories: Record<string, Set<string>> = {
            vibe: new Set(),
            target: new Set(),
            highlights: new Set(),
            tourism: new Set(),
            accommodation: new Set(),
            infrastructure: new Set(),
            sport: new Set(),
            info: new Set(),
            general: new Set(),
        };

        locations.forEach(loc => {
            if (loc.tags) {
                Object.entries(loc.tags).forEach(([cat, tagList]: [string, any]) => {
                    if (categories[cat] && Array.isArray(tagList)) {
                        tagList.forEach(t => categories[cat].add(t));
                    }
                });
            }
        });

        // Convert Sets to sorted Arrays
        const result: Record<string, string[]> = {};
        Object.entries(categories).forEach(([cat, set]) => {
            if (set.size > 0) result[cat] = Array.from(set).sort();
        });
        return result;
    }, [locations]);

    // Filter Logic
    const filteredLocations = useMemo(() => {
        const query = normalize(searchTerm);

        return locations.filter(loc => {
            // 1. Text Search
            const nameMatch = normalize(loc.name).includes(query);
            const regionMatch = normalize(loc.region || '').includes(query);
            const countryMatch = normalize(loc.country || '').includes(query);
            const descMatch = normalize(loc.description?.[currentSeason] || '').includes(query);

            // Search inside tags
            let tagMatch = false;
            let tagsList: string[] = [];
            if (loc.tags) {
                Object.values(loc.tags).forEach((list: any) => {
                    if (Array.isArray(list)) tagsList = [...tagsList, ...list];
                });
            }
            if (tagsList.some(t => normalize(t).includes(query))) tagMatch = true;

            const textMatches = !query || nameMatch || regionMatch || countryMatch || descMatch || tagMatch;

            // 2. Tag Filter (Selected Tags from clickable pills)
            const tagFilterMatches = selectedTags.length === 0 || selectedTags.every(selTag =>
                tagsList.some(t => t === selTag)
            );

            return textMatches && tagFilterMatches;
        });
    }, [searchTerm, locations, currentSeason, selectedTags]);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="pt-24 pb-12 px-6 container mx-auto max-w-5xl">

                {/* Search Header */}
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-3xl font-black text-slate-900">{t('hero_title')}</h1>
                    <p className="text-slate-500">{t('hero_subtitle')}</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8 max-w-2xl mx-auto">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                        <SearchIcon size={22} />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t('placeholder')}
                        className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 text-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400 font-medium"
                        autoFocus
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Filter Toggles & Active Filters Area */}
                <div className="mb-8 flex flex-col gap-4">
                    <div className="flex items-center gap-4 justify-between">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all border cursor-pointer ${isFilterOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-primary'}`}
                        >
                            <SlidersHorizontal size={18} />
                            {isFilterOpen ? t('hide_filters') : t('show_filters')}
                        </button>

                        <div className="text-sm font-medium text-slate-500">
                            {t('results_found', { count: filteredLocations.length })}
                        </div>
                    </div>

                    {/* Active Chips */}
                    {selectedTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">{t('active_filters')}</span>
                            {selectedTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/20 hover:bg-primary hover:text-white transition-all group cursor-pointer"
                                >
                                    {tag} <X size={12} className="group-hover:scale-110" />
                                </button>
                            ))}
                            <button
                                onClick={() => setSelectedTags([])}
                                className="text-xs font-bold text-red-500 hover:text-red-700 ml-2 hover:underline cursor-pointer"
                            >
                                {t('clear_all')}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-8">

                    {/* COLLAPSIBLE SIDEBAR FILTERS */}
                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ width: 0, opacity: 0, marginRight: 0 }}
                                animate={{ width: 300, opacity: 1, marginRight: 32 }}
                                exit={{ width: 0, opacity: 0, marginRight: 0 }}
                                className="hidden md:block overflow-hidden shrink-0"
                            >
                                <div className="space-y-6 w-[300px]">
                                    {Object.entries(tagsByCategory).map(([category, tags]) => (
                                        <div key={category} className="border-b border-slate-100 pb-4 last:border-0">
                                            <button
                                                onClick={() => {
                                                    setOpenCategories(prev =>
                                                        prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
                                                    )
                                                }}
                                                className="flex items-center justify-between w-full text-left mb-3 group cursor-pointer"
                                            >
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest group-hover:text-primary transition-colors">
                                                    {t(`categories.${category}` as any)}
                                                </h4>
                                                {openCategories.includes(category) ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                            </button>

                                            {openCategories.includes(category) && (
                                                <div className="flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-top-1">
                                                    {tags.map(tag => {
                                                        const isSelected = selectedTags.includes(tag);
                                                        return (
                                                            <button
                                                                key={tag}
                                                                onClick={() => toggleTag(tag)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border cursor-pointer ${isSelected
                                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50'}`}
                                                            >
                                                                {tag}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Mobile Filters Toggler Overlay */}
                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="block md:hidden bg-white rounded-3xl border border-slate-100 shadow-xl p-6 overflow-hidden mb-8"
                            >
                                <div className="space-y-6">
                                    {Object.entries(tagsByCategory).map(([category, tags]) => (
                                        <div key={category} className="border-b border-slate-50 pb-4 last:border-0">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                                                {t(`categories.${category}` as any)}
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {tags.map(tag => {
                                                    const isSelected = selectedTags.includes(tag);
                                                    return (
                                                        <button
                                                            key={tag}
                                                            onClick={() => toggleTag(tag)}
                                                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${isSelected
                                                                ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
                                                                : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}
                                                        >
                                                            {tag}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Results Grid Area */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {filteredLocations.length > 0 ? (
                                    filteredLocations.map(location => (
                                        <Link
                                            href={`/locations/${location.name}`}
                                            key={location.id}
                                            className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row min-h-[220px]"
                                        >
                                            {/* Image */}
                                            <div className="w-full sm:w-2/5 relative overflow-hidden h-48 sm:h-auto">
                                                <img
                                                    src={location.seasonalImages?.[currentSeason] || location.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'}
                                                    alt={location.name}
                                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent sm:block hidden" />

                                                {/* Match Indicator (Fake for aesthetic) */}
                                                <div className="absolute top-4 left-4">
                                                    <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-primary shadow-lg flex items-center gap-1">
                                                        <Check size={10} /> {t('recommended')}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 p-8 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                                                                <MapPin size={10} /> {location.country}
                                                            </div>
                                                            <h3 className="font-bold text-slate-900 text-2xl group-hover:text-primary transition-colors">{location.name}</h3>
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-4">
                                                        {location.description?.[currentSeason] || location.description?.['winter'] || tLoc('no_description')}
                                                    </p>
                                                </div>

                                                {/* Tags Preview */}
                                                <div className="flex flex-wrap gap-2">
                                                    {location.tags?.vibe?.slice(0, 3).map((t: string) => (
                                                        <span key={t} className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">{t}</span>
                                                    ))}
                                                    {location.tags?.highlights?.slice(0, 2).map((t: string) => (
                                                        <span key={t} className="text-[10px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 shadow-sm">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-inner">
                                        <SearchIcon size={48} className="mx-auto text-slate-200 mb-6" />
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t('no_results_title')}</h3>
                                        <p className="text-slate-400 max-w-xs mx-auto">{t('no_results_desc')}</p>
                                        <button
                                            onClick={() => { setSearchTerm(''); setSelectedTags([]) }}
                                            className="mt-6 text-primary font-bold hover:underline cursor-pointer"
                                        >
                                            {t('reset_and_retry')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <SuggestLocationBanner />
            </div>
        </div>
    );
}
