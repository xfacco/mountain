'use client';

import {
    LayoutDashboard,
    LogOut,
    Settings,
    Map,
    Plus,
    Search,
    CheckCircle,
    Trash2,
    Save,
    X,
    ArrowLeft,
    Home,
    Sparkles,
    ExternalLink,
    Layers,
    MessageSquare,
    Mail,
    Activity,
    Columns
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TAG_CATEGORIES } from '@/lib/tags-config';

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('locations');
    const [locations, setLocations] = useState<any[]>([]);
    const [loadingLocs, setLoadingLocs] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const user = sessionStorage.getItem('mountcomp_admin_user');
        if (!user) {
            router.push('/admin/login');
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    // Edit Mode State
    const [editingLocation, setEditingLocation] = useState<any>(null);

    // Load locations from Firestore
    useEffect(() => {
        if (!isAuthenticated) return;
        // Handle URL parameters for deep linking
        const queryParams = new URLSearchParams(window.location.search);
        const tabParam = queryParams.get('tab');
        const locParam = queryParams.get('location');

        if (tabParam === 'ai-tasks') {
            setActiveTab('ai-tasks');
            // We'll handle the location pre-fill via state or passing it down
        }

        const fetchLocations = async () => {
            try {
                const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const q = query(collection(db, 'locations'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const docs = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setLocations(docs);
            } catch (e) {
                console.error("Error fetching locations:", e);
            } finally {
                setLoadingLocs(false);
            }
        };

        if (!editingLocation) {
            fetchLocations();
        }
    }, [activeTab, editingLocation]);

    // Selection & Merge State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const startMerge = () => {
        if (selectedIds.length < 2) return;
        setActiveTab('merge');
    };

    const handleLogout = async () => {
        sessionStorage.removeItem('mountcomp_admin_user');
        router.push('/admin/login');
    };

    const handleDeleteLocation = async (id: string, name: string) => {
        if (!confirm(`Sei sicuro di voler eliminare "${name}"? Questa azione è irreversibile.`)) return;

        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await deleteDoc(doc(db, 'locations', id));

            setLocations(prev => prev.filter(l => l.id !== id));
            alert('Località eliminata con successo.');
        } catch (error) {
            console.error(error);
            alert('Errore durante l\'eliminazione.');
        }
    };

    const handleSaveEdit = async (updatedData: any) => {
        try {
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const finalData = {
                ...updatedData,
                updatedAt: serverTimestamp()
            };
            delete finalData.id; // Don't save ID inside the doc

            await updateDoc(doc(db, 'locations', updatedData.id), finalData);

            setEditingLocation(null); // Close editor
            setActiveTab('locations'); // Refresh list
            alert('Modifiche salvate con successo!');
        } catch (e) {
            console.error("Update Error:", e);
            alert("Errore durante il salvataggio delle modifiche.");
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-10 flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold">M</div>
                    <span className="font-display font-bold text-lg text-slate-800">AdminPanel</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <button
                        onClick={() => { setActiveTab('locations'); setEditingLocation(null); setSelectedIds([]); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'locations' && !editingLocation ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Map size={18} />
                        Gestione Località
                    </button>
                    <button
                        onClick={() => { setActiveTab('ai-tasks'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'ai-tasks' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <LayoutDashboard size={18} />
                        Richieste AI
                    </button>
                    <button
                        onClick={() => { setActiveTab('home-config'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'home-config' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Home size={18} />
                        Configura Home
                    </button>
                    <button
                        onClick={() => { setActiveTab('messages'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'messages' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <MessageSquare size={18} />
                        Messaggi
                    </button>
                    <button
                        onClick={() => { setActiveTab('match-logs'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'match-logs' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Activity size={18} />
                        Log Match
                    </button>
                    <button
                        onClick={() => { setActiveTab('compare-logs'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'compare-logs' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Columns size={18} />
                        Log Comparazioni
                    </button>
                    <button
                        onClick={() => { setActiveTab('search-data'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'search-data' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Search size={18} />
                        Dati Search
                    </button>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
                        <LogOut size={18} />
                        Esci
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                {/* Editor View */}
                {editingLocation ? (
                    <EditLocationView
                        location={editingLocation}
                        onSave={handleSaveEdit}
                        onCancel={() => setEditingLocation(null)}
                    />
                ) : activeTab === 'merge' ? (
                    <MergeTool
                        selectedLocations={locations.filter(l => selectedIds.includes(l.id))}
                        onCancel={() => setActiveTab('locations')}
                        onComplete={() => { setActiveTab('locations'); setSelectedIds([]); }}
                    />
                ) : (
                    <>
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">
                                    {activeTab === 'locations' ? 'Località'
                                        : activeTab === 'messages' ? 'Messaggi Utenti'
                                            : activeTab === 'match-logs' ? 'Log Match AI'
                                                : activeTab === 'compare_logs' ? 'Log Comparazioni'
                                                    : activeTab === 'search-data' ? 'Dati per Motori di Ricerca'
                                                        : 'Motore AI Ricerca'}
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    {activeTab === 'locations' ? 'Gestisci le destinazioni pubblicate.'
                                        : activeTab === 'messages' ? 'Leggi le segnalazioni e le richieste degli utenti.'
                                            : activeTab === 'match-logs' ? 'Vedi cosa cercano gli utenti nel Wizard.'
                                                : activeTab === 'compare-logs' ? 'Vedi quali località vengono messe a confronto.'
                                                    : activeTab === 'search-data' ? 'Elenco località e nazioni (Copia & Incolla).'
                                                        : activeTab === 'ai-tasks' ? 'Estrai nuovi dati dal web tramite Gemini.'
                                                            : 'Modifica i contenuti della Home Page.'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                {selectedIds.length >= 2 && activeTab === 'locations' && (
                                    <button onClick={startMerge} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-opacity-90 font-medium text-sm animate-in fade-in">
                                        <CheckCircle size={16} />
                                        Unisci Selezionati ({selectedIds.length})
                                    </button>
                                )}
                                <button onClick={() => setActiveTab('ai-tasks')} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-opacity-90 font-medium text-sm">
                                    <Plus size={16} />
                                    {activeTab === 'locations' ? 'Nuova Località' : 'Nuova Ricerca'}
                                </button>
                            </div>
                        </header>

                        {activeTab === 'locations' && (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                {/* ... Search Bar ... */}
                                <div className="p-4 border-b border-slate-100 flex gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Cerca località..."
                                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                {loadingLocs ? (
                                    <div className="p-8 text-center text-slate-500">Caricamento località...</div>
                                ) : locations.length === 0 ? (
                                    // ... empty state ...
                                    <div className="p-12 text-center">...</div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                            <tr>
                                                <th className="px-6 py-4 w-10">
                                                    <input type="checkbox"
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedIds(locations.map(l => l.id));
                                                            else setSelectedIds([]);
                                                        }}
                                                        checked={selectedIds.length === locations.length && locations.length > 0}
                                                        className="rounded border-slate-300"
                                                    />
                                                </th>
                                                <th className="px-6 py-4">Nome</th>
                                                <th className="px-6 py-4 text-center">Tag Status</th>
                                                <th className="px-6 py-4 text-center">Servizi</th>
                                                <th className="px-6 py-4">Regione</th>
                                                <th className="px-6 py-4">Stato</th>
                                                <th className="px-6 py-4">Ultima Modifica</th>
                                                <th className="px-6 py-4 text-right">Azioni</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {locations.map((loc) => (
                                                <tr key={loc.id} className={`hover:bg-slate-50/50 ${selectedIds.includes(loc.id) ? 'bg-indigo-50/30' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        <input type="checkbox"
                                                            checked={selectedIds.includes(loc.id)}
                                                            onChange={() => toggleSelection(loc.id)}
                                                            className="rounded border-slate-300"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {loc.seasonalImages ? (
                                                                <div className="grid grid-cols-2 gap-0.5 w-12 h-12 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 flex-shrink-0">
                                                                    {['winter', 'summer', 'autumn', 'spring'].map((s) => (
                                                                        <div key={s} className="w-full h-full">
                                                                            {loc.seasonalImages[s] ? (
                                                                                <img src={loc.seasonalImages[s]} alt={s} className="w-full h-full object-cover" title={`${s.charAt(0).toUpperCase()}${s.slice(1)}`} />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-slate-200" />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : loc.coverImage ? (
                                                                <img src={loc.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0" />
                                                            )}
                                                            <span className="font-medium text-slate-900">{loc.name}</span>
                                                            {loc.aiGenerationMetadata && (
                                                                <span title="Generato da AI" className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">AI</span>
                                                            )}
                                                            <span title="Lingua" className={`text-xs px-1.5 py-0.5 rounded border uppercase font-bold ${loc.language === 'en' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                                {loc.language || 'IT'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center gap-1">
                                                            {['vibe', 'target', 'highlights'].map(tagType => {
                                                                const count = loc.tags?.[tagType]?.length || 0;
                                                                return (
                                                                    <div
                                                                        key={tagType}
                                                                        title={`${tagType}: ${count} tags`}
                                                                        className={`w-2.5 h-2.5 rounded-full ${count > 0 ? 'bg-primary' : 'bg-slate-200'}`}
                                                                    />
                                                                );
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold border border-slate-200" title="Totale servizi/attività">
                                                            <Layers size={12} />
                                                            {loc.services?.length || 0}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                                        {loc.region || 'N/A'}, {loc.country || 'IT'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${loc.status === 'published'
                                                            ? 'bg-green-50 text-green-700 border-green-100'
                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                            }`}>
                                                            <CheckCircle size={12} /> {loc.status === 'published' ? 'Pubblicato' : 'Bozza'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs text-slate-500">
                                                            {loc.updatedAt ? (
                                                                <>
                                                                    <div className="font-bold text-slate-700">
                                                                        {new Date(loc.updatedAt.seconds * 1000).toLocaleDateString('it-IT')}
                                                                    </div>
                                                                    <div>
                                                                        {new Date(loc.updatedAt.seconds * 1000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                                                    </div>
                                                                </>
                                                            ) : loc.createdAt ? (
                                                                <>
                                                                    <div className="font-bold text-slate-700">
                                                                        {new Date(loc.createdAt.seconds * 1000).toLocaleDateString('it-IT')}
                                                                    </div>
                                                                    <div className="text-[10px]">Creazione</div>
                                                                </>
                                                            ) : (
                                                                <span className="italic text-slate-400">N/D</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link
                                                                href={`/locations/${loc.name}`}
                                                                target="_blank"
                                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                                title="Visualizza sul sito"
                                                            >
                                                                <ExternalLink size={18} />
                                                            </Link>
                                                            <Link
                                                                href={`/admin?tab=ai-tasks&location=${encodeURIComponent(loc.name)}`}
                                                                target="_blank"
                                                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                title="Analisi AI (Nuova Scheda)"
                                                            >
                                                                <Sparkles size={18} />
                                                            </Link>
                                                            <button
                                                                onClick={() => setEditingLocation(loc)}
                                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Modifica"
                                                            >
                                                                <Settings size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLocation(loc.id, loc.name)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Elimina"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {activeTab === 'messages' && <MessagesView />}
                        {activeTab === 'match-logs' && <MatchLogsView />}
                        {activeTab === 'compare-logs' && <CompareLogsView />}
                        {activeTab === 'search-data' && <SearchDataView locations={locations} />}
                        {activeTab === 'ai-tasks' && <AITaskRunner />}
                        {activeTab === 'home-config' && <HomeConfigView />}
                    </>
                )}
            </main>
        </div>
    );
}
function MessagesView() {
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);
                const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMessages(docs);
            } catch (e) {
                console.error("Error fetching messages:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminare questo messaggio?')) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await deleteDoc(doc(db, 'contacts', id));
            setMessages(prev => prev.filter(m => m.id !== id));
        } catch (e) {
            alert('Errore eliminazione');
        }
    };

    const getReasonLabel = (reason: string) => {
        const labels: any = {
            bug: 'Errore/Bug',
            info: 'Informazioni',
            new_location: 'Nuova Località',
            other: 'Altro'
        };
        return labels[reason] || reason;
    };

    const getReasonColor = (reason: string) => {
        const colors: any = {
            bug: 'bg-red-50 text-red-700 border-red-100',
            info: 'bg-blue-50 text-blue-700 border-blue-100',
            new_location: 'bg-green-50 text-green-700 border-green-100',
            other: 'bg-slate-50 text-slate-700 border-slate-100'
        };
        return colors[reason] || colors.other;
    };

    if (loading) return <div className="text-center py-20 text-slate-500">Caricamento messaggi...</div>;

    if (messages.length === 0) return (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
            <Mail size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-bold text-slate-900">Nessun messaggio</h3>
            <p className="text-slate-500">I messaggi degli utenti appariranno qui.</p>
        </div>
    );

    return (
        <div className="grid gap-6">
            {messages.map(msg => (
                <div key={msg.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                                {msg.firstName?.[0]}{msg.lastName?.[0]}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{msg.firstName} {msg.lastName}</h3>
                                <p className="text-sm text-slate-500">{msg.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getReasonColor(msg.reason)}`}>
                                {getReasonLabel(msg.reason)}
                            </span>
                            <button
                                onClick={() => handleDelete(msg.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Passioni</span>
                            <p className="text-sm text-slate-700 font-medium">{msg.passions || 'Nessuna passione indicata'}</p>
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Messaggio</span>
                            <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{msg.description}</p>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString() : 'Data non disponibile'}</span>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Ricevuto
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function MergeTool({ selectedLocations, onCancel, onComplete }: { selectedLocations: any[], onCancel: () => void, onComplete: () => void }) {
    const [masterId, setMasterId] = useState<string>(selectedLocations[0]?.id);
    const [fieldSelections, setFieldSelections] = useState<Record<string, string>>({});
    const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

    // Initialize selections when masterId changes
    useEffect(() => {
        if (!masterId) return;

        // Default: all fields come from Master
        const defaults: Record<string, string> = {};
        CATEGORIES.forEach(cat => defaults[cat] = masterId);
        setFieldSelections(defaults);

        // Default: only Master services selected
        const masterLoc = selectedLocations.find(l => l.id === masterId);
        if (masterLoc && masterLoc.services) {
            const ids = new Set(masterLoc.services.map((s: any) => s.id || s.name)); // fallback to name if ID missing
            setSelectedServiceIds(ids as Set<string>);
        }
    }, [masterId, selectedLocations]);

    const masterLoc = selectedLocations.find(l => l.id === masterId);
    if (!masterLoc) return <div>Errore: Master non trovato</div>;

    const sourceLocs = selectedLocations.filter(l => l.id !== masterId);

    const handleMerge = async () => {
        if (!confirm(`Confermi l'unione? \n- ${masterLoc.name} sarà aggiornata.\n- ${sourceLocs.length} località verranno ELIMINATE definitamente.`)) return;

        try {
            const { doc, updateDoc, deleteDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            // 1. Build Final Object
            const finalData: any = { ...masterLoc };

            // Merge Fields
            Object.entries(fieldSelections).forEach(([category, sourceId]) => {
                const source = selectedLocations.find(l => l.id === sourceId);
                if (source) {
                    finalData[category] = source[category];
                }
            });

            // Merge Services
            const allServices = selectedLocations.flatMap(l => l.services || []);
            const finalServices = allServices.filter(s => selectedServiceIds.has(s.id || s.name));
            finalData.services = finalServices;
            finalData.updatedAt = serverTimestamp();

            // 2. Update Master
            const { id, ...dataToSave } = finalData; // exclude ID
            await updateDoc(doc(db, 'locations', masterId), dataToSave);

            // 3. Delete Sources
            for (const source of sourceLocs) {
                await deleteDoc(doc(db, 'locations', source.id));
            }

            alert('Unione completata con successo!');
            onComplete();

        } catch (e) {
            console.error("Merge Error:", e);
            alert("Errore durante l'unione.");
        }
    };

    const toggleService = (id: string) => {
        const newSet = new Set(selectedServiceIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedServiceIds(newSet);
    };

    const toggleAllFromSource = (loc: any, select: boolean) => {
        const newSet = new Set(selectedServiceIds);
        const sourceServiceIds = (loc.services || []).map((s: any) => s.id || s.name);
        sourceServiceIds.forEach((id: string) => {
            if (select) newSet.add(id);
            else newSet.delete(id);
        });
        setSelectedServiceIds(newSet);
    };

    const toggleAllGlobal = (select: boolean) => {
        if (select) {
            const allIds = selectedLocations.flatMap(l => l.services || []).map(s => s.id || s.name);
            setSelectedServiceIds(new Set(allIds));
        } else {
            setSelectedServiceIds(new Set());
        }
    };

    // Categories to merge
    const CATEGORIES = [
        'description', 'profile', 'technicalData', 'accessibility', 'parking', 'localMobility',
        'infoPoints', 'medical', 'advancedSkiing', 'outdoorNonSki', 'family', 'rentals',
        'eventsAndSeasonality', 'gastronomy', 'digital', 'practicalTips', 'openingHours',
        'safety', 'sustainability'
    ];

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">Unisci Località</h1>
                    <p className="text-slate-500">Seleziona i dati migliori da conservare.</p>
                </div>
                <button onClick={handleMerge} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2">
                    <CheckCircle size={18} /> Completa Unione
                </button>
            </div>

            <div className="grid grid-cols-3 gap-8">
                {/* LEFT: Master Selection */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-1 h-fit sticky top-8">
                    <h3 className="font-bold text-slate-900 mb-4">1. Scegli Località Master</h3>
                    <p className="text-xs text-slate-500 mb-4">Questa è la località che verrà mantenuta (e aggiornata). Le altre verranno eliminate.</p>

                    <div className="space-y-3">
                        {selectedLocations.map(loc => (
                            <label key={loc.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${masterId === loc.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                                <input
                                    type="radio"
                                    name="masterBlob"
                                    checked={masterId === loc.id}
                                    onChange={() => setMasterId(loc.id)}
                                    className="text-indigo-600"
                                />
                                <div>
                                    <div className="font-bold text-sm text-slate-900">{loc.name}</div>
                                    <div className="text-xs text-slate-500">{loc.status} • {loc.services?.length || 0} servizi</div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Data Selection */}
                <div className="col-span-2 space-y-8">

                    {/* Categories Comparison */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-6">2. Confronta e Scegli Dati</h3>

                        <div className="space-y-6">
                            {CATEGORIES.map(cat => (
                                <div key={cat} className="p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-xs font-bold uppercase text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">{cat}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Master Option */}
                                        <label className={`cursor-pointer border p-3 rounded-lg transition-all ${fieldSelections[cat] === masterId ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-700">Master</span>
                                                <input
                                                    type="radio" checked={fieldSelections[cat] === masterId}
                                                    onChange={() => setFieldSelections(prev => ({ ...prev, [cat]: masterId }))}
                                                />
                                            </div>
                                            <div className="text-xs text-slate-600 line-clamp-3 overflow-hidden">
                                                {JSON.stringify(masterLoc[cat] || 'N/A')}
                                            </div>
                                        </label>

                                        {/* Source Option(s) - simplified to first source for now if multiple, or list logic needed */}
                                        {sourceLocs.map(source => (
                                            <label key={source.id} className={`cursor-pointer border p-3 rounded-lg transition-all ${fieldSelections[cat] === source.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-xs font-bold text-slate-700">Source: {source.name}</span>
                                                    <input
                                                        type="radio" checked={fieldSelections[cat] === source.id}
                                                        onChange={() => setFieldSelections(prev => ({ ...prev, [cat]: source.id }))}
                                                    />
                                                </div>
                                                <div className="text-xs text-slate-600 line-clamp-3 overflow-hidden">
                                                    {JSON.stringify(source[cat] || 'N/A')}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Services Selection */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-slate-900">3. Unisci Servizi ({selectedServiceIds.size})</h3>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => toggleAllGlobal(true)}
                                    className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    Seleziona Tutti (Global)
                                </button>
                                <button
                                    onClick={() => toggleAllGlobal(false)}
                                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors"
                                >
                                    Pulisci Tutto
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">Seleziona i singoli servizi da includere nel risultato finale.</p>

                        <div className="space-y-4">
                            {selectedLocations.map(loc => (
                                <div key={loc.id} className="border-t border-slate-100 pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className={`text-sm font-bold ${loc.id === masterId ? 'text-green-700' : 'text-slate-700'}`}>
                                            {loc.id === masterId ? 'Da Master' : `Da Source (${loc.name})`}
                                        </h4>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => toggleAllFromSource(loc, true)}
                                                className="text-[10px] font-bold text-indigo-600 hover:underline uppercase"
                                            >
                                                Tutti
                                            </button>
                                            <button
                                                onClick={() => toggleAllFromSource(loc, false)}
                                                className="text-[10px] font-bold text-slate-400 hover:text-red-500 hover:underline uppercase"
                                            >
                                                Nessuno
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(loc.services || []).map((s: any, idx: number) => {
                                            const sId = s.id || s.name; // Use ID or Fallback to Name
                                            const isSelected = selectedServiceIds.has(sId);
                                            return (
                                                <label key={idx} className={`flex items-start gap-2 p-2 rounded border text-sm cursor-pointer hover:bg-slate-50 ${isSelected ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-100'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleService(sId)}
                                                        className="mt-1 text-indigo-600 rounded"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-slate-900">{s.name}</div>
                                                        <div className="text-xs text-slate-500 capitalize">{s.category}</div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// --- Sub-Components ---

function EditLocationView({ location, onSave, onCancel }: { location: any, onSave: (data: any) => void, onCancel: () => void }) {
    const [formData, setFormData] = useState({
        ...location,
        description: location.description || { winter: '', summer: '' },
        services: location.services || [],
        tags: location.tags || { vibe: [], target: [], highlights: [], activities: [] },
        seasonalImages: location.seasonalImages || {
            winter: location.coverImage || '',
            summer: location.coverImage || '',
            spring: location.coverImage || '',
            autumn: location.coverImage || ''
        }
    });

    // AI weights for tags visualization
    const [tagWeights, setTagWeights] = useState<any>(null);

    // UI State for Active Tab inside Editor
    const [editTab, setEditTab] = useState<'general' | 'services'>('general');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('desc_')) {
            const season = name.split('_')[1];
            setFormData({
                ...formData,
                description: { ...formData.description, [season]: value }
            });
        } else if (name.startsWith('img_')) {
            const season = name.split('_')[1];
            setFormData({
                ...formData,
                seasonalImages: { ...formData.seasonalImages, [season]: value }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const toggleTag = (category: string, tagId: string) => {
        const currentTags = formData.tags?.[category] || [];
        const newTags = currentTags.includes(tagId)
            ? currentTags.filter((t: string) => t !== tagId)
            : [...currentTags, tagId];
        setFormData({
            ...formData,
            tags: {
                ...formData.tags,
                [category]: newTags
            }
        });
    };

    // Service Management
    const handleServiceChange = (idx: number, field: string, value: any) => {
        const updatedServices = [...formData.services];
        updatedServices[idx] = { ...updatedServices[idx], [field]: value };
        setFormData({ ...formData, services: updatedServices });
    };

    const handleSeasonToggle = (idx: number, season: string) => {
        const updatedServices = [...formData.services];
        const currentSeasons = updatedServices[idx].seasonAvailability || [];
        if (currentSeasons.includes(season)) {
            updatedServices[idx].seasonAvailability = currentSeasons.filter((s: string) => s !== season);
        } else {
            updatedServices[idx].seasonAvailability = [...currentSeasons, season];
        }
        setFormData({ ...formData, services: updatedServices });
    };

    const addService = () => {
        const newService = {
            id: crypto.randomUUID(),
            name: 'Nuovo Servizio',
            description: '',
            category: 'other',
            seasonAvailability: ['winter', 'summer']
        };
        setFormData({ ...formData, services: [newService, ...formData.services] });
    };

    const removeService = (idx: number) => {
        if (!confirm('Eliminare questo servizio?')) return;
        const updatedServices = [...formData.services];
        updatedServices.splice(idx, 1);
        setFormData({ ...formData, services: updatedServices });
    };

    // AI Tag Generation Logic
    const [generatingWizard, setGeneratingWizard] = useState(false);
    const [generatingSEO, setGeneratingSEO] = useState(false);

    const generateTags = async (mode: 'wizard' | 'seo') => {
        if (mode === 'wizard') setGeneratingWizard(true);
        else setGeneratingSEO(true);

        try {
            const { API_BASE_URL } = await import('@/lib/api');
            const res = await fetch(`${API_BASE_URL}/api/ai/generate-tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location_name: formData.name,
                    description: formData.description,
                    services: formData.services,
                    language: formData.language || 'it',
                    mode: mode
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Server Error ${res.status}: ${errText}`);
            }

            const data = await res.json();
            if (data.status === 'success' && data.data) {
                if (mode === 'wizard') {
                    // Update weights state for UI visualization
                    if (data.data.weights) setTagWeights(data.data.weights);

                    // Update the actual selected tags
                    setFormData((prev: any) => ({
                        ...prev,
                        tags: {
                            ...(prev.tags || {}),
                            ...(data.data.selected || {})
                        }
                    }));
                } else {
                    // SEO Mode
                    setFormData((prev: any) => ({
                        ...prev,
                        tags: {
                            ...(prev.tags || {}),
                            ...data.data
                        }
                    }));
                }
                alert(`${mode === 'wizard' ? 'Tag Wizard' : 'Tag SEO'} generati con successo!`);
            } else {
                alert(`Errore API: ${data.message || 'Sconosciuto'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Errore Generazione: ${e.message}`);
        } finally {
            if (mode === 'wizard') setGeneratingWizard(false);
            else setGeneratingSEO(false);
        }
    };

    // Duplicate & Translate Logic
    const [translating, setTranslating] = useState(false);

    const handleDuplicateTranslate = async () => {
        if (!confirm('Vuoi duplicare questa località e tradurla automaticamente in ITALIANO usando l\'AI?')) return;
        setTranslating(true);
        try {
            // Prepare content to translate
            const contentToTranslate = {
                description: formData.description,
                services: formData.services,
                tags: formData.tags,
                profile: formData.profile || {},
                practicalTips: formData.practicalTips || {},
                safety: formData.safety || {},
                // Add more fields as needed for full translation
            };

            const { API_BASE_URL } = await import('@/lib/api');
            const res = await fetch(`${API_BASE_URL}/api/ai/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: contentToTranslate,
                    target_language: "Italian"
                })
            });

            if (!res.ok) throw new Error('Translation API failed');
            const result = await res.json();

            if (result.status === 'error') throw new Error(result.message);

            const translatedData = result.data;

            // Create new duplicated location
            const newLocation = {
                ...formData,
                ...translatedData, // Overwrite with translated fields
                id: crypto.randomUUID(), // New ID
                name: `${formData.name} (IT)`,
                language: 'it',
                status: 'draft',
                createdAt: new Date().toISOString(),
                aiGenerationMetadata: {
                    ...formData.aiGenerationMetadata,
                    translatedFrom: formData.id,
                    translationEngine: 'Gemini AI',
                    translatedAt: new Date().toISOString()
                }
            };

            // Allow parent component to handle the save of the NEW location
            // Since onSave usually updates the CURRENT one, we might need a direct save here
            const { collection, addDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const docRef = await addDoc(collection(db, 'locations'), newLocation);

            alert('✅ Località duplicata e tradotta! La troverai nella lista come bozza.');
            onCancel(); // Close current editor

        } catch (e: any) {
            console.error("Translation error:", e);
            alert(`Errore traduzione: ${e.message}`);
        } finally {
            setTranslating(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">Modifica {location.name}</h1>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDuplicateTranslate}
                        disabled={translating}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${translating ? 'bg-purple-100 text-purple-400 cursor-not-allowed' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'}`}
                    >
                        {translating ? <span className="animate-spin">⏳</span> : <Sparkles size={16} />}
                        {translating ? 'Traduzione...' : 'Duplica (IT)'}
                    </button>
                    <button onClick={() => setEditTab('general')} className={`px-4 py-2 rounded-lg font-medium text-sm border ${editTab === 'general' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>Generale</button>
                    <button onClick={() => setEditTab('services')} className={`px-4 py-2 rounded-lg font-medium text-sm border ${editTab === 'services' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>Servizi ({formData.services.length})</button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">

                {/* GENERAL TAB */}
                {editTab === 'general' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Località</label>
                                <input name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stato</label>
                                    <select
                                        value={formData.status || 'draft'}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    >
                                        <option value="draft">Bozza</option>
                                        <option value="published">Pubblicato</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Visibilità Frontend</label>
                                    <div className="flex items-center gap-3 mt-2">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.visible ?? false}
                                                onChange={e => setFormData({ ...formData, visible: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            <span className="ml-3 text-sm font-medium text-slate-900">{formData.visible ? 'Visibile' : 'Nascosto'}</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ordine Visualizzazione</label>
                                    <input
                                        type="number"
                                        value={formData.order ?? 0}
                                        onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Regione</label>
                                <input name="region" value={formData.region} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Paese</label>
                                <select
                                    name="country"
                                    value={formData.country || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none bg-white"
                                >
                                    <option value="">Seleziona...</option>
                                    {TAG_CATEGORIES.nations.map(n => (
                                        <option key={n.id} value={n.label}>{n.label}</option>
                                    ))}
                                    <option value="Austria">Austria</option>
                                    <option value="Francia">Francia</option>
                                    <option value="Svizzera">Svizzera</option>
                                    <option value="Germania">Germania</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Lingua</label>
                                <select
                                    name="language"
                                    value={formData.language || 'it'}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none bg-white"
                                >
                                    <option value="it">Italiano (IT)</option>
                                    <option value="en">English (EN)</option>
                                    <option value="de">Deutsch (DE)</option>
                                    <option value="fr">Français (FR)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Altitudine (m)</label>
                                <input
                                    type="number"
                                    value={formData.altitude || ''}
                                    onChange={(e) => setFormData({ ...formData, altitude: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                                    placeholder="Es. 1200"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-700">Coordinate (Gradi Decimali es. 46.1234)</label>
                                    <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(formData.name + ' ' + (formData.region || '') + ' altitudine longitudine latitudine gradi decimali')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                                    >
                                        <Search size={10} /> Cerca dati
                                    </a>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.coordinates?.lat || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                coordinates: { ...formData.coordinates, lat: parseFloat(e.target.value) || 0 }
                                            })}
                                            className="w-full pl-4 pr-8 py-2 border rounded-lg focus:border-primary outline-none"
                                            placeholder="Lat (es. 46.55)"
                                        />
                                        <span className="absolute right-3 top-2 text-slate-400 text-xs font-bold">°N</span>
                                    </div>
                                    <div className="flex-1 relative">
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.coordinates?.lng || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                coordinates: { ...formData.coordinates, lng: parseFloat(e.target.value) || 0 }
                                            })}
                                            className="w-full pl-4 pr-8 py-2 border rounded-lg focus:border-primary outline-none"
                                            placeholder="Lng (es. 11.23)"
                                        />
                                        <span className="absolute right-3 top-2 text-slate-400 text-xs font-bold">°E</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-700">Immagini Stagionali (URL)</label>
                                    <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(formData.name + ' immagini di grandi dimensioni')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                                    >
                                        <Search size={10} /> Cerca immagini HQ
                                    </a>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {['winter', 'spring', 'summer', 'autumn'].map((season) => (
                                        <div key={season}>
                                            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">{season === 'winter' ? 'Inverno' : season === 'spring' ? 'Primavera' : season === 'summer' ? 'Estate' : 'Autunno'}</label>
                                            <div className="flex gap-2">
                                                <input
                                                    name={`img_${season}`}
                                                    value={formData.seasonalImages?.[season] || ''}
                                                    onChange={handleChange}
                                                    className="flex-1 px-3 py-2 border rounded-lg focus:border-primary outline-none text-xs font-mono text-slate-500"
                                                    placeholder={`URL ${season}...`}
                                                />
                                                {(formData.seasonalImages?.[season]) && (
                                                    <img src={formData.seasonalImages[season]} className="w-8 h-8 rounded object-cover border" alt={season} />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">L'immagine 'Inverno' verrà usata come copertina principale se non diversamente specificato.</p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-6">
                            <h3 className="font-bold text-slate-900 mb-4">Descrizioni Stagionali</h3>
                            <div className="grid gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Inverno (Winter)</label>
                                    <textarea name="desc_winter" value={formData.description.winter} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-primary outline-none h-32 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Estate (Summer)</label>
                                    <textarea name="desc_summer" value={formData.description.summer} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-primary outline-none h-32 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Autunno (Autumn)</label>
                                    <textarea name="desc_autumn" value={formData.description.autumn || ''} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-primary outline-none h-32 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Primavera (Spring)</label>
                                    <textarea name="desc_spring" value={formData.description.spring || ''} onChange={handleChange} className="w-full px-4 py-3 border rounded-lg focus:border-primary outline-none h-32 resize-none" />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-bold text-slate-900">Tags & Caratteristiche</h3>
                            <p className="text-xs text-slate-500">Gestisci i tag per l'algoritmo e per la SEO.</p>
                        </div>
                        <div className="space-y-8">
                            {/* Wizard Match Tags (Strict 1-to-1) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                                <div className="col-span-full mb-2 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <Sparkles size={16} /> Configurazione Match Wizard (1-a-1)
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1">Questi tag attivano direttamente l'algoritmo di abbinamento intelligente.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => generateTags('wizard')}
                                        disabled={generatingWizard}
                                        className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 font-bold hover:bg-primary/20 flex items-center gap-2 transition-colors uppercase tracking-wider"
                                    >
                                        {generatingWizard ? 'Analisi...' : '✨ Autoconfigura Wizard'}
                                    </button>
                                </div>

                                {/* Vibe Selection */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Vibe / Atmosfera</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TAG_CATEGORIES.vibe.map(tag => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => toggleTag('vibe', tag.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-between gap-2 ${formData.tags?.vibe?.includes(tag.id)
                                                    ? 'bg-primary text-white border-primary shadow-md'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/30'
                                                    }`}
                                            >
                                                {tag.label}
                                                {tagWeights?.vibe?.[tag.id] !== undefined && (
                                                    <span className={`text-[9px] px-1 rounded-sm ${formData.tags?.vibe?.includes(tag.id) ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                                                        {tagWeights.vibe[tag.id]}%
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Target Selection */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Target Utente</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TAG_CATEGORIES.target.map(tag => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => toggleTag('target', tag.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-between gap-2 ${formData.tags?.target?.includes(tag.id)
                                                    ? 'bg-primary text-white border-primary shadow-md'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/30'
                                                    }`}
                                            >
                                                {tag.label}
                                                {tagWeights?.target?.[tag.id] !== undefined && (
                                                    <span className={`text-[9px] px-1 rounded-sm ${formData.tags?.target?.includes(tag.id) ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                                                        {tagWeights.target[tag.id]}%
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Activities Match */}
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Attività Chiave</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TAG_CATEGORIES.activities.map(tag => (
                                            <button
                                                key={tag.id}
                                                type="button"
                                                onClick={() => toggleTag('activities', tag.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-between gap-2 ${formData.tags?.activities?.includes(tag.id)
                                                    ? 'bg-primary text-white border-primary shadow-md'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/30'
                                                    }`}
                                            >
                                                {tag.label}
                                                {tagWeights?.activities?.[tag.id] !== undefined && (
                                                    <span className={`text-[9px] px-1 rounded-sm ${formData.tags?.activities?.includes(tag.id) ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                                                        {tagWeights.activities[tag.id]}%
                                                    </span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* SEO & Extra Tags (Free Text) */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-full flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Tag SEO & Approfondimenti (Testo Libero)</h4>
                                    <button
                                        type="button"
                                        onClick={() => generateTags('seo')}
                                        disabled={generatingSEO}
                                        className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 font-bold hover:bg-slate-200 flex items-center gap-2 transition-colors uppercase tracking-wider"
                                    >
                                        {generatingSEO ? 'Generazione...' : '✨ Estrai Parole Chiave SEO'}
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Highlights</label>
                                    <input
                                        value={formData.tags?.highlights?.join(', ') || ''}
                                        onChange={(e) => setFormData({ ...formData, tags: { ...formData.tags, highlights: e.target.value.split(',').map(s => s.trim()) } })}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                                        placeholder="Es. Spa, Ghiacciaio..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tag Attività (Tourism)</label>
                                    <input
                                        value={formData.tags?.tourism?.join(', ') || ''}
                                        onChange={(e) => setFormData({ ...formData, tags: { ...formData.tags, tourism: e.target.value.split(',').map(s => s.trim()) } })}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                                        placeholder="Es. Freeride, MTB..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tag Ospitalità (Accom.)</label>
                                    <input
                                        value={formData.tags?.accommodation?.join(', ') || ''}
                                        onChange={(e) => setFormData({ ...formData, tags: { ...formData.tags, accommodation: e.target.value.split(',').map(s => s.trim()) } })}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                                        placeholder="Es. Lusso, Glamping..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tag Impianti (Infrastr.)</label>
                                    <input
                                        value={formData.tags?.infrastructure?.join(', ') || ''}
                                        onChange={(e) => setFormData({ ...formData, tags: { ...formData.tags, infrastructure: e.target.value.split(',').map(s => s.trim()) } })}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                                        placeholder="Es. Skibus, Funivia..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tag Sport</label>
                                    <input
                                        value={formData.tags?.sport?.join(', ') || ''}
                                        onChange={(e) => setFormData({ ...formData, tags: { ...formData.tags, sport: e.target.value.split(',').map(s => s.trim()) } })}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                                        placeholder="Es. Tennis, Nuoto..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tag Info</label>
                                    <input
                                        value={formData.tags?.info?.join(', ') || ''}
                                        onChange={(e) => setFormData({ ...formData, tags: { ...formData.tags, info: e.target.value.split(',').map(s => s.trim()) } })}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                                        placeholder="Es. App, Guide..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tag Generali</label>
                                    <input
                                        value={formData.tags?.general?.join(', ') || ''}
                                        onChange={(e) => setFormData({ ...formData, tags: { ...formData.tags, general: e.target.value.split(',').map(s => s.trim()) } })}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                                        placeholder="Es. Storico, Panoramico..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SERVICES TAB */}
                {editTab === 'services' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                            <p className="text-sm text-slate-600">Gestisci i singoli servizi offerti dalla località.</p>
                            <button onClick={addService} className="text-sm bg-slate-900 text-white px-3 py-2 rounded-lg font-bold hover:bg-slate-800 flex items-center gap-2">
                                <Plus size={16} /> Aggiungi Servizio
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.services.map((service: any, idx: number) => (
                                <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:border-primary/30 transition-colors bg-slate-50/30">
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <input
                                                value={service.name}
                                                onChange={(e) => handleServiceChange(idx, 'name', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md text-sm font-bold placeholder-slate-400"
                                                placeholder="Nome Servizio"
                                            />
                                            <select
                                                value={service.category}
                                                onChange={(e) => handleServiceChange(idx, 'category', e.target.value)}
                                                className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                                            >
                                                <option value="tourism">Attività / Turismo</option>
                                                <option value="accommodation">Ospitalità</option>
                                                <option value="infrastructure">Impianti / Trasporti</option>
                                                <option value="essential">Servizi Essenziali</option>
                                                <option value="sport">Sport</option>
                                                <option value="info">Informazioni</option>
                                                <option value="general">Generale</option>
                                            </select>
                                            <textarea
                                                value={service.description}
                                                onChange={(e) => handleServiceChange(idx, 'description', e.target.value)}
                                                className="col-span-2 w-full px-3 py-2 border rounded-md text-sm h-16 resize-none placeholder-slate-400"
                                                placeholder="Descrizione breve..."
                                            />
                                            <div className="col-span-2 flex gap-4 items-center">
                                                <span className="text-xs font-bold uppercase text-slate-400">Stagioni:</span>
                                                {['winter', 'summer', 'autumn', 'spring'].map(season => (
                                                    <label key={season} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={service.seasonAvailability?.includes(season)}
                                                            onChange={() => handleSeasonToggle(idx, season)}
                                                            className="rounded text-primary focus:ring-primary"
                                                        />
                                                        <span className="capitalize">{season}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={() => removeService(idx)} className="text-slate-400 hover:text-red-600 p-2">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-slate-100">
                    <button onClick={onCancel} className="px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors">
                        Annulla
                    </button>
                    <button onClick={() => onSave(formData)} className="px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-opacity-90 transition-colors flex items-center gap-2">
                        <Save size={18} /> Salva Modifiche
                    </button>
                </div>
            </div>
        </div>
    );
}

function AITaskRunner() {
    const [targetLocation, setTargetLocation] = useState('');

    // Handle pre-filled location from URL
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const locParam = queryParams.get('location');
        if (locParam) {
            setTargetLocation(locParam);
        }
    }, []);

    const [customInstructions, setCustomInstructions] = useState('');
    // const [language, setLanguage] = useState<'it' | 'en'>('it'); // Removed: Force EN by default via Backend Prompt
    const language = 'en'; // Hardcode internal logic to EN for consistency
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading) {
            setTimer(0);
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const [showPromptPreview, setShowPromptPreview] = useState(false);
    const [finalPrompt, setFinalPrompt] = useState('');
    const [existingLocationId, setExistingLocationId] = useState<string | null>(null);

    // Step 1: Check DB and Prepare Prompt
    const prepareResearch = async () => {
        if (!targetLocation) return;
        setLoading(true); // Temporary loading state during check

        try {
            const { collection, getDocs, query, where } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            // Check if location exists
            // Check if location exists for the SELECTED LANGUAGE
            // Note: If 'language' is undefined in DB, we assume it's IT (legacy)
            const q = query(collection(db, 'locations'), where('name', '==', targetLocation));
            const snapshot = await getDocs(q);

            // Client-side filtering for language to handle missing fields (legacy data)
            const exactMatch = snapshot.docs.find(doc => {
                const data = doc.data();
                const dbLang = data.language || 'it'; // Default to 'it' if missing
                return dbLang === language;
            });

            let promptInstructions = customInstructions;

            // Language Directive REMOVED (Handled by Backend Default Prompt now)
            // if (language === 'en') ...

            if (exactMatch) {
                const existingData = exactMatch.data();
                setExistingLocationId(exactMatch.id);

                // Alert handled by UI logic (showing preview with warning)
                if (!confirm(`⚠️ ATTENZIONE: "${targetLocation}" è già presente nel DB (Lingua: ${language.toUpperCase()})!\n\nVuoi procedere analizzando SOLO i servizi mancanti?`)) {
                    setLoading(false);
                    return;
                }

                const existingServices = existingData.services?.map((s: any) => s.name) || [];

                if (existingServices.length > 0) {
                    const exclusionText = `\n\nIMPORTANTE - ESCLUSIONI:\nLa località è già presente nel database con alcuni servizi. \nNON includere o duplicare i seguenti servizi già salvati (ignorali completamente e trovane di nuovi o approfondisci categorie diverse):\n- ${existingServices.join('\n- ')}`;
                    promptInstructions += exclusionText;
                }
            } else {
                setExistingLocationId(null);
            }

            setFinalPrompt(promptInstructions);
            setShowPromptPreview(true); // Show Preview Step

        } catch (e: any) {
            console.error("Error checking DB:", e);
            alert(`Errore durante la verifica della località: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Execute AI Request with Final Prompt
    const executeResearch = async () => {
        setShowPromptPreview(false);
        setLoading(true);
        setResult(null);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 240000); // 240s

            const { API_BASE_URL } = await import('@/lib/api');
            const res = await fetch(`${API_BASE_URL}/api/ai/research`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    location_name: targetLocation,
                    user_instructions: finalPrompt // Use the prepared prompt with exclusions
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            const data = await res.json();
            if (data.status === 'error') throw new Error(data.message);
            setResult(data);
        } catch (error) {
            console.error(error);
            alert('Errore durante la ricerca AI.');
        } finally {
            setLoading(false);
        }
    };

    const saveToDatabase = async () => {
        if (!result || !result.data) return;
        try {
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const mappedServices = (result.data.services || []).map((s: any) => ({
                ...s,
                id: crypto.randomUUID(),
                locationId: 'temp_id',
                metadata: { source: 'ai-generated' }
            }));

            const locationData = {
                name: result.data.name,
                region: 'Da verificare',
                country: 'Italia',
                coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba',
                description: result.data.description || {},
                services: mappedServices,
                tags: result.data.tags || { vibe: [], target: [], highlights: [] },
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: 'draft',
                visible: false,
                order: 0,
                dataVersion: result.data.version || 'v2.0',
                aiGenerationMetadata: {
                    userInstructions: customInstructions || 'Standard Full Analysis',
                    generatedAt: new Date().toISOString(),
                    engine: 'Gemini AI'
                },
                profile: result.data.profile || {},
                technicalData: result.data.technicalData || {},
                accessibility: result.data.accessibility || {},
                parking: result.data.parking || {},
                localMobility: result.data.localMobility || {},
                infoPoints: result.data.infoPoints || {},
                medical: result.data.medical || {},
                advancedSkiing: result.data.advancedSkiing || {},
                outdoorNonSki: result.data.outdoorNonSki || {},
                family: result.data.family || {},
                rentals: result.data.rentals || {},
                eventsAndSeasonality: result.data.eventsAndSeasonality || {},
                gastronomy: result.data.gastronomy || {},
                digital: result.data.digital || {},
                practicalTips: result.data.practicalTips || {},
                openingHours: result.data.openingHours || {},
                safety: result.data.safety || {},
                sustainability: result.data.sustainability || {},
                language: language // Save the selected language (it or en)
            };

            await addDoc(collection(db, 'locations'), locationData);
            alert(`✅ ${result.data.name} salvata nel database.`);
            setResult(null); setTargetLocation(''); setCustomInstructions('');

        } catch (e) {
            console.error("Error saving to DB:", e);
            alert("Errore durante il salvataggio.");
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-2xl">
            {/* ... inputs ... */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Località Target</label>
                <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="Es. Cortina d'Ampezzo..."
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary outline-none"
                />
            </div>



            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Istruzioni Speciali per l'AI</label>
                <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Es. Focus su hotel..."
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-primary outline-none h-24 resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">Lascia vuoto per standard.</p>
            </div>
            <button
                onClick={prepareResearch}
                disabled={!targetLocation || loading}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-opacity-90 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {loading ? (
                    <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analisi in corso... {timer}s
                    </span>
                ) : 'Avvia Analisi AI'}
            </button>

            {/* PROMPT PREVIEW MODAL */}
            {showPromptPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 flex flex-col max-h-[90vh]">
                        <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="text-blue-600" size={24} /> Conferma Prompt AI
                        </h3>
                        <p className="text-slate-600 mb-4">Ecco le istruzioni esatte che verranno inviate all'IA. Puoi modificarle se necessario.</p>

                        <div className="flex-1 overflow-y-auto min-h-[200px] border rounded-xl p-4 bg-slate-50 mb-6 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                            <textarea
                                value={finalPrompt}
                                onChange={(e) => setFinalPrompt(e.target.value)}
                                className="w-full h-full bg-transparent outline-none resize-none"
                                rows={10}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowPromptPreview(false)}
                                className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={executeResearch}
                                className="px-6 py-3 rounded-xl font-bold bg-primary text-white hover:bg-opacity-90 transition-colors flex items-center gap-2"
                            >
                                <CheckCircle size={18} /> Conferma e Invia
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {result && result.data && (
                <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <CheckCircle className="text-green-500" size={20} />
                                Analisi Completata
                            </h3>
                            <p className="text-slate-500 text-sm">
                                Estratti {result.data.services?.length || 0} servizi.
                            </p>
                        </div>
                        <button
                            onClick={saveToDatabase}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                        >
                            Salva nel DB
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function HomeConfigView() {
    const [config, setConfig] = useState<any>({
        heroTitle: '',
        heroSubtitle: '',
        heroImages: {
            winter: '',
            summer: '',
            spring: '',
            autumn: ''
        }
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');
                const docRef = doc(db, 'settings', 'home');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setConfig(docSnap.data() as any);
                } else {
                    // Defaults
                    setConfig({
                        heroTitle: 'Scopri la tua <br /> Montagna Ideale',
                        heroSubtitle: 'Il primo comparatore intelligente per località montane.',
                        heroImages: {
                            winter: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80',
                            summer: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80',
                            spring: 'https://images.unsplash.com/photo-1490750967868-58cb75065ed2?auto=format&fit=crop&q=80',
                            autumn: 'https://images.unsplash.com/photo-1507041957456-9c3d40e84758?auto=format&fit=crop&q=80'
                        }
                    });
                }
            } catch (e) {
                console.error("Error fetching home config:", e);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await setDoc(doc(db, 'settings', 'home'), config);
            alert('Configurazione Home salvata con successo!');
        } catch (e) {
            console.error("Error saving home config:", e);
            alert("Errore durante il salvataggio.");
        }
    };

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Configurazione Hero (Slide)</h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Titolo Principale (HTML supportato, es. &lt;br/&gt;)</label>
                    <input
                        value={config.heroTitle}
                        onChange={e => setConfig({ ...config, heroTitle: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sottotitolo</label>
                    <textarea
                        value={config.heroSubtitle}
                        onChange={e => setConfig({ ...config, heroSubtitle: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none h-20 resize-none"
                    />
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-900 mb-4">Sfondi Stagionali (URL)</h3>
                    <div className="grid grid-cols-2 gap-6">
                        {['winter', 'spring', 'summer', 'autumn'].map((season) => (
                            <div key={season}>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-2 capitalize">{season}</label>
                                <div className="space-y-2">
                                    <input
                                        value={config.heroImages?.[season] || ''}
                                        onChange={e => setConfig({
                                            ...config,
                                            heroImages: { ...config.heroImages, [season]: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm text-slate-600 font-mono"
                                        placeholder={`URL per ${season}`}
                                    />
                                    {config.heroImages?.[season] && (
                                        <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border">
                                            <img src={config.heroImages[season]} className="w-full h-full object-cover" alt={season} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100">
                    <button
                        onClick={handleSave}
                        className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Save size={18} /> Salva Configurazione
                    </button>
                </div>
            </div>
        </div>
    );
}

function MatchLogsView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { collection, getDocs, orderBy, query, limit } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');
                const q = query(collection(db, 'match_logs'), orderBy('timestamp', 'desc'), limit(50));
                const snap = await getDocs(q);
                setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento log...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Preferenze</th>
                        <th className="px-6 py-4">Top Result</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {logs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'N/A'}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {Object.entries(log.preferences || {}).map(([key, val]: [string, any]) => (
                                        Array.isArray(val) && val.length > 0 && (
                                            <div key={key} className="bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                                                <span className="font-bold text-slate-400 mr-1 uppercase">{key}:</span>
                                                <span className="text-slate-700">{val.join(', ')}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {log.results?.[0] ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                                            {log.results[0].score}%
                                        </div>
                                        <span className="font-bold text-slate-900">{log.results[0].name}</span>
                                    </div>
                                ) : '-'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CompareLogsView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { collection, getDocs, orderBy, query, limit } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');
                // Increase limit to get better statistics
                const q = query(collection(db, 'compare_logs'), orderBy('timestamp', 'desc'), limit(500));
                const snap = await getDocs(q);
                setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const aggregatedLogs = useMemo(() => {
        const groups: Record<string, any> = {};

        logs.forEach(log => {
            const names = (log.locations || []).map((l: any) => l.name).sort();
            const key = names.length > 0 ? names.join(' + ') : 'Nessuna località';

            if (!groups[key]) {
                groups[key] = {
                    key,
                    names: names,
                    count: 0,
                    lastSeen: log.timestamp,
                    seasons: new Set()
                };
            }

            groups[key].count += 1;
            groups[key].seasons.add(log.season);

            if (log.timestamp?.seconds && (!groups[key].lastSeen?.seconds || log.timestamp.seconds > groups[key].lastSeen.seconds)) {
                groups[key].lastSeen = log.timestamp;
            }
        });

        return Object.values(groups).sort((a: any, b: any) => b.count - a.count);
    }, [logs]);

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento statistiche comparazioni...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm">Classifica Comparazioni (Top {aggregatedLogs.length})</h3>
                <span className="text-[10px] text-slate-400 font-medium">Analizzati {logs.length} log recenti</span>
            </div>
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                        <th className="px-6 py-4 w-16">Rank</th>
                        <th className="px-6 py-4">Località Comparate</th>
                        <th className="px-6 py-4 text-center">Frequenza</th>
                        <th className="px-6 py-4">Stagioni</th>
                        <th className="px-6 py-4 text-right">Ultima Ricerca</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {aggregatedLogs.map((log: any, idx) => (
                        <tr key={log.key} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                    idx === 1 ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                        idx === 2 ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                            'bg-slate-50 text-slate-400'
                                    }`}>
                                    {idx + 1}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-2">
                                    {log.names.map((name: string, i: number) => (
                                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                                            {name}
                                        </div>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-primary/10 text-primary rounded-full font-black text-xs">
                                    {log.count}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-1">
                                    {Array.from(log.seasons).map((s: any) => (
                                        <span key={s} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-bold uppercase border border-slate-200">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap text-slate-500 text-xs">
                                {log.lastSeen?.toDate ? log.lastSeen.toDate().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function SearchDataView({ locations }: { locations: any[] }) {
    const [selectedCountry, setSelectedCountry] = useState<string>('all');

    const countries = useMemo(() => {
        const unique = new Set(locations.map(loc => loc.country || 'Italia'));
        return Array.from(unique).sort();
    }, [locations]);

    const filteredLocations = useMemo(() => {
        if (selectedCountry === 'all') return locations;
        return locations.filter(loc => (loc.country || 'Italia') === selectedCountry);
    }, [locations, selectedCountry]);

    const textData = useMemo(() => {
        return filteredLocations
            .map(loc => `${loc.name}, ${loc.country || 'Italia'}`)
            .sort((a, b) => a.localeCompare(b)) // Alphabetical order
            .join('\n');
    }, [filteredLocations]);

    const handleCopy = () => {
        if (!textData) return;
        navigator.clipboard.writeText(textData);
        alert(`Copiati ${filteredLocations.length} risultati negli appunti!`);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 h-[calc(100vh-250px)] flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Elenco Località</h3>
                        <p className="text-sm text-slate-500">Formato: Nome, Nazione</p>
                    </div>

                    <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-primary"
                    >
                        <option value="all">Tutti i paesi ({locations.length})</option>
                        {countries.map(country => (
                            <option key={country} value={country}>
                                {country} ({locations.filter(l => (l.country || 'Italia') === country).length})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {filteredLocations.length} Risultati
                    </span>
                    <button
                        onClick={handleCopy}
                        disabled={filteredLocations.length === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                        <Save size={18} /> Copia questi dati
                    </button>
                </div>
            </div>

            <textarea
                readOnly
                value={textData}
                placeholder="Nessun dato disponibile per questa selezione."
                className="flex-1 w-full p-6 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-sm leading-relaxed focus:outline-none resize-none"
            />
        </div>
    );
}
