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
import { Search as SearchIcon, MapPin, X, Loader2, SlidersHorizontal, ChevronRight, ChevronDown, Check, Star, Link2 as LinkIcon, Sparkles, Footprints, Mountain, Users, Bed, ArrowUp, Activity, Coffee, ShoppingBag, Music, Waves, Heart, Dumbbell, Compass, Trees, Building2 as Building, Bus, Sun, Bike, Layers, Wind, Landmark } from 'lucide-react';
import { CompareAddedModal } from '@/components/ui/CompareAddedModal';
import { CompareLimitModal } from '@/components/ui/CompareLimitModal';
import { TAG_CATEGORIES } from '@/lib/tags-config';
import { useLocationStore } from '@/store/location-store';
import { useDebounce } from '@/hooks/useDebounce';

// Helper to normalize strings for search (remove accents, lowercase)
const normalize = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

const DEFAULT_RANGES: Record<string, [number, number]> = {
    altitude: [0, 5000],
    population: [0, 1000000],
    beds: [0, 100000],
    maxAltitude: [0, 6000],
    skiAreaTotalKm: [0, 2000],
    skiAreaLifts: [0, 500],
    hikingKm: [0, 5000],
};

const RANGE_CONFIGS = [
    { key: 'altitude', labelKeyPath: 'altitude', icon: Mountain, min: DEFAULT_RANGES.altitude[0], max: DEFAULT_RANGES.altitude[1], step: 100, unit: 'm', namespace: 'Locations' },
    { key: 'population', labelKeyPath: 'city_dimensions.population', icon: Users, min: DEFAULT_RANGES.population[0], max: DEFAULT_RANGES.population[1], step: 1000, unit: '', namespace: 'LocationDetail' },
    { key: 'beds', labelKeyPath: 'city_dimensions.accommodation_capacity', icon: Bed, min: DEFAULT_RANGES.beds[0], max: DEFAULT_RANGES.beds[1], step: 500, unit: '', namespace: 'LocationDetail' },
    { key: 'maxAltitude', labelKeyPath: 'city_dimensions.max_altitude', icon: ArrowUp, min: DEFAULT_RANGES.maxAltitude[0], max: DEFAULT_RANGES.maxAltitude[1], step: 100, unit: 'm', namespace: 'LocationDetail' },
    { key: 'skiAreaTotalKm', labelKeyPath: 'city_dimensions.ski_area_total', icon: Activity, min: DEFAULT_RANGES.skiAreaTotalKm[0], max: DEFAULT_RANGES.skiAreaTotalKm[1], step: 10, unit: 'km', namespace: 'LocationDetail' },
    { key: 'skiAreaLifts', labelKeyPath: 'city_dimensions.ski_area_lifts', icon: Layers, min: DEFAULT_RANGES.skiAreaLifts[0], max: DEFAULT_RANGES.skiAreaLifts[1], step: 1, unit: '', namespace: 'LocationDetail' },
    { key: 'hikingKm', labelKeyPath: 'city_dimensions.hiking', icon: Trees, min: DEFAULT_RANGES.hikingKm[0], max: DEFAULT_RANGES.hikingKm[1], step: 10, unit: 'km', namespace: 'LocationDetail' },
];

const CAT_CONFIGS = [
    { key: 'cityType', labelKeyPath: 'city_dimensions.type', icon: Building, options: ['village', 'town', 'city', 'resort', 'alpine_town', 'mountain_city', 'tourist_center'], namespace: 'LocationDetail' },
    { key: 'trafficFreeCenter', labelKeyPath: 'city_dimensions.traffic_free_center', icon: Footprints, options: ['yes', 'no', 'partial'], namespace: 'LocationDetail' },
    { key: 'hasShuttle', labelKeyPath: 'city_dimensions.shuttle', icon: Bus, options: ['yes', 'no', 'seasonal'], namespace: 'LocationDetail' },
    { key: 'aspect', labelKeyPath: 'city_dimensions.aspect', icon: Compass, options: ['traditional_village', 'mountain_city', 'resort_integrated', 'sunny_plateau', 'remote_outpost', 'alpine_lake', 'thermal_hub', 'protected_park', 'nature_reserve', 'ski_resort', 'historic_town'], namespace: 'LocationDetail' },
];

