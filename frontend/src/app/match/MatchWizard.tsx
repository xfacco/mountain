'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { useSeasonStore } from '@/store/season-store';
import Link from 'next/link';
import { locationNameToSlug } from '@/lib/url-utils';
import { TAG_CATEGORIES } from '@/lib/tags-config';
import { MatchScoreBreakdown } from '@/components/match/MatchScoreBreakdown';
import { useCompareStore } from '@/store/compare-store';
import { SlidersHorizontal, ChevronRight, ChevronLeft, Check, Sparkles, MapPin, User, Users, Heart, PartyPopper, Coffee, Activity, Music, Gem, Trees, Snowflake, Mountain, Droplets, Utensils, Landmark, Flag, Globe, Sun, Leaf, History, Laptop, Moon, Zap, ShoppingBag, Camera, Search, CheckCircle, Star, Link2 as LinkIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CompareAddedModal } from '@/components/ui/CompareAddedModal';
import { CompareLimitModal } from '@/components/ui/CompareLimitModal';
import { MatchHistoryList } from '@/components/match/MatchHistoryList';


// Helper for classes 
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

// Types for the wizard
type Step = 'intro' | 'season' | 'target' | 'vibe' | 'activities' | 'nation' | 'location' | 'results';

interface Preferences {
    season: string[];
    target: string[];
    vibe: string[];
    activities: string[];
    nation: string[];
    location: {
        lat: number;
        lng: number;
        name: string;
        mode: 'current' | 'custom' | 'none';
        maxDistance: number; // in km, 0 for unlimited
    };
}

function MatchWizardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const t = useTranslations('Match');
    const tLoc = useTranslations('Locations');
    const tLocDetail = useTranslations('LocationDetail');
    const { currentSeason, setSeason } = useSeasonStore();
    const { selectedLocations, addLocation, removeLocation } = useCompareStore();
    const tCommon = useTranslations('Common');

    const [currentStep, setCurrentStep] = useState<Step>('intro');
    const [searching, setSearching] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [limitModalOpen, setLimitModalOpen] = useState(false);
    const [lastAddedLocation, setLastAddedLocation] = useState('');
    const [copied, setCopied] = useState(false);

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);



    // Calculate progress width
    const getProgress = () => {
        const stepOrder = ['season', 'target', 'vibe', 'activities', 'nation', 'location'];
        const index = stepOrder.indexOf(currentStep);
        if (index === -1) return 0;
        return ((index + 1) / stepOrder.length) * 100 + '%';
    };
    const [preferences, setPreferences] = useState<Preferences>({
        season: [],
        target: [],
        vibe: [],
        activities: [],
        nation: [],
        location: {
            lat: 45.4642, // Default Milano
            lng: 9.1899,
            name: '',
            mode: 'none',
            maxDistance: 0
        }
    });
    const [userIp, setUserIp] = useState<string>('');
    const [logId, setLogId] = useState<string | null>(null);

    // Fetch IP on mount
    useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setUserIp(data.ip))
            .catch(err => console.error("Error fetching IP", err));
    }, []);

    // Results
    const [locations, setLocations] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load locations
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                // Ensure firebase is initialized client-side
                const { collection, getDocs, query, where } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                // For a real app, we might want to filter server side or use a designated endpoint
                // Here we fetch all published locations and filter in memory for the match algorithm
                const q = query(collection(db, 'locations'), where('status', '==', 'published'));
                const querySnapshot = await getDocs(q);

                const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
                setLocations(docs);
            } catch (e) {
                console.error("Error fetching locations for matching", e);
            }
        };
        fetchLocations();
    }, []);

    // Load local history on mount
    useEffect(() => {
        const saved = localStorage.getItem('match_history');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setHistory(parsed);
                    // Only show history if we are at 'intro' step and not sharing a specific ID
                    const shareId = searchParams.get('id');
                    if (!shareId) {
                        setShowHistory(true);
                    }
                }
            } catch (e) {
                console.error("Failed to parse match history", e);
            }
        }
    }, [searchParams]);

    // Load shared match if ID present
    useEffect(() => {
        const shareId = searchParams.get('id');
        if (shareId && locations.length > 0) {
            const loadSharedMatch = async () => {
                try {
                    const { doc, getDoc } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');
                    const docSnap = await getDoc(doc(db, 'match_logs', shareId));
                    if (docSnap.exists()) {
                        const data = docSnap.data();

                        // Log the view action
                        try {
                            const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
                            // We fetch IP again if userIp is not yet set
                            let currentIp = userIp;
                            if (!currentIp) {
                                const res = await fetch('https://api.ipify.org?format=json');
                                const ipData = await res.json();
                                currentIp = ipData.ip;
                            }
                            await addDoc(collection(db, 'share_logs'), {
                                ip: currentIp,
                                page: 'match',
                                action: 'view',
                                logId: shareId,
                                timestamp: serverTimestamp()
                            });
                        } catch (logErr) {
                            console.error("Error logging share view:", logErr);
                        }

                        if (data.preferences) {
                            setPreferences(data.preferences);
                            setLogId(shareId);
                            setCurrentStep('results');
                        }
                    }
                } catch (err) {
                    console.error("Error loading shared match", err);
                }
            };
            loadSharedMatch();
        }
    }, [searchParams, locations]);

    // Calculate matches when entering results step
    useEffect(() => {
        if (currentStep === 'results' && locations.length > 0) {
            calculateMatches();
        }
    }, [currentStep, locations]);

    // Scroll to top on step change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    // Initialize season preference based on current store if empty
    useEffect(() => {
        if (preferences.season.length === 0) {
            setPreferences(prev => ({ ...prev, season: [currentSeason] }));
        }
    }, []);

    const copyLink = async () => {
        if (!logId) return;
        try {
            const url = `${window.location.origin}/match?id=${logId}`;
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);

            // Log the share action
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await addDoc(collection(db, 'share_logs'), {
                ip: userIp,
                page: 'match',
                action: 'copy',
                url: url,
                logId: logId,
                timestamp: serverTimestamp()
            });
        } catch (err) {
            console.error("Failed to copy/log share link", err);
        }
    };

    const calculateMatches = () => {
        setLoading(true);

        // Update global season store
        if (preferences.season.length > 0) {
            setSeason(preferences.season[0] as any);
        }

        const validLocations = locations.filter((loc: any) => {
            // 0. Hard Filter: Nation (if selected and not 'any')
            if (preferences.nation.length > 0 && !preferences.nation.includes('any')) {
                const nationMappings: Record<string, string[]> = {
                    'italy': ['italy', 'italia'],
                    'austria': ['austria', 'österreich', 'osterreich'],
                    'switzerland': ['switzerland', 'svizzera', 'suisse', 'schweiz'],
                    'france': ['france', 'francia']
                };
                const requiredNations = preferences.nation.map(n => n.toLowerCase());
                const locCountry = (loc.country || '').toLowerCase();

                const matchesNation = requiredNations.some(req => {
                    const terms = nationMappings[req] || [req];
                    return terms.some(term => locCountry.includes(term));
                });

                if (!matchesNation) return false;
            }
            return true;
        });

        // DEBUG: Log the first location's structure to see where weights are
        if (validLocations.length > 0) {
            console.log("DEBUG: Checking structure of first location:", validLocations[0].name);
            console.log("DEBUG: tagWeights:", validLocations[0].tagWeights);
            console.log("DEBUG: Full Object keys:", Object.keys(validLocations[0]));
        }

        // Helper to get weight (0-100) for a specific tag
        const getTagWeight = (loc: any, category: string, tag: string): number => {
            // Helper for fallback
            const fallback = () => {
                let locTags: string[] = [];
                if (category === 'activities') {
                    locTags = [...(loc.tags?.activities || []), ...(loc.tags?.tourism || []), ...(loc.tags?.sport || [])];
                } else {
                    locTags = loc.tags?.[category] || [];
                }
                return locTags.some(t => t.toLowerCase().includes(tag.toLowerCase())) ? 100 : 0;
            };

            if (!loc.tagWeights) return fallback();

            // 1. Find Category Key (Case Insensitive)
            const catKey = Object.keys(loc.tagWeights).find(k => k.toLowerCase() === category.toLowerCase());
            if (!catKey) return fallback();

            const weights = loc.tagWeights[catKey];

            // 2. Find Tag Key (Case Insensitive)
            const foundKey = Object.keys(weights).find(k => k.toLowerCase() === tag.toLowerCase());

            if (foundKey && weights[foundKey] !== undefined) {
                let val = weights[foundKey];
                if (typeof val === 'string') val = parseFloat(val.replace('%', ''));
                return isNaN(val) ? 0 : val;
            }

            return fallback();
        };

        const scoredLocations = validLocations.map((loc: any) => {
            // 1. Calculate Content Affinity (The "Average")
            // specific elements chosen by visitor: Vibe, Target, Activities
            const selectedItems: { category: string, tag: string }[] = [];

            preferences.vibe.forEach(t => selectedItems.push({ category: 'vibe', tag: t }));
            preferences.target.forEach(t => selectedItems.push({ category: 'target', tag: t }));
            preferences.activities.forEach(t => selectedItems.push({ category: 'activities', tag: t }));

            // If no tags selected, default to neutral score or handled elsewhere (though wizard forces selection)
            let totalWeight = 0;
            let matchCount = 0;

            if (selectedItems.length > 0) {
                selectedItems.forEach(item => {
                    const w = getTagWeight(loc, item.category, item.tag);
                    totalWeight += w;
                });
                matchCount = selectedItems.length;
            }

            // Calculate Base Affinity Score (0-100)
            // This represents strictly "how much this place is what you asked for"
            let affinityScore = matchCount > 0 ? (totalWeight / matchCount) : 0; // Baseline 50 if nothing selected? rare.

            // 2. Calculate Distance Score (Proximity)
            let distanceInKm: number | null = null;
            let proximityScore = 0;

            if (preferences.location.mode !== 'none' && loc.coordinates) {
                distanceInKm = getDistance(
                    preferences.location.lat,
                    preferences.location.lng,
                    loc.coordinates.lat,
                    loc.coordinates.lng
                );

                // Filter by max distance if set
                if (preferences.location.maxDistance > 0 && distanceInKm > preferences.location.maxDistance) {
                    return { ...loc, matchScore: -1, distance: distanceInKm }; // Exclude
                }

                // Score: 100 at 0km, fading to 0 at MaxDistance (or 600km default)
                const range = preferences.location.maxDistance > 0 ? preferences.location.maxDistance : 600;
                proximityScore = Math.max(0, 100 * (1 - (distanceInKm / range)));
            }

            // 3. Final Combined Score
            // User request: "Algoritmo basato su pesi... POI variabile vicino"
            // We use a weighted average: 80% Content Match, 20% Proximity Match (if distance provided)

            // 3. Final Combined Score
            // User request (Step 51): "Togli il 3 punto dall'algoritmo" -> Remove distance weighting.
            // Match Score is strictly the Average Content Affinity.

            const finalScore = affinityScore;
            // Removed distance weighting block

            // Rounding
            return {
                ...loc,
                matchScore: Math.round(finalScore),
                distance: distanceInKm,
                // Debug values to verify if needed
                _debug: { affinity: Math.round(affinityScore), proximity: Math.round(proximityScore) }
            };
        });

        // Utility: Distance Calculation
        function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        // Sort and Filter
        const topMatches = scoredLocations
            .filter((l: any) => l.matchScore >= 0) // Filter out hard exclusions
            .sort((a: any, b: any) => b.matchScore - a.matchScore)
            .slice(0, 6);

        // Logging
        const logMatch = async (results: any[]) => {
            try {
                const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');
                const docRef = await addDoc(collection(db, 'match_logs'), {
                    preferences,
                    results: results.map(m => ({ id: m.id, name: m.name, score: m.matchScore, distance: m.distance })),
                    timestamp: serverTimestamp(),
                    algo: "avg_affinity_v2",
                    ip: userIp,
                    choices: [] // Initialize empty choices
                });
                setLogId(docRef.id);

                // Save to local history ONLY if we're not loading an existing result from URL
                if (!searchParams.get('id')) {
                    const historyItem = {
                        timestamp: Date.now(),
                        date: new Date().toISOString(),
                        logId: docRef.id,
                        results: results.map(m => ({ name: m.name, score: m.matchScore })),
                        preferences
                    };
                    const newHistory = [historyItem, ...history].slice(0, 10);
                    setHistory(newHistory);
                    localStorage.setItem('match_history', JSON.stringify(newHistory));
                    // Notify Navbar
                    window.dispatchEvent(new Event('matchesUpdated'));
                }
            } catch (err) {
                console.error("Error logging", err);
            }
        };

        setMatches(topMatches);
        logMatch(topMatches);
        setTimeout(() => setLoading(false), 800);
    };


    const handleOptionToggle = (category: keyof Omit<Preferences, 'location'>, value: string, singleSelect: boolean = false) => {
        setPreferences(prev => {
            const current = prev[category] as string[];
            if (singleSelect) {
                return { ...prev, [category]: current.includes(value) ? [] : [value] };
            }
            if (current.includes(value)) {
                return { ...prev, [category]: current.filter(item => item !== value) };
            }
            return { ...prev, [category]: [...current, value] };
        });
    };

    const handleChoice = async (locationName: string) => {
        if (!logId) return;
        try {
            const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await updateDoc(doc(db, 'match_logs', logId), {
                choices: arrayUnion(locationName)
            });
        } catch (err) {
            console.error("Error updating choice", err);
        }
    };

    const handleDeleteHistory = (timestamp: number) => {
        const newHistory = history.filter(item => item.timestamp !== timestamp);
        setHistory(newHistory);
        localStorage.setItem('match_history', JSON.stringify(newHistory));
        // Notify Navbar
        window.dispatchEvent(new Event('matchesUpdated'));
        if (newHistory.length === 0) {
            setShowHistory(false);
        }
    };

    const nextStep = () => {
        if (currentStep === 'intro') setCurrentStep('season');
        else if (currentStep === 'season') setCurrentStep('target');
        else if (currentStep === 'target') setCurrentStep('vibe');
        else if (currentStep === 'vibe') setCurrentStep('activities');
        else if (currentStep === 'activities') setCurrentStep('nation');
        else if (currentStep === 'nation') setCurrentStep('location');
        else if (currentStep === 'location') setCurrentStep('results');
    };

    const prevStep = () => {
        if (currentStep === 'season') setCurrentStep('intro');
        else if (currentStep === 'target') setCurrentStep('season');
        else if (currentStep === 'vibe') setCurrentStep('target');
        else if (currentStep === 'activities') setCurrentStep('vibe');
        else if (currentStep === 'nation') setCurrentStep('activities');
        else if (currentStep === 'location') setCurrentStep('nation');
        else if (currentStep === 'results') setCurrentStep('location');
    };

    const restart = () => {
        setPreferences({
            season: [],
            target: [],
            vibe: [],
            activities: [],
            nation: [],
            location: { lat: 45.4642, lng: 9.1899, name: '', mode: 'none', maxDistance: 0 }
        });
        setCurrentStep('intro');
        setMatches([]);
        setLogId(null);
        // Show history list again if it has items
        if (history.length > 0) {
            setShowHistory(true);
        }
        // Clear shared ID from URL if present
        if (searchParams.get('id')) {
            router.replace('/match', { scroll: false });
        }
    };

    // Render Steps

    // History Step
    if (showHistory && currentStep === 'intro') {
        return (
            <>
                <Navbar />
                <MatchHistoryList
                    history={history}
                    onStartNew={() => setShowHistory(false)}
                    onDeleteHistory={handleDeleteHistory}
                />
            </>
        );
    }

    // Intro
    if (currentStep === 'intro') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col relative overflow-hidden">
                <Navbar />



                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 pt-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="max-w-2xl"
                    >
                        <div className="mx-auto w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl">
                            <Sparkles className="w-10 h-10 text-primary" />
                        </div>

                        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                            {t('title')}
                        </h1>
                        <p className="text-xl text-slate-300 mb-12 leading-relaxed">
                            {t('subtitle')}
                        </p>

                        <button
                            onClick={nextStep}
                            className="bg-primary hover:bg-primary-dark text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                            {t('start_button')} <ChevronRight className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Results Step
    if (currentStep === 'results') {
        return (
            <>
                <div className="min-h-screen bg-slate-50 flex flex-col">
                    <Navbar />
                    <div className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

                        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                            <div>
                                <span className="text-primary font-bold uppercase tracking-wider text-sm mb-2 block">AI Recommender</span>
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900">{t('steps.results')}</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                {logId && (
                                    <button
                                        onClick={copyLink}
                                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                    >
                                        <LinkIcon size={16} className={copied ? "text-green-500" : "text-slate-400"} />
                                        {copied ? tCommon('link_copied') : tCommon('copy_link')}
                                    </button>
                                )}
                                <button
                                    onClick={restart}
                                    className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                >
                                    <Sparkles size={16} className="text-primary" />
                                    {t('restart')}
                                </button>
                                {history.length > 0 && (
                                    <button
                                        onClick={() => { restart(); setShowHistory(true); }}
                                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary transition-all shadow-md active:scale-95"
                                    >
                                        <History size={16} />
                                        {t('history.my_matches')}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Preferences Summary Recap */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-10"
                        >
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                                <SlidersHorizontal size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{t('your_preferences') || 'Riepilogo Selezione'}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-4">
                                {/* Season */}
                                {preferences.season.length > 0 && (
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('steps.season')}</span>
                                        <div className="flex gap-2">
                                            {preferences.season.map(s => (
                                                <span key={s} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold capitalize">
                                                    {t(`options.${s}`)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Target */}
                                {preferences.target.length > 0 && (
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('steps.target')}</span>
                                        <div className="flex gap-2">
                                            {preferences.target.map(s => (
                                                <span key={s} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold capitalize">
                                                    {t(`options.${s}`)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Vibe */}
                                {preferences.vibe.length > 0 && (
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('steps.vibe')}</span>
                                        <div className="flex gap-2 flex-wrap">
                                            {preferences.vibe.map(s => (
                                                <span key={s} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold capitalize">
                                                    {t(`options.${s}`)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Activities */}
                                {preferences.activities.length > 0 && (
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('steps.activities')}</span>
                                        <div className="flex gap-2 flex-wrap">
                                            {preferences.activities.map(s => (
                                                <span key={s} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold capitalize">
                                                    {t(`options.${s}`)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Location */}
                                {preferences.location.mode !== 'none' && (
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t('steps.location')}</span>
                                        <div className="flex gap-2">
                                            <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-xs font-bold">
                                                {preferences.location.name}
                                                {preferences.location.maxDistance > 0 ? ` (${preferences.location.maxDistance}km)` : ' (∞)'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-96 rounded-3xl bg-white shadow-sm border border-slate-100 p-4 animate-pulse">
                                        <div className="w-full h-2/3 bg-slate-200 rounded-2xl mb-4"></div>
                                        <div className="h-8 w-2/3 bg-slate-200 rounded mb-2"></div>
                                        <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : matches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start mt-8">
                                {matches.map((location, index) => {
                                    const isSelected = selectedLocations.some(l => l.id === location.id);
                                    return (
                                        <motion.div
                                            key={location.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-slate-100 flex flex-col group relative"
                                        >
                                            <div className="relative aspect-[16/10] overflow-hidden">
                                                <img
                                                    src={location.seasonalImages?.[preferences.season[0] || currentSeason] || location.coverImage || location.seasonalImages?.winter}
                                                    alt={location.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                                                {/* Score Badge */}
                                                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur shadow-lg rounded-2xl p-3 flex flex-col items-center min-w-[60px] border border-white/20">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Match</span>
                                                    <span className="text-2xl font-black text-slate-900 leading-none">
                                                        {Math.round(location.matchScore || 0)}%
                                                    </span>
                                                </div>

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
                                                    className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all z-20 shadow-lg backdrop-blur-md ${isSelected
                                                        ? 'bg-primary text-white scale-110'
                                                        : 'bg-white/80 text-slate-600 hover:bg-white hover:text-primary'
                                                        }`}
                                                    title={isSelected ? tLocDetail('remove_from_compare') : tLocDetail('add_to_compare')}
                                                >
                                                    {isSelected ? <Check size={20} className="stroke-[3]" /> : <Star size={20} />}
                                                </button>

                                                <div className="absolute bottom-6 left-6 right-6">
                                                    <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-[0.2em] mb-2">
                                                        <MapPin size={12} className="text-primary" /> {location.country}
                                                    </div>
                                                    <h3 className="text-3xl font-black text-white">{location.name}</h3>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-8">
                                                <div className="flex flex-wrap gap-2 mb-6">
                                                    {(() => {
                                                        interface TagDisplayItem { tag: string; type: 'match' | 'generic'; score?: number; }
                                                        const mItems: TagDisplayItem[] = [];
                                                        const getTagWeightLocal = (category: string, tag: string): number => {
                                                            if (!location.tagWeights) return fallback();
                                                            const catKey = Object.keys(location.tagWeights).find(k => k.toLowerCase() === category.toLowerCase());
                                                            if (!catKey) return fallback();
                                                            const weightObj = location.tagWeights[catKey];
                                                            const foundKey = Object.keys(weightObj).find(k => k.toLowerCase() === tag.toLowerCase());
                                                            if (foundKey && weightObj[foundKey] !== undefined) {
                                                                let val = weightObj[foundKey];
                                                                if (typeof val === 'string') val = parseFloat(val.replace('%', ''));
                                                                return isNaN(val) ? 0 : val;
                                                            }
                                                            return fallback();
                                                            function fallback() {
                                                                let locTags: string[] = [];
                                                                if (category === 'activities') {
                                                                    locTags = [...(location.tags?.activities || []), ...(location.tags?.tourism || []), ...(location.tags?.sport || [])];
                                                                } else {
                                                                    locTags = location.tags?.[category] || [];
                                                                }
                                                                return locTags.some(t => t.toLowerCase().includes(tag.toLowerCase())) ? 100 : 0;
                                                            }
                                                        };
                                                        preferences.vibe.forEach(p => {
                                                            const w = getTagWeightLocal('vibe', p);
                                                            if (w > 0) mItems.push({ tag: p, type: 'match', score: w });
                                                        });
                                                        preferences.target.forEach(p => {
                                                            const w = getTagWeightLocal('target', p);
                                                            if (w > 0) mItems.push({ tag: p, type: 'match', score: w });
                                                        });
                                                        preferences.activities.forEach(p => {
                                                            const w = getTagWeightLocal('activities', p);
                                                            if (w > 0) mItems.push({ tag: p, type: 'match', score: w });
                                                        });
                                                        const uniqueMatches = Array.from(new Set(mItems.map(m => m.tag)))
                                                            .map(tag => mItems.find(m => m.tag === tag)!);
                                                        const allTags: TagDisplayItem[] = [...uniqueMatches];
                                                        if (allTags.length < 3) {
                                                            location.tags?.vibe?.slice(0, 5).forEach((t: string) => {
                                                                if (!allTags.some(m => m.tag.toLowerCase() === t.toLowerCase())) {
                                                                    allTags.push({ tag: t, type: 'generic' });
                                                                }
                                                            });
                                                        }
                                                        return allTags.slice(0, 5).map((item, i) => (
                                                            <span key={i} className={cn(
                                                                "px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1.5",
                                                                item.type === 'match'
                                                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                                                    : "bg-slate-100 text-slate-600"
                                                            )}>
                                                                {item.type === 'match' && item.score !== undefined && (
                                                                    <div className="flex items-center gap-1 mr-0.5">
                                                                        <CheckCircle size={10} strokeWidth={3} />
                                                                        <span className="opacity-90 font-black">{item.score}%</span>
                                                                    </div>
                                                                )}
                                                                {item.tag}
                                                            </span>
                                                        ));
                                                    })()}
                                                </div>

                                                <p className="text-slate-600 leading-relaxed mb-8 line-clamp-3">
                                                    {location.description?.[preferences.season[0] || currentSeason] || location.description?.['winter']}
                                                </p>

                                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                                                    <div>
                                                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">{tLoc('altitude')}</span>
                                                        <span className="font-bold text-slate-800">{location.altitude || 'N/D'}m</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Season</span>
                                                        <span className="font-bold text-slate-800 capitalize">{preferences.season[0] || currentSeason}</span>
                                                    </div>
                                                    {location.distance && (
                                                        <div className="col-span-2 mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                            <span className="text-slate-500 text-sm flex items-center gap-1">
                                                                <MapPin size={14} /> Distance from you
                                                            </span>
                                                            <span className="font-black text-primary">
                                                                ~{Math.round(location.distance)} km
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Match Score Breakdown */}
                                                <MatchScoreBreakdown location={location} preferences={preferences} />

                                                <Link
                                                    href={`/locations/${locationNameToSlug(location.name)}`}
                                                    onClick={() => handleChoice(location.name)}
                                                    className="mt-8 block w-full py-4 text-center bg-slate-900 text-white rounded-xl font-bold hover:bg-primary transition-colors duration-300"
                                                >
                                                    {t('view_details')}
                                                </Link>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-24">
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('no_matches')}</h3>
                                <button onClick={restart} className="text-primary font-bold hover:underline mt-4">{t('restart')}</button>
                            </div>
                        )}
                    </div>
                </div>

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
            </>
        );
    }

    // Question Config with Component Icons
    const stepsConf = {
        season: {
            title: t('steps.season'),
            options: [
                { id: 'winter', Icon: Snowflake, label: t('options.winter') },
                { id: 'summer', Icon: Sun, label: t('options.summer') },
                { id: 'spring', Icon: Leaf, label: t('options.spring') },
                { id: 'autumn', Icon: Trees, label: t('options.autumn') },
            ],
            multi: false,
            stateKey: 'season'
        },
        target: {
            title: t('steps.target'),
            options: TAG_CATEGORIES.target.map(opt => ({
                ...opt,
                label: t(`options.${opt.id}`),
                Icon: opt.id === 'family' ? Users : opt.id === 'couple' ? Heart : opt.id === 'friends' ? PartyPopper : User
            })),
            multi: false,
            stateKey: 'target'
        },
        vibe: {
            title: t('steps.vibe'),
            options: TAG_CATEGORIES.vibe.map(opt => {
                const icons: Record<string, any> = {
                    relax: Coffee,
                    sport: Activity,
                    party: Music,
                    luxury: Gem,
                    nature: Trees,
                    tradition: History,
                    work: Laptop,
                    silence: Moon
                };
                return { ...opt, label: t(`options.${opt.id}`), Icon: icons[opt.id] || Sparkles };
            }),
            multi: true,
            stateKey: 'vibe'
        },
        activities: {
            title: t('steps.activities'),
            options: TAG_CATEGORIES.activities.map(opt => {
                const icons: Record<string, any> = {
                    ski: Snowflake,
                    hiking: Mountain,
                    wellness: Droplets,
                    food: Utensils,
                    culture: Landmark,
                    adrenaline: Zap,
                    shopping: ShoppingBag,
                    photography: Camera
                };
                return { ...opt, label: t(`options.${opt.id}`), Icon: icons[opt.id] || Sparkles };
            }),
            multi: true,
            stateKey: 'activities'
        },
        nation: {
            title: t('steps.nation'),
            options: [
                ...TAG_CATEGORIES.nations.map(opt => ({ ...opt, label: t(`options.${opt.id}`), Icon: Flag })),
                { id: 'any', Icon: Globe, label: t('options.any') }
            ],
            multi: false,
            stateKey: 'nation'
        }
    };

    // Location Step Custom Render
    if (currentStep === 'location') {

        const detectLocation = () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((position) => {
                    setPreferences(prev => ({
                        ...prev,
                        location: {
                            ...prev.location,
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            mode: 'current',
                            name: 'My current location'
                        }
                    }));
                }, (error) => {
                    alert("Unable to detect your location. Please enter a city manually.");
                    console.error(error);
                });
            } else {
                alert("Your browser does not support geolocation.");
            }
        };

        const searchCity = async () => {
            if (!preferences.location.name) return;
            setSearching(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(preferences.location.name)}&limit=1`);
                const data = await res.json();
                if (data && data.length > 0) {
                    setPreferences(prev => ({
                        ...prev,
                        location: {
                            ...prev.location,
                            lat: parseFloat(data[0].lat),
                            lng: parseFloat(data[0].lon),
                            name: data[0].display_name
                        }
                    }));
                } else {
                    alert("City not found.");
                }
            } catch (err) {
                console.error("Geocoding error:", err);
                alert("Errore durante la ricerca della città.");
            } finally {
                setSearching(false);
            }
        };

        return (
            <>
                <div className="min-h-screen bg-slate-50 flex flex-col">
                    <Navbar />
                    <div className="flex-1 flex flex-col pt-24 pb-12 px-4 sm:px-6 max-w-4xl mx-auto w-full">
                        <div className="w-full h-1 bg-slate-200 rounded-full mb-12 overflow-hidden">
                            <motion.div className="h-full bg-primary" initial={{ width: '80%' }} animate={{ width: getProgress() }} />
                        </div>

                        <div className="flex-1 flex flex-col items-center">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full">
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 text-center mb-4">
                                    {t('steps.location')}
                                </h2>
                                <p className="text-slate-500 text-center mb-12">Tell us where you start from to calculate the distances.</p>

                                <div className="max-w-xl mx-auto space-y-6">
                                    {/* Mode Selection */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={detectLocation}
                                            className={cn(
                                                "p-6 rounded-2xl border transition-all flex flex-col items-center gap-4",
                                                preferences.location.mode === 'current'
                                                    ? "border-primary bg-primary text-white shadow-lg"
                                                    : "border-slate-100 bg-white text-slate-600 hover:border-primary/30"
                                            )}
                                        >
                                            <MapPin size={32} strokeWidth={1.5} />
                                            <span className="font-bold">Use Current Location</span>
                                        </button>

                                        <button
                                            onClick={() => setPreferences(prev => ({ ...prev, location: { ...prev.location, mode: 'custom' } }))}
                                            className={cn(
                                                "p-6 rounded-2xl border transition-all flex flex-col items-center gap-4",
                                                preferences.location.mode === 'custom'
                                                    ? "border-primary bg-primary text-white shadow-lg"
                                                    : "border-slate-100 bg-white text-slate-600 hover:border-primary/30"
                                            )}
                                        >
                                            <Globe size={32} strokeWidth={1.5} />
                                            <span className="font-bold">Enter City</span>
                                        </button>
                                    </div>

                                    {preferences.location.mode === 'custom' && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-4 space-y-4">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Es. Milano, Roma, Torino..."
                                                    value={preferences.location.name}
                                                    onChange={(e) => setPreferences(prev => ({ ...prev, location: { ...prev.location, name: e.target.value } }))}
                                                    className="flex-1 px-6 py-4 rounded-xl border border-slate-200 focus:border-primary outline-none shadow-sm text-lg"
                                                    onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                                                />
                                                <button
                                                    onClick={searchCity}
                                                    disabled={searching || !preferences.location.name}
                                                    className="px-6 bg-slate-900 text-white rounded-xl font-bold hover:bg-primary transition-colors disabled:opacity-50"
                                                >
                                                    {searching ? '...' : <Search size={20} />}
                                                </button>
                                            </div>
                                            {preferences.location.lat !== 45.4642 && (
                                                <p className="text-xs text-green-600 font-medium px-2 flex items-center gap-1">
                                                    <CheckCircle size={14} /> Location found!
                                                </p>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Distance Selection */}
                                    <div className="pt-8 border-t border-slate-100">
                                        <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-6 text-center">
                                            Maximum Distance: {preferences.location.maxDistance === 0 ? 'Unlimited' : `${preferences.location.maxDistance} km`}
                                        </label>

                                        <div className="grid grid-cols-4 gap-3">
                                            {[100, 250, 500, 0].map(dist => (
                                                <button
                                                    key={dist}
                                                    onClick={() => setPreferences(prev => ({ ...prev, location: { ...prev.location, maxDistance: dist } }))}
                                                    className={cn(
                                                        "py-3 rounded-xl border font-bold text-sm transition-all",
                                                        preferences.location.maxDistance === dist
                                                            ? "bg-slate-900 text-white border-slate-900"
                                                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                                    )}
                                                >
                                                    {dist === 0 ? 'Unlimited' : `${dist}km`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="mt-12 flex justify-between items-center w-full max-w-2xl mx-auto">
                            <button onClick={prevStep} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-6 py-3 rounded-full hover:bg-slate-100 transition-colors">
                                <ChevronLeft size={20} /> Back
                            </button>
                            <button
                                onClick={nextStep}
                                disabled={preferences.location.mode === 'none' || (preferences.location.mode === 'custom' && !preferences.location.name)}
                                className="bg-slate-900 hover:bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                            >
                                Complete <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>

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
            </>
        );
    }

    const currentConf = stepsConf[currentStep as keyof typeof stepsConf] as any;
    if (!currentConf) return null;

    return (
        <>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />

                <div className="flex-1 flex flex-col pt-24 pb-12 px-4 sm:px-6 max-w-4xl mx-auto w-full">
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-slate-200 rounded-full mb-12 overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: 0 }}
                            animate={{ width: getProgress() }}
                        />
                    </div>

                    <div className="flex-1 flex flex-col items-center">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                            className="w-full"
                        >
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 text-center mb-12">
                                {currentConf.title}
                            </h2>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {currentConf.options.map((opt: any) => {
                                    const isSelected = (preferences[currentConf.stateKey as keyof Preferences] as string[]).includes(opt.id);
                                    const IconComp = opt.Icon;

                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleOptionToggle(currentConf.stateKey, opt.id, !currentConf.multi)}
                                            className={cn(
                                                "relative p-6 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-4 group aspect-square",
                                                isSelected
                                                    ? "border-primary bg-primary text-white shadow-xl shadow-primary/20 scale-105"
                                                    : "border-slate-100 bg-white text-slate-400 hover:border-primary/30 hover:text-primary hover:shadow-lg"
                                            )}
                                        >
                                            <IconComp
                                                size={32}
                                                strokeWidth={1.5}
                                                className={cn("transition-transform duration-300 group-hover:scale-110", isSelected ? "text-white" : "text-current")}
                                            />
                                            <span className={cn(
                                                "font-medium text-sm text-center",
                                                isSelected ? "text-white" : "text-slate-600 group-hover:text-primary"
                                            )}>{opt.label}</span>

                                            {isSelected && (
                                                <div className="absolute top-3 right-3 text-white">
                                                    <Check size={16} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>

                    <div className="mt-12 flex justify-between items-center w-full max-w-2xl mx-auto">
                        <button
                            onClick={prevStep}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium px-6 py-3 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <ChevronLeft size={20} /> Back
                        </button>

                        <button
                            onClick={nextStep}
                            disabled={Array.isArray(preferences[currentConf.stateKey as keyof Preferences]) && (preferences[currentConf.stateKey as keyof Preferences] as any).length === 0}
                            className="disabled:opacity-50 disabled:cursor-not-allowed bg-slate-900 hover:bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                        >
                            Continue <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

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
        </>
    );
}

export default function MatchWizard() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
            <MatchWizardContent />
        </Suspense>
    );
}
