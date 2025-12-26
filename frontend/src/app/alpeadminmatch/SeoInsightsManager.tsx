
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Edit2, Trash2, RefreshCw, Save, Search, ArrowRight, Check, ArrowDownAZ, ArrowDownNarrowWide, Merge, X, CopyMinus } from 'lucide-react';

type SeoCategory = 'highlights' | 'tourism' | 'accommodation' | 'infrastructure' | 'sport' | 'info' | 'general';

const SEO_CATEGORIES: SeoCategory[] = [
    'highlights', 'tourism', 'accommodation', 'infrastructure', 'sport', 'info', 'general'
];

interface TagUsage {
    tag: string;
    count: number;
    locationIds: string[];
}

export default function SeoInsightsManager() {
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);
    const [tagData, setTagData] = useState<Record<SeoCategory, TagUsage[]>>({
        highlights: [], tourism: [], accommodation: [], infrastructure: [], sport: [], info: [], general: []
    });
    const [activeCategory, setActiveCategory] = useState<SeoCategory>('highlights');
    const [filter, setFilter] = useState('');
    const [sortOrder, setSortOrder] = useState<'count' | 'alpha'>('count');
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [mergeTargetName, setMergeTargetName] = useState('');

    // Fetch all locations
    const fetchData = async () => {
        setLoading(true);
        try {
            const { collection, getDocs, query } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const q = query(collection(db, 'locations'));
            const snapshot = await getDocs(q);

            const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLocations(docs);
            analyzeTags(docs);
        } catch (error) {
            console.error("Error loading locations:", error);
            alert("Errore nel caricamento delle località.");
        } finally {
            setLoading(false);
            setAnalyzing(false);
        }
    };

    const toggleSelectTag = (tag: string) => {
        const newSet = new Set(selectedTags);
        if (newSet.has(tag)) newSet.delete(tag);
        else newSet.add(tag);
        setSelectedTags(newSet);
    };

    const openMergeModal = () => {
        if (selectedTags.size < 2) return;
        // Default name is the one with highest count
        const sortedSelected = filteredTags.filter(t => selectedTags.has(t.tag)).sort((a, b) => b.count - a.count);
        setMergeTargetName(sortedSelected[0]?.tag || '');
        setIsMergeModalOpen(true);
    };

    const handleMergeTags = async () => {
        if (!mergeTargetName) return;
        if (!confirm(`Confermi l'unione di ${selectedTags.size} tag nel nuovo tag "${mergeTargetName}"?`)) return;

        setAnalyzing(true);
        setIsMergeModalOpen(false);
        try {
            const { doc, updateDoc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            // Collect all location IDs involved
            const allInvolvedLocIds = new Set<string>();
            selectedTags.forEach(tag => {
                const usage = tagData[activeCategory].find(t => t.tag === tag);
                usage?.locationIds.forEach(id => allInvolvedLocIds.add(id));
            });

            let updatedCount = 0;

            for (const locId of Array.from(allInvolvedLocIds)) {
                const locRef = doc(db, 'locations', locId);
                const locSnap = await getDoc(locRef);

                if (locSnap.exists()) {
                    const data = locSnap.data();
                    const currentTags = data.tags?.[activeCategory] || [];

                    // Filter out ALL selected tags
                    const keptTags = currentTags.filter((t: string) => !selectedTags.has(t));

                    // Add the NEW target tag if not already present
                    if (!keptTags.includes(mergeTargetName)) {
                        keptTags.push(mergeTargetName);
                    }

                    await updateDoc(locRef, {
                        [`tags.${activeCategory}`]: keptTags
                    });
                    updatedCount++;
                }
            }

            alert(`Unione completata! Aggiornate ${updatedCount} località.`);
            setSelectedTags(new Set());
            fetchData();
        } catch (error) {
            console.error("Error merging tags:", error);
            alert("Errore durante l'unione.");
        } finally {
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const analyzeTags = (locs: any[]) => {
        const newData: Record<SeoCategory, TagUsage[]> = {
            highlights: [], tourism: [], accommodation: [], infrastructure: [], sport: [], info: [], general: []
        };

        const tempMaps: Record<SeoCategory, Map<string, string[]>> = {
            highlights: new Map(), tourism: new Map(), accommodation: new Map(),
            infrastructure: new Map(), sport: new Map(), info: new Map(), general: new Map()
        };

        locs.forEach(loc => {
            if (!loc.tags) return;

            SEO_CATEGORIES.forEach(cat => {
                const tags = loc.tags[cat];
                if (Array.isArray(tags)) {
                    tags.forEach(t => {
                        const trimmed = t.trim();
                        if (!trimmed) return;

                        if (!tempMaps[cat].has(trimmed)) {
                            tempMaps[cat].set(trimmed, []);
                        }
                        tempMaps[cat].get(trimmed)?.push(loc.id);
                    });
                }
            });
        });

        SEO_CATEGORIES.forEach(cat => {
            const usages: TagUsage[] = [];
            tempMaps[cat].forEach((ids, tag) => {
                usages.push({ tag, count: ids.length, locationIds: ids });
            });
            // Sort by count descending
            newData[cat] = usages.sort((a, b) => b.count - a.count);
        });

        setTagData(newData);
    };

    const handleEditTag = async (oldTag: string, usage: TagUsage) => {
        const newTag = prompt(`Modifica il tag "${oldTag}" per ${usage.count} località:`, oldTag);
        if (!newTag || newTag === oldTag) return;

        if (!confirm(`Sei sicuro di voler rinominare "${oldTag}" in "${newTag}" su ${usage.count} località?`)) return;

        setAnalyzing(true);
        try {
            const { doc, updateDoc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            // Find existing tag in this category to handle merge
            const existingTargetTag = tagData[activeCategory].find(t => t.tag.toLowerCase() === newTag.toLowerCase());

            let updatedCount = 0;

            for (const locId of usage.locationIds) {
                const locRef = doc(db, 'locations', locId);
                const locSnap = await getDoc(locRef);

                if (locSnap.exists()) {
                    const data = locSnap.data();
                    const currentTags = data.tags?.[activeCategory] || [];

                    // Remove old tag, add new tag
                    // If merging, we just remove old and ensure new is present unique
                    const filteredTags = currentTags.filter((t: string) => t !== oldTag);
                    if (!filteredTags.includes(newTag)) {
                        filteredTags.push(newTag);
                    }

                    await updateDoc(locRef, {
                        [`tags.${activeCategory}`]: filteredTags
                    });
                    updatedCount++;
                }
            }

            alert(`Tag aggiornato con successo su ${updatedCount} località.`);
            fetchData(); // Reload all data to refresh state
        } catch (error) {
            console.error("Error updating tag:", error);
            alert("Errore durante l'aggiornamento dei tag.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDeleteTag = async (tagToDelete: string, usage: TagUsage) => {
        if (!confirm(`ATTENZIONE: Stai per eliminare il tag "${tagToDelete}" da ${usage.count} località. Questa operazione è irreversibile. Procedere?`)) return;

        setAnalyzing(true);
        try {
            const { doc, updateDoc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            let updatedCount = 0;

            for (const locId of usage.locationIds) {
                const locRef = doc(db, 'locations', locId);
                const locSnap = await getDoc(locRef);

                if (locSnap.exists()) {
                    const data = locSnap.data();
                    const currentTags = data.tags?.[activeCategory] || [];

                    const newTags = currentTags.filter((t: string) => t !== tagToDelete);

                    if (newTags.length !== currentTags.length) {
                        await updateDoc(locRef, {
                            [`tags.${activeCategory}`]: newTags
                        });
                        updatedCount++;
                    }
                }
            }

            alert(`Tag eliminato da ${updatedCount} località.`);
            fetchData();
        } catch (error) {
            console.error("Error deleting tag:", error);
            alert("Errore durante l'eliminazione.");
        } finally {
            setAnalyzing(false);
        }
    };



    const wordStats = useMemo(() => {
        const stats: Record<string, number> = {};
        const stopWords = new Set(['e', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'and', 'or', 'the', 'of', 'to', 'for', 'with', 'on', 'at', '&', '-', 'per', 'is']);

        tagData[activeCategory].forEach(usage => {
            // Split by non-alphanumeric chars, but keep accented chars
            const words = usage.tag.toLowerCase().split(/[\s,./()"-]+/);
            words.forEach(w => {
                if (w.length > 2 && !stopWords.has(w) && isNaN(Number(w))) {
                    stats[w] = (stats[w] || 0) + usage.count;
                }
            });
        });

        return Object.entries(stats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50);
    }, [tagData, activeCategory]);

    if (loading) return <div className="p-12 text-center text-slate-500">Analisi tags in corso...</div>;

    const filteredTags = tagData[activeCategory]
        .filter(t => t.tag.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => {
            if (sortOrder === 'count') {
                return b.count - a.count;
            } else {
                return a.tag.localeCompare(b.tag);
            }
        });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Analisi e Gestione Insight SEO</h2>
                    <p className="text-slate-500 text-sm">Raggruppa e normalizza i tag descrittivi (Highlights, Sport, ecc.) usati nelle località.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm"
                >
                    <RefreshCw size={16} className={analyzing ? 'animate-spin' : ''} />
                    Aggiorna Dati
                </button>
            </div>

            {/* Merge Modal */}
            {isMergeModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Merge className="text-indigo-600" size={24} />
                                Unione Multipla ({selectedTags.size})
                            </h3>
                            <button onClick={() => setIsMergeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-6">
                            <p className="text-sm text-slate-600">Stai unendo i seguenti tag:</p>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-100">
                                {Array.from(selectedTags).map(t => (
                                    <span key={t} className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500 font-mono">
                                        {t}
                                    </span>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nuovo nome tag unificato:</label>
                                <input
                                    type="text"
                                    value={mergeTargetName}
                                    onChange={(e) => setMergeTargetName(e.target.value)}
                                    className="w-full px-4 py-2 border-2 border-indigo-100 rounded-lg focus:border-indigo-500 outline-none font-bold text-slate-800"
                                    placeholder="Es. Sci Alpino"
                                    autoFocus
                                />
                                <p className="text-xs text-slate-400 mt-1">Tutte le istanze dei tag selezionati verranno sostituite da questo nuovo nome.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setIsMergeModalOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium text-sm transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleMergeTags}
                                disabled={!mergeTargetName.trim()}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Merge size={16} /> Conferma Unione
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row min-h-[600px] overflow-hidden">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-2 flex flex-col gap-1">
                    {SEO_CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => { setActiveCategory(cat); setFilter(''); setSortOrder('count'); }}
                            className={`flex justify-between items-center px-4 py-3 rounded-lg text-sm font-medium transition-all capitalize ${activeCategory === cat
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                : 'text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            {cat}
                            <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {tagData[cat].length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">


                    <div className="bg-slate-50 border-b border-slate-200 p-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                            <CopyMinus size={12} /> Parole più frequenti (Top 50)
                        </h4>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {wordStats.map(([word, freq]) => (
                                <button
                                    key={word}
                                    onClick={() => setFilter(word)}
                                    className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors flex items-center gap-1 shrink-0"
                                >
                                    <span className="font-medium">{word}</span>
                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded-full">{freq}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Header / Filter */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-white sticky top-0 z-10">
                        <h3 className="font-bold text-slate-800 capitalize flex items-center gap-2 text-lg">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                            {activeCategory}
                        </h3>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Filtra tag..."
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setSortOrder('count')}
                                title="Ordina per frequenza (numerico)"
                                className={`p-1.5 rounded-md transition-all ${sortOrder === 'count' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ArrowDownNarrowWide size={16} />
                            </button>
                            <button
                                onClick={() => setSortOrder('alpha')}
                                title="Ordina alfabeticamente"
                                className={`p-1.5 rounded-md transition-all ${sortOrder === 'alpha' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ArrowDownAZ size={16} />
                            </button>
                        </div>

                        {selectedTags.size >= 2 && (
                            <button
                                onClick={openMergeModal}
                                className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-all animate-in zoom-in"
                            >
                                <Merge size={16} />
                                Unisci ({selectedTags.size})
                            </button>
                        )}
                    </div>


                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 content-start">
                        {analyzing && (
                            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <RefreshCw className="animate-spin text-indigo-600" size={32} />
                                    <p className="font-medium text-slate-600">Applicazione modifiche bulk...</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                            {filteredTags.map((usage, idx) => (
                                <div key={idx} className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${selectedTags.has(usage.tag) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedTags.has(usage.tag)}
                                            onChange={() => toggleSelectTag(usage.tag)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                            {usage.count}
                                        </div>
                                        <div>
                                            <div className="font-medium text-slate-800">{usage.tag}</div>
                                            <div className="text-[10px] text-slate-400 flex gap-1">
                                                Presente in: {usage.locationIds.slice(0, 3).join(', ')} {usage.locationIds.length > 3 ? `+${usage.locationIds.length - 3}` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditTag(usage.tag, usage)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Rinomina in tutte le località"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTag(usage.tag, usage)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Elimina da tutte le località"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {filteredTags.length === 0 && (
                                <div className="text-center py-20 text-slate-400 italic">
                                    Nessun tag trovato con questo filtro.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