const PRESENCE_CONFIGS = [
    { key: 'crossCountry', labelKeyPath: 'city_dimensions.cross_country', icon: Activity },
    { key: 'snowshoeing', labelKeyPath: 'city_dimensions.snowshoeing', icon: Compass },
    { key: 'sledding', labelKeyPath: 'city_dimensions.sledding', icon: Wind },
    { key: 'snowpark', labelKeyPath: 'city_dimensions.snowpark', icon: Layers },
    { key: 'mtbTrails', labelKeyPath: 'city_dimensions.mtb', icon: Bike },
    { key: 'adventureParks', labelKeyPath: 'city_dimensions.adventure_parks', icon: Trees },
    { key: 'viaFerrata', labelKeyPath: 'city_dimensions.via_ferrata', icon: Mountain },
    { key: 'climbing', labelKeyPath: 'city_dimensions.climbing', icon: Landmark },
    { key: 'waterPool', labelKeyPath: 'city_dimensions.water_activities', icon: Waves },
    { key: 'nightlifeAperitifs', labelKeyPath: 'city_dimensions.nightlife', icon: Music },
    { key: 'shoppingType', labelKeyPath: 'city_dimensions.shopping', icon: ShoppingBag },
    { key: 'relaxSpa', labelKeyPath: 'city_dimensions.relax', icon: Heart },
];

