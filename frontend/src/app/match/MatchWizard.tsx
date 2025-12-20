'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { useSeasonStore } from '@/store/season-store';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Check, Sparkles, MapPin, User, Users, Heart, PartyPopper, Coffee, Activity, Music, Gem, Trees, Snowflake, Mountain, Droplets, Utensils, Landmark, Flag, Globe, Sun, Leaf, History, Laptop, Moon, Zap, ShoppingBag, Camera, Search, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TAG_CATEGORIES } from '@/lib/tags-config';

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

export default function MatchWizard() {
    const t = useTranslations('Match');
    const tLoc = useTranslations('Locations');
    const { currentSeason, setSeason } = useSeasonStore();

    const [currentStep, setCurrentStep] = useState<Step>('intro');
    const [searching, setSearching] = useState(false);

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

    // Calculate matches when entering results step
    useEffect(() => {
        if (currentStep === 'results' && locations.length > 0) {
            calculateMatches();
        }
    }, [currentStep, locations]);

    // Initialize season preference based on current store if empty
    useEffect(() => {
        if (preferences.season.length === 0) {
            setPreferences(prev => ({ ...prev, season: [currentSeason] }));
        }
    }, []);

    const calculateMatches = () => {
        setLoading(true);

        // Update global season store based on preference
        if (preferences.season.length > 0) {
            setSeason(preferences.season[0] as any);
        }

        // This is a simple scoring algorithm. 
        // In a real production app, this could be more sophisticated or use vector search.
        const initialScored = locations.map((loc: any) => {
            let score = 0;
            let maxScore = 0;

            // 1. Target Match (User traveling with vs Location Target)
            const locTargets = loc.tags?.target || [];
            if (preferences.target.length > 0 && locTargets.length > 0) {
                const hasTargetMatch = preferences.target.some(pref =>
                    locTargets.some((t: string) => t.toLowerCase().includes(pref.toLowerCase()))
                );
                if (hasTargetMatch) score += 30; // High weight
                maxScore += 30;
            }

            // 2. Vibe Match
            const locVibe = loc.tags?.vibe || [];
            if (preferences.vibe.length > 0 && locVibe.length > 0) {
                const hasVibeMatch = preferences.vibe.some(pref =>
                    locVibe.some((t: string) => t.toLowerCase().includes(pref.toLowerCase()))
                );
                if (hasVibeMatch) score += 25;
                maxScore += 25;
            }

            // 3. Activity Match
            const locActivities = [...(loc.tags?.tourism || []), ...(loc.tags?.sport || [])];
            if (preferences.activities.length > 0 && locActivities.length > 0) {
                const matchCount = preferences.activities.filter(pref =>
                    locActivities.some((t: string) => t.toLowerCase().includes(pref.toLowerCase()))
                ).length;
                score += Math.min(matchCount * 10, 30); // Max 30 points
                maxScore += 30;
            }

            // 4. Nation Match
            if (preferences.nation.length > 0 && !preferences.nation.includes('any')) {
                const nationMappings: Record<string, string[]> = {
                    'italy': ['italy', 'italia'],
                    'austria': ['austria', 'österreich', 'osterreich'],
                    'switzerland': ['switzerland', 'svizzera', 'suisse', 'schweiz'],
                    'france': ['france', 'francia']
                };

                const isNationMatch = preferences.nation.some(pref => {
                    const searchTerms = nationMappings[pref.toLowerCase()] || [pref.toLowerCase()];
                    const locCountry = (loc.country || '').toLowerCase();
                    return searchTerms.some(term => locCountry.includes(term));
                });

                if (isNationMatch) score += 15;
                maxScore += 15;
            }

            // 5. Explicit Tag Matching (1-to-1) based on categories
            const categoriesToMatch: (keyof Omit<Preferences, 'location'>)[] = ['vibe', 'target', 'activities'];
            categoriesToMatch.forEach(cat => {
                const prefs = preferences[cat] as string[];
                const locTags = loc.tags?.[cat] || [];
                if (prefs.length > 0) {
                    const matches = prefs.filter(p => locTags.includes(p));
                    // Additional boost for exact structured match
                    score += matches.length * 5;
                }
            });

            // 5. Seasonality Boost (if location explicitly mentions season in description or data)
            // Simulating this by checking if description exists for the selected season
            if (preferences.season.length > 0) {
                const season = preferences.season[0];
                if (loc.description?.[season]) {
                    score += 5;
                    maxScore += 5;
                }
            }

            // 6. Location & Distance Match
            let distanceInKm: number | null = null;
            if (preferences.location.mode !== 'none') {
                const locLat = loc.coordinates?.lat;
                const locLng = loc.coordinates?.lng;

                if (locLat && locLng) {
                    distanceInKm = getDistance(
                        preferences.location.lat,
                        preferences.location.lng,
                        locLat,
                        locLng
                    );

                    // If distance is set, exclude if outside range
                    if (preferences.location.maxDistance > 0 && distanceInKm > preferences.location.maxDistance) {
                        score = -100; // Drop it
                    } else if (preferences.location.maxDistance > 0) {
                        // Bonus for proximity if range is specified
                        const proximityBonus = Math.max(0, 20 * (1 - distanceInKm / preferences.location.maxDistance));
                        score += proximityBonus;
                        maxScore += 20;
                    }
                } else {
                    // If we have a location filter but loc has no coords, slight penalty
                    // but don't exclude unless we want to be strict
                }
            }

            return { ...loc, matchScore: 0, distance: distanceInKm, score, maxScore };
        });

        // 2nd pass: Normalize scores (need to do it after distance filter if any)
        const scoredLocations = initialScored.map((item: any) => {
            const percentage = Math.max(0, Math.round((item.score / (item.maxScore || 1)) * 100));
            return { ...item, matchScore: percentage };
        });

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

        // Filter out those with negative score (excluded by distance)
        const validLocations = scoredLocations.filter((loc: any) => loc.matchScore >= 0);

        // Log the match search to Firebase
        const logMatch = async (topMatches: any[]) => {
            try {
                const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                await addDoc(collection(db, 'match_logs'), {
                    preferences,
                    results: topMatches.map(m => ({ id: m.id, name: m.name, score: m.matchScore, distance: m.distance })),
                    timestamp: serverTimestamp(),
                    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
                });
            } catch (err) {
                console.error("Error logging match:", err);
            }
        };

        const topMatches = validLocations
            .sort((a: any, b: any) => b.matchScore - a.matchScore)
            .slice(0, 6);

        setMatches(topMatches);
        logMatch(topMatches);

        // Simulate "thinking" time
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
    };

    // Render Steps
    // --------------------------------------------------------------------------------------------

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
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <div className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                        <div>
                            <span className="text-primary font-bold uppercase tracking-wider text-sm mb-2 block">AI Recommender</span>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900">{t('steps.results')}</h2>
                        </div>
                        <button onClick={restart} className="text-slate-500 hover:text-slate-900 underline text-sm">
                            {t('restart')}
                        </button>
                    </div>

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
                            {matches.map((location, index) => (
                                <motion.div
                                    key={location.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 group hover:shadow-2xl transition-all duration-300 relative"
                                >
                                    {/* Match Badge */}
                                    <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur text-primary px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-1">
                                        <Sparkles size={16} className="fill-current" />
                                        {location.matchScore}% Match
                                    </div>

                                    {/* Image */}
                                    <div className="relative h-80 overflow-hidden">
                                        <img
                                            src={location.seasonalImages?.[preferences.season[0] || currentSeason] || location.coverImage}
                                            alt={location.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />

                                        <div className="absolute bottom-6 left-6 text-white">
                                            <div className="flex items-center gap-2 text-sm font-medium opacity-90 mb-1">
                                                <MapPin size={16} />
                                                {location.region}, {location.country}
                                            </div>
                                            <h3 className="text-4xl font-display font-bold">{location.name}</h3>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-8">
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {/* Show relevant tags based on match */}
                                            {location.tags?.vibe?.slice(0, 3).map((tag: string) => (
                                                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide">
                                                    {tag}
                                                </span>
                                            ))}
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
                                                        <MapPin size={14} /> Distanza da te
                                                    </span>
                                                    <span className="font-black text-primary">
                                                        ~{Math.round(location.distance)} km
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <Link
                                            href={`/locations/${location.name}`}
                                            className="mt-8 block w-full py-4 text-center bg-slate-900 text-white rounded-xl font-bold hover:bg-primary transition-colors duration-300"
                                        >
                                            {t('view_details')}
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24">
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">{t('no_matches')}</h3>
                            <button onClick={restart} className="text-primary font-bold hover:underline mt-4">{t('restart')}</button>
                        </div>
                    )}
                </div>
            </div>
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
                            name: 'Mia posizione attuale'
                        }
                    }));
                }, (error) => {
                    alert("Impossibile rilevare la posizione. Per favore inserisci una città manualmente.");
                    console.error(error);
                });
            } else {
                alert("Geolocalizzazione non supportata dal tuo browser.");
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
                    alert("Città non trovata.");
                }
            } catch (err) {
                console.error("Geocoding error:", err);
                alert("Errore durante la ricerca della città.");
            } finally {
                setSearching(false);
            }
        };

        return (
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
                            <p className="text-slate-500 text-center mb-12">Dicci da dove parti per calcolare le distanze.</p>

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
                                        <span className="font-bold">Usa Posizione Attuale</span>
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
                                        <span className="font-bold">Inserisci Città</span>
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
                                                <CheckCircle size={14} /> Località trovata!
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
        );
    }

    const currentConf = stepsConf[currentStep as keyof typeof stepsConf] as any;
    if (!currentConf) return null;




    return (
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
    );
}
