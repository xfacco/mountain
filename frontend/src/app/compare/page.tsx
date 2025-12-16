'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useSeasonStore } from '@/store/season-store';
import { useCompareStore } from '@/store/compare-store';
import { Location } from '@/types';
import { Check, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ComparePage() {
    const { currentSeason } = useSeasonStore();
    const { selectedLocations, addLocation, removeLocation } = useCompareStore();
    const [locationOptions, setLocationOptions] = useState<any[]>([]);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [loading, setLoading] = useState(true);

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
                alert("Puoi confrontare al massimo 3 località.");
                return;
            }
            addLocation(location);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="pt-32 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-display font-bold text-slate-900">
                            Confronta Località
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Analisi dati per stagione:{' '}
                            <span className="font-bold text-primary capitalize">
                                {currentSeason}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-opacity-90 transition-all font-medium"
                    >
                        <Plus size={18} />
                        Aggiungi Località
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
                                <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Seleziona fino a 3 località</h4>
                                {loading ? (
                                    <div className="text-center py-4 text-slate-400">Caricamento lista...</div>
                                ) : locationOptions.length === 0 ? (
                                    <div className="text-center py-4 text-slate-400">Nessuna località disponibile nel DB.</div>
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
                {selectedLocations.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500 text-lg">
                            Seleziona le località per iniziare il confronto
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-4 w-48 bg-transparent"></th>
                                    {selectedLocations.map((loc) => (
                                        <th key={loc.id} className="p-4 min-w-[250px] align-top">
                                            <div className="relative group">
                                                <button
                                                    onClick={() => toggleLocation(loc)}
                                                    className="absolute -top-2 -right-2 p-1 bg-white text-slate-400 hover:text-red-500 rounded-full shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <div className="aspect-video rounded-xl overflow-hidden mb-4 shadow-md bg-slate-100">
                                                    <img
                                                        src={loc.seasonalImages?.[currentSeason] || loc.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'}
                                                        alt={loc.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900">
                                                    {loc.name}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    {loc.region || 'Alpi'}, {loc.country || 'IT'}
                                                </p>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="text-slate-700">

                                {/* 1. PANORAMICA (Overview) - Always Visible */}
                                <tr>
                                    <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                        Panoramica & Atmosfera
                                    </td>
                                </tr>
                                <tr>
                                    <td className="p-4 font-bold text-slate-900 bg-slate-50/50 min-w-[150px]">
                                        Altitudine
                                    </td>
                                    {selectedLocations.map((loc) => (
                                        <td key={loc.id} className="p-4 align-top font-mono text-sm text-slate-700">
                                            {loc.altitude ? `${loc.altitude}m` : 'N/D'}
                                        </td>
                                    ))}
                                </tr>
                                <tr>
                                    <td className="p-4 font-bold text-slate-900 bg-slate-50/50 min-w-[150px]">
                                        Descrizione Stagionale
                                    </td>
                                    {selectedLocations.map((loc) => (
                                        <td key={loc.id} className="p-4 align-top">
                                            <p className="text-sm leading-relaxed text-slate-600">
                                                {loc.description?.[currentSeason] ||
                                                    'Descrizione stagionale non disponibile.'}
                                            </p>
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-t border-slate-200 bg-yellow-50/30">
                                    <td className="p-4 font-bold text-slate-900 bg-slate-50/50">
                                        Highlights
                                    </td>
                                    {selectedLocations.map((loc) => (
                                        <td key={loc.id} className="p-4 align-top">
                                            <div className="flex flex-wrap gap-2">
                                                {loc.tags?.highlights?.map((t: string) => (
                                                    <span key={t} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-md border border-yellow-200">{t}</span>
                                                )) || <span className="text-slate-400 text-xs italic">-</span>}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                <tr className="border-t border-slate-200">
                                    <td className="p-4 font-bold text-slate-900 bg-slate-50/50">
                                        Atmosfera & Target
                                    </td>
                                    {selectedLocations.map((loc) => (
                                        <td key={loc.id} className="p-4 align-top space-y-3">
                                            <div>
                                                <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block mb-1">Vibe</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {loc.tags?.vibe?.map((t: string) => (
                                                        <span key={t} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded border border-purple-100">{t}</span>
                                                    )) || <span className="text-slate-400 text-xs italic">-</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block mb-1">Target</span>
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
                                        Attività Turistiche
                                    </td>
                                </tr>
                                <tr className="bg-slate-50/10">
                                    <td className="p-4 font-bold text-slate-900 bg-slate-50/50">
                                        Tag Attività
                                    </td>
                                    {selectedLocations.map((loc) => (
                                        <td key={loc.id} className="p-4 align-top">
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
                                    className="cursor-pointer hover:bg-slate-50 transition-colors border-t border-slate-100"
                                    onClick={() => setShowDetails(prev => ({ ...prev, tourism: !prev.tourism }))}
                                >
                                    <td colSpan={selectedLocations.length + 1} className="p-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            {showDetails.tourism ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            {showDetails.tourism ? 'Nascondi Dettagli' : 'Mostra Dettagli'}
                                        </div>
                                    </td>
                                </tr>
                                {showDetails.tourism && (
                                    <tr className="border-t border-slate-200 bg-slate-50/20">
                                        <td className="p-4 font-bold text-slate-900 bg-slate-50/50 align-top">
                                            Dettagli Attività
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="p-4 align-top">
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
                                )}

                                {/* 3. OSPITALITÀ (Accommodation) */}
                                <tr>
                                    <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                        Ospitalità
                                    </td>
                                </tr>
                                <tr className="bg-slate-50/10">
                                    <td className="p-4 font-bold text-slate-900 bg-slate-50/50">
                                        Tag Ospitalità
                                    </td>
                                    {selectedLocations.map((loc) => (
                                        <td key={loc.id} className="p-4 align-top">
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
                                    className="cursor-pointer hover:bg-slate-50 transition-colors border-t border-slate-100"
                                    onClick={() => setShowDetails(prev => ({ ...prev, accommodation: !prev.accommodation }))}
                                >
                                    <td colSpan={selectedLocations.length + 1} className="p-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            {showDetails.accommodation ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            {showDetails.accommodation ? 'Nascondi Dettagli' : 'Mostra Dettagli'}
                                        </div>
                                    </td>
                                </tr>
                                {showDetails.accommodation && (
                                    <tr className="border-t border-slate-200 bg-slate-50/20">
                                        <td className="p-4 font-bold text-slate-900 bg-slate-50/50 align-top">
                                            Dettagli Ospitalità
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="p-4 align-top">
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
                                )}

                                {/* 4. IMPIANTI (Infrastructure) */}
                                <tr>
                                    <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                        Impianti & Trasporti
                                    </td>
                                </tr>
                                <tr className="bg-slate-50/10">
                                    <td className="p-4 font-bold text-slate-900 bg-slate-50/50">
                                        Tag Impianti
                                    </td>
                                    {selectedLocations.map((loc) => (
                                        <td key={loc.id} className="p-4 align-top">
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
                                    className="cursor-pointer hover:bg-slate-50 transition-colors border-t border-slate-100"
                                    onClick={() => setShowDetails(prev => ({ ...prev, infrastructure: !prev.infrastructure }))}
                                >
                                    <td colSpan={selectedLocations.length + 1} className="p-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            {showDetails.infrastructure ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            {showDetails.infrastructure ? 'Nascondi Dettagli' : 'Mostra Dettagli'}
                                        </div>
                                    </td>
                                </tr>
                                {showDetails.infrastructure && (
                                    <tr className="border-t border-slate-200 bg-slate-50/20">
                                        <td className="p-4 font-bold text-slate-900 bg-slate-50/50 align-top">
                                            Dettagli Impianti
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="p-4 align-top">
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
                                )}

                                {/* 5. SPORT */}
                                <tr>
                                    <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                        Sport & Benessere
                                    </td>
                                </tr>
                                <tr className="bg-slate-50/10">
                                    <td className="p-4 font-bold text-slate-900 bg-slate-50/50">
                                        Tag Sport
                                    </td>
                                    {selectedLocations.map((loc) => (
                                        <td key={loc.id} className="p-4 align-top">
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
                                    className="cursor-pointer hover:bg-slate-50 transition-colors border-t border-slate-100"
                                    onClick={() => setShowDetails(prev => ({ ...prev, sport: !prev.sport }))}
                                >
                                    <td colSpan={selectedLocations.length + 1} className="p-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            {showDetails.sport ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            {showDetails.sport ? 'Nascondi Dettagli' : 'Mostra Dettagli'}
                                        </div>
                                    </td>
                                </tr>
                                {showDetails.sport && (
                                    <tr className="border-t border-slate-200 bg-slate-50/20">
                                        <td className="p-4 font-bold text-slate-900 bg-slate-50/50 align-top">
                                            Dettagli Sport
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="p-4 align-top">
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
                                )}

                                {/* 6. INFO */}
                                <tr>
                                    <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                        Informazioni Utili
                                    </td>
                                </tr>
                                <tr className="bg-slate-50/10">
                                    <td className="p-4 font-bold text-slate-900 bg-slate-50/50">
                                        Tag Info
                                    </td>
                                    {selectedLocations.map((loc) => (
                                        <td key={loc.id} className="p-4 align-top">
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
                                    className="cursor-pointer hover:bg-slate-50 transition-colors border-t border-slate-100"
                                    onClick={() => setShowDetails(prev => ({ ...prev, info: !prev.info }))}
                                >
                                    <td colSpan={selectedLocations.length + 1} className="p-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            {showDetails.info ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            {showDetails.info ? 'Nascondi Dettagli' : 'Mostra Dettagli'}
                                        </div>
                                    </td>
                                </tr>
                                {showDetails.info && (
                                    <tr className="border-t border-slate-200 bg-slate-50/20">
                                        <td className="p-4 font-bold text-slate-900 bg-slate-50/50 align-top">
                                            Dettagli Info
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="p-4 align-top">
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
                                )}

                                {/* 7. GENERALE (General) */}
                                <tr>
                                    <td colSpan={selectedLocations.length + 1} className="p-4 py-3 bg-slate-100 font-bold text-slate-900 border-b border-slate-200">
                                        Servizi Generali
                                    </td>
                                </tr>
                                <tr className="bg-slate-50/10">
                                    <td className="p-4 font-bold text-slate-900 bg-slate-50/50">
                                        Tag Generali
                                    </td>
                                    {selectedLocations.map((loc) => (
                                        <td key={loc.id} className="p-4 align-top">
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
                                    className="cursor-pointer hover:bg-slate-50 transition-colors border-t border-slate-100"
                                    onClick={() => setShowDetails(prev => ({ ...prev, general: !prev.general }))}
                                >
                                    <td colSpan={selectedLocations.length + 1} className="p-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex items-center justify-center gap-1">
                                            {showDetails.general ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            {showDetails.general ? 'Nascondi Dettagli' : 'Mostra Dettagli'}
                                        </div>
                                    </td>
                                </tr>
                                {showDetails.general && (
                                    <tr className="border-t border-slate-200 bg-slate-50/20">
                                        <td className="p-4 font-bold text-slate-900 bg-slate-50/50 align-top">
                                            Dettagli Generali
                                        </td>
                                        {selectedLocations.map((loc) => (
                                            <td key={loc.id} className="p-4 align-top">
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
                                )}

                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