function SearchContent() {
    const { currentSeason } = useSeasonStore();
    const { locations, loading: globalLoading, fetchLocations } = useLocationStore();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [openCategories, setOpenCategories] = useState<string[]>([]);
    const [userIP, setUserIP] = useState('0.0.0.0');
    const [currentLogId, setCurrentLogId] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(12);

    // Advanced Filters State
    const [rangeFilters, setRangeFilters] = useState<Record<string, [number, number]>>(DEFAULT_RANGES);

    const [categoryFilters, setCategoryFilters] = useState<Record<string, string[]>>({
        cityType: [],
        trafficFreeCenter: [],
        aspect: [],
        hasShuttle: []
    });

    const [presenceFilters, setPresenceFilters] = useState<string[]>([]);
    const [tagRangeFilters, setTagRangeFilters] = useState<Record<string, Record<string, [number, number]>>>({
        vibe: {},
        target: {},
        activities: {},
    });

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
        fetchLocations();

        // Get IP

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
            activities: new Set(),
        };

        // 1. Fill Vibe, Target, Activities from authoritative TAG_CATEGORIES
        TAG_CATEGORIES.vibe.forEach(t => categories.vibe.add(t.label));
        TAG_CATEGORIES.target.forEach(t => categories.target.add(t.label));
        TAG_CATEGORIES.activities.forEach(t => categories.activities.add(t.label));

        // 2. Fill other categories dynamically from locations
        locations.forEach(loc => {
            if (loc.tags) {
                Object.entries(loc.tags).forEach(([cat, tagList]: [string, any]) => {
                    // Skip categories we already handled from TAG_CATEGORIES to avoid duplicates or junk
                    if (cat === 'vibe' || cat === 'target' || cat === 'activities' || cat === 'tourism' || cat === 'sport') {
                        return;
                    }

                    if (categories[cat] && Array.isArray(tagList)) {
                        tagList.forEach(t => categories[cat].add(t));
                    }
                });
            }
        });

        // Convert Sets to sorted Arrays
        const result: Record<string, string[]> = {};
        Object.entries(categories).forEach(([cat, set]) => {
            // For Vibe, Target, Activities we always show them if available
            // For others we show only if they have tags
            if (set.size > 0) {
                // For the percentage ones, we KEEP THE ORDER from TAG_CATEGORIES but use result of Set
                if (cat === 'vibe' || cat === 'target' || cat === 'activities') {
                    // This ensures we only show tags that are in the set (which we just added)
                    // and maintains the order from the config
                    const configTags = cat === 'vibe' ? TAG_CATEGORIES.vibe :
                        cat === 'target' ? TAG_CATEGORIES.target :
                            TAG_CATEGORIES.activities;
                    result[cat] = configTags.map(t => t.label);
                } else {
                    result[cat] = Array.from(set).sort();
                }
            }
        });
        return result;
    }, [locations]);

    // Filter Logic
    const filteredLocations = useMemo(() => {
        const query = normalize(debouncedSearchTerm);

        return locations.filter(loc => {
            // 0. Status & Language Check (Consistency with Locations list)
            const isPublished = loc.status === 'published';
            const isCorrectLang = !loc.language || loc.language === 'en';
            if (!isPublished || !isCorrectLang) return false;

            // 1. Text Search
            const nameMatch = normalize(loc.name).includes(query);
            const regionMatch = normalize(loc.region || '').includes(query);
            const countryMatch = normalize(loc.country || '').includes(query);
            const descMatch = normalize(loc.description?.[currentSeason] || '').includes(query);

            // Search inside tags
            let tagsList: string[] = [];
            if (loc.tags) {
                Object.values(loc.tags).forEach((list: any) => {
                    if (Array.isArray(list)) tagsList = [...tagsList, ...list];
                });
            }
            const textMatches = !query || nameMatch || regionMatch || countryMatch || descMatch || tagsList.some(t => normalize(t).includes(query));

            // 2. Tag Filter (Selected Tags from clickable pills)
            const tagFilterMatches = selectedTags.length === 0 || selectedTags.every(selTag =>
                tagsList.some(t => t === selTag)
            );

            // 3. Adv. Range Filters
            const cd = loc.cityDimensions || {};
            const altitudeVal = loc.altitude || 0;
            const populationVal = Number(cd.population) || 0;
            const bedsVal = Number(cd.accommodationCapacity) || 0;
            const maxAltVal = Number(cd.maxAltitude) || 0;
            const skiKmVal = Number(cd.skiAreaTotalKm) || 0;
            const skiLiftsVal = Number(cd.skiAreaLifts) || 0;
            const hikingVal = Number(cd.hikingKm) || 0;

            const rangeMatches =
                altitudeVal >= rangeFilters.altitude[0] && altitudeVal <= rangeFilters.altitude[1] &&
                populationVal >= rangeFilters.population[0] && populationVal <= rangeFilters.population[1] &&
                bedsVal >= rangeFilters.beds[0] && bedsVal <= rangeFilters.beds[1] &&
                maxAltVal >= rangeFilters.maxAltitude[0] && maxAltVal <= rangeFilters.maxAltitude[1] &&
                skiKmVal >= rangeFilters.skiAreaTotalKm[0] && skiKmVal <= rangeFilters.skiAreaTotalKm[1] &&
                skiLiftsVal >= rangeFilters.skiAreaLifts[0] && skiLiftsVal <= rangeFilters.skiAreaLifts[1] &&
                hikingVal >= rangeFilters.hikingKm[0] && hikingVal <= rangeFilters.hikingKm[1];

            // 4. Adv. Category Filters
            const typeMatch = categoryFilters.cityType.length === 0 || categoryFilters.cityType.includes(cd.cityType);
            const trafficMatch = categoryFilters.trafficFreeCenter.length === 0 || categoryFilters.trafficFreeCenter.includes(cd.trafficFreeCenter);
            const shuttleMatch = categoryFilters.hasShuttle.length === 0 || categoryFilters.hasShuttle.includes(cd.hasShuttle);
            const aspectMatch = categoryFilters.aspect.length === 0 || categoryFilters.aspect.some(a => cd.aspect?.includes(a));

            // 5. Presence / Activity Filters
            const presenceMatches = presenceFilters.length === 0 || presenceFilters.every(pf => {
                const val = cd[pf];
                return val && val !== 'no' && val !== 'No';
            });

            // 6. Tag Weight Range Filters (Vibe, Target, Activities)
            const tagWeightMatches = Object.entries(tagRangeFilters).every(([uiCat, tags]) => {
                return Object.entries(tags).every(([tagName, range]) => {
                    const normTagName = tagName.toLowerCase();

                    // 1. Find the canonical Tag ID by searching all categories in master config
                    let tagId = tagName;
                    for (const [configCat, configTags] of Object.entries(TAG_CATEGORIES)) {
                        const match = (configTags as unknown as any[]).find(t =>
                            t.label.toLowerCase() === normTagName || t.id.toLowerCase() === normTagName
                        );
                        if (match) {
                            tagId = match.id;
                            break;
                        }
                    }
                    const normTagId = tagId.toLowerCase();

                    // 2. Aggressive search for weight across ALL potential weight categories
                    const weightCategories = ['vibe', 'target', 'activities', 'tourism', 'sport', 'highlights'];
                    let weight: number | undefined;

                    for (const c of weightCategories) {
                        const catWeights = loc.tagWeights?.[c] || {};

                        // Check multiple key variations
                        if (catWeights[tagId] !== undefined) { weight = Number(catWeights[tagId]); break; }
                        if (catWeights[tagName] !== undefined) { weight = Number(catWeights[tagName]); break; }
                        if (catWeights[normTagId] !== undefined) { weight = Number(catWeights[normTagId]); break; }
                        if (catWeights[normTagName] !== undefined) { weight = Number(catWeights[normTagName]); break; }

                        // Search keys for case-insensitive match
                        const keyMatch = Object.keys(catWeights).find(k =>
                            k.toLowerCase() === normTagId || k.toLowerCase() === normTagName
                        );
                        if (keyMatch) {
                            weight = Number(catWeights[keyMatch]);
                            break;
                        }
                    }

                    // 3. Fallback to binary presence (100% if tag is in any category list)
                    if (weight === undefined) {
                        let hasTag = false;
                        for (const c of weightCategories) {
                            if (loc.tags?.[c]?.some((t: string) =>
                                t.toLowerCase() === normTagName || t.toLowerCase() === normTagId
                            )) {
                                hasTag = true;
                                break;
                            }
                        }
                        weight = hasTag ? 100 : 0;
                    }

                    return weight >= range[0] && weight <= range[1];
                });
            });

            return textMatches && tagFilterMatches && rangeMatches && typeMatch && trafficMatch && shuttleMatch && aspectMatch && presenceMatches && tagWeightMatches;
        });
    }, [searchTerm, locations, currentSeason, selectedTags, rangeFilters, categoryFilters, presenceFilters, tagRangeFilters]);

    // Search Logging (Updated to include advanced filters)
    useEffect(() => {
        if (!searchTerm && selectedTags.length === 0 && presenceFilters.length === 0) return;

        const logSearch = async () => {
            try {
                const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const docRef = await addDoc(collection(db, 'search_logs'), {
                    query: searchTerm,
                    tags: selectedTags,
                    advanced: {
                        range: rangeFilters,
                        category: categoryFilters,
                        presence: presenceFilters,
                        tagRanges: tagRangeFilters
                    },
                    timestamp: serverTimestamp(),
                    ip: userIP,
                    resultsCount: filteredLocations.length,
                    choices: []
                });
                setCurrentLogId(docRef.id);
            } catch (e) {
                console.error("Failed to log search", e);
            }
        };

        const timer = setTimeout(logSearch, 2000);
        return () => clearTimeout(timer);
    }, [searchTerm, selectedTags, rangeFilters, categoryFilters, presenceFilters, userIP, filteredLocations.length]);

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
                    {(selectedTags.length > 0 ||
                        presenceFilters.length > 0 ||
                        Object.values(categoryFilters).some(v => v.length > 0) ||
                        Object.entries(rangeFilters).some(([k, v]) => v[0] !== DEFAULT_RANGES[k][0] || v[1] !== DEFAULT_RANGES[k][1]) ||
                        Object.values(tagRangeFilters).some(catTags => Object.values(catTags).some(range => range[0] > 0 || range[1] < 100))
                    ) && (
                            <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">{t('active_filters')}</span>

                                {/* Range Filter Chips */}
                                {Object.entries(rangeFilters).map(([k, v]) => {
                                    if (v[0] === DEFAULT_RANGES[k][0] && v[1] === DEFAULT_RANGES[k][1]) return null;
                                    const cfg = RANGE_CONFIGS.find(c => c.key === k);
                                    return (
                                        <button
                                            key={k}
                                            onClick={() => setRangeFilters(prev => ({ ...prev, [k]: DEFAULT_RANGES[k] }))}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-100 hover:bg-red-50 hover:text-red-600 transition-all group cursor-pointer"
                                        >
                                            {(cfg?.namespace === 'Locations' ? tLoc : tLocDetail)(cfg?.labelKeyPath as any)}: {v[0]}{cfg?.unit} - {v[1]}{cfg?.unit} <X size={12} className="group-hover:scale-110" />
                                        </button>
                                    );
                                })}

                                {/* Category Filter Chips */}
                                {Object.entries(categoryFilters).map(([cat, values]) =>
                                    values.map(val => (
                                        <button
                                            key={cat + val}
                                            onClick={() => setCategoryFilters(prev => ({
                                                ...prev,
                                                [cat]: prev[cat].filter(x => x !== val)
                                            }))}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200 hover:bg-red-50 hover:text-red-600 transition-all group cursor-pointer"
                                        >
                                            {tLocDetail(`city_dimensions.${val}` as any) || val.replace(/_/g, ' ')} <X size={12} className="group-hover:scale-110" />
                                        </button>
                                    ))
                                )}

                                {/* Presence Filter Chips */}
                                {presenceFilters.map(pf => {
                                    const cfg = PRESENCE_CONFIGS.find(c => c.key === pf);
                                    return (
                                        <button
                                            key={pf}
                                            onClick={() => setPresenceFilters(prev => prev.filter(x => x !== pf))}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold border border-indigo-100 hover:bg-red-50 hover:text-red-600 transition-all group cursor-pointer"
                                        >
                                            {cfg ? tLocDetail(cfg.labelKeyPath as any) : pf} <X size={12} className="group-hover:scale-110" />
                                        </button>
                                    );
                                })}

                                {/* Tag Range Filter Chips */}
                                {Object.entries(tagRangeFilters).map(([cat, tags]) =>
                                    Object.entries(tags).map(([tag, range]) => {
                                        if (range[0] === 0 && range[1] === 100) return null;
                                        return (
                                            <button
                                                key={cat + tag}
                                                onClick={() => setTagRangeFilters(prev => {
                                                    const next = { ...prev };
                                                    const catCopy = { ...next[cat] };
                                                    delete catCopy[tag];
                                                    next[cat] = catCopy;
                                                    return next;
                                                })}
                                                className="flex items-center gap-1.5 px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-xs font-bold border border-pink-100 hover:bg-red-50 hover:text-red-600 transition-all group cursor-pointer"
                                            >
                                                {tag}: {range[0]}% - {range[1]}% <X size={12} className="group-hover:scale-110" />
                                            </button>
                                        );
                                    })
                                )}

                                {/* Existing Tag Chips */}
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
                                    onClick={() => {
                                        setSearchTerm('');
                                        setRangeFilters(DEFAULT_RANGES);
                                        setCategoryFilters({ cityType: [], trafficFreeCenter: [], aspect: [], hasShuttle: [] });
                                        setPresenceFilters([]);
                                        setSelectedTags([]);
                                        setTagRangeFilters({ vibe: {}, target: {}, activities: {} });
                                    }}
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
                        {globalLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {filteredLocations.length > 0 ? (
                                    <>
                                        {filteredLocations.slice(0, visibleCount).map(location => {
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
                                        })}

                                        {visibleCount < filteredLocations.length && (
                                            <div className="mt-12 flex justify-center">
                                                <button
                                                    onClick={() => setVisibleCount(prev => prev + 12)}
                                                    className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm cursor-pointer"
                                                >
                                                    {t('more_tags' as any, { count: filteredLocations.length - visibleCount })}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 shadow-inner">
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{t('no_results_title')}</h3>
                                        <p className="text-slate-400 max-w-xs mx-auto">{t('no_results_desc')}</p>
                                        <button
                                            onClick={() => { setSearchTerm(''); setSelectedTags([]) }}
                                            className="mt-6 text-primary font-bold hover:underline cursor-pointer"
                                        >
                                            {t('reset_filters')}
                                        </button>
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
                                className="fixed inset-0 lg:m-auto w-full lg:max-w-4xl h-full lg:h-[90vh] bg-white lg:rounded-[32px] shadow-2xl z-[70] overflow-hidden flex flex-col"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900">
                                            <SlidersHorizontal size={20} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">{t('show_filters')}</h2>
                                            <p className="text-xs text-slate-400 font-medium">Personalizza la tua ricerca in montagna</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                                    >
                                        <X size={24} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                                    {/* Sidebar Categories */}
                                    <div className="w-full lg:w-64 bg-slate-50 border-r border-slate-100 overflow-y-auto p-4 grid grid-cols-2 lg:flex lg:flex-col gap-2 lg:space-y-2">
                                        {[
                                            { id: 'dimensions', labelKey: 'dimensions', icon: Building },
                                            { id: 'activities', labelKey: 'tourism', icon: Activity },
                                            { id: 'vibe_target', labelKey: 'vibe_style', icon: Sparkles },
                                            { id: 'highlights', labelKey: 'highlights', icon: Star },
                                        ].map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setOpenCategories([cat.id])} // Use as active tab
                                                className={`w-full flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-3 lg:px-4 py-3 rounded-xl text-[11px] lg:text-sm font-bold transition-all ${openCategories.includes(cat.id) || (openCategories.length === 0 && cat.id === 'dimensions')
                                                    ? 'bg-white text-primary shadow-sm border border-slate-200'
                                                    : 'text-slate-500 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <cat.icon size={16} className="lg:w-[18px] lg:h-[18px]" />
                                                <span className="truncate">{t(`categories.${cat.labelKey}` as any) || cat.id}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Scrollable Content */}
                                    <div className="flex-1 overflow-y-auto p-8">
                                        {(openCategories.length === 0 || openCategories.includes('dimensions')) && (
                                            <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {RANGE_CONFIGS.slice(0, 4).map(cfg => (
                                                        <div key={cfg.key} className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <cfg.icon size={16} className="text-slate-400" />
                                                                    <h4 className="text-sm font-bold text-slate-700">
                                                                        {(cfg.namespace === 'Locations' ? tLoc : tLocDetail)(cfg.labelKeyPath as any)}
                                                                    </h4>
                                                                </div>
                                                                <div className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                                                    {rangeFilters[cfg.key][0]}{cfg.unit} - {rangeFilters[cfg.key][1]}{cfg.unit}
                                                                </div>
                                                            </div>
                                                            <div className="px-2 space-y-2">
                                                                <div className="relative h-6 flex items-center">
                                                                    <div className="absolute w-full h-1.5 bg-slate-100 rounded-lg" />
                                                                    <input
                                                                        type="range"
                                                                        min={cfg.min}
                                                                        max={cfg.max}
                                                                        step={cfg.step}
                                                                        value={rangeFilters[cfg.key][0]}
                                                                        onChange={(e) => {
                                                                            const val = Math.min(Number(e.target.value), rangeFilters[cfg.key][1]);
                                                                            setRangeFilters(prev => ({ ...prev, [cfg.key]: [val, prev[cfg.key][1]] }));
                                                                        }}
                                                                        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                                                                    />
                                                                    <input
                                                                        type="range"
                                                                        min={cfg.min}
                                                                        max={cfg.max}
                                                                        step={cfg.step}
                                                                        value={rangeFilters[cfg.key][1]}
                                                                        onChange={(e) => {
                                                                            const val = Math.max(Number(e.target.value), rangeFilters[cfg.key][0]);
                                                                            setRangeFilters(prev => ({ ...prev, [cfg.key]: [prev[cfg.key][0], val] }));
                                                                        }}
                                                                        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                    <span>Min: {cfg.min}{cfg.unit}</span>
                                                                    <span>Max: {cfg.max}{cfg.unit}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {CAT_CONFIGS.map(cfg => (
                                                        <div key={cfg.key} className="space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <cfg.icon size={16} className="text-slate-400" />
                                                                <h4 className="text-sm font-bold text-slate-700">
                                                                    {(cfg.namespace === 'Locations' ? tLoc : tLocDetail)(cfg.labelKeyPath as any)}
                                                                </h4>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {cfg.options.map(opt => {
                                                                    const isSelected = categoryFilters[cfg.key].includes(opt);
                                                                    return (
                                                                        <button
                                                                            key={opt}
                                                                            onClick={() => setCategoryFilters(prev => ({
                                                                                ...prev,
                                                                                [cfg.key]: isSelected
                                                                                    ? prev[cfg.key].filter(x => x !== opt)
                                                                                    : [...prev[cfg.key], opt]
                                                                            }))}
                                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isSelected
                                                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                                                : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                                                                                }`}
                                                                        >
                                                                            {tLocDetail(`city_dimensions.${opt}` as any) || opt.replace(/_/g, ' ')}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {openCategories.includes('activities') && (
                                            <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {RANGE_CONFIGS.slice(4).map(cfg => (
                                                        <div key={cfg.key} className="space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <cfg.icon size={16} className="text-slate-400" />
                                                                    <h4 className="text-sm font-bold text-slate-700">
                                                                        {(cfg.namespace === 'Locations' ? tLoc : tLocDetail)(cfg.labelKeyPath as any)}
                                                                    </h4>
                                                                </div>
                                                                <div className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                                                    {rangeFilters[cfg.key][0]}{cfg.unit} - {rangeFilters[cfg.key][1]}{cfg.unit}
                                                                </div>
                                                            </div>
                                                            <div className="px-2 space-y-2">
                                                                <div className="relative h-6 flex items-center">
                                                                    <div className="absolute w-full h-1.5 bg-slate-100 rounded-lg" />
                                                                    <input
                                                                        type="range"
                                                                        min={cfg.min}
                                                                        max={cfg.max}
                                                                        step={cfg.step}
                                                                        value={rangeFilters[cfg.key][0]}
                                                                        onChange={(e) => {
                                                                            const val = Math.min(Number(e.target.value), rangeFilters[cfg.key][1]);
                                                                            setRangeFilters(prev => ({ ...prev, [cfg.key]: [val, prev[cfg.key][1]] }));
                                                                        }}
                                                                        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                                                                    />
                                                                    <input
                                                                        type="range"
                                                                        min={cfg.min}
                                                                        max={cfg.max}
                                                                        step={cfg.step}
                                                                        value={rangeFilters[cfg.key][1]}
                                                                        onChange={(e) => {
                                                                            const val = Math.max(Number(e.target.value), rangeFilters[cfg.key][0]);
                                                                            setRangeFilters(prev => ({ ...prev, [cfg.key]: [prev[cfg.key][0], val] }));
                                                                        }}
                                                                        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                                                                    />
                                                                </div>
                                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                    <span>Min: {cfg.min}{cfg.unit}</span>
                                                                    <span>Max: {cfg.max}{cfg.unit}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Sport & Wellness (Percentage Sliders) - Moved here from Vibe & Style */}
                                                {(() => {
                                                    const cat = 'activities';
                                                    const tags = tagsByCategory[cat] || [];
                                                    if (tags.length === 0) return null;

                                                    return (
                                                        <div key={cat} className="space-y-6 pt-12 border-t border-slate-100">
                                                            <div className="flex items-center gap-2">
                                                                <Activity size={18} className="text-primary" />
                                                                <h4 className="text-sm font-bold text-slate-700">
                                                                    {t(`categories.${cat === 'activities' ? 'sport' : cat}` as any)}
                                                                </h4>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                                                {tags.map(tag => {
                                                                    const range = tagRangeFilters[cat]?.[tag] || [0, 100];
                                                                    const isActive = range[0] > 0 || range[1] < 100;

                                                                    return (
                                                                        <div key={tag} className="space-y-3 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className={`text-sm ${isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-500'}`}>
                                                                                    {tag}
                                                                                </span>
                                                                                <div className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                                                                    {range[0]}% - {range[1]}%
                                                                                </div>
                                                                            </div>
                                                                            <div className="px-1 space-y-2">
                                                                                <div className="relative h-6 flex items-center">
                                                                                    <div className="absolute w-full h-1.5 bg-slate-200/50 rounded-lg" />
                                                                                    <div
                                                                                        className="absolute h-1.5 bg-primary rounded-lg"
                                                                                        style={{
                                                                                            left: `${range[0]}%`,
                                                                                            width: `${range[1] - range[0]}%`
                                                                                        }}
                                                                                    />
                                                                                    <input
                                                                                        type="range" min="0" max="100" step="5" value={range[0]}
                                                                                        onChange={(e) => {
                                                                                            const val = Math.min(Number(e.target.value), range[1]);
                                                                                            setTagRangeFilters(prev => ({
                                                                                                ...prev,
                                                                                                [cat]: { ...prev[cat], [tag]: [val, range[1]] }
                                                                                            }));
                                                                                        }}
                                                                                        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                                                                                    />
                                                                                    <input
                                                                                        type="range" min="0" max="100" step="5" value={range[1]}
                                                                                        onChange={(e) => {
                                                                                            const val = Math.max(Number(e.target.value), range[0]);
                                                                                            setTagRangeFilters(prev => ({
                                                                                                ...prev,
                                                                                                [cat]: { ...prev[cat], [tag]: [range[0], val] }
                                                                                            }));
                                                                                        }}
                                                                                        className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                                                                                    />
                                                                                </div>
                                                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                                    <span>0%</span>
                                                                                    <span>100%</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {openCategories.includes('vibe_target') && (
                                            <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                                                {['vibe', 'target'].map((cat) => {
                                                    const tags = tagsByCategory[cat] || [];
                                                    if (tags.length === 0) return null;

                                                    return (
                                                        <div key={cat} className="space-y-6">
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                                {t(`categories.${cat === 'activities' ? 'sport' : cat}` as any)}
                                                            </h4>

                                                            {cat === 'vibe' || cat === 'target' || cat === 'activities' ? (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                                                    {tags.map(tag => {
                                                                        const range = tagRangeFilters[cat]?.[tag] || [0, 100];
                                                                        const isActive = range[0] > 0 || range[1] < 100;

                                                                        return (
                                                                            <div key={tag} className="space-y-3 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-slate-200 transition-all">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className={`text-sm ${isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-500'}`}>
                                                                                        {tag}
                                                                                    </span>
                                                                                    <div className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                                                                        {range[0]}% - {range[1]}%
                                                                                    </div>
                                                                                </div>
                                                                                <div className="px-1 space-y-2">
                                                                                    <div className="relative h-6 flex items-center">
                                                                                        <div className="absolute w-full h-1.5 bg-slate-200/50 rounded-lg" />
                                                                                        {/* Active track highlight */}
                                                                                        <div
                                                                                            className="absolute h-1.5 bg-primary rounded-lg"
                                                                                            style={{
                                                                                                left: `${range[0]}%`,
                                                                                                width: `${range[1] - range[0]}%`
                                                                                            }}
                                                                                        />
                                                                                        <input
                                                                                            type="range"
                                                                                            min="0"
                                                                                            max="100"
                                                                                            step="5"
                                                                                            value={range[0]}
                                                                                            onChange={(e) => {
                                                                                                const val = Math.min(Number(e.target.value), range[1]);
                                                                                                setTagRangeFilters(prev => ({
                                                                                                    ...prev,
                                                                                                    [cat]: { ...prev[cat], [tag]: [val, range[1]] }
                                                                                                }));
                                                                                            }}
                                                                                            className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                                                                                        />
                                                                                        <input
                                                                                            type="range"
                                                                                            min="0"
                                                                                            max="100"
                                                                                            step="5"
                                                                                            value={range[1]}
                                                                                            onChange={(e) => {
                                                                                                const val = Math.max(Number(e.target.value), range[0]);
                                                                                                setTagRangeFilters(prev => ({
                                                                                                    ...prev,
                                                                                                    [cat]: { ...prev[cat], [tag]: [range[0], val] }
                                                                                                }));
                                                                                            }}
                                                                                            className="absolute w-full h-1.5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md cursor-pointer"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                                        <span>0%</span>
                                                                                        <span>100%</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-2">
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
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {openCategories.includes('highlights') && (
                                            <div className="space-y-12 animate-in fade-in slide-in-from-right-4">
                                                <div className="space-y-6">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                        {t('categories.highlights' as any)}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(tagsByCategory['highlights'] || []).map(tag => {
                                                            const isSelected = selectedTags.includes(tag);
                                                            return (
                                                                <button
                                                                    key={tag}
                                                                    onClick={() => toggleTag(tag)}
                                                                    className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${isSelected
                                                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-white'}`}
                                                                >
                                                                    {tag}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between sticky bottom-0 z-10">
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setRangeFilters(DEFAULT_RANGES);
                                            setCategoryFilters({ cityType: [], trafficFreeCenter: [], aspect: [], hasShuttle: [] });
                                            setPresenceFilters([]);
                                            setSelectedTags([]);
                                            setTagRangeFilters({ vibe: {}, target: {}, activities: {} });
                                        }}
                                        className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                    >
                                        {t('clear_all')}
                                    </button>
                                    <button
                                        onClick={() => setIsFilterOpen(false)}
                                        className="px-12 py-4 bg-slate-900 text-white rounded-[20px] font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
                                    >
                                        <div className="bg-white/10 px-2 py-0.5 rounded-md text-xs mr-2">
                                            {filteredLocations.length}
                                        </div>
                                        {t('view_results')}
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
