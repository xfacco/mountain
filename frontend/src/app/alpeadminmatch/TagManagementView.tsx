
'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Edit2, Check, RefreshCw } from 'lucide-react';
import { TAG_CATEGORIES } from '@/lib/tags-config';

interface Tag {
    id: string;
    label: string;
}

interface TagConfig {
    vibe: Tag[];
    target: Tag[];
    activities: Tag[];
    nations: Tag[];
}

export default function TagManagementView({ onUpdate }: { onUpdate?: () => void }) {
    const [config, setConfig] = useState<TagConfig>({
        vibe: [],
        target: [],
        activities: [],
        nations: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeCategory, setActiveCategory] = useState<keyof TagConfig>('vibe');

    // Load from Firestore
    useEffect(() => {
        const loadTags = async () => {
            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const docRef = doc(db, 'system_configs', 'tags');
                const snap = await getDoc(docRef);

                if (snap.exists()) {
                    const data = snap.data();
                    setConfig({
                        vibe: data.vibe || [...TAG_CATEGORIES.vibe],
                        target: data.target || [...TAG_CATEGORIES.target],
                        activities: data.activities || [...TAG_CATEGORIES.activities],
                        nations: data.nations || [...TAG_CATEGORIES.nations],
                        // Preserve any other categories already in DB
                        ...data
                    });
                } else {
                    // Fallback to static config if no DB config exists
                    setConfig({
                        vibe: [...TAG_CATEGORIES.vibe],
                        target: [...TAG_CATEGORIES.target],
                        activities: [...TAG_CATEGORIES.activities],
                        nations: [...TAG_CATEGORIES.nations]
                    });
                }
            } catch (error) {
                console.error("Error loading tags:", error);
                // Fallback on error
                setConfig({
                    vibe: [...TAG_CATEGORIES.vibe],
                    target: [...TAG_CATEGORIES.target],
                    activities: [...TAG_CATEGORIES.activities],
                    nations: [...TAG_CATEGORIES.nations]
                });
            } finally {
                setLoading(false);
            }
        };

        loadTags();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            await setDoc(doc(db, 'system_configs', 'tags'), config);
            alert('Configurazione tag salvata con successo!');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Error saving tags:", error);
            alert('Errore durante il salvataggio.');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (!confirm('Sei sicuro? Questo ripristinerà i tag ai valori predefiniti del sistema (hardcoded).')) return;
        setConfig({
            vibe: [...TAG_CATEGORIES.vibe],
            target: [...TAG_CATEGORIES.target],
            activities: [...TAG_CATEGORIES.activities],
            nations: [...TAG_CATEGORIES.nations]
        });
    };

    const addTag = (category: keyof TagConfig) => {
        const label = prompt('Etichetta del nuovo tag (es. "Avventura"):');
        if (!label) return;

        // Simple ID generation from label
        const id = label.toLowerCase().replace(/[^a-z0-9]/g, '');

        setConfig(prev => {
            // Ensure ID is unique
            if (prev[category].some(t => t.id === id)) {
                alert('Esiste già un tag con questo ID.');
                return prev;
            }
            return {
                ...prev,
                [category]: [...prev[category], { id, label }]
            };
        });
    };

    const editTag = (category: keyof TagConfig, index: number) => {
        const tag = config[category][index];
        const newLabel = prompt('Nuova etichetta:', tag.label);
        if (newLabel === null || newLabel === tag.label) return;

        setConfig(prev => {
            const newList = [...prev[category]];
            newList[index] = { ...newList[index], label: newLabel };
            return { ...prev, [category]: newList };
        });
    };

    const deleteTag = (category: keyof TagConfig, index: number) => {
        if (!confirm('Sei sicuro di voler eliminare questo tag? Le località che lo usano potrebbero avere dati inconsistenti.')) return;

        setConfig(prev => ({
            ...prev,
            [category]: prev[category].filter((_, i) => i !== index)
        }));
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento configurazione...</div>;

    const categoryLabels: Record<keyof TagConfig, string> = {
        vibe: 'Atmosfera / Vibe',
        target: 'Target / Clientela',
        activities: 'Attività',
        nations: 'Nazioni'
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Gestione Tag e Categorie</h2>
                    <p className="text-slate-500 text-sm">Modifica i gruppi di tag disponibili nell'applicazione.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                        <RefreshCw size={16} />
                        Ripristina Default
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm disabled:opacity-70"
                    >
                        <Save size={16} />
                        {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                {/* Sidebar Categories */}
                <div className="w-full md:w-64 border-r border-slate-100 bg-slate-50/50 p-2 space-y-1">
                    {(Object.keys(categoryLabels) as Array<keyof TagConfig>).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all flex justify-between items-center ${activeCategory === cat
                                ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                : 'text-slate-600 hover:bg-white/50'
                                }`}
                        >
                            {categoryLabels[cat]}
                            <span className="bg-slate-100 text-slate-500 text-[10px] px-1.5 py-0.5 rounded-full border border-slate-200">
                                {config[cat].length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            Gestione {categoryLabels[activeCategory]}
                        </h3>
                        <button
                            onClick={() => addTag(activeCategory)}
                            className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-md hover:bg-slate-800 flex items-center gap-1 font-bold"
                        >
                            <Plus size={14} /> Aggiungi Tag
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {config[activeCategory].map((tag, idx) => (
                            <div key={`${tag.id}-${idx}`} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg hover:border-indigo-100 hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs font-mono text-slate-400">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm">{tag.label}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">ID: {tag.id}</div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => editTag(activeCategory, idx)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                        title="Modifica Label"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteTag(activeCategory, idx)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                        title="Elimina"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {config[activeCategory].length === 0 && (
                            <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                Nessun tag in questa categoria.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
