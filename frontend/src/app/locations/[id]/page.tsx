'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { MapPin, Calendar, Star, Info, ChevronLeft, ArrowLeft, Sun, Snowflake, Cloud, Wind, Mountain, Home, Bus, Quote, AlertCircle, Check, X, Accessibility, HelpCircle, Layers, List, Search, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSeasonStore } from '@/store/season-store';
import { useCompareStore } from '@/store/compare-store';

export default function LocationDetailPage() {
    const params = useParams();
    const router = useRouter(); // Initialize router
    const { currentSeason, setSeason } = useSeasonStore();
    const { selectedLocations, addLocation, removeLocation } = useCompareStore();
    const [location, setLocation] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
        { id: 'overview', label: 'Panoramica', icon: Info },
        { id: 'tourism', label: 'Attività', icon: Mountain },
        { id: 'accommodation', label: 'Ospitalità', icon: Home },
        { id: 'infrastructure', label: 'Impianti', icon: Bus },
        { id: 'sport', label: 'Sport', icon: Accessibility },
        { id: 'info', label: 'Info Utili', icon: HelpCircle },
        { id: 'general', label: 'Generale', icon: Layers },
        { id: 'all', label: 'Tutto', icon: List }
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
                    setLocation({ id: docSnap.id, ...locData });
                    // Removed local season logic, relying on global currentSeason
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
            <h1 className="text-xl font-bold text-slate-900">Località non trovata</h1>
            <Link href="/locations" className="text-primary hover:underline">Torna alla lista</Link>
        </div>
    );

    const seasons = [
        { id: 'winter', label: 'Inverno', icon: Snowflake },
        { id: 'spring', label: 'Primavera', icon: Cloud },
        { id: 'summer', label: 'Estate', icon: Sun },
        { id: 'autumn', label: 'Autunno', icon: Wind },
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

            <div className="pt-32 pb-12 container mx-auto px-6">
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
                                            title="Apri in Google Maps"
                                        >
                                            <MapPin size={12} />
                                            {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                                            <ArrowRight size={10} className="-rotate-45" />
                                        </a>
                                    )}
                                </div>

                                {/* Quick Search (Local Content) */}
                                <div className="mb-6 relative z-10">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Cerca servizi, attività..."
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
                                        Cerca in tutte le categorie (Attività, Ospitalità, Impianti, etc.)
                                    </p>
                                </div>

                                {/* Compare Action - Moved back to Sidebar */}
                                <div className="mb-6">
                                    {selectedLocations.find(l => l.id === location.id) ? (
                                        <button
                                            onClick={() => removeLocation(location.id)}
                                            className="w-full bg-green-50 hover:bg-red-50 text-green-700 hover:text-red-700 font-bold py-3 rounded-xl transition-all border border-green-200 hover:border-red-200 flex items-center justify-center gap-2 group shadow-sm"
                                        >
                                            <span className="group-hover:hidden flex items-center gap-2"><Check size={18} /> Aggiunto a Confronto</span>
                                            <span className="hidden group-hover:flex items-center gap-2"><X size={18} /> Rimuovi da Confronto</span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                if (selectedLocations.length >= 3) {
                                                    alert("Puoi confrontare al massimo 3 località.");
                                                    return;
                                                }
                                                addLocation(location);
                                                router.push('/compare');
                                            }}
                                            className={`w-full font-bold py-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2  ${selectedLocations.length >= 3 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'}`}
                                        >
                                            <Star size={18} className="group-hover:fill-current transition-colors" />
                                            {selectedLocations.length >= 3 ? 'Massimo 3 località' : 'Aggiungi a Confronto'}
                                        </button>
                                    )}
                                </div>

                                {/* Categories / Tabs - Moved above Seasons */}
                                <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap gap-2 mb-6">
                                    {tabs.map((tab) => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
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

                                {/* Season Selector - Moved below Categories */}
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
                            </div>
                        </div>

                    </div>

                    {/* RIGHT COLUMN (Main): Tabs & Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Tab Headers */}
                        {/* General Characteristics (Top of Page) */}
                        {location.tags && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    {renderTagGroup('Highlights', location.tags.highlights, Star, 'text-yellow-500', 'bg-yellow-50 border-yellow-100')}
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    {renderTagGroup('Vibe', location.tags.vibe, Info, 'text-purple-500', 'bg-purple-50 border-purple-100')}
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                    {renderTagGroup('Target', location.tags.target, Info, 'text-blue-500', 'bg-blue-50 border-blue-100')}
                                </div>
                            </div>
                        )}

                        {/* Tab Content */}
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 min-h-[500px]">

                            {/* OVERVIEW TAB */}
                            {(activeTab === 'overview' || activeTab === 'all') && (searchTerm === '' || location.description?.[currentSeason]?.toLowerCase().includes(searchTerm.toLowerCase())) && (
                                <div className="mobile-fade-in space-y-8 mb-12">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold text-slate-900">Panoramica Stagionale</h2>
                                    </div>

                                    {/* Season Selector for Description */}

                                    <div className="prose prose-lg text-slate-600 leading-relaxed">
                                        {location.description?.[currentSeason] || <span className="text-slate-400 italic">Nessuna descrizione disponibile per questa stagione.</span>}
                                    </div>
                                </div>
                            )}

                            {/* TOURISM TAB */}
                            {(activeTab === 'overview' || activeTab === 'all') ? null : null}
                            {(activeTab === 'tourism' || activeTab === 'all') && (searchTerm === '' || getFilteredServices('tourism').length > 0) && (
                                <div className="mobile-fade-in space-y-6 mb-12">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <Mountain className="text-green-600" size={28} /> Attività Turistiche
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
                                                                {s === 'winter' ? <Snowflake size={10} /> : s === 'summer' ? <Sun size={10} /> : <Calendar size={10} />} {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 italic">Nessuna attività specificata.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ACCOMMODATION TAB */}
                            {(activeTab === 'accommodation' || activeTab === 'all') && (searchTerm === '' || getFilteredServices('accommodation').length > 0) && (
                                <div className="mobile-fade-in space-y-6 mb-12">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <Home className="text-orange-500" size={28} /> Ospitalità
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
                                                                {s === 'winter' ? <Snowflake size={10} /> : s === 'summer' ? <Sun size={10} /> : <Calendar size={10} />} {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 italic">Nessuna opzione di ospitalità specificata.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* INFRASTRUCTURE TAB */}
                            {(activeTab === 'infrastructure' || activeTab === 'all') && (searchTerm === '' || getFilteredServices('infrastructure').length > 0) && (
                                <div className="mobile-fade-in space-y-6 mb-12">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <Bus className="text-slate-600" size={28} /> Impianti & Trasporti
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
                                                    {service.seasonAvailability?.includes('winter') && <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-bold">Inverno</span>}
                                                    {service.seasonAvailability?.includes('summer') && <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-bold">Estate</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {(getFilteredServices('infrastructure').length === 0) &&
                                        <p className="text-slate-500 italic">Nessun servizio infrastrutturale elencato.</p>
                                    }
                                </div>
                            )}

                            {/* SPORT TAB */}
                            {(activeTab === 'sport' || activeTab === 'all') && (searchTerm === '' || getFilteredServices('sport').length > 0) && (
                                <div className="mobile-fade-in space-y-6 mb-12">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <Accessibility className="text-red-500" size={28} /> Sport & Benessere
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
                                                    {service.seasonAvailability?.includes('winter') && <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-bold">Inverno</span>}
                                                    {service.seasonAvailability?.includes('summer') && <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-bold">Estate</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {(getFilteredServices('sport').length === 0) && <p className="text-slate-500 italic">Nessun servizio sportivo elencato.</p>}
                                </div>
                            )}

                            {/* INFO TAB */}
                            {(activeTab === 'info' || activeTab === 'all') && (searchTerm === '' || getFilteredServices('info').length > 0) && (
                                <div className="mobile-fade-in space-y-6 mb-12">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <HelpCircle className="text-indigo-500" size={28} /> Informazioni Utili
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
                                    {(getFilteredServices('info').length === 0) && <p className="text-slate-500 italic">Nessuna informazione aggiuntiva disponibile.</p>}
                                </div>
                            )}

                            {/* GENERAL TAB */}
                            {(activeTab === 'general' || activeTab === 'all') && (searchTerm === '' || getFilteredServices('general').length > 0) && (
                                <div className="mobile-fade-in space-y-6 mb-12">
                                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                                        <Layers className="text-slate-500" size={28} /> Servizi Generali
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
                                    {(getFilteredServices('general').length === 0) && <p className="text-slate-500 italic">Nessun servizio generale elencato.</p>}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
