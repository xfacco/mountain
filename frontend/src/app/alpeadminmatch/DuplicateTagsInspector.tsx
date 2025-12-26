
'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, Search, Trash2 } from 'lucide-react';

const ALL_TAG_CATEGORIES = [
    'vibe', 'target', 'activities',
    'highlights', 'tourism', 'accommodation', 'infrastructure', 'sport', 'info', 'general'
];

interface DuplicateInfo {
    tag: string;
    count: number;
    categories: string[];
}

interface LocationAnalysis {
    id: string;
    name: string;
    totalTags: number;
    duplicates: DuplicateInfo[];
    allTagsMap: Record<string, string[]>; // tag -> categories where it appears
}

export default function DuplicateTagsInspector() {
    const [loading, setLoading] = useState(true);
    const [locations, setLocations] = useState<LocationAnalysis[]>([]);
    const [filter, setFilter] = useState('');
    const [showOnlyDuplicates, setShowOnlyDuplicates] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { collection, getDocs, query } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const q = query(collection(db, 'locations'));
            const snapshot = await getDocs(q);

            const analysis: LocationAnalysis[] = snapshot.docs.map(doc => {
                const data = doc.data();
                const tags = data.tags || {};

                const locAnalysis: LocationAnalysis = {
                    id: doc.id,
                    name: data.name || 'Senza Nome',
                    totalTags: 0,
                    duplicates: [],
                    allTagsMap: {}
                };

                const tagCounts: Record<string, number> = {};
                const tagInCategories: Record<string, string[]> = {};

                ALL_TAG_CATEGORIES.forEach(cat => {
                    const catTags = tags[cat];
                    if (Array.isArray(catTags)) {
                        catTags.forEach((t: string) => {
                            const normalized = t.trim().toLowerCase();
                            if (!normalized) return;

                            locAnalysis.totalTags++;
                            tagCounts[normalized] = (tagCounts[normalized] || 0) + 1;

                            if (!tagInCategories[normalized]) tagInCategories[normalized] = [];
                            tagInCategories[normalized].push(cat);
                        });
                    }
                });

                // Find duplicates
                Object.entries(tagCounts).forEach(([tag, count]) => {
                    if (count > 1) {
                        locAnalysis.duplicates.push({
                            tag: tag, // Keep one version (lowercase) or try to find display version? Lowercase for comparison.
                            count,
                            categories: tagInCategories[tag]
                        });
                    }
                });

                // Sort duplicates by count
                locAnalysis.duplicates.sort((a, b) => b.count - a.count);
                locAnalysis.allTagsMap = tagInCategories;

                return locAnalysis;
            });

            // Sort locations: those with most duplicates first
            analysis.sort((a, b) => b.duplicates.length - a.duplicates.length);

            setLocations(analysis);
        } catch (error) {
            console.error("Error loading locations:", error);
            alert("Errore nel caricamento delle località.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAutoCleanup = async (locId: string, dups: DuplicateInfo[]) => {
        if (!confirm(`Rimuovere automaticamente i duplicati per questa località? Verrà mantenuta una sola istanza per ogni tag (priorità alle categorie principali).`)) return;

        try {
            const { doc, getDoc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const locRef = doc(db, 'locations', locId);
            const locSnap = await getDoc(locRef);

            if (!locSnap.exists()) return;
            const data = locSnap.data();
            const currentTags = data.tags || {};

            // Logic: iterate duplicates. For each duplicate tag, keep it in the "first" found category (or a preferred one) and remove from others.
            // Or simpler: remove strictly redundant entries.
            // If a tag "ski" is in 'activities' and 'sport', do we want to keep both? 
            // The user asked "if we have equal tags". 
            // Usually we want unique tags globally or at least unique per list. 
            // Let's assume we want to Clean them so they appear only once across the location? 
            // Actually, maybe just removing exact duplicates within same list + cross list.
            // Let's adopt a strategy: Keep it in the category that seems most relevant, or just keep the first one encountered in our priority list.

            const newTags = { ...currentTags };

            // Track what we've seen globally for this location to ensure uniqueness
            const seen = new Set<string>();

            // Categories priority order for retaining the tag
            const priorityCats = ['vibe', 'target', 'activities', 'highlights', 'tourism', 'accommodation', 'infrastructure', 'sport', 'info', 'general'];

            priorityCats.forEach(cat => {
                if (Array.isArray(newTags[cat])) {
                    // Filter the array
                    newTags[cat] = newTags[cat].filter((t: string) => {
                        const norm = t.trim().toLowerCase();
                        if (seen.has(norm)) {
                            return false; // Remove! Already seen in a higher priority category
                        }
                        seen.add(norm);
                        return true;
                    });
                }
            });

            await updateDoc(locRef, { tags: newTags });
            alert('Pulizia duplicati completata!');
            fetchData();
        } catch (e) {
            console.error(e);
            alert('Errore durante la pulizia.');
        }
    };

    const filteredLocations = locations.filter(l => {
        if (showOnlyDuplicates && l.duplicates.length === 0) return false;
        return l.name.toLowerCase().includes(filter.toLowerCase());
    });

    if (loading) return <div className="p-12 text-center text-slate-500">Analisi integrità tags...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Ispettore Duplicati Tag</h2>
                    <p className="text-slate-500 text-sm">Identifica le località che hanno lo stesso tag ripetuto più volte (nella stessa lista o in liste diverse).</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                >
                    <RefreshCw size={16} />
                    Aggiorna
                </button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cerca località..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                    />
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={showOnlyDuplicates}
                        onChange={(e) => setShowOnlyDuplicates(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Mostra solo con duplicati
                </label>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <h4 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
                    ℹ️ Come funziona "Correggi Auto"?
                </h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                    La funzione automatica scansiona tutti i tag duplicati e mantiene <strong>una sola istanza</strong> per ciascun tag, dando priorità alle categorie più importanti (Vibe, Target, Activities) rispetto a quelle generiche (General, Info).
                    <br />
                    <em>Esempio: Se "Relax" è presente sia in "Vibe" che in "Highlights", verrà mantenuto solo in "Vibe".</em>
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredLocations.map(loc => (
                    <div key={loc.id} className={`bg-white rounded-xl border p-5 transition-all ${loc.duplicates.length > 0 ? 'border-amber-200 shadow-sm' : 'border-slate-100 opacity-70'}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    {loc.name}
                                    {loc.duplicates.length > 0 ? (
                                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                            <AlertTriangle size={12} /> {loc.duplicates.length} Duplicati
                                        </span>
                                    ) : (
                                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                            <CheckCircle size={12} /> Clean
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-slate-500">Totale Tag: {loc.totalTags}</p>
                            </div>

                            {loc.duplicates.length > 0 && (
                                <button
                                    onClick={() => handleAutoCleanup(loc.id, loc.duplicates)}
                                    className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-bold flex items-center gap-1 transition-colors"
                                >
                                    <Trash2 size={14} /> Correggi Auto
                                </button>
                            )}
                        </div>

                        {loc.duplicates.length > 0 && (
                            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                                {loc.duplicates.map((dup, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm border-b border-slate-200 last:border-0 pb-2 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                {dup.tag}
                                            </span>
                                            <span className="text-slate-500 text-xs">
                                                trovato {dup.count} volte
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            {dup.categories.map((cat, i) => (
                                                <span key={i} className="text-[10px] uppercase bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-medium">
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {filteredLocations.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        Nessuna località trovata.
                    </div>
                )}
            </div>
        </div>
    );
}
