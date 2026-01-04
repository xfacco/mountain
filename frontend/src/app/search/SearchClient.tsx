'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import { useSeasonStore } from '@/store/season-store';
import { useTranslations } from 'next-intl';
import { locationNameToSlug } from '@/lib/url-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { SuggestLocationBanner } from '@/components/ui/SuggestLocationBanner';
import { useCompareStore } from '@/store/compare-store';
import { Search as SearchIcon, MapPin, X, Loader2, SlidersHorizontal, ChevronRight, ChevronDown, Check, Star, Link2 as LinkIcon, Sparkles } from 'lucide-react';
import { CompareAddedModal } from '@/components/ui/CompareAddedModal';
import { CompareLimitModal } from '@/components/ui/CompareLimitModal';

// Helper to normalize strings for search (remove accents, lowercase)
const normalize = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

function SearchContent() {
    const { currentSeason } = useSeasonStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    const [userIP, setUserIP] = useState('0.0.0.0');
    const [currentLogId, setCurrentLogId] = useState<string | null>(null);

    const t = useTranslations('Search');
    const tLoc = useTranslations('Locations');
    const tLocDetail = useTranslations('LocationDetail');
    const tCommon = useTranslations('Common');
    const tNav = useTranslations('Navbar');

    const [copied, setCopied] = useState(false);

    const { selectedLocations, addLocation, removeLocation } = useCompareStore();
    const searchParams = useSearchParams();

    const [modalOpen, setModalOpen] = useState(false);
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const [lastAddedLocation, setLastAddedLocation] = useState('');

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

        // Get IP
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setUserIP(data.ip))
            .catch(err => console.error("IP fetch failed", err));

        // Initialize from URL
        const q = searchParams.get('q');
        const tag = searchParams.get('tag');
        const sharedId = searchParams.get('id');

        if (q) setSearchTerm(q);
        if (tag) {
            setSelectedTags([tag]);
        }

        if (sharedId) {
            const loadSharedSearch = async () => {
                try {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');
                    const docSnap = await getDoc(doc(db, 'search_logs', sharedId));
                    if (docSnap.exists()) {
                        const data = docSnap.data();

                        // Log the view action
                        try {
                            const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                            // We fetch IP again if userIP is not yet set or is default
                            let currentIp = userIP;
                            if (!currentIp || currentIp === '0.0.0.0') {
                                const res = await fetch('https://api.ipify.org?format=json');
                                const ipData = await res.json();
                                currentIp = ipData.ip;
                            }
                            await addDoc(collection(db, 'share_logs'), {
                                ip: currentIp,
                                page: 'search',
                                action: 'view',
                                logId: sharedId,
                                timestamp: serverTimestamp()
                            });
                        } catch (logErr) {
                            console.error("Error logging share view:", logErr);
                        }

                        if (data.query !== undefined) setSearchTerm(data.query);
                        if (data.tags) setSelectedTags(data.tags);
                        setCurrentLogId(sharedId);
                    }
                } catch (e) {
                    console.error("Failed to load shared search", e);
                }
            };
            loadSharedSearch();
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

    // Search Logging
    useEffect(() => {
        if (!searchTerm && selectedTags.length === 0) return;

        const logSearch = async () => {
            try {
                const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const docRef = await addDoc(collection(db, 'search_logs'), {
                    query: searchTerm,
                    tags: selectedTags,
                    timestamp: serverTimestamp(),
                    ip: userIP,
                    resultsCount: filteredLocations.length,
                    choices: [] // Track clicked results
                });
                setCurrentLogId(docRef.id);
            } catch (e) {
                console.error("Failed to log search", e);
            }
        };

        const timer = setTimeout(logSearch, 2000); // 2s debounce
        return () => clearTimeout(timer);
    }, [searchTerm, selectedTags, userIP, filteredLocations.length]);

    const handleResultClick = async (locationName: string) => {
        if (!currentLogId) return;
        try {
            const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await updateDoc(doc(db, 'search_logs', currentLogId), {
                choices: arrayUnion(locationName)
            });
        } catch (e) {
            console.error("Failed to log click", e);
        }
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    const copyLink = async () => {
        if (!currentLogId) return;
        try {
            const url = `${window.location.origin}/search?id=${currentLogId}`;
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            // Log the share action
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await addDoc(collection(db, 'share_logs'), {
                ip: userIP,
                page: 'search',
                action: 'copy',
                url: url,
                logId: currentLogId,
                timestamp: serverTimestamp()
            });
        } catch (e) {
            console.error("Failed to copy/log share link", e);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="pt-24 pb-12 px-6 container mx-auto max-w-5xl">

                {/* Search Header */}
                <div className="text-center mb-12 space-y-4 relative">
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
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all border cursor-pointer ${isFilterOpen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-primary'}`}
                            >
                                <SlidersHorizontal size={18} />
                                {isFilterOpen ? t('hide_filters') : t('show_filters')}
                            </button>

                            <Link
                                href="/match"
                                className="hidden lg:flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all bg-slate-900 text-white shadow-lg shadow-slate-200/50 hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-slate-800"
                            >
                                <Sparkles size={18} className="text-yellow-400" />
                                {tNav('match')}
                            </Link>

                            {currentLogId && (
                                <button
                                    onClick={copyLink}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all border bg-white text-slate-700 border-slate-200 hover:border-primary shadow-sm active:scale-95 cursor-pointer"
                                >
                                    <LinkIcon size={18} className={copied ? "text-green-500" : "text-slate-400"} />
                                    {copied ? tCommon('link_copied') : tCommon('copy_link')}
                                </button>
                            )}
                        </div>

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

                <div className="flex flex-col gap-8">
                    {/* Results Grid Area */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {filteredLocations.length > 0 ? (
                                    filteredLocations.map(location => {
                                        const isSelected = selectedLocations.some(l => l.id === location.id);
                                        return (
                                            <div key={location.id} className="relative group">
                                                <Link
                                                    href={`/locations/${locationNameToSlug(location.name)}`}
                                                    onClick={() => handleResultClick(location.name)}
                                                    className="block bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row min-h-[220px]"
                                                >
                                                    {/* Image */}
                                                    <div className="w-full sm:w-2/5 relative overflow-hidden h-48 sm:h-auto">
                                                        <img
                                                            src={location.seasonalImages?.[currentSeason] || location.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'}
                                                            alt={location.name}
                                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent sm:block hidden" />
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

                                                            {/* Info Row (Altitude & Services) */}
                                                            <div className="flex items-center gap-6 mb-6">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">{tLoc('altitude')}</span>
                                                                    <span className="text-sm font-bold text-slate-700">{location.altitude ? `${location.altitude}m` : 'N/D'}</span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">{tLoc('services')}</span>
                                                                    <span className="text-sm font-bold text-slate-700">{location.servicesCount ?? location.services?.length ?? 0}</span>
                                                                </div>
                                                            </div>
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
                                                        : 'bg-white/70 text-slate-600 hover:bg-white hover:text-primary'
                                                        }`}
                                                    title={isSelected ? tLocDetail('remove_from_compare') : tLocDetail('add_to_compare')}
                                                >
                                                    {isSelected ? <Check size={20} /> : <Star size={20} />}
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-inner">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t('no_results_title')}</h3>
                                        <p className="text-slate-400 max-w-xs mx-auto">{t('no_results_desc')}</p>
                                        <button
                                            onClick={() => { setSearchTerm(''); setSelectedTags([]) }}
                                            className="mt-6 text-primary font-bold hover:underline cursor-pointer"
                                        >
                                            {t('reset_and_retry')}
                                        </button>

                                        <div className="mt-8 pt-6 border-t border-slate-100 max-w-md mx-auto">
                                            <p className="text-sm text-slate-600 mb-3">{tCommon('suggest_location_title')}</p>
                                            <Link
                                                href="/contact"
                                                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-sm hover:shadow-lg"
                                            >
                                                {tCommon('suggest_location_button')}
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Filter Modal */}
                <AnimatePresence>
                    {isFilterOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsFilterOpen(false)}
                                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60]"
                            />

                            {/* Modal Content */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[85vh] bg-white rounded-[32px] shadow-2xl z-[70] overflow-hidden flex flex-col"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900">
                                            <SlidersHorizontal size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">{t('show_filters')}</h2>
                                            <p className="text-xs text-slate-400 font-medium">Personalizza la tua ricerca</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                                    >
                                        <X size={24} className="text-slate-400" />
                                    </button>
                                </div>

                                {/* Scrollable Filter Categories */}
                                <div className="p-8 overflow-y-auto space-y-8 flex-1">
                                    {Object.entries(tagsByCategory).map(([category, tags]) => {
                                        const isOpen = openCategories.includes(category);
                                        return (
                                            <div key={category} className="border-b border-slate-100 last:border-0 pb-4">
                                                <button
                                                    onClick={() => {
                                                        setOpenCategories(prev =>
                                                            prev.includes(category)
                                                                ? prev.filter(c => c !== category)
                                                                : [...prev, category]
                                                        );
                                                    }}
                                                    className="w-full flex items-center justify-between py-2 group cursor-pointer"
                                                >
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-600 transition-colors">
                                                        {t(`categories.${category}` as any)}
                                                    </h4>
                                                    {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                                </button>

                                                <AnimatePresence>
                                                    {isOpen && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="flex flex-wrap gap-2 pt-4">
                                                                {tags.map(tag => {
                                                                    const isSelected = selectedTags.includes(tag);
                                                                    return (
                                                                        <button
                                                                            key={tag}
                                                                            onClick={() => toggleTag(tag)}
                                                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${isSelected
                                                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                                                : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-white'}`}
                                                                        >
                                                                            {tag}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer */}
                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between sticky bottom-0 z-10">
                                    <button
                                        onClick={() => setSelectedTags([])}
                                        className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                    >
                                        {t('clear_all')}
                                    </button>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                                    >
                                        Applica Filtri
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

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
                <SuggestLocationBanner />
            </div>
        </div>
    );
}

export default function SearchClient() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
            <SearchContent />
        </Suspense>
    );
}
