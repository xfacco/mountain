'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MapPin, Calendar, Star, Heart, Info, ChevronLeft, ChevronRight, ArrowLeft, Sun, Snowflake, Cloud, Wind, Mountain, Home, Bus, Quote, AlertCircle, Check, X, Accessibility, HelpCircle, Layers, List, Search, ArrowRight, Sparkles, Link2 as LinkIcon } from 'lucide-react';
import { locationNameToSlug } from '@/lib/url-utils';
import { TAG_CATEGORIES } from '@/lib/tags-config';
import Link from 'next/link';
import { useSeasonStore } from '@/store/season-store';
import { useCompareStore } from '@/store/compare-store';
import { useTranslations } from 'next-intl';
import { CompareAddedModal } from '@/components/ui/CompareAddedModal';
import { CompareLimitModal } from '@/components/ui/CompareLimitModal';
import { RadarChart } from '@/components/ui/RadarChart';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeTags } from '@/lib/tag-utils';

export default function LocationDetailClient({ initialData }: { initialData?: any }) {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { currentSeason, setSeason } = useSeasonStore();
    const { selectedLocations, addLocation, removeLocation } = useCompareStore();
    const [location, setLocation] = useState<any>(initialData || null);
    const [loading, setLoading] = useState(!initialData);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isMobileTagsOpen, setIsMobileTagsOpen] = useState(false);
    const [isSinglePageMode, setIsSinglePageMode] = useState(false);
    const t = useTranslations('LocationDetail');
    const tSeasons = useTranslations('Seasons');
    const tCommon = useTranslations('Common');

    const [copied, setCopied] = useState(false);

    const [modalOpen, setModalOpen] = useState(false);
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const [userIp, setUserIp] = useState<string>('');

    // Local Search State
    const [searchTerm, setSearchTerm] = useState('');

    // Highlighted Sections State
    const [highlightedSections, setHighlightedSections] = useState<string[]>([]);
    const [showOnlyHighlighted, setShowOnlyHighlighted] = useState(false);

    // Fetch IP on mount
    useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setUserIp(data.ip))
            .catch(err => console.error("Error fetching IP", err));
    }, []);

    // Load highlights for current location
    useEffect(() => {
        if (location?.id) {
            const saved = localStorage.getItem(`alpematch_highlights_${location.id}`);
            if (saved) {
                try {
                    setHighlightedSections(JSON.parse(saved));
                } catch (e) {
                    console.error("Error parsing highlights", e);
                }
            }
        }
    }, [location?.id]);



    const toggleHighlight = (sectionId: string) => {
        const isAdding = !highlightedSections.includes(sectionId);
        const next = isAdding
            ? [...highlightedSections, sectionId]
            : highlightedSections.filter(id => id !== sectionId);

        setHighlightedSections(next);
        if (location?.id) {
            localStorage.setItem(`alpematch_highlights_${location.id}`, JSON.stringify(next));

            // Notify Navbar to update count
            window.dispatchEvent(new Event('highlightsUpdated'));

            // Save location name for global summary
            const namesRepo = JSON.parse(localStorage.getItem('alpematch_location_names') || '{}');
            namesRepo[location.id] = location.name;
            localStorage.setItem('alpematch_location_names', JSON.stringify(namesRepo));

            // Log highlight action to Firestore
            const logHighlight = async () => {
                try {
                    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');
                    await addDoc(collection(db, 'highlight_logs'), {
                        ip: userIp,
                        locationName: location?.name,
                        locationId: location?.id,
                        itemId: sectionId,
                        action: isAdding ? 'add' : 'remove',
                        timestamp: serverTimestamp()
                    });
                } catch (err) {
                    console.error("Error logging highlight action:", err);
                }
            };
            logHighlight();
        }
    };

    // Image Carousel Logic
    const availableImagesData = [
        ...(location?.seasonalImages?.winter ? [{ src: location.seasonalImages.winter, season: 'winter' }] : []),
        ...(location?.seasonalImages?.spring ? [{ src: location.seasonalImages.spring, season: 'spring' }] : []),
        ...(location?.seasonalImages?.summer ? [{ src: location.seasonalImages.summer, season: 'summer' }] : []),
        ...(location?.seasonalImages?.autumn ? [{ src: location.seasonalImages.autumn, season: 'autumn' }] : []),
    ];

    // Filter duplicates if any (e.g. fallback images)
    const availableImages = availableImagesData.filter((v, i, a) => a.findIndex(t => t.src === v.src) === i);

    const [currentImgIdx, setCurrentImgIdx] = useState(0);

    useEffect(() => {
        if (!location) return;
        const idx = availableImages.findIndex(img => img.season === currentSeason);
        if (idx !== -1) {
            setCurrentImgIdx(idx);
        }
    }, [currentSeason, location]);


    const nextImg = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        setCurrentImgIdx((prev) => (prev + 1) % availableImages.length);
    };
    const prevImg = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        e?.preventDefault();
        setCurrentImgIdx((prev) => (prev - 1 + availableImages.length) % availableImages.length);
    };

    // Log view if shared link
    useEffect(() => {
        const isShared = searchParams.get('s') === '1';
        if (isShared && location?.name) {
            const logView = async () => {
                try {
                    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');

                    let currentIp = userIp;
                    if (!currentIp) {
                        const res = await fetch('https://api.ipify.org?format=json');
                        const ipData = await res.json();
                        currentIp = ipData.ip;
                    }

                    await addDoc(collection(db, 'share_logs'), {
                        ip: currentIp,
                        page: 'location_detail',
                        action: 'view',
                        locationName: location.name,
                        timestamp: serverTimestamp()
                    });
                } catch (err) {
                    console.error("Error logging share view location detail:", err);
                }
            };
            logView();
        }
    }, [searchParams, location?.name]);

    // Auto-switch to 'all' tab when searching to show results across all categories
    useEffect(() => {
        if (searchTerm.trim() !== '') {
            setActiveTab('all');
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
        { id: 'sport', label: t('tabs.sport'), icon: Accessibility },
        { id: 'infrastructure', label: t('tabs.infrastructure'), icon: Bus },
        { id: 'info', label: t('tabs.info'), icon: HelpCircle },
        { id: 'general', label: t('tabs.general'), icon: Layers },
        { id: 'accommodation', label: t('tabs.accommodation'), icon: Home },
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
                    {normalizeTags(tags).map((tag: string, i: number) => (
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

    const copyLink = async () => {
        try {
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('s', '1');
            const url = currentUrl.toString();
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            // Log the share action
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await addDoc(collection(db, 'share_logs'), {
                ip: userIp,
                page: 'location_detail',
                action: 'copy',
                url: url,
                locationName: location?.name,
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to copy/log share link:", err);
        }
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
                            <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 relative group/carousel">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={availableImages[currentImgIdx]?.src || 'fallback'}
                                        src={availableImages[currentImgIdx]?.src || location.coverImage || location.seasonalImages?.winter || '/logo_alpematch.png'}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.5, ease: "easeInOut" }}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={1}
                                        onDragEnd={(e, { offset, velocity }) => {
                                            const swipe = offset.x;
                                            if (swipe < -50) {
                                                nextImg();
                                            } else if (swipe > 50) {
                                                prevImg();
                                            }
                                        }}
                                        className="w-full h-full object-cover touch-pan-y"
                                        alt={location.name}
                                    />
                                </AnimatePresence>

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 pointer-events-none" />

                                {availableImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImg}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-all opacity-100 lg:opacity-0 lg:group-hover/carousel:opacity-100 z-10 border border-white/30"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={nextImg}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/40 transition-all opacity-100 lg:opacity-0 lg:group-hover/carousel:opacity-100 z-10 border border-white/30"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight size={20} />
                                        </button>

                                        {/* Dots Navigation */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                            {availableImages.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentImgIdx(i)}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentImgIdx
                                                        ? 'bg-white w-6 shadow-lg shadow-white/20'
                                                        : 'bg-white/40 w-1.5 hover:bg-white/60'
                                                        }`}
                                                    aria-label={`Go to image ${i + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="px-2">
                                <h1 className="text-3xl font-black text-slate-900 mb-2 leading-tight">{location.name}</h1>
                                <div className="flex flex-wrap items-center gap-4 mb-6 text-slate-500 text-sm">
                                    <span className="flex items-center gap-1">
                                        <MapPin size={14} /> {location.region}, {location.country}
                                    </span>

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

                                {/* Quick Stats Summary */}
                                <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t border-slate-50">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            <Mountain size={12} className="text-slate-400" /> {t('altitude')}
                                        </div>
                                        <div className="text-lg font-black text-slate-900 leading-none">
                                            {location.altitude ? `${location.altitude}m` : 'N/D'}
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                            <Bus size={12} className="text-slate-400" /> {t('services')}
                                        </div>
                                        <div className="text-lg font-black text-slate-900 leading-none">
                                            {location.servicesCount ?? location.services?.length ?? 0}
                                        </div>
                                    </div>
                                </div>



                                {/* Desktop Only Controls */}
                                <div className="hidden lg:block space-y-6">
                                    {/* Compare Action */}
                                    <div>
                                        {selectedLocations.find(l => l.id === location.id) ? (
                                            <button
                                                onClick={() => removeLocation(location.id)}
                                                className="w-full bg-green-50 hover:bg-red-50 text-green-700 hover:text-red-700 font-bold py-3 rounded-xl transition-all border border-green-200 hover:border-red-200 flex items-center justify-center gap-2 group shadow-sm active:scale-95"
                                            >
                                                <span className="group-hover:hidden flex items-center gap-2 animate-in zoom-in duration-300"><Check size={18} /> {t('added_to_compare')}</span>
                                                <span className="hidden group-hover:flex items-center gap-2"><X size={18} /> {t('remove_from_compare')}</span>
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    if (selectedLocations.length >= 3) {
                                                        setLimitModalOpen(true);
                                                        return;
                                                    }
                                                    addLocation(location);
                                                    setModalOpen(true);
                                                    // router.push('/compare'); // Removed redirect as per user request
                                                }}
                                                className={`w-full font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2  ${selectedLocations.length >= 3 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200 hover:shadow-lg hover:-translate-y-0.5'}`}
                                            >
                                                <Star size={18} className="group-hover:fill-current transition-colors" />
                                                {selectedLocations.length >= 3 ? t('max_compare_button') : t('add_to_compare')}
                                            </button>
                                        )}
                                    </div>

                                    {/* Share Action */}
                                    <button
                                        onClick={copyLink}
                                        className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-3 rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2 group shadow-sm active:scale-95"
                                    >
                                        <LinkIcon size={18} className={copied ? "text-green-500" : "text-slate-400 group-hover:text-primary transition-colors"} />
                                        {copied ? tCommon('link_copied') : tCommon('copy_link')}
                                    </button>

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
                                                        if (tab.id === 'all') {
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        } else {
                                                            setTimeout(() => {
                                                                document.getElementById(`section-${tab.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                            }, 10);
                                                        }
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
                                    <div className="pt-6 border-t border-slate-100 space-y-3">
                                        <button
                                            onClick={() => {
                                                const newShowOnlyHighlighted = !showOnlyHighlighted;
                                                setShowOnlyHighlighted(newShowOnlyHighlighted);
                                                if (newShowOnlyHighlighted) {
                                                    const mainContent = document.getElementById('main-content');
                                                    if (mainContent) {
                                                        mainContent.scrollIntoView({ behavior: 'smooth' });
                                                    }
                                                }
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${showOnlyHighlighted
                                                ? 'bg-rose-500 text-white border-rose-600 shadow-md ring-2 ring-rose-400/20'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400 hover:text-rose-600 shadow-sm'
                                                }`}
                                            title={t('highlight_element')}
                                        >
                                            <Heart size={14} className={showOnlyHighlighted ? "fill-current" : ""} />
                                            {showOnlyHighlighted ? t('tabs.all') : t('show_only_highlighted')}
                                            {highlightedSections.length > 0 && !showOnlyHighlighted && (
                                                <span className="ml-1 bg-rose-200 text-rose-900 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">
                                                    {highlightedSections.length}
                                                </span>
                                            )}
                                        </button>

                                        <Link
                                            href={`/directory?location=${locationNameToSlug(location.name)}`}
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
                    <div id="main-content" className="lg:col-span-2 space-y-8 scroll-mt-10">
                        {/* Sticky Search Bar - Desktop Only */}
                        <div className="hidden lg:block sticky top-20 z-30 bg-slate-50/80 backdrop-blur-md pb-4 pt-1 -mx-4 px-4 rounded-b-2xl">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder={t('search_local_placeholder')}
                                    className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium placeholder:text-slate-400"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>


                        {/* Tab Headers */}
                        {/* General Characteristics (Top of Page) */}
                        {location.tags && !showOnlyHighlighted && (
                            <div id="highlights-section" className="mb-2 scroll-mt-32 group/section">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative">
                                    {renderTagGroup('Highlights', location.tags.highlights, Heart, 'text-rose-500', 'bg-rose-50 border-rose-100')}
                                </div>
                            </div>
                        )}

                        {/* Tab Content */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">

                            {/* OVERVIEW TAB */}
                            {(activeTab === 'overview' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || location.description?.[currentSeason]?.toLowerCase().includes(searchTerm.toLowerCase())) && !showOnlyHighlighted && (
                                <div id="section-overview" className="mobile-fade-in space-y-8 mb-12 scroll-mt-24 lg:scroll-mt-32 relative group/section">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-slate-900">{t('seasonal_overview')}</h2>
                                        </div>
                                    </div>

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
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                                        <div className="flex justify-center order-2 md:order-1">
                                                            <RadarChart
                                                                data={TAG_CATEGORIES.vibe.map(config => {
                                                                    const weights = location.tagWeights?.vibe || {};
                                                                    const tagKey = Object.keys(weights).find(k => k.toLowerCase() === config.id.toLowerCase());
                                                                    const val = tagKey ? weights[tagKey] : 0;
                                                                    return { label: config.label, value: val };
                                                                }).filter(d => d.value > 0)}
                                                                color="#a855f7"
                                                                size={280}
                                                            />
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 order-1 md:order-2 content-start">
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
                                                </div>

                                                {/* Target */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                                        <div className="flex justify-center order-2 md:order-1">
                                                            <RadarChart
                                                                data={TAG_CATEGORIES.target.map(config => {
                                                                    const weights = location.tagWeights?.target || {};
                                                                    const tagKey = Object.keys(weights).find(k => k.toLowerCase() === config.id.toLowerCase());
                                                                    const val = tagKey ? weights[tagKey] : 0;
                                                                    return { label: config.label, value: val };
                                                                }).filter(d => d.value > 0)}
                                                                color="#3b82f6"
                                                                size={260}
                                                            />
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 order-1 md:order-2 content-start">
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
                                                </div>

                                                {/* Activity */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-3 bg-green-500 rounded-full"></div>
                                                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('tabs.sport')}</h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                                        <div className="flex justify-center order-2 md:order-1">
                                                            <RadarChart
                                                                data={TAG_CATEGORIES.activities.map(config => {
                                                                    const weights = location.tagWeights?.activities || {};
                                                                    const tagKey = Object.keys(weights).find(k => k.toLowerCase() === config.id.toLowerCase());
                                                                    const val = tagKey ? weights[tagKey] : 0;
                                                                    return { label: config.label, value: val };
                                                                }).filter(d => d.value > 0)}
                                                                color="#10b981"
                                                                size={280}
                                                            />
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 order-1 md:order-2 content-start">
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
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TOURISM TAB */}
                            {(activeTab === 'tourism' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('tourism').length > 0) && (!showOnlyHighlighted || getFilteredServices('tourism').some((s: any) => highlightedSections.includes(`${s.name}-tourism`))) && (
                                <div id="section-tourism" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32 group/section">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Mountain className="text-green-600" size={28} /> {t('sections.tourism')}
                                        </div>
                                    </h2>
                                    {location.tags?.tourism && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Caratteristiche Attività', location.tags.tourism, Mountain, 'text-green-600', 'bg-green-50 border-green-100')}
                                        </div>
                                    )}
                                    <div className="grid md:grid-cols-1 gap-4">
                                        {getFilteredServices('tourism')
                                            .filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-tourism`))
                                            .length > 0 ? (
                                            getFilteredServices('tourism')
                                                .filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-tourism`))
                                                .map((service: any, idx: number) => {
                                                    const isHighlighted = highlightedSections.includes(`${service.name}-tourism`);
                                                    return (
                                                        <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-green-200 transition-all relative group/item flex flex-col">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-bold text-slate-900 text-lg pr-8">{service.name}</h4>
                                                            </div>
                                                            <p className="text-slate-600 mb-4 leading-relaxed whitespace-pre-wrap">{service.description}</p>
                                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 mt-auto gap-4">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {service.seasonAvailability?.map((s: string) => (
                                                                        <span key={s} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-100 px-2 py-1 rounded-md flex items-center gap-1">
                                                                            {s === 'winter' ? <Snowflake size={10} /> : s === 'summer' ? <Sun size={10} /> : <Calendar size={10} />} {tSeasons(s)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleHighlight(`${service.name}-tourism`)}
                                                                    className={`p-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${isHighlighted
                                                                        ? 'bg-rose-500 text-white'
                                                                        : 'bg-white text-slate-300 hover:text-rose-500 border border-slate-100 shadow-sm'
                                                                        }`}
                                                                    title={t('highlight_element')}
                                                                >
                                                                    <Heart size={14} className={isHighlighted ? "fill-current" : ""} />
                                                                    <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider">{t('highlight_element')}</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 italic">{t('no_items')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* SPORT TAB */}
                            {(activeTab === 'sport' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('sport').length > 0) && (!showOnlyHighlighted || getFilteredServices('sport').some((s: any) => highlightedSections.includes(`${s.name}-sport`))) && (
                                <div id="section-sport" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32 group/section">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Accessibility className="text-red-500" size={28} /> {t('sections.sport')}
                                        </div>
                                    </h2>
                                    {location.tags?.sport && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Caratteristiche Sport', location.tags.sport, Accessibility, 'text-red-500', 'bg-red-50 border-red-100')}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getFilteredServices('sport')
                                            .filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-sport`))
                                            .map((service: any, idx: number) => {
                                                const isHighlighted = highlightedSections.includes(`${service.name}-sport`);
                                                return (
                                                    <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group relative flex flex-col">
                                                        <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors pr-8">{service.name}</h3>
                                                        {service.description && <p className="text-slate-600 text-sm leading-relaxed mb-4">{service.description}</p>}
                                                        <div className="flex items-center justify-between mt-auto gap-4 pt-3 border-t border-slate-50">
                                                            <div className="flex gap-2">
                                                                {service.seasonAvailability?.includes('winter') && <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-bold">{tSeasons('winter')}</span>}
                                                                {service.seasonAvailability?.includes('summer') && <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-bold">{tSeasons('summer')}</span>}
                                                            </div>
                                                            <button
                                                                onClick={() => toggleHighlight(`${service.name}-sport`)}
                                                                className={`p-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${isHighlighted
                                                                    ? 'bg-rose-500 text-white'
                                                                    : 'bg-slate-50 text-slate-300 hover:text-rose-500 border border-slate-100 shadow-sm'
                                                                    }`}
                                                                title={t('highlight_element')}
                                                            >
                                                                <Heart size={14} className={isHighlighted ? "fill-current" : ""} />
                                                                <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider">{t('highlight_element')}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    {(getFilteredServices('sport').filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-sport`)).length === 0) && <p className="text-slate-500 italic">{t('no_items')}</p>}
                                </div>
                            )}


                            {/* INFRASTRUCTURE TAB */}
                            {(activeTab === 'infrastructure' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('infrastructure').length > 0) && (!showOnlyHighlighted || getFilteredServices('infrastructure').some((s: any) => highlightedSections.includes(`${s.name}-infrastructure`))) && (
                                <div id="section-infrastructure" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32 group/section">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Bus className="text-slate-600" size={28} /> {t('sections.infrastructure')}
                                        </div>
                                    </h2>
                                    {location.tags?.infrastructure && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Caratteristiche Impianti', location.tags.infrastructure, Bus, 'text-slate-600', 'bg-slate-50 border-slate-100')}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getFilteredServices('infrastructure')
                                            .filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-infrastructure`))
                                            .map((service: any, idx: number) => {
                                                const isHighlighted = highlightedSections.includes(`${service.name}-infrastructure`);
                                                return (
                                                    <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group relative flex flex-col">
                                                        <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors pr-8">{service.name}</h3>
                                                        {service.description && (
                                                            <p className="text-slate-600 text-sm leading-relaxed mb-4">{service.description}</p>
                                                        )}
                                                        <div className="flex items-center justify-between mt-auto gap-4 pt-3 border-t border-slate-50">
                                                            <div className="flex gap-2">
                                                                {service.seasonAvailability?.includes('winter') && <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-bold">{tSeasons('winter')}</span>}
                                                                {service.seasonAvailability?.includes('summer') && <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-bold">{tSeasons('summer')}</span>}
                                                            </div>
                                                            <button
                                                                onClick={() => toggleHighlight(`${service.name}-infrastructure`)}
                                                                className={`p-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${isHighlighted
                                                                    ? 'bg-rose-500 text-white'
                                                                    : 'bg-slate-50 text-slate-300 hover:text-rose-500 border border-slate-100 shadow-sm'
                                                                    }`}
                                                                title={t('highlight_element')}
                                                            >
                                                                <Heart size={14} className={isHighlighted ? "fill-current" : ""} />
                                                                <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider">{t('highlight_element')}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    {(getFilteredServices('infrastructure').filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-infrastructure`)).length === 0) &&
                                        <p className="text-slate-500 italic">{t('no_items')}</p>
                                    }
                                </div>
                            )}


                            {/* INFO TAB */}
                            {(activeTab === 'info' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('info').length > 0) && (!showOnlyHighlighted || getFilteredServices('info').some((s: any) => highlightedSections.includes(`${s.name}-info`))) && (
                                <div id="section-info" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32 group/section">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <HelpCircle className="text-indigo-500" size={28} /> {t('sections.info')}
                                        </div>
                                    </h2>
                                    {location.tags?.info && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Tag Info', location.tags.info, HelpCircle, 'text-indigo-500', 'bg-indigo-50 border-indigo-100')}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getFilteredServices('info')
                                            .filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-info`))
                                            .map((service: any, idx: number) => {
                                                const isHighlighted = highlightedSections.includes(`${service.name}-info`);
                                                return (
                                                    <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group relative flex flex-col">
                                                        <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors pr-8">{service.name}</h3>
                                                        {service.description && <p className="text-slate-600 text-sm leading-relaxed mb-4">{service.description}</p>}
                                                        <div className="flex items-center justify-end mt-auto gap-4 pt-3 border-t border-slate-50">
                                                            <button
                                                                onClick={() => toggleHighlight(`${service.name}-info`)}
                                                                className={`p-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${isHighlighted
                                                                    ? 'bg-rose-500 text-white'
                                                                    : 'bg-slate-50 text-slate-300 hover:text-rose-500 border border-slate-100 shadow-sm'
                                                                    }`}
                                                                title={t('highlight_element')}
                                                            >
                                                                <Heart size={14} className={isHighlighted ? "fill-current" : ""} />
                                                                <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider">{t('highlight_element')}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    {(getFilteredServices('info').filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-info`)).length === 0) && <p className="text-slate-500 italic">{t('no_items')}</p>}
                                </div>
                            )}

                            {/* GENERAL TAB */}
                            {/* GENERAL TAB */}
                            {(activeTab === 'general' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('general').length > 0) && (!showOnlyHighlighted || getFilteredServices('general').some((s: any) => highlightedSections.includes(`${s.name}-general`))) && (
                                <div id="section-general" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32 group/section">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Layers className="text-slate-500" size={28} /> {t('sections.general')}
                                        </div>
                                    </h2>
                                    {location.tags?.general && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Caratteristiche Generali', location.tags.general, Layers, 'text-slate-500', 'bg-slate-50 border-slate-100')}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getFilteredServices('general')
                                            .filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-general`))
                                            .map((service: any, idx: number) => {
                                                const isHighlighted = highlightedSections.includes(`${service.name}-general`);
                                                return (
                                                    <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-100 hover:border-slate-300 transition-all shadow-sm hover:shadow-md group relative flex flex-col">
                                                        <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors pr-8">{service.name}</h3>
                                                        {service.description && <p className="text-slate-600 text-sm leading-relaxed mb-4">{service.description}</p>}
                                                        <div className="flex items-center justify-end mt-auto gap-4 pt-3 border-t border-slate-50">
                                                            <button
                                                                onClick={() => toggleHighlight(`${service.name}-general`)}
                                                                className={`p-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${isHighlighted
                                                                    ? 'bg-rose-500 text-white'
                                                                    : 'bg-slate-50 text-slate-300 hover:text-rose-500 border border-slate-100 shadow-sm'
                                                                    }`}
                                                                title={t('highlight_element')}
                                                            >
                                                                <Heart size={14} className={isHighlighted ? "fill-current" : ""} />
                                                                <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider">{t('highlight_element')}</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                    {(getFilteredServices('general').filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-general`)).length === 0) && <p className="text-slate-500 italic">{t('no_items')}</p>}
                                </div>
                            )}

                            {/* ACCOMMODATION TAB */}
                            {/* ACCOMMODATION TAB */}
                            {(activeTab === 'accommodation' || activeTab === 'all' || isSinglePageMode) && (searchTerm === '' || getFilteredServices('accommodation').length > 0) && (!showOnlyHighlighted || getFilteredServices('accommodation').some((s: any) => highlightedSections.includes(`${s.name}-accommodation`))) && (
                                <div id="section-accommodation" className="mobile-fade-in space-y-6 mb-12 scroll-mt-24 lg:scroll-mt-32 group/section">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Home className="text-orange-500" size={28} /> {t('sections.accommodation')}
                                        </div>
                                    </h2>
                                    {location.tags?.accommodation && (
                                        <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                            {renderTagGroup('Caratteristiche Ospitalità', location.tags.accommodation, Home, 'text-orange-500', 'bg-orange-50 border-orange-100')}
                                        </div>
                                    )}
                                    <div className="grid md:grid-cols-1 gap-4">
                                        {getFilteredServices('accommodation')
                                            .filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-accommodation`))
                                            .length > 0 ? (
                                            getFilteredServices('accommodation')
                                                .filter((service: any) => !showOnlyHighlighted || highlightedSections.includes(`${service.name}-accommodation`))
                                                .map((service: any, idx: number) => {
                                                    const isHighlighted = highlightedSections.includes(`${service.name}-accommodation`);
                                                    return (
                                                        <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-rose-200 transition-all relative group/item shadow-sm flex flex-col">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h4 className="font-bold text-lg text-slate-900 pr-8">{service.name}</h4>
                                                            </div>
                                                            <p className="text-slate-600 mb-4 leading-relaxed whitespace-pre-wrap">{service.description}</p>
                                                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 mt-auto gap-4">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {service.seasonAvailability?.map((s: string) => (
                                                                        <span key={s} className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-100 px-2 py-1 rounded-md flex items-center gap-1">
                                                                            {s === 'winter' ? <Snowflake size={10} /> : s === 'summer' ? <Sun size={10} /> : <Calendar size={10} />} {tSeasons(s)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                                <button
                                                                    onClick={() => toggleHighlight(`${service.name}-accommodation`)}
                                                                    className={`p-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${isHighlighted
                                                                        ? 'bg-rose-500 text-white'
                                                                        : 'bg-white text-slate-300 hover:text-rose-500 border border-slate-100 shadow-sm'
                                                                        }`}
                                                                    title={t('highlight_element')}
                                                                >
                                                                    <Heart size={14} className={isHighlighted ? "fill-current" : ""} />
                                                                    <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider">{t('highlight_element')}</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 italic">{t('no_items')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Empty State for Highlights */}
                            {showOnlyHighlighted && highlightedSections.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                                        <Heart size={40} className="text-rose-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">No highlighted sections</h3>
                                    <p className="text-slate-500 max-w-xs mx-auto">
                                        Click the heart of the sections you want to add to your location favorites.
                                    </p>
                                    <button
                                        onClick={() => setShowOnlyHighlighted(false)}
                                        className="mt-8 text-sm font-bold text-slate-900 hover:underline"
                                    >
                                        Show all sections
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Sticky Footer */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-y-[3px] border-slate-200 pb-4">
                <div className="flex flex-col">
                    {/* Expandable Tags Area (Expanding Upwards) */}
                    {isMobileTagsOpen && (
                        <div className="px-4 py-6 border-b border-slate-100 animate-in slide-in-from-bottom-4 duration-300 max-h-[60vh] overflow-y-auto">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">{t('tabs.all')}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {tabs.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setIsSinglePageMode(false);
                                                setIsMobileTagsOpen(false);
                                                setIsMobileSearchOpen(false);
                                                if (tab.id === 'all') {
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                } else {
                                                    setTimeout(() => {
                                                        document.getElementById(`section-${tab.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                    }, 10);
                                                }
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
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchTerm(val);
                                        if (val.length > 0) {
                                            document.getElementById('highlights-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }}
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
                        {/* Highlight Toggle */}
                        <button
                            onClick={() => {
                                const newShowOnlyHighlighted = !showOnlyHighlighted;
                                setShowOnlyHighlighted(newShowOnlyHighlighted);
                                setIsMobileTagsOpen(false);
                                setIsMobileSearchOpen(false);

                                // Scroll to main content if enabling highlights mode
                                if (newShowOnlyHighlighted) {
                                    const mainContent = document.getElementById('main-content');
                                    if (mainContent) {
                                        mainContent.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }
                            }}
                            className={`p-3 rounded-2xl transition-all ${showOnlyHighlighted ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 bg-slate-100'}`}
                            title={t('highlight_element')}
                        >
                            <Heart size={22} className={showOnlyHighlighted ? "fill-current" : ""} />
                        </button>

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
                                    className="p-3 bg-green-50 text-green-700 rounded-2xl border border-green-200 shadow-sm animate-in zoom-in duration-300"
                                >
                                    <Check size={22} />
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (selectedLocations.length >= 3) {
                                            setLimitModalOpen(true);
                                            return;
                                        }
                                        addLocation(location);
                                        setModalOpen(true);
                                        // router.push('/compare'); // Removed redirect as per user request
                                    }}
                                    className={`p-3 rounded-2xl transition-all shadow-sm active:scale-95 ${selectedLocations.length >= 3 ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white shadow-slate-200'}`}
                                >
                                    <Star size={22} />
                                </button>
                            )}
                        </div>

                        {/* Share Trigger */}
                        <button
                            onClick={copyLink}
                            className={`p-3 rounded-2xl transition-all ${copied ? 'bg-green-50 text-green-700' : 'text-slate-500 bg-slate-50 border border-slate-100'}`}
                        >
                            <LinkIcon size={22} />
                        </button>
                    </div>
                </div>
            </div>

            <CompareAddedModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                locationName={location?.name || ''}
            />

            <CompareLimitModal
                isOpen={limitModalOpen}
                onClose={() => setLimitModalOpen(false)}
                selectedLocations={selectedLocations}
                onRemove={removeLocation}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Place",
                        "name": location.name,
                        "description": location.description?.[currentSeason] || location.description?.winter || "",
                        "url": `https://www.alpematch.com/locations/${location.slug || params.id}`,
                        "hasMap": location.coordinates ? `https://www.google.com/maps?api=1&query=${location.coordinates.lat},${location.coordinates.lng}` : undefined,
                        "geo": location.coordinates ? {
                            "@type": "GeoCoordinates",
                            "latitude": location.coordinates.lat.toString(),
                            "longitude": location.coordinates.lng.toString()
                        } : undefined,
                        "address": {
                            "@type": "PostalAddress",
                            "addressRegion": location.region,
                            "addressCountry": location.country
                        },
                        "elevation": location.altitude ? `${location.altitude}m` : undefined,
                        "image": [
                            location.coverImage,
                            location.seasonalImages?.winter,
                            location.seasonalImages?.summer
                        ].filter(Boolean),
                        "mainEntityOfPage": {
                            "@type": "WebPage",
                            "@id": `https://www.alpematch.com/locations/${location.slug || params.id}`
                        },
                        "amenityFeature": [
                            ...normalizeTags(location.tags?.highlights || []).map((tag: string) => ({
                                "@type": "LocationFeatureSpecification",
                                "name": tag,
                                "value": true
                            })),
                            ...normalizeTags(location.tags?.tourism || []).map((tag: string) => ({
                                "@type": "LocationFeatureSpecification",
                                "name": tag,
                                "value": true
                            })),
                            ...normalizeTags(location.tags?.sport || []).map((tag: string) => ({
                                "@type": "LocationFeatureSpecification",
                                "name": tag,
                                "value": true
                            })),
                            ...normalizeTags(location.tags?.infrastructure || []).map((tag: string) => ({
                                "@type": "LocationFeatureSpecification",
                                "name": tag,
                                "value": true
                            }))
                        ]
                    })
                }}
            />
        </div>
    );
}
