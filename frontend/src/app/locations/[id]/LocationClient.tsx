'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MapPin, Calendar, Star, Info, ChevronLeft, ArrowLeft, Sun, Snowflake, Cloud, Wind, Mountain, Home, Bus, Quote, AlertCircle, Check, X, Accessibility, HelpCircle, Layers, List, Search, ArrowRight, Sparkles } from 'lucide-react';
import { TAG_CATEGORIES } from '@/lib/tags-config';
import Link from 'next/link';
import { useSeasonStore } from '@/store/season-store';
import { useCompareStore } from '@/store/compare-store';
import { useTranslations } from 'next-intl';

export default function LocationDetailClient({ initialData }: { initialData?: any }) {
    const params = useParams();
    const router = useRouter(); // Initialize router
    const { currentSeason, setSeason } = useSeasonStore();
    const { selectedLocations, addLocation, removeLocation } = useCompareStore();
    const [location, setLocation] = useState<any>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isMobileTagsOpen, setIsMobileTagsOpen] = useState(false);
    const [isSinglePageMode, setIsSinglePageMode] = useState(false);
    const t = useTranslations('LocationDetail');
    const tSeasons = useTranslations('Seasons');

    // Local Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Auto-switch to 'all' tab when searching to show results across all categories
    useEffect(() => {
        if (searchTerm.trim() !== '') {
            setActiveTab('all');
        } else {
            // Optional: revert to 'overview' or stay on 'all'? 
            // Better to stay where user is or default to overview only if they were on 'all' effectively.
            // Let's just switch to 'all' on search start.
        }
    }, [searchTerm]);

    const getFilteredServices = (category: string) => {
        if (!location?.services) return [];
        return location.services.filter((s: any) =>
            s.category === category &&
            (searchTerm === '' ||
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.description?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    // State for Tabs
    // Removed local activeDescTab, using global currentSeason
    const [activeTab, setActiveTab] = useState<string>('all');

    const tabs = [
        { id: 'overview', label: t('tabs.overview'), icon: Info },
        { id: 'tourism', label: t('tabs.tourism'), icon: Mountain },
        { id: 'accommodation', label: t('tabs.accommodation'), icon: Home },
        { id: 'infrastructure', label: t('tabs.infrastructure'), icon: Bus },
        { id: 'sport', label: t('tabs.sport'), icon: Accessibility },
        { id: 'info', label: t('tabs.info'), icon: HelpCircle },
        { id: 'general', label: t('tabs.general'), icon: Layers },
        { id: 'all', label: t('tabs.all'), icon: List }
    ];

    useEffect(() => {
        const fetchLocation = async () => {
            if (!params.id) return;
            try {
                const { collection, query, where, getDocs } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                // Query by name instead of ID since URL param is now name
                const decodedName = decodeURIComponent(params.id as string);
                const q = query(collection(db, 'locations'), where('name', '==', decodedName));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const docSnap = querySnapshot.docs[0]; // Take the first match
                    const locData = docSnap.data();
                    const locId = docSnap.id;

                    // Fetch heavy details
                    try {
                        const { doc, getDoc } = await import('firebase/firestore');
                        const detailsSnap = await getDoc(doc(db, 'location_details', locId));
                        if (detailsSnap.exists()) {
                            setLocation({ id: locId, ...locData, ...detailsSnap.data() });
                        } else {
                            setLocation({ id: locId, ...locData });
                        }
                    } catch (e) {
                        console.error("Error fetching heavy details:", e);
                        setLocation({ id: locId, ...locData });
                    }
                }
            } catch (error) {
                console.error("Error fetching location:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLocation();
    }, [params.id]);

    if (loading) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!location) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-20 gap-4">
            <AlertCircle size={48} className="text-slate-300" />
            <h1 className="text-xl font-bold text-slate-900">{t('not_found')}</h1>
            <Link href="/locations" className="text-primary hover:underline">{t('back_to_list')}</Link>
        </div>
    );

    const seasons = [
        { id: 'winter', label: tSeasons('winter'), icon: Snowflake },
        { id: 'spring', label: tSeasons('spring'), icon: Cloud },
        { id: 'summer', label: tSeasons('summer'), icon: Sun },
        { id: 'autumn', label: tSeasons('autumn'), icon: Wind },
    ];

    const renderTagGroup = (title: string, tags: string[], Icon: any, colorClass: string, bgClass: string = 'bg-slate-50 border-slate-100') => {
        if (!tags || tags.length === 0) return null;
        return (
            <div>
                <h4 className={`font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider ${colorClass.replace('text', 'text-opacity-70')}`}>
                    <Icon size={14} className={colorClass} /> {title}
                </h4>
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag: string, i: number) => (
                        <Link
                            href={`/search?tag=${encodeURIComponent(tag)}`}
                            key={i}
                            className={`px-3 py-1 text-sm rounded-lg border ${bgClass} text-slate-700 hover:scale-105 hover:shadow-sm transition-all block`}
                        >
                            {tag}
                        </Link>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="pt-32 pb-32 lg:pb-12 container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: Identity Card (Image + Summary + Compare) + Sidebar Widgets */}
                    <div className="space-y-8 h-fit lg:sticky lg:bottom-8 self-end">
                        {/* Identity Card */}
                        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 relative">
                                <img
                                    src={location.seasonalImages?.[currentSeason] || location.coverImage || location.seasonalImages?.winter}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                    alt={location.name}
                                />

                            </div>

                            <div className="px-2">
                                <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">{location.name}</h1>
                                <div className="flex flex-wrap items-center gap-4 mb-6 text-slate-500 text-sm">
                                    <span className="flex items-center gap-1">
                                        <MapPin size={14} /> {location.region}, {location.country}
                                    </span>
                                    {location.altitude && (
                                        <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                            <Mountain size={14} /> {location.altitude}m
                                        </span>
                                    )}
                                    {location.coordinates && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100 hover:border-blue-200 transition-colors cursor-pointer"
                                            title={t('open_maps')}
                                        >
                                            <MapPin size={12} />
                                            {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                                            <ArrowRight size={10} className="-rotate-45" />
                                        </a>
                                    )}
                                </div>

                                {/* Quick Search (Local Content) - Desktop Only */}
                                <div className="hidden lg:block mb-6 relative z-10">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder={t('search_local_placeholder')}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 px-1">
                                        {t('search_hint')}
                                    </p>
                                </div>

                                {/* Desktop Only Controls */}
                                <div className="hidden lg:block space-y-6">
                                    {/* Compare Action */}
                                    <div>
                                        {selectedLocations.find(l => l.id === location.id) ? (
                                            <button
                                                onClick={() => removeLocation(location.id)}
                                                className="w-full bg-green-50 hover:bg-red-50 text-green-700 hover:text-red-700 font-bold py-3 rounded-xl transition-all border border-green-200 hover:border-red-200 flex items-center justify-center gap-2 group shadow-sm"
                                            >
                                                <span className="group-hover:hidden flex items-center gap-2"><Check size={18} /> {t('added_to_compare')}</span>
                                                <span className="hidden group-hover:flex items-center gap-2"><X size={18} /> {t('remove_from_compare')}</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (selectedLocations.length >= 3) {
                                                        alert(t('max_compare_alert'));
                                                        return;
                                                    }
                                                    addLocation(location);
                                                    router.push('/compare');
                                                }}
                                                className={`w-full font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2  ${selectedLocations.length >= 3 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'}`}
                                            >
                                                <Star size={18} className="group-hover:fill-current transition-colors" />
                                                {selectedLocations.length >= 3 ? t('max_compare_button') : t('add_to_compare')}
                                            </button>
                                        )}
                                    </div>

                                    {/* Categories / Tabs */}
                                    <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-2">
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive = activeTab === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => {
                                                        setActiveTab(tab.id);
                                                        setIsSinglePageMode(false);
                                                    }}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                                                        ? 'bg-slate-900 text-white shadow-md'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                        }`}
                                                >
                                                    <Icon size={14} />
                                                    {tab.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Season Selector */}
                                    <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-2">
                                        {seasons.map(s => {
                                            const Icon = s.icon;
                                            const isActive = currentSeason === s.id;
                                            const hasContent = location.description?.[s.id];
                                            if (!hasContent && (s.id === 'autumn' || s.id === 'spring')) return null;

                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => setSeason((s.id as any))}
                                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                                                        ? 'bg-slate-900 text-white shadow-md'
                                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                                        }`}
                                                >
                                                    <Icon size={14} />
                                                    {s.label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* SEO Index Link */}
                                    <div className="pt-6 border-t border-slate-100">
                                        <Link
                                            href={`/directory?location=${encodeURIComponent(location.name)}`}
                                            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors py-2"
                                        >
                                            <List size={12} /> See the details in reduced format
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Main): Tabs & Content */}
                    <div className="lg:col-span-2 space-y-8">


                        {/* Tab Headers */}
                        {/* General Characteristics (Top of Page) */}
                        {location.tags && (
                            <div className="mb-2">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    {renderTagGroup('Highlights', location.tags.highlights, Star, 'text-yellow-500', 'bg-yellow-50 border-yellow-100')}
                                </div>
                            </div>
                        )}

                        {/* Tab Content */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">

                            {/* OVERVIEW TAB */}
                            {(activeTab === 'overview' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || location.description?.[currentSeason]?.toLowerCase().includes(searchTerm.toLowerCase())) && (
                                <div id="section-overview" className="mobile-fade-in space-y-8 mb-12 scroll-mt-24 lg:scroll-mt-32">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-slate-900">{t('seasonal_overview')}</h2>
                                    </div>

                                    {/* Season Selector for Description */}

                                    <div className="prose prose-lg text-slate-600 leading-relaxed">
                                        {location.description?.[currentSeason] || <span className="text-slate-400 italic">{t('no_description')}</span>}
                                    </div>

                                    {/* AI Match Weights (Nested) */}
                                    {location.tagWeights && (
                                        <div className="pt-10 border-t border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="flex flex-col gap-6">
                                                {/* Vibe */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-3 bg-purple-500 rounded-full"></div>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vibe</h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {TAG_CATEGORIES.vibe.map(config => {
                                                            const weights = location.tagWeights?.vibe || {};
                                                            const tagKey = Object.keys(weights).find(k => k.toLowerCase() === config.id.toLowerCase());
                                                            const val = tagKey ? weights[tagKey] : null;
                                                            if (val === null || val === undefined) return null;
                                                            return (
                                                                <div key={config.id} className="flex flex-col items-center bg-purple-50 border border-purple-100 rounded-xl px-3 py-1.5 min-w-[80px]">
                                                                    <span className="text-[10px] font-bold text-purple-700 capitalize leading-tight mb-0.5 text-center">{config.label}</span>
                                                                    <span className="text-sm font-black text-purple-900">{val}%</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Target */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target</h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {TAG_CATEGORIES.target.map(config => {
                                                            const weights = location.tagWeights?.target || {};
                                                            const tagKey = Object.keys(weights).find(k => k.toLowerCase() === config.id.toLowerCase());
                                                            const val = tagKey ? weights[tagKey] : null;
                                                            if (val === null || val === undefined) return null;
                                                            return (
                                                                <div key={config.id} className="flex flex-col items-center bg-blue-50 border border-blue-100 rounded-xl px-3 py-1.5 min-w-[80px]">
                                                                    <span className="text-[10px] font-bold text-blue-700 capitalize leading-tight mb-0.5 text-center">{config.label}</span>
                                                                    <span className="text-sm font-black text-blue-900">{val}%</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Activity */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-3 bg-green-500 rounded-full"></div>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Activities</h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {TAG_CATEGORIES.activities.map(config => {
                                                            const weights = location.tagWeights?.activities || {};
                                                            const tagKey = Object.keys(weights).find(k => k.toLowerCase() === config.id.toLowerCase());
                                                            const val = tagKey ? weights[tagKey] : null;
                                                            if (val === null || val === undefined) return null;
                                                            return (
                                                                <div key={config.id} className="flex flex-col items-center bg-green-50 border border-green-100 rounded-xl px-3 py-1.5 min-w-[80px]">
                                                                    <span className="text-[10px] font-bold text-green-700 capitalize leading-tight mb-0.5 text-center">{config.label}</span>
                                                                    <span className="text-sm font-black text-green-900">{val}%</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TOURISM TAB */}
                            {(activeTab === 'overview' || activeTab === 'all') ? null : null}
                            {(activeTab === 'tourism' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('tourism').length > 0) && (
                                <div id="section-tourism" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <Mountain className="text-green-600" size={28} /> {t('sections.tourism')}
                                    </h2>
                                    {location.tags?.tourism && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Caratteristiche Attività', location.tags.tourism, Mountain, 'text-green-600', 'bg-green-50 border-green-100')}
                                        </div>
                                    )}
                                    <div className="grid md:grid-cols-1 gap-4">
                                        {getFilteredServices('tourism').length > 0 ? (
                                            getFilteredServices('tourism').map((service: any, idx: number) => (
                                                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-green-200 transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-slate-900 text-lg">{service.name}</h4>
                                                    </div>
                                                    <p className="text-slate-600 mb-4 leading-relaxed whitespace-pre-wrap">{service.description}</p>
                                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50 mt-auto">
                                                        {service.seasonAvailability?.map((s: string) => (
                                                            <span key={s} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-100 px-2 py-1 rounded-md flex items-center gap-1">
                                                                {s === 'winter' ? <Snowflake size={10} /> : s === 'summer' ? <Sun size={10} /> : <Calendar size={10} />} {tSeasons(s)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 italic">{t('no_items')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ACCOMMODATION TAB */}
                            {(activeTab === 'accommodation' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('accommodation').length > 0) && (
                                <div id="section-accommodation" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <Home className="text-orange-500" size={28} /> {t('sections.accommodation')}
                                    </h2>
                                    {location.tags?.accommodation && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Caratteristiche Ospitalità', location.tags.accommodation, Home, 'text-orange-500', 'bg-orange-50 border-orange-100')}
                                        </div>
                                    )}
                                    <div className="grid md:grid-cols-1 gap-4">
                                        {getFilteredServices('accommodation').length > 0 ? (
                                            getFilteredServices('accommodation').map((service: any, idx: number) => (
                                                <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h4 className="font-bold text-slate-900 text-lg">{service.name}</h4>
                                                    </div>
                                                    <p className="text-slate-600 mb-4 leading-relaxed whitespace-pre-wrap">{service.description}</p>
                                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50 mt-auto">
                                                        {service.seasonAvailability?.map((s: string) => (
                                                            <span key={s} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-100 px-2 py-1 rounded-md flex items-center gap-1">
                                                                {s === 'winter' ? <Snowflake size={10} /> : s === 'summer' ? <Sun size={10} /> : <Calendar size={10} />} {tSeasons(s)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 italic">{t('no_items')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* INFRASTRUCTURE TAB */}
                            {(activeTab === 'infrastructure' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('infrastructure').length > 0) && (
                                <div id="section-infrastructure" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <Bus className="text-slate-600" size={28} /> {t('sections.infrastructure')}
                                    </h2>
                                    {location.tags?.infrastructure && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Caratteristiche Impianti', location.tags.infrastructure, Bus, 'text-slate-600', 'bg-slate-50 border-slate-100')}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getFilteredServices('infrastructure').map((service: any, idx: number) => (
                                            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group">
                                                <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                                                {service.description && (
                                                    <p className="text-slate-600 text-sm leading-relaxed">{service.description}</p>
                                                )}
                                                <div className="flex gap-2 mt-3">
                                                    {service.seasonAvailability?.includes('winter') && <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-bold">{tSeasons('winter')}</span>}
                                                    {service.seasonAvailability?.includes('summer') && <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-bold">{tSeasons('summer')}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {(getFilteredServices('infrastructure').length === 0) &&
                                        <p className="text-slate-500 italic">{t('no_items')}</p>
                                    }
                                </div>
                            )}

                            {/* SPORT TAB */}
                            {(activeTab === 'sport' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('sport').length > 0) && (
                                <div id="section-sport" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <Accessibility className="text-red-500" size={28} /> {t('sections.sport')}
                                    </h2>
                                    {location.tags?.sport && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Caratteristiche Sport', location.tags.sport, Accessibility, 'text-red-500', 'bg-red-50 border-red-100')}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getFilteredServices('sport').map((service: any, idx: number) => (
                                            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group">
                                                <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                                                {service.description && <p className="text-slate-600 text-sm leading-relaxed">{service.description}</p>}
                                                <div className="flex gap-2 mt-3">
                                                    {service.seasonAvailability?.includes('winter') && <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-bold">{tSeasons('winter')}</span>}
                                                    {service.seasonAvailability?.includes('summer') && <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-bold">{tSeasons('summer')}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {(getFilteredServices('sport').length === 0) && <p className="text-slate-500 italic">{t('no_items')}</p>}
                                </div>
                            )}

                            {/* INFO TAB */}
                            {(activeTab === 'info' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('info').length > 0) && (
                                <div id="section-info" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <HelpCircle className="text-indigo-500" size={28} /> {t('sections.info')}
                                    </h2>
                                    {location.tags?.info && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Tag Info', location.tags.info, HelpCircle, 'text-indigo-500', 'bg-indigo-50 border-indigo-100')}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getFilteredServices('info').map((service: any, idx: number) => (
                                            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group">
                                                <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                                                {service.description && <p className="text-slate-600 text-sm leading-relaxed">{service.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                    {(getFilteredServices('info').length === 0) && <p className="text-slate-500 italic">{t('no_items')}</p>}
                                </div>
                            )}

                            {/* GENERAL TAB */}
                            {(activeTab === 'general' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('general').length > 0) && (
                                <div id="section-general" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <Layers className="text-slate-500" size={28} /> {t('sections.general')}
                                    </h2>
                                    {location.tags?.general && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Caratteristiche Generali', location.tags.general, Layers, 'text-slate-500', 'bg-slate-50 border-slate-100')}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getFilteredServices('general').map((service: any, idx: number) => (
                                            <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group">
                                                <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                                                {service.description && <p className="text-slate-600 text-sm leading-relaxed">{service.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                    {(getFilteredServices('general').length === 0) && <p className="text-slate-500 italic">{t('no_items')}</p>}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Footer */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-t border-slate-200 pb-4">
                <div className="flex flex-col">
                    {/* Expandable Tags Area (Expanding Upwards) */}
                    {isMobileTagsOpen && (
                        <div className="px-4 py-6 border-b border-slate-100 animate-in slide-in-from-bottom-4 duration-300 max-h-[60vh] overflow-y-auto">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">{t('tabs.all')}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {tabs.filter(t => t.id !== 'all').map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setIsSinglePageMode(true);
                                                setIsMobileTagsOpen(false);
                                                setIsMobileSearchOpen(false);
                                                setTimeout(() => {
                                                    document.getElementById(`section-${tab.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }, 10);
                                            }}
                                            className={`flex items-center gap-2.5 px-4 py-3.5 rounded-2xl text-[11px] font-bold uppercase tracking-wide transition-all ${isActive
                                                ? 'bg-slate-900 text-white shadow-lg'
                                                : 'bg-slate-50 text-slate-600 border border-slate-100'
                                                }`}
                                        >
                                            <Icon size={14} />
                                            <span className="truncate">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Expandable Search Area */}
                    {isMobileSearchOpen && (
                        <div className="px-4 py-3 border-b border-slate-100 animate-in slide-in-from-bottom-2 duration-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder={t('search_local_placeholder')}
                                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    onClick={() => { setIsMobileSearchOpen(false); setSearchTerm(''); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1 bg-slate-200/50 rounded-full"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Main Agile Bar (Single Line) */}
                    <div className="flex items-center justify-between px-3 py-3 gap-2">
                        {/* Search Trigger */}
                        <button
                            onClick={() => {
                                setIsMobileSearchOpen(!isMobileSearchOpen);
                                setIsMobileTagsOpen(false);
                            }}
                            className={`p-3 rounded-2xl transition-all ${isMobileSearchOpen ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 bg-slate-50'}`}
                        >
                            <Search size={22} />
                        </button>

                        {/* Tags Expand Trigger */}
                        <button
                            onClick={() => {
                                setIsMobileTagsOpen(!isMobileTagsOpen);
                                setIsMobileSearchOpen(false);
                            }}
                            className={`flex-1 flex items-center justify-between px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all ${isMobileTagsOpen
                                ? 'bg-slate-900 text-white shadow-lg'
                                : 'text-slate-700 bg-slate-50 border border-slate-100'
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                <List size={16} />
                                {tabs.find(t => t.id === activeTab)?.label || t('tabs.all')}
                            </span>
                            {isMobileTagsOpen ? <ChevronLeft className="-rotate-90" size={16} /> : <ChevronLeft className="rotate-90" size={16} />}
                        </button>

                        {/* Compare Action */}
                        <div className="flex items-center gap-2">
                            {selectedLocations.find(l => l.id === location.id) ? (
                                <button
                                    onClick={() => removeLocation(location.id)}
                                    className="p-3 bg-green-50 text-green-700 rounded-2xl border border-green-200 shadow-sm"
                                >
                                    <Check size={22} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (selectedLocations.length >= 3) {
                                            alert(t('max_compare_alert'));
                                            return;
                                        }
                                        addLocation(location);
                                        router.push('/compare');
                                    }}
                                    className={`p-3 rounded-2xl transition-all shadow-sm ${selectedLocations.length >= 3 ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white shadow-slate-200'}`}
                                >
                                    <Star size={22} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
