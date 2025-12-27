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
    Activity,
    Columns,
    ChevronUp,
    ChevronDown,
    MessageSquare,
    Link as ShareIcon,
    Mail,
    Check,
    Tags,
    AlertTriangle,
    HelpCircle,
    Info,
    Heart
} from 'lucide-react';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TAG_CATEGORIES } from '@/lib/tags-config';
import { locationNameToSlug } from '@/lib/url-utils';
import TagManagementView from './TagManagementView';
import SeoInsightsManager from './SeoInsightsManager';
import DuplicateTagsInspector from './DuplicateTagsInspector';

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Caricamento...</div>}>
            <AdminDashboard />
        </Suspense>
    );
}

function AdminDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState('locations');
    const [locations, setLocations] = useState<any[]>([]);
    const [loadingLocs, setLoadingLocs] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
    const [systemTags, setSystemTags] = useState(TAG_CATEGORIES);

    const fetchSystemTags = async () => {
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const snap = await getDoc(doc(db, 'system_configs', 'tags'));
            if (snap.exists()) {
                setSystemTags(prev => ({ ...prev, ...snap.data() }));
            }
        } catch (e) {
            console.error("Error fetching tags", e);
        }
    };

    useEffect(() => {
        if (isAuthenticated) fetchSystemTags();
    }, [isAuthenticated]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredLocations = useMemo(() => {
        let items = [...locations];

        // Search filter
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            items = items.filter(loc =>
                (loc.name?.toLowerCase().includes(lowSearch)) ||
                (loc.region?.toLowerCase().includes(lowSearch)) ||
                (loc.country?.toLowerCase().includes(lowSearch))
            );
        }

        // Sort
        if (sortConfig) {
            items.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                // Handle special cases
                if (sortConfig.key === 'updatedAt') {
                    aVal = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
                    bVal = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
                } else if (sortConfig.key === 'services') {
                    aVal = a.services?.length || 0;
                    bVal = b.services?.length || 0;
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return items;
    }, [locations, searchTerm, sortConfig]);

    useEffect(() => {
        const user = sessionStorage.getItem('mountcomp_admin_user');
        if (!user) {
            const currentPath = window.location.pathname;
            const currentSearch = window.location.search;
            const redirectUrl = encodeURIComponent(`${currentPath}${currentSearch}`);
            router.push(`/alpeadminmatch/login?redirect=${redirectUrl}`);
        } else {
            setIsAuthenticated(true);
        }
    }, [router]);

    // Edit Mode State
    const [editingLocation, setEditingLocation] = useState<any>(null);

    // Handle deep linking from URL search params
    useEffect(() => {
        if (!isAuthenticated) return;

        const tabParam = searchParams.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [searchParams, isAuthenticated]);

    // Load locations from Firestore
    useEffect(() => {
        if (!isAuthenticated) return;

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
    }, [activeTab, editingLocation, isAuthenticated]);

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
        router.push('/alpeadminmatch/login');
    };

    const handleStartEdit = async (loc: any) => {
        try {
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            // Fetch heavy data
            const heavyDocSnap = await getDoc(doc(db, 'location_details', loc.id));

            if (heavyDocSnap.exists()) {
                const heavyData = heavyDocSnap.data();
                setEditingLocation({ ...loc, ...heavyData });
            } else {
                // If it doesn't exist (legacy/existing data not yet split), just use loc data
                // This allows smooth transition for existing records
                setEditingLocation(loc);
            }
        } catch (e) {
            console.error("Error fetching heavy data:", e);
            setEditingLocation(loc);
        }
    };

    const handleDeleteLocation = async (id: string, name: string) => {
        if (!confirm(`Sei sicuro di voler eliminare "${name}"? Questa azione è irreversibile.`)) return;

        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            // Delete both light and heavy documents
            await deleteDoc(doc(db, 'locations', id));
            await deleteDoc(doc(db, 'location_details', id));

            setLocations(prev => prev.filter(l => l.id !== id));
            alert('Località eliminata con successo.');
        } catch (error) {
            console.error(error);
            alert('Errore durante l\'eliminazione.');
        }
    };

    const handleSaveEdit = async (updatedData: any) => {
        try {
            const { doc, updateDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const heavyFields = [
                'services', 'technicalData', 'accessibility',
                'parking', 'localMobility', 'infoPoints', 'medical',
                'advancedSkiing', 'outdoorNonSki', 'family', 'rentals',
                'eventsAndSeasonality', 'gastronomy', 'digital', 'practicalTips',
                'openingHours', 'safety', 'sustainability',
                'aiGenerationMetadata', 'profile', 'tagWeights'
            ];

            const lightData: any = { updatedAt: serverTimestamp() };
            const heavyData: any = { updatedAt: serverTimestamp() };

            // Ensure all tag categories exist
            if (updatedData.tags) {
                const requiredCategories = ['vibe', 'target', 'highlights', 'activities', 'tourism', 'sport', 'accommodation', 'infrastructure', 'info', 'general'];
                requiredCategories.forEach(cat => {
                    if (!updatedData.tags[cat]) {
                        updatedData.tags[cat] = [];
                    }
                });
            } else {
                updatedData.tags = {
                    vibe: [], target: [], highlights: [], activities: [],
                    tourism: [], sport: [], accommodation: [], infrastructure: [], info: [], general: []
                };
            }

            Object.entries(updatedData).forEach(([key, value]) => {
                if (key === 'id') return;
                if (heavyFields.includes(key)) {
                    heavyData[key] = value;
                } else {
                    lightData[key] = value;
                }
            });

            // Double persistence for tagWeights (needed in both for matching and detailed view)
            if (updatedData.tagWeights) {
                lightData.tagWeights = updatedData.tagWeights;
            }

            // Denormalize counts/flags for list view
            lightData.servicesCount = updatedData.services?.length || 0;
            lightData.hasAiMetadata = !!updatedData.aiGenerationMetadata;

            // Update main document (light)
            await updateDoc(doc(db, 'locations', updatedData.id), lightData);

            // Update or Create heavy document
            // We use setDoc with merge to ensure it exists or updates
            await setDoc(doc(db, 'location_details', updatedData.id), heavyData, { merge: true });

            // Small delay to allow Firestore to propagate serverTimestamp
            await new Promise(resolve => setTimeout(resolve, 500));

            setEditingLocation(null);
            setActiveTab('locations');
            alert('Modifiche salvate con successo (Struttura Thin/Full)!');
        } catch (e) {
            console.error("Update Error:", e);
            alert("Errore durante il salvataggio delle modifiche.");
        }
    };

    const handleMigrateTagWeights = async () => {
        if (!confirm("ATTENZIONE: Questa azione copierà i 'tagWeights' dalla tabella dettagli alla tabella main per TUTTE le località. Confermi?")) return;
        setLoadingLocs(true);
        try {
            const { collection, getDocs, doc, getDoc, updateDoc, query } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const q = query(collection(db, 'locations'));
            const querySnapshot = await getDocs(q);

            let count = 0;
            let skipped = [];
            console.log(`Found ${querySnapshot.size} locations. Starting migration...`);

            for (const locDoc of querySnapshot.docs) {
                const locData = locDoc.data();
                const heavySnap = await getDoc(doc(db, 'location_details', locDoc.id));

                let weightsToMigrate = null;
                const heavyData = heavySnap.exists() ? heavySnap.data() : {};

                // Find weights with robustness
                // 1. Check Standard: heavyData.tagWeights
                if (heavyData.tagWeights && typeof heavyData.tagWeights === 'object') {
                    weightsToMigrate = heavyData.tagWeights;
                }
                // 2. Check Legacy/Loose Keys in Heavy doc
                else {
                    const keys = Object.keys(heavyData);
                    const findKey = (pattern: string) => keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '') === pattern);

                    const vibeKey = findKey('vibe') || findKey('vibeweights');
                    const targetKey = findKey('target') || findKey('targetweights');
                    const actKey = findKey('activities') || findKey('activitiesweights') || findKey('activityweights');

                    if (vibeKey || targetKey || actKey) {
                        weightsToMigrate = {
                            vibe: vibeKey ? heavyData[vibeKey] : {},
                            target: targetKey ? heavyData[targetKey] : {},
                            activities: actKey ? heavyData[actKey] : {}
                        };
                    }
                }

                // 3. Fallback: Check if they are already in locData but we want to be sure they are in tagWeights
                if (!weightsToMigrate) {
                    const keys = Object.keys(locData);
                    const findKey = (pattern: string) => keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '') === pattern);

                    const vibeKey = findKey('vibe') || findKey('vibeweights');
                    const targetKey = findKey('target') || findKey('targetweights');
                    const actKey = findKey('activities') || findKey('activitiesweights') || findKey('activityweights');

                    if (vibeKey || targetKey || actKey) {
                        weightsToMigrate = {
                            vibe: vibeKey ? locData[vibeKey] : {},
                            target: targetKey ? locData[targetKey] : {},
                            activities: actKey ? locData[actKey] : {}
                        };
                    }
                }

                if (weightsToMigrate) {
                    await updateDoc(doc(db, 'locations', locDoc.id), {
                        tagWeights: weightsToMigrate
                    });
                    count++;
                } else {
                    skipped.push(locData.name || locDoc.id);
                }
            }

            if (skipped.length > 0) {
                console.warn("Skipped locations (no weights found):", skipped);
                alert(`Migrazione completata! Aggiornate ${count} località.\nSaltate ${skipped.length}: ${skipped.join(', ')}`);
            } else {
                alert(`Migrazione completata! Tutte le ${count} località sono state aggiornate.`);
            }
        } catch (e) {
            console.error("Migration fatal error:", e);
            alert("Errore durante la migrazione. Controlla la console.");
        } finally {
            setLoadingLocs(false);
        }
    };

    const handleMigrateServicesCount = async () => {
        if (!confirm("Questa azione aggiornerà il 'servicesCount' per TUTTE le località leggendo i dati dalla tabella dettagli. Procedere?")) return;
        setLoadingLocs(true);
        try {
            const { collection, getDocs, doc, getDoc, updateDoc, query } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const q = query(collection(db, 'locations'));
            const querySnapshot = await getDocs(q);

            let count = 0;
            for (const locDoc of querySnapshot.docs) {
                const locData = locDoc.data();
                let sCount = 0;

                // Check light doc
                if (locData.services && Array.isArray(locData.services)) {
                    sCount = Math.max(sCount, locData.services.length);
                }

                // Check heavy doc
                const heavySnap = await getDoc(doc(db, 'location_details', locDoc.id));
                if (heavySnap.exists()) {
                    const heavyData = heavySnap.data();
                    if (heavyData.services && Array.isArray(heavyData.services)) {
                        sCount = Math.max(sCount, heavyData.services.length);
                    }
                }

                // If sCount is STILL 0, but we have servicesCount already saved, keep it or try to find other array fields?
                // For now, let's trust the services array.
                if (sCount === 0 && locData.servicesCount) {
                    sCount = locData.servicesCount;
                }

                await updateDoc(doc(db, 'locations', locDoc.id), {
                    servicesCount: sCount
                });
                count++;
            }
            alert(`Migrazione completata! Aggiornate ${count} località.`);
        } catch (e) {
            console.error("Migration Error:", e);
            alert("Errore durante la migrazione dei servizi.");
        } finally {
            setLoadingLocs(false);
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
                        onClick={() => { setActiveTab('tags'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'tags' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Tags size={18} />
                        Gestione Tag
                    </button>
                    <button
                        onClick={() => { setActiveTab('seo-tags'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'seo-tags' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Sparkles size={18} />
                        Highlights & SEO
                    </button>
                    <button
                        onClick={() => { setActiveTab('duplicate-tags'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'duplicate-tags' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <AlertTriangle size={18} />
                        Ispettore Duplicati
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
                        onClick={() => { setActiveTab('search-data'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'search-data' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Search size={18} />
                        Dati Search per AI
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
                        onClick={() => { setActiveTab('compare-ranking'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'compare-ranking' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Activity size={18} />
                        Top Comparazioni
                    </button>
                    <button
                        onClick={() => { setActiveTab('compare-raw'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'compare-raw' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Columns size={18} />
                        Log Comparazioni
                    </button>
                    <button
                        onClick={() => { setActiveTab('search-logs'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'search-logs' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Search size={18} />
                        Log Ricerche
                    </button>

                    <button
                        onClick={() => { setActiveTab('share-logs'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'share-logs' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <ShareIcon size={18} />
                        Log Cond. location
                    </button>

                    <button
                        onClick={() => { setActiveTab('highlight-logs'); setEditingLocation(null); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'highlight-logs' ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Heart size={18} />
                        Log Highlight Luoghi
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
                        systemTags={systemTags}
                        allLocations={locations}
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
                                                : activeTab === 'compare-ranking' ? 'Classifica Comparazioni'
                                                    : activeTab === 'compare-raw' ? 'Dettaglio Comparazioni'
                                                        : activeTab === 'search-logs' ? 'Log Ricerche Sito'
                                                            : activeTab === 'search-data' ? 'Dati per Motori di Ricerca'
                                                                : activeTab === 'share-logs' ? 'Log Condivisioni Link location'
                                                                    : activeTab === 'highlight-logs' ? 'Log Highlight Elementi'
                                                                        : activeTab === 'tags' ? 'Gestione Tag Sistema'
                                                                            : activeTab === 'seo-tags' ? 'Highlights & SEO Refactoring'
                                                                                : activeTab === 'duplicate-tags' ? 'Controllo Duplicati Tag'
                                                                                    : 'Motore AI Ricerca'}
                                </h1>
                                <p className="text-slate-500 text-sm mt-1">
                                    {activeTab === 'locations' ? 'Gestisci le destinazioni pubblicate.'
                                        : activeTab === 'messages' ? 'Leggi le segnalazioni e le richieste degli utenti.'
                                            : activeTab === 'match-logs' ? 'Vedi cosa cercano gli utenti nel Wizard.'
                                                : activeTab === 'compare-ranking' ? 'Vedi quali combinazioni di località sono più popolari.'
                                                    : activeTab === 'compare-raw' ? 'Vedi i singoli confronti effettuati dagli utenti.'
                                                        : activeTab === 'search-logs' ? 'Analisi delle ricerche testuali e dei filtri usati.'
                                                            : activeTab === 'search-data' ? 'Elenco località e nazioni (Copia & Incolla).'
                                                                : activeTab === 'ai-tasks' ? 'Estrai nuovi dati dal web tramite Gemini.'
                                                                    : activeTab === 'share-logs' ? 'Vedi quali link e pagine vengono condivisi dagli utenti.'
                                                                        : activeTab === 'highlight-logs' ? 'Vedi quali elementi delle località vengono messi nei preferiti.'
                                                                            : 'Modifica i contenuti della Home Page.'}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                {activeTab === 'locations' && (
                                    <div className="flex gap-2">
                                        <button onClick={handleMigrateTagWeights} className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg shadow-sm hover:bg-yellow-200 font-medium text-sm">
                                            <Sparkles size={16} />
                                            Migra Pesi
                                        </button>
                                        <button onClick={handleMigrateServicesCount} className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg shadow-sm hover:bg-blue-200 font-medium text-sm">
                                            <Layers size={16} />
                                            Migra Servizi
                                        </button>
                                    </div>
                                )}
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
                                            placeholder="Cerca località per nome, regione o stato..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
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
                                                            if (e.target.checked) setSelectedIds(sortedAndFilteredLocations.map(l => l.id));
                                                            else setSelectedIds([]);
                                                        }}
                                                        checked={selectedIds.length === sortedAndFilteredLocations.length && sortedAndFilteredLocations.length > 0}
                                                        className="rounded border-slate-300"
                                                    />
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 transition-all group border-r border-slate-200" onClick={() => handleSort('name')}>
                                                    <div className="flex items-center justify-between">
                                                        <span>Nome</span>
                                                        <div className="flex flex-col -gap-1">
                                                            <ChevronUp size={10} className={sortConfig?.key === 'name' && sortConfig.direction === 'asc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                            <ChevronDown size={10} className={sortConfig?.key === 'name' && sortConfig.direction === 'desc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                        </div>
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 text-center text-slate-400">Tag Status</th>
                                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 transition-all group border-x border-slate-200" onClick={() => handleSort('services')}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>Servizi</span>
                                                        <div className="flex flex-col -gap-1">
                                                            <ChevronUp size={10} className={sortConfig?.key === 'services' && sortConfig.direction === 'asc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                            <ChevronDown size={10} className={sortConfig?.key === 'services' && sortConfig.direction === 'desc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                        </div>
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 transition-all group border-r border-slate-200" onClick={() => handleSort('region')}>
                                                    <div className="flex items-center justify-between">
                                                        <span>Regione</span>
                                                        <div className="flex flex-col -gap-1">
                                                            <ChevronUp size={10} className={sortConfig?.key === 'region' && sortConfig.direction === 'asc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                            <ChevronDown size={10} className={sortConfig?.key === 'region' && sortConfig.direction === 'desc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                        </div>
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 transition-all group border-r border-slate-200" onClick={() => handleSort('country')}>
                                                    <div className="flex items-center justify-between">
                                                        <span>Stato</span>
                                                        <div className="flex flex-col -gap-1">
                                                            <ChevronUp size={10} className={sortConfig?.key === 'country' && sortConfig.direction === 'asc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                            <ChevronDown size={10} className={sortConfig?.key === 'country' && sortConfig.direction === 'desc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                        </div>
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 transition-all group border-r border-slate-200" onClick={() => handleSort('status')}>
                                                    <div className="flex items-center justify-between">
                                                        <span>Status</span>
                                                        <div className="flex flex-col -gap-1">
                                                            <ChevronUp size={10} className={sortConfig?.key === 'status' && sortConfig.direction === 'asc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                            <ChevronDown size={10} className={sortConfig?.key === 'status' && sortConfig.direction === 'desc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                        </div>
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 cursor-pointer hover:bg-slate-200 transition-all group border-r border-slate-200" onClick={() => handleSort('updatedAt')}>
                                                    <div className="flex items-center justify-between">
                                                        <span>Aggiornata</span>
                                                        <div className="flex flex-col -gap-1">
                                                            <ChevronUp size={10} className={sortConfig?.key === 'updatedAt' && sortConfig.direction === 'asc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                            <ChevronDown size={10} className={sortConfig?.key === 'updatedAt' && sortConfig.direction === 'desc' ? 'text-primary' : 'text-slate-300 opacity-0 group-hover:opacity-100'} />
                                                        </div>
                                                    </div>
                                                </th>
                                                <th className="px-6 py-4 text-right">Azioni</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {sortedAndFilteredLocations.map((loc) => (
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
                                                                                <a href={loc.seasonalImages[s]} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                                                                    <img src={loc.seasonalImages[s]} alt={s} className="w-full h-full object-cover shadow-sm hover:opacity-80 transition-opacity" title={`${s.charAt(0).toUpperCase()}${s.slice(1)} - Apri immagine`} />
                                                                                </a>
                                                                            ) : (
                                                                                <div className="w-full h-full bg-slate-200" />
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : loc.coverImage ? (
                                                                <a href={loc.coverImage} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 hover:opacity-80 transition-opacity" title="Apri immagine">
                                                                    <img src={loc.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                                                                </a>
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0" />
                                                            )}
                                                            <span className="font-medium text-slate-900">{loc.name}</span>
                                                            {(loc.aiGenerationMetadata || loc.hasAiMetadata) && (
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
                                                            {loc.servicesCount ?? (loc.services?.length || 0)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                                        {loc.region || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-600 font-medium">
                                                        {loc.country || 'IT'}
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
                                                                href={`/locations/${locationNameToSlug(loc.name)}`}
                                                                target="_blank"
                                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                                title="Visualizza sul sito"
                                                            >
                                                                <ExternalLink size={18} />
                                                            </Link>
                                                            <Link
                                                                href={`/alpeadminmatch?tab=ai-tasks&location=${encodeURIComponent(loc.name)}`}
                                                                target="_blank"
                                                                className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                title="Analisi AI (Nuova Scheda)"
                                                            >
                                                                <Sparkles size={18} />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleStartEdit(loc)}
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
                        {activeTab === 'tags' && <TagManagementView onUpdate={fetchSystemTags} />}
                        {activeTab === 'seo-tags' && <SeoInsightsManager />}
                        {activeTab === 'duplicate-tags' && <DuplicateTagsInspector />}
                        {activeTab === 'match-logs' && <MatchLogsView />}
                        {activeTab === 'compare-ranking' && <CompareRankingView />}
                        {activeTab === 'compare-raw' && <CompareRawLogsView />}
                        {activeTab === 'search-logs' && <SearchLogsView />}
                        {activeTab === 'search-data' && <SearchDataView locations={locations} />}
                        {activeTab === 'ai-tasks' && <AITaskRunner />}
                        {activeTab === 'share-logs' && <ShareLogsView />}
                        {activeTab === 'highlight-logs' && <HighlightLogsView />}
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

function MergeTool({ selectedLocations: initialSelected, onCancel, onComplete }: { selectedLocations: any[], onCancel: () => void, onComplete: () => void }) {
    const [selectedLocations, setSelectedLocations] = useState<any[]>(initialSelected);
    const [loading, setLoading] = useState(true);
    const [masterId, setMasterId] = useState<string>(initialSelected[0]?.id);
    const [fieldSelections, setFieldSelections] = useState<Record<string, string>>({});
    const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

    // Fetch Full Data for all selected locations
    useEffect(() => {
        const fetchFullData = async () => {
            try {
                const { doc, getDoc } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const fullLocs = await Promise.all(initialSelected.map(async (loc) => {
                    try {
                        const detailsSnap = await getDoc(doc(db, 'location_details', loc.id));
                        if (detailsSnap.exists()) {
                            return { ...loc, ...detailsSnap.data() };
                        }
                    } catch (e) {
                        console.error("Error fetching heavy data for merge:", loc.name, e);
                    }
                    return loc;
                }));

                setSelectedLocations(fullLocs);
            } catch (err) {
                console.error("Error initializing merge tool:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFullData();
    }, [initialSelected]);

    // Initialize selections when masterId changes or data loads
    useEffect(() => {
        if (!masterId || loading) return;

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
    }, [masterId, selectedLocations, loading]);

    if (loading) return <div className="p-12 text-center text-slate-500">Preparazione dati per l'unione...</div>;

    const masterLoc = selectedLocations.find(l => l.id === masterId);
    if (!masterLoc) return <div>Errore: Master non trovato</div>;

    const sourceLocs = selectedLocations.filter(l => l.id !== masterId);

    const handleMerge = async () => {
        if (!confirm(`Confermi l'unione? \n- ${masterLoc.name} sarà aggiornata.\n- ${sourceLocs.length} località verranno ELIMINATE definitamente.`)) return;

        try {
            const { doc, updateDoc, setDoc, deleteDoc, serverTimestamp } = await import('firebase/firestore');
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

            // Merge Tags (Union of all tags from Master + Sources)
            // This ensures we keep the rich "Compare" tags even if Master didn't have them
            const mergedTags = { ...(masterLoc.tags || {}) };
            const allTagsCategories = new Set([
                'vibe', 'target', 'activities', 'highlights',
                'tourism', 'sport', 'accommodation', 'infrastructure', 'info', 'general'
            ]);

            // Add any other categories found in master
            Object.keys(mergedTags).forEach(k => allTagsCategories.add(k));

            sourceLocs.forEach(source => {
                if (!source.tags) return;

                // Add categories found in source
                Object.keys(source.tags).forEach(k => allTagsCategories.add(k));

                // Merge arrays
                allTagsCategories.forEach(category => {
                    const masterList = mergedTags[category] || [];
                    const sourceList = source.tags[category] || [];

                    // Union
                    const unionSet = new Set([...masterList, ...sourceList]);
                    mergedTags[category] = Array.from(unionSet);
                });
            });
            finalData.tags = mergedTags;

            finalData.updatedAt = serverTimestamp();

            // 2. Separate into Thin/Full structure
            const heavyFields = [
                'services', 'technicalData', 'accessibility',
                'parking', 'localMobility', 'infoPoints', 'medical',
                'advancedSkiing', 'outdoorNonSki', 'family', 'rentals',
                'eventsAndSeasonality', 'gastronomy', 'digital', 'practicalTips',
                'openingHours', 'safety', 'sustainability',
                'aiGenerationMetadata', 'profile'
            ];

            const lightData: any = {};
            const heavyData: any = {};

            Object.entries(finalData).forEach(([key, value]) => {
                if (key === 'id') return;
                if (heavyFields.includes(key)) {
                    heavyData[key] = value;
                } else {
                    lightData[key] = value;
                }
            });

            // Denormalize for list view
            lightData.servicesCount = finalServices.length;
            lightData.hasAiMetadata = !!finalData.aiGenerationMetadata || !!heavyData.aiGenerationMetadata;

            // 3. Update Master
            await updateDoc(doc(db, 'locations', masterId), lightData);
            await setDoc(doc(db, 'location_details', masterId), heavyData, { merge: true });

            // 4. Delete Sources (both collections)
            for (const source of sourceLocs) {
                await deleteDoc(doc(db, 'locations', source.id));
                await deleteDoc(doc(db, 'location_details', source.id));
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

function EditLocationView({ location, onSave, onCancel, systemTags, allLocations }: { location: any, onSave: (data: any) => void, onCancel: () => void, systemTags: any, allLocations?: any[] }) {
    const [formData, setFormData] = useState({
        ...location,
        description: location.description || { winter: '', summer: '' },
        services: location.services || [],
        tags: location.tags || {
            vibe: [], target: [], highlights: [], activities: [],
            tourism: [], sport: [], accommodation: [], infrastructure: [], info: [], general: []
        },
        tagWeights: location.tagWeights || {},
        seasonalImages: location.seasonalImages || {
            winter: location.coverImage || '',
            summer: location.coverImage || '',
            spring: location.coverImage || '',
            autumn: location.coverImage || ''
        }
    });

    // AI weights for tags visualization
    const [tagWeights, setTagWeights] = useState<any>(location.tagWeights || null);

    // UI State for Active Tab inside Editor
    const [editTab, setEditTab] = useState<'general' | 'services' | 'export'>('general');
    const [showExplanation, setShowExplanation] = useState<null | 'wizard' | 'seo'>(null);

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

    const handleWeightChange = (category: string, tagId: string, value: number) => {
        const val = isNaN(value) ? 0 : Math.min(100, Math.max(0, value));
        setTagWeights((prev: any) => ({
            ...prev,
            [category]: {
                ...(prev?.[category] || {}),
                [tagId]: val
            }
        }));
        setFormData((prev: any) => ({
            ...prev,
            tagWeights: {
                ...(prev.tagWeights || {}),
                [category]: {
                    ...(prev.tagWeights?.[category] || {}),
                    [tagId]: val
                }
            }
        }));
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

                    // Auto-select ALL tags that have weights (not just top picks)
                    // This allows admin to manually deselect unwanted tags
                    const autoSelectedTags: any = {};
                    if (data.data.weights) {
                        Object.keys(data.data.weights).forEach(category => {
                            // Get all tag IDs that have a weight > 0
                            autoSelectedTags[category] = Object.keys(data.data.weights[category]);
                        });
                    }

                    // Update the actual selected tags AND save the weights to DB
                    setFormData((prev: any) => ({
                        ...prev,
                        tags: {
                            ...(prev.tags || {}),
                            ...autoSelectedTags  // Auto-select ALL tags with weights
                        },
                        // Save weights for use in matching algorithm
                        tagWeights: data.data.weights || {}
                    }));
                } else {
                    // SEO Mode with Fuzzy Matching against Existing tags
                    let optimizedTags = { ...data.data };

                    if (allLocations && allLocations.length > 0) {
                        // 1. Build a reference set of "Standard Tags" currently in use
                        // Structure: { category: Set<existingTagString> }
                        const referenceTags: Record<string, Set<string>> = {
                            highlights: new Set(), tourism: new Set(), accommodation: new Set(),
                            infrastructure: new Set(), sport: new Set(), info: new Set(), general: new Set()
                        };

                        allLocations.forEach((loc: any) => {
                            if (!loc.tags) return;
                            Object.keys(referenceTags).forEach(cat => {
                                if (loc.tags[cat]) {
                                    loc.tags[cat].forEach((t: string) => referenceTags[cat].add(t));
                                }
                            });
                        });

                        // 2. Fuzzy Match Function (similar to CompareClient)
                        const checkSimilarity = (tag1: string, tag2: string) => {
                            const normalize = (s: string) => s.toLowerCase().trim();
                            const t1 = normalize(tag1);
                            const t2 = normalize(tag2);

                            if (t1 === t2) return true;
                            if (t1.includes(t2) || t2.includes(t1)) return true; // Substring

                            const stopWords = new Set(['della', 'delle', 'degli', 'nella', 'nelle', 'negli', 'con', 'per', 'tra', 'fra', 'and', 'the', 'del', 'al', 'i', 'le', 'gli']);
                            const getWords = (s: string) => s.split(/[\s\-_]+/).filter(w => w.length >= 2 && !stopWords.has(w));
                            const words1 = getWords(t1);
                            const words2 = getWords(t2);

                            // Intersection
                            return words1.some(w => words2.includes(w));
                        };

                        // 3. Process new tags and try to match
                        Object.keys(optimizedTags).forEach(cat => {
                            if (!referenceTags[cat]) return;

                            const newTagList = optimizedTags[cat] || [];
                            const processedList: string[] = [];

                            newTagList.forEach((newTag: string) => {
                                // Find if there is a match in referenceTags[cat]
                                let match = null;

                                // Prioritize exact match (case insensitive)
                                for (const existingTag of Array.from(referenceTags[cat])) {
                                    if (existingTag.toLowerCase() === newTag.toLowerCase()) {
                                        match = existingTag;
                                        break;
                                    }
                                }

                                // If no exact match, try fuzzy
                                if (!match) {
                                    for (const existingTag of Array.from(referenceTags[cat])) {
                                        if (checkSimilarity(newTag, existingTag)) {
                                            match = existingTag;
                                            break;
                                        }
                                    }
                                }

                                if (match) {
                                    console.log(`[SEO Tag Match] Converted "${newTag}" to existing "${match}"`);
                                    processedList.push(match);
                                } else {
                                    processedList.push(newTag);
                                }
                            });

                            // Remove duplicates within the new list itself
                            optimizedTags[cat] = Array.from(new Set(processedList));
                        });
                    }

                    setFormData((prev: any) => ({
                        ...prev,
                        tags: {
                            ...(prev.tags || {}),
                            ...optimizedTags
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
                slug: locationNameToSlug(`${formData.name} (IT)`),
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

    const seasonalImagesSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        (formData.name || '') + ' ' + (formData.region || '') + ' mountain panorama wallpaper images from Unsplash, Pexels, Pixabay, StockSnap.io, Picjumbo, Freepik, Burst (by Shopify), Kaboompics, Reshot, Gratisography, Rawpixel, ISO Republic, Morguefile, Wikimedia Commons'
    )}&tbm=isch`;
    const ufficioSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(
        (formData.name || '') + ' ' + (formData.region || '') + ' sito ufficiale'
    )}&tbm=`;

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
                    <button onClick={() => setEditTab('general')} className={`px-4 py-2 rounded-lg font-medium text-sm border ${editTab === 'general' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}>Generale</button>
                    <button onClick={() => setEditTab('services')} className={`px-4 py-2 rounded-lg font-medium text-sm border ${editTab === 'services' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 shadow-sm'}`}>Servizi ({formData.services.length})</button>
                    <button onClick={() => setEditTab('export')} className={`px-4 py-2 rounded-lg font-medium text-sm border ${editTab === 'export' ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200' : 'bg-white text-indigo-600 border-indigo-200 shadow-sm hover:bg-indigo-50'}`}>Esporta AI ✨</button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                {/* GENERAL TAB */}
                {editTab === 'general' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* ID and Basic Info */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Località</label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">URL Slug (SEO)</label>
                                <div className="flex gap-2">
                                    <input
                                        name="slug"
                                        value={formData.slug || ''}
                                        onChange={handleChange}
                                        placeholder="es. abetone-monte-cimone"
                                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none font-mono text-sm bg-slate-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, slug: locationNameToSlug(formData.name) })}
                                        className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 border border-slate-200"
                                        title="Rigenera slug dal nome"
                                    >
                                        <Sparkles size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status and Visibility */}
                        <div className="grid grid-cols-3 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Stato</label>
                                <select
                                    value={formData.status || 'draft'}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full p-2 border rounded-lg bg-white text-sm"
                                >
                                    <option value="draft">Bozza</option>
                                    <option value="published">Pubblicato</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Visibilità (App Mobile)</label>
                                <div className="flex items-center gap-3 mt-1">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.visible ?? false}
                                            onChange={e => setFormData({ ...formData, visible: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-slate-900">{formData.visible ? 'Visibile' : 'Nascosta'}</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Ordine Visualizzazione</label>
                                <input
                                    type="number"
                                    value={formData.order ?? 0}
                                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                    className="w-full p-2 border rounded-lg bg-white text-sm"
                                />
                            </div>
                        </div>

                        {/* Location Details Grid */}
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Regione</label>
                                <input name="region" value={formData.region} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none" />
                                <a
                                    href={`https://www.google.com/search?q=${encodeURIComponent(formData.name + ' ' + (formData.region || '') + ' - regione della location in inglese ')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                                >
                                    <Search size={10} /> Trova su Google
                                </a>
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
                                    {(systemTags?.nations || TAG_CATEGORIES.nations).map((n: any) => (
                                        <option key={n.id} value={n.label}>{n.label}</option>
                                    ))}
                                    <option value="Austria">Austria</option>
                                    <option value="Francia">Francia</option>
                                    <option value="Svizzera">Svizzera</option>
                                    <option value="Germania">Germania</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Lingua Originale</label>
                                <select
                                    name="language"
                                    value={formData.language || 'it'}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none bg-white font-bold"
                                >
                                    <option value="it">Italiano (IT)</option>
                                    <option value="en">English (EN)</option>
                                    <option value="de">Deutsch (DE)</option>
                                    <option value="fr">Français (FR)</option>
                                </select>
                            </div>
                        </div>

                        {/* Utils & Coordinates */}
                        <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Altitudine Media (m)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.altitude || ''}
                                        onChange={(e) => setFormData({ ...formData, altitude: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border rounded-lg focus:border-primary outline-none"
                                        placeholder="Es. 1200"
                                    />
                                    <span className="absolute right-3 top-2 text-slate-400 font-bold text-sm">m s.l.m.</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-slate-700">Coordinate GPS (Decimali)</label>
                                    <a
                                        href={`https://www.google.com/search?q=${encodeURIComponent(formData.name + ' ' + (formData.region || '') + ' altitudine, coordinate gps gradi decimali')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold"
                                    >
                                        <Search size={10} /> Trova su Google
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
                                            className="w-full pl-4 pr-8 py-2 border rounded-lg focus:border-primary outline-none font-mono text-xs"
                                            placeholder="Latitudine (es. 46.55)"
                                        />
                                        <span className="absolute right-2 top-2 text-slate-400 text-[10px] font-black uppercase">Lat</span>
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
                                            className="w-full pl-4 pr-8 py-2 border rounded-lg focus:border-primary outline-none font-mono text-xs"
                                            placeholder="Longitudine (es. 11.23)"
                                        />
                                        <span className="absolute right-2 top-2 text-slate-400 text-[10px] font-black uppercase">Lng</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Image urls section */}
                        <div className="border border-slate-100 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-slate-900 border-l-4 border-indigo-500 pl-3">Immagini Stagionali</h3>
                                <div className="flex gap-3">
                                    <a
                                        href={ufficioSearchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-500 hover:text-primary transition-colors flex items-center gap-1 font-bold"
                                    >
                                        Sito ufficiale<Search size={10} />
                                    </a>

                                    <a
                                        href={seasonalImagesSearchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-1 rounded text-slate-500 hover:text-primary transition-colors flex items-center gap-1 font-bold"
                                    >
                                        Cerca immagine<Search size={10} />
                                    </a>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['winter', 'spring', 'summer', 'autumn'].map((season) => (
                                    <div key={season}>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">{season}</label>
                                        <div className="space-y-2">
                                            <div className="aspect-video rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shadow-inner relative group">
                                                {formData.seasonalImages?.[season] ? (
                                                    <img src={formData.seasonalImages[season]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={season} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <Plus size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                name={`img_${season}`}
                                                value={formData.seasonalImages?.[season] || ''}
                                                onChange={handleChange}
                                                className="w-full px-2 py-1.5 border rounded text-[10px] font-mono outline-none focus:border-indigo-400 text-slate-500"
                                                placeholder="URL immagine..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Seasonal Descriptions */}
                        <div className="pt-4 space-y-6">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                <MessageSquare size={18} className="text-primary" /> Descrizioni stagionali
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {['winter', 'summer', 'autumn', 'spring'].map((season) => (
                                    <div key={season} className="space-y-2">
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400">{season === 'winter' ? 'Inverno' : season === 'summer' ? 'Estate' : season === 'autumn' ? 'Autunno' : 'Primavera'}</label>
                                        <textarea
                                            name={`desc_${season}`}
                                            value={formData.description[season] || ''}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border rounded-xl focus:border-primary outline-none h-40 resize-none text-sm leading-relaxed"
                                            placeholder={`Descrivi la località in ${season}...`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tags Section */}
                        <div className="pt-8 space-y-8">
                            <div>
                                <h3 className="font-bold text-slate-900 border-l-4 border-purple-500 pl-3">Tags & Caratteristiche Match</h3>
                                <p className="text-xs text-slate-500 ml-4 mt-1">Configura i pesi dell&apos;algoritmo per il Wizard e i meta-tag per il motore di ricerca.</p>

                            </div>

                            {/* Wizard Tags Container */}
                            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-8">
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-900">Configurazione Match Wizard</h4>
                                            <p className="text-[10px] text-slate-500 font-medium tracking-wide font-black uppercase">Algoritmo 1-a-1 & Pesi AI</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowExplanation('wizard')}
                                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                                            title="Cos'è l'Autoconfigurazione Wizard?"
                                        >
                                            <HelpCircle size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => generateTags('wizard')}
                                            disabled={generatingWizard}
                                            className="bg-primary text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                                        >
                                            {generatingWizard ? 'Analisi in corso...' : '✨ Autoconfigura Wizard'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Vibe Selection */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                            <div className="w-1 h-3 bg-indigo-400 rounded-full"></div> Atmosfera / Vibe
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {(systemTags?.vibe || TAG_CATEGORIES.vibe).map((tag: any) => (
                                                <button
                                                    key={tag.id} type="button" onClick={() => toggleTag('vibe', tag.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-between gap-2 ${formData.tags?.vibe?.includes(tag.id) ? 'bg-primary text-white border-primary shadow-sm scale-[1.02]' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'}`}
                                                >
                                                    {tag.label}
                                                    {tagWeights?.vibe?.[tag.id] !== undefined && (
                                                        <input
                                                            type="number"
                                                            value={tagWeights.vibe[tag.id]}
                                                            onChange={(e) => handleWeightChange('vibe', tag.id, parseInt(e.target.value))}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={`w-10 text-[9px] px-1 py-0.5 rounded-sm border-0 text-center focus:ring-1 focus:ring-white/50 outline-none ${formData.tags?.vibe?.includes(tag.id) ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Target Selection */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                            <div className="w-1 h-3 bg-pink-400 rounded-full"></div> Target Utente
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {(systemTags?.target || TAG_CATEGORIES.target).map((tag: any) => (
                                                <button
                                                    key={tag.id} type="button" onClick={() => toggleTag('target', tag.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-between gap-2 ${formData.tags?.target?.includes(tag.id) ? 'bg-primary text-white border-primary shadow-sm scale-[1.02]' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'}`}
                                                >
                                                    {tag.label}
                                                    {tagWeights?.target?.[tag.id] !== undefined && (
                                                        <input
                                                            type="number"
                                                            value={tagWeights.target[tag.id]}
                                                            onChange={(e) => handleWeightChange('target', tag.id, parseInt(e.target.value))}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={`w-10 text-[9px] px-1 py-0.5 rounded-sm border-0 text-center focus:ring-1 focus:ring-white/50 outline-none ${formData.tags?.target?.includes(tag.id) ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Activities Match */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                            <div className="w-1 h-3 bg-green-400 rounded-full"></div> Attività Chiave
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {(systemTags?.activities || TAG_CATEGORIES.activities).map((tag: any) => (
                                                <button
                                                    key={tag.id} type="button" onClick={() => toggleTag('activities', tag.id)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-between gap-2 ${formData.tags?.activities?.includes(tag.id) ? 'bg-primary text-white border-primary shadow-sm scale-[1.02]' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/40'}`}
                                                >
                                                    {tag.label}
                                                    {tagWeights?.activities?.[tag.id] !== undefined && (
                                                        <input
                                                            type="number"
                                                            value={tagWeights.activities[tag.id]}
                                                            onChange={(e) => handleWeightChange('activities', tag.id, parseInt(e.target.value))}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={`w-10 text-[9px] px-1 py-0.5 rounded-sm border-0 text-center focus:ring-1 focus:ring-white/50 outline-none ${formData.tags?.activities?.includes(tag.id) ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}
                                                        />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Extra SEO Tags (Free Text) */}
                            <div className="p-6 bg-white rounded-2xl border border-slate-100 space-y-6">
                                <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tag SEO & Insight (Testo Libero)</h4>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowExplanation('seo')}
                                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                                            title="Cos'è l'Estrazione Insight SEO?"
                                        >
                                            <HelpCircle size={16} />
                                        </button>
                                        <button
                                            type="button" onClick={() => generateTags('seo')} disabled={generatingSEO}
                                            className="text-[10px] bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 font-bold hover:bg-slate-200 flex items-center gap-2 transition-all"
                                        >
                                            {generatingSEO ? 'Analisi SEO...' : '✨ Estrai Insight SEO'}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {['highlights', 'tourism', 'accommodation', 'infrastructure', 'sport', 'info', 'general'].map((key) => (
                                        <div key={key}>
                                            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2">{key}</label>
                                            <textarea
                                                value={formData.tags?.[key]?.join(', ') || ''}
                                                onChange={(e) => setFormData({ ...formData, tags: { ...formData.tags, [key]: e.target.value.split(',').map(s => s.trim()) } })}
                                                className="w-full px-3 py-2 border rounded-lg text-xs font-medium focus:border-primary outline-none min-h-[80px] resize-y"
                                                placeholder="Virgola per separare..."
                                                rows={3}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SERVICES TAB */}
                {editTab === 'services' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                            <div>
                                <h3 className="font-bold text-slate-900">Servizi & Attività</h3>
                                <p className="text-xs text-slate-500">Gestisci l'elenco dettagliato dei servizi per questa località.</p>
                            </div>
                            <button onClick={addService} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center gap-2 shadow-sm transition-all">
                                <Plus size={16} /> Aggiungi Nuovo
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {formData.services.map((service: any, idx: number) => (
                                <div key={idx} className="group border border-slate-200 rounded-2xl p-5 hover:border-primary/40 hover:shadow-md transition-all bg-white relative">
                                    <button onClick={() => removeService(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-600 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-4 space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nome Servizio</label>
                                                <input
                                                    value={service.name} onChange={(e) => handleServiceChange(idx, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm font-bold focus:border-primary outline-none"
                                                    placeholder="Es. Noleggio Sci Rossi"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Categoria</label>
                                                <select
                                                    value={service.category} onChange={(e) => handleServiceChange(idx, 'category', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 font-medium"
                                                >
                                                    <option value="tourism">Attività / Turismo</option>
                                                    <option value="accommodation">Ospitalità</option>
                                                    <option value="infrastructure">Impianti / Trasporti</option>
                                                    <option value="essential">Servizi Essenziali</option>
                                                    <option value="sport">Sport</option>
                                                    <option value="info">Informazioni</option>
                                                    <option value="general">Generale</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="md:col-span-8 space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Descrizione Dettagliata</label>
                                                <textarea
                                                    value={service.description} onChange={(e) => handleServiceChange(idx, 'description', e.target.value)}
                                                    className="w-full px-4 py-2 border rounded-lg text-sm h-24 resize-none focus:border-primary outline-none leading-relaxed"
                                                    placeholder="Descrivi il servizio, orari, costi o link utili..."
                                                />
                                            </div>
                                            <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Disponibilità:</span>
                                                <div className="flex gap-4">
                                                    {['winter', 'summer', 'autumn', 'spring'].map(season => (
                                                        <label key={season} className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                                                            <input
                                                                type="checkbox" checked={service.seasonAvailability?.includes(season)}
                                                                onChange={() => handleSeasonToggle(idx, season)}
                                                                className="rounded text-primary border-slate-300 focus:ring-primary w-4 h-4"
                                                            />
                                                            <span className="capitalize">{season}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* AI EXPORT TAB */}
                {editTab === 'export' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-indigo-900">Payload di validazione AI</h3>
                                    <p className="text-sm text-indigo-600">Copia questi dati e incollali nel tuo prompt AI per verificare la correttezza dei tag e dei servizi.</p>
                                </div>
                                <button
                                    onClick={() => {
                                        const text = document.getElementById('ai-payload-text')?.innerText || '';
                                        navigator.clipboard.writeText(text);
                                        alert('Payload copiato negli appunti!');
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                    <Layers size={18} /> Copia Tutto
                                </button>
                            </div>

                            <div
                                id="ai-payload-text"
                                className="bg-white border border-indigo-200 rounded-xl p-6 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto"
                            >

                                <div className="mb-4 pb-4 border-b border-slate-100">
                                    <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">INFO LOCALITÀ</span>{'\n'}
                                    Nome: {formData.name}{'\n'}
                                    Regione: {formData.region}{'\n'}
                                    Paese: {formData.country}{'\n'}
                                    Altitudine: {formData.altitude}m{'\n'}
                                    Slug SEO: {formData.slug}{'\n'}
                                </div>

                                <div className="mb-4 pb-4 border-b border-slate-100">
                                    <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">SERVIZI & ITEMS ({formData.services.length})</span>{'\n'}
                                    {formData.services.map((s: any, i: number) => (
                                        `${i + 1}. ${s.name} [${s.seasonAvailability?.join(', ')}]${s.highlight ? ' *HIGHLIGHT*' : ''}\n`
                                    ))}
                                </div>

                                <div>
                                    <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">TAGS ATTUALI</span>{'\n'}
                                    {Object.entries(formData.tags).map(([category, tags]: [string, any]) => (
                                        tags && tags.length > 0 ? `${category.toUpperCase()}: ${tags.join(', ')}\n` : null
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">CONFIGURAZIONE MATCH WIZARD (PESI)</span>{'\n'}
                                    {Object.entries(tagWeights || {}).map(([category, weights]: [string, any]) => (
                                        weights && typeof weights === 'object' && Object.keys(weights).length > 0 ? (
                                            `${category.toUpperCase()}:\n` +
                                            Object.entries(weights).map(([tagId, weight]) => {
                                                const tagLabel = (systemTags?.[category]?.find((t: any) => t.id === tagId)?.label) || tagId;
                                                return `- ${tagLabel}: ${weight}%\n`;
                                            }).join('')
                                        ) : null
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 italic text-slate-400">
                                    Istruzioni: "Analizza i servizi e i tag sopra elencati per la località {formData.name}.
                                    Verifica se i tag (vibe, target, activities) della sezione MATCH WIZARD sono coerenti con i servizi offerti e suggerisci eventuali correzioni o integrazioni dandomi anche le percentuali (fai una tabella di riferimento con tutti i valori e descrivi il perchè).
                                    Verifica che tutte le informazioni ed i servizi siano riferiti alla località.
                                    "
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 mt-12 pt-8 border-t border-slate-100">
                    <button onClick={onCancel} className="px-6 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-sm transition-all border border-transparent hover:border-slate-200">
                        Annulla modifiche
                    </button>
                    <button onClick={() => onSave(formData)} className="px-8 py-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3">
                        <Save size={18} /> Salva Scheda Località
                    </button>
                </div>

                {/* Explanation Modal */}
                {showExplanation && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowExplanation(null)}>
                        <div
                            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 rounded-2xl ${showExplanation === 'wizard' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-700'}`}>
                                        <Info size={24} />
                                    </div>
                                    <button onClick={() => setShowExplanation(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-2">
                                    {showExplanation === 'wizard' ? 'Autoconfigurazione Match Wizard' : 'Estrazione Insight SEO'}
                                </h3>

                                <div className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                                    {showExplanation === 'wizard' ? (
                                        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                                            <p>
                                                La funzione <strong>"✨ Autoconfigura Wizard"</strong> è uno strumento di intelligenza artificiale avanzato che serve a istruire l'algoritmo di matching su quanto una località sia adatta a determinati profili utente.
                                            </p>
                                            <p className="text-xs bg-indigo-50 text-indigo-700 p-3 rounded-xl border border-indigo-100">
                                                Mentre l'estrazione SEO si occupa di "testo libero", questa funzione lavora su <strong>tag predefiniti e pesi matematici</strong>.
                                            </p>

                                            <div className="space-y-4">
                                                <h4 className="font-black text-[10px] uppercase tracking-widest text-primary border-b border-slate-100 pb-2">Come funziona nel dettaglio:</h4>

                                                <div className="space-y-2">
                                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">1</span>
                                                        Il Contesto dell'Analisi
                                                    </p>
                                                    <p className="text-xs">L'IA riceve nome, descrizioni e servizi, agendo come un <strong>esperto di marketing turistico</strong> per valutare il posizionamento della località.</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">2</span>
                                                        Scoring e Pesi Percentuali (0-100%)
                                                    </p>
                                                    <p className="text-xs">Per ognuno dei 20 tag fondamentali, l'IA assegna un punteggio di rilevanza:</p>
                                                    <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-[11px] border border-slate-100">
                                                        <p><strong>Vibe:</strong> relax, sport, party, luxury, nature, tradition, work, silence.</p>
                                                        <p><strong>Target:</strong> family, couple, friends, solo.</p>
                                                        <p><strong>Activities:</strong> ski, hiking, wellness, food, culture, adrenaline, shopping, photography.</p>
                                                    </div>
                                                    <p className="text-[11px] italic text-slate-400">Esempio: "ski: 100%" e "party: 80%", ma magari "silence: 20%".</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">3</span>
                                                        Selezione e Configurazione Algoritmo
                                                    </p>
                                                    <ul className="text-xs space-y-1 list-disc pl-4 text-slate-500">
                                                        <li><strong>Seleziona i tag:</strong> Attiva i bottoni nella scheda admin (bordi colorati).</li>
                                                        <li><strong>Salva i pesi nel DB:</strong> Memorizza le percentuali per l'algoritmo.</li>
                                                        <li><strong>Istruisce il Match Wizard:</strong> Determina la posizione della località nei risultati basata sull'affinità con l'utente.</li>
                                                    </ul>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="font-bold text-slate-900 flex items-center gap-2">
                                                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">4</span>
                                                        Il Differenziale con il SEO
                                                    </p>
                                                    <p className="text-xs">Serve a <strong>ordinare i risultati interni</strong> al sito in modo scientifico e imparziale, evitando che una località sia "tutto per tutti" e catturando le sfumature reali dell'offerta turistica.</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                                            <p>
                                                La funzione <strong>"Estrai Insight SEO"</strong> nell'area admin delle location è uno strumento basato sull'intelligenza artificiale (Gemini) progettato per generare automaticamente tag descrittivi e parole chiave ottimizzate per ogni località.
                                            </p>

                                            <div className="space-y-4">
                                                <h4 className="font-black text-[10px] uppercase tracking-widest text-primary">Cosa succede quando la attivi:</h4>

                                                <div className="space-y-2">
                                                    <p className="font-bold text-slate-900">1. Analisi dei Dati Esistenti</p>
                                                    <p className="text-xs">Il sistema invia all'IA tutto quello che sa sulla località: nome, descrizioni (estate/inverno) e l'elenco dei servizi configurati.</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="font-bold text-slate-900">2. Generazione Smart dei Tag</p>
                                                    <p className="text-xs">L'IA estrae concetti chiave divisi in 7 categorie:</p>
                                                    <ul className="text-[11px] grid grid-cols-1 gap-1 list-disc pl-4 text-slate-500">
                                                        <li><strong>Highlights:</strong> Punti di forza (es. "Ghiacciaio perenne").</li>
                                                        <li><strong>Tourism:</strong> Attività (es. "Freeride", "MTB").</li>
                                                        <li><strong>Accommodation:</strong> Soggiorni (es. "Eco-rifugi").</li>
                                                        <li><strong>Infrastructure:</strong> Impianti (es. "Skibus gratuito").</li>
                                                        <li><strong>Sport:</strong> Discipline praticabili.</li>
                                                        <li><strong>Info:</strong> Info utili (es. "WiFi in quota").</li>
                                                        <li><strong>General:</strong> Aggettivi (es. "Panoramico").</li>
                                                    </ul>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="font-bold text-slate-900">3. Normalizzazione "Standard Tag"</p>
                                                    <p className="text-xs">Il sistema corregge automaticamente i tag suggeriti confrontandoli con quelli già presenti nel DB per evitare duplicati e mantenere il database pulito.</p>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="font-bold text-slate-900">4. Risultato Finale</p>
                                                    <p className="text-xs">I campi vengono popolati automaticamente, trasformando descrizioni prolisse in metadati strutturati per filtri e comparazioni.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowExplanation(null)}
                                    className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95"
                                >
                                    Ho capito
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
                const locId = exactMatch.id;
                setExistingLocationId(locId);

                // Fetch heavy data to get services
                const { doc, getDoc } = await import('firebase/firestore');
                const detailsSnap = await getDoc(doc(db, 'location_details', locId));
                let services: any[] = [];

                if (detailsSnap.exists()) {
                    services = detailsSnap.data().services || [];
                } else {
                    // Fallback to light data for legacy records
                    services = exactMatch.data().services || [];
                }

                // Alert handled by UI logic (showing preview with warning)
                if (!confirm(`⚠️ ATTENZIONE: "${targetLocation}" è già presente nel DB (Lingua: ${language.toUpperCase()})!\n\nVuoi procedere analizzando SOLO i servizi mancanti?`)) {
                    setLoading(false);
                    return;
                }

                const existingServices = services.map((s: any) => s.name) || [];

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
            const { collection, addDoc, doc, setDoc, serverTimestamp } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            const heavyFields = [
                'services', 'technicalData', 'accessibility',
                'parking', 'localMobility', 'infoPoints', 'medical',
                'advancedSkiing', 'outdoorNonSki', 'family', 'rentals',
                'eventsAndSeasonality', 'gastronomy', 'digital', 'practicalTips',
                'openingHours', 'safety', 'sustainability',
                'aiGenerationMetadata', 'profile'
            ];

            const mappedServices = (result.data.services || []).map((s: any) => ({
                ...s,
                id: crypto.randomUUID(),
                locationId: 'temp_id',
                metadata: { source: 'ai-generated' }
            }));

            const fullData: any = {
                name: result.data.name,
                slug: locationNameToSlug(result.data.name),
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
                language: language
            };

            const lightData: any = {};
            const heavyData: any = {};

            Object.entries(fullData).forEach(([key, value]) => {
                if (heavyFields.includes(key)) {
                    heavyData[key] = value;
                } else {
                    lightData[key] = value;
                }
            });

            // Denormalize for admin list
            lightData.servicesCount = mappedServices.length;
            lightData.hasAiMetadata = true;

            // 1. Create light doc and get ID
            const lightDocRef = await addDoc(collection(db, 'locations'), lightData);

            // 2. Create heavy doc with same ID
            await setDoc(doc(db, 'location_details', lightDocRef.id), heavyData);

            alert(`✅ \${result.data.name} salvata nel database (Struttura Split).`);
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

            <div className="mt-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                        <Info size={16} />
                    </div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Documentazione Tecnica Ricerca AI</p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-blue-600 uppercase">🤖 Algoritmo</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Utilizza <strong>Gemini</strong> con un sistema di agent-searching. L&apos;AI simula una navigazione umana per validare dati tecnici (km piste, altimetria) e descrizioni.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-purple-600 uppercase">📂 Duplicati</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Se la località esiste, il sistema lo rileva e genera un <strong>Prompt di Esclusione</strong>. Questo evita di duplicare servizi già salvati, concentrandosi solo sulle novità.
                            </p>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-amber-600 uppercase">⚙️ Parametri</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Puoi raffinare l&apos;analisi con le <strong>Istruzioni Speciali</strong>. Es: <em>&quot;Aggiungi solo hotel 4 stelle&quot;</em> o <em>&quot;Focus estremo sui dati freeride&quot;</em>.
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-emerald-600 uppercase">📄 Configurazione & DB</p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                I prompt sono in <code>backend/prompts.py</code>. L&apos;AI è istruita a trovare un <strong>numero illimitato</strong> di servizi, ma è vincolata a un set predefinito di ID per i tag di base per garantire la compatibilità con il DB esistente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

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
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [ipMap, setIpMap] = useState<Record<string, string>>({});

    const PAGE_SIZE = 10;

    const fetchLogs = async (isMore = false) => {
        if (isMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const { collection, getDocs, orderBy, query, limit, startAfter } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            let q = query(
                collection(db, 'match_logs'),
                orderBy('timestamp', 'desc'),
                limit(PAGE_SIZE)
            );

            if (isMore && lastDoc) {
                q = query(
                    collection(db, 'match_logs'),
                    orderBy('timestamp', 'desc'),
                    startAfter(lastDoc),
                    limit(PAGE_SIZE)
                );
            }

            const snap = await getDocs(q);
            const newLogs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

            if (isMore) {
                setLogs(prev => [...prev, ...newLogs]);
            } else {
                setLogs(newLogs);
            }

            setLastDoc(snap.docs[snap.docs.length - 1]);
            setHasMore(snap.docs.length === PAGE_SIZE);

            // Fetch IPs
            newLogs.forEach(log => {
                if (log.ip && log.ip !== '0.0.0.0' && !log.country && !ipMap[log.ip]) {
                    resolveIP(log.ip, log.id);
                }
            });

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const resolveIP = async (ip: string, docId: string) => {
        if (!ip || ip === '0.0.0.0' || ip === '127.0.0.1' || ip === '::1' || ipMap[ip]) return;

        try {
            setIpMap(prev => ({ ...prev, [ip]: '...' }));
            const res = await fetch(`https://ipinfo.io/${ip}/json`);
            if (res.ok) {
                const data = await res.json();
                if (data.country) {
                    const regionNames = new Intl.DisplayNames(['it'], { type: 'region' });
                    const countryName = regionNames.of(data.country) || data.country;
                    setIpMap(prev => ({ ...prev, [ip]: countryName }));
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');
                    await updateDoc(doc(db, 'match_logs', docId), { country: countryName });
                    return;
                }
            }
            setIpMap(prev => ({ ...prev, [ip]: 'N/D' }));
        } catch (e) {
            setIpMap(prev => ({ ...prev, [ip]: 'N/D' }));
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo log?')) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await deleteDoc(doc(db, 'match_logs', id));
            setLogs(prev => prev.filter(log => log.id !== id));
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'eliminazione del log.');
        }
    };

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.length} log selezionati?`)) return;

        try {
            const { doc, writeBatch } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const batch = writeBatch(db);

            selectedIds.forEach(id => {
                batch.delete(doc(db, 'match_logs', id));
            });

            await batch.commit();
            setLogs(prev => prev.filter(log => !selectedIds.includes(log.id)));
            setSelectedIds([]);
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'eliminazione massiva dei log.');
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === logs.length) setSelectedIds([]);
        else setSelectedIds(logs.map(l => l.id));
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento log...</div>;

    return (
        <div className="space-y-4">
            {selectedIds.length > 0 && (
                <div className="flex justify-between items-center bg-red-50 border border-red-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <div className="text-red-700 text-sm font-medium">
                        Hai selezionato <span className="font-black">{selectedIds.length}</span> log
                    </div>
                    <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 font-bold text-xs transition-all"
                    >
                        <Trash2 size={14} /> Elimina Selezionati
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={logs.length > 0 && selectedIds.length === logs.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                />
                            </th>
                            <th className="px-6 py-4">Data / IP</th>
                            <th className="px-6 py-4">Preferenze</th>
                            <th className="px-6 py-4">Risultati Match (%)</th>
                            <th className="px-6 py-4 text-center">Scelta Utente</th>
                            <th className="px-6 py-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map(log => (
                            <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(log.id) ? 'bg-indigo-50/30' : ''}`}>
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(log.id)}
                                        onChange={() => toggleSelectOne(log.id)}
                                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-slate-500 text-xs font-medium">
                                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('it-IT') : 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                                        <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            {log.ip || '0.0.0.0'}
                                        </span>
                                        {(log.country || ipMap[log.ip]) && (
                                            <span className="text-indigo-500 font-black uppercase text-[9px]">
                                                {log.country || ipMap[log.ip]}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1 max-w-sm">
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
                                    <div className="flex flex-wrap gap-2">
                                        {log.results?.map((res: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                                                <span className="text-[10px] font-black text-primary">{res.score}%</span>
                                                <span className="text-xs font-medium text-slate-700">{res.name}</span>
                                            </div>
                                        ))}
                                        {!log.results?.length && <span className="text-slate-300">-</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        {log.choices?.length > 0 ? (
                                            log.choices.map((choice: string, i: number) => (
                                                <div key={i} className="flex items-center gap-1.5 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                                    <Check size={12} /> {choice}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-slate-300 italic uppercase font-bold tracking-widest">Nessun click</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Elimina Log"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {hasMore && (
                    <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-center">
                        <button
                            onClick={() => fetchLogs(true)}
                            disabled={loadingMore}
                            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-all shadow-sm flex items-center gap-2"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    Caricamento...
                                </>
                            ) : (
                                <>
                                    <Plus size={14} /> Carica altri log
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function CompareRankingView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const { collection, getDocs, orderBy, query, limit } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');
                const q = query(collection(db, 'compare_logs'), orderBy('timestamp', 'desc'), limit(500));
                const snap = await getDocs(q);
                setLogs(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })));
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
                    seasons: new Set(),
                    choices: new Set()
                };
            }

            groups[key].count += 1;
            groups[key].seasons.add(log.season);
            (log.choices || []).forEach((c: string) => groups[key].choices.add(c));

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
                        <th className="px-6 py-4">Click / Scelte</th>
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
                                    {Array.from(log.seasons || []).map((s: any) => (
                                        <span key={s} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-bold uppercase border border-slate-200">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {Array.from(log.choices || []).length > 0 ? (
                                        Array.from(log.choices).map((choice: any) => (
                                            <span key={choice} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-[9px] font-bold border border-green-100">
                                                <Check size={10} /> {choice}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-[9px] text-slate-300 italic">Nessun click</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap text-slate-500 text-xs">
                                {log.lastSeen?.toDate ? log.lastSeen.toDate().toLocaleString('it-IT') : 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function CompareRawLogsView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [ipMap, setIpMap] = useState<Record<string, string>>({});

    const PAGE_SIZE = 15;

    const fetchLogs = async (isMore = false) => {
        if (isMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const { collection, getDocs, orderBy, query, limit, startAfter } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            let q = query(
                collection(db, 'compare_logs'),
                orderBy('timestamp', 'desc'),
                limit(PAGE_SIZE)
            );

            if (isMore && lastDoc) {
                q = query(
                    collection(db, 'compare_logs'),
                    orderBy('timestamp', 'desc'),
                    startAfter(lastDoc),
                    limit(PAGE_SIZE)
                );
            }

            const snap = await getDocs(q);
            const newLogs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

            if (isMore) setLogs(prev => [...prev, ...newLogs]);
            else setLogs(newLogs);

            setLastDoc(snap.docs[snap.docs.length - 1]);
            setHasMore(snap.docs.length === PAGE_SIZE);

            // Fetch IPs
            newLogs.forEach(log => {
                if (log.ip && log.ip !== '0.0.0.0' && !log.country && !ipMap[log.ip]) {
                    resolveIP(log.ip, log.id);
                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const resolveIP = async (ip: string, docId: string) => {
        if (!ip || ip === '0.0.0.0' || ip === '127.0.0.1' || ip === '::1' || ipMap[ip]) return;

        try {
            setIpMap(prev => ({ ...prev, [ip]: '...' }));
            const res = await fetch(`https://ipinfo.io/${ip}/json`);
            if (res.ok) {
                const data = await res.json();
                if (data.country) {
                    const regionNames = new Intl.DisplayNames(['it'], { type: 'region' });
                    const countryName = regionNames.of(data.country) || data.country;
                    setIpMap(prev => ({ ...prev, [ip]: countryName }));
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');
                    await updateDoc(doc(db, 'compare_logs', docId), { country: countryName });
                    return;
                }
            }
            setIpMap(prev => ({ ...prev, [ip]: 'N/D' }));
        } catch (e) {
            setIpMap(prev => ({ ...prev, [ip]: 'N/D' }));
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo log?')) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await deleteDoc(doc(db, 'compare_logs', id));
            setLogs(prev => prev.filter(log => log.id !== id));
            setSelectedIds(prev => prev.filter(i => i !== id));
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'eliminazione del log.');
        }
    };

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.length} log selezionati?`)) return;

        try {
            const { doc, writeBatch } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const batch = writeBatch(db);

            selectedIds.forEach(id => {
                batch.delete(doc(db, 'compare_logs', id));
            });

            await batch.commit();
            setLogs(prev => prev.filter(log => !selectedIds.includes(log.id)));
            setSelectedIds([]);
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'eliminazione massiva dei log.');
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === logs.length) setSelectedIds([]);
        else setSelectedIds(logs.map(l => l.id));
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento log comparazioni...</div>;

    return (
        <div className="space-y-4">
            {selectedIds.length > 0 && (
                <div className="flex justify-between items-center bg-red-50 border border-red-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <div className="text-red-700 text-sm font-medium">
                        Hai selezionato <span className="font-black">{selectedIds.length}</span> log
                    </div>
                    <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 font-bold text-xs transition-all"
                    >
                        <Trash2 size={14} /> Elimina Selezionati
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 text-sm">Dettaglio Singole Comparazioni (Raw Logs)</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={logs.length > 0 && selectedIds.length === logs.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                />
                            </th>
                            <th className="px-6 py-4">Data / IP</th>
                            <th className="px-6 py-4">Località Comparate</th>
                            <th className="px-6 py-4">Scelte Utente</th>
                            <th className="px-6 py-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log: any) => (
                            <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(log.id) ? 'bg-indigo-50/30' : ''}`}>
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(log.id)}
                                        onChange={() => toggleSelectOne(log.id)}
                                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-slate-500 text-xs font-medium">
                                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('it-IT') : 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                                        <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            {log.ip || '0.0.0.0'}
                                        </span>
                                        {(log.country || ipMap[log.ip]) && (
                                            <span className="text-indigo-500 font-black uppercase text-[9px]">
                                                {log.country || ipMap[log.ip]}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {log.locations?.map((loc: any, i: number) => (
                                            <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100">
                                                {loc.name}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {log.choices?.length > 0 ? (
                                            log.choices.map((choice: string, i: number) => (
                                                <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-[9px] font-bold border border-green-100">
                                                    <Check size={10} /> {choice}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[9px] text-slate-300 italic uppercase font-bold text-[8px]">Nessun click</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Elimina Log"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {hasMore && (
                    <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-center">
                        <button
                            onClick={() => fetchLogs(true)}
                            disabled={loadingMore}
                            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-all shadow-sm flex items-center gap-2"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    Caricamento...
                                </>
                            ) : (
                                <>
                                    <Plus size={14} /> Carica altri log
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
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
            .sort((a, b) => a.localeCompare(b))
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

function SearchLogsView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [ipMap, setIpMap] = useState<Record<string, string>>({});

    const PAGE_SIZE = 15;

    const fetchLogs = async (isMore = false) => {
        if (isMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const { collection, getDocs, orderBy, query, limit, startAfter } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            let q = query(
                collection(db, 'search_logs'),
                orderBy('timestamp', 'desc'),
                limit(PAGE_SIZE)
            );

            if (isMore && lastDoc) {
                q = query(
                    collection(db, 'search_logs'),
                    orderBy('timestamp', 'desc'),
                    startAfter(lastDoc),
                    limit(PAGE_SIZE)
                );
            }

            const snap = await getDocs(q);
            const newLogs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

            if (isMore) setLogs(prev => [...prev, ...newLogs]);
            else setLogs(newLogs);

            setLastDoc(snap.docs[snap.docs.length - 1]);
            setHasMore(snap.docs.length === PAGE_SIZE);

            // Fetch IPs
            newLogs.forEach(log => {
                if (log.ip && log.ip !== '0.0.0.0' && !log.country && !ipMap[log.ip]) {
                    resolveIP(log.ip, log.id);
                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const resolveIP = async (ip: string, docId: string) => {
        if (!ip || ip === '0.0.0.0' || ip === '127.0.0.1' || ip === '::1' || ipMap[ip]) return;

        try {
            setIpMap(prev => ({ ...prev, [ip]: '...' }));
            const res = await fetch(`https://ipinfo.io/${ip}/json`);
            if (res.ok) {
                const data = await res.json();
                if (data.country) {
                    const regionNames = new Intl.DisplayNames(['it'], { type: 'region' });
                    const countryName = regionNames.of(data.country) || data.country;
                    setIpMap(prev => ({ ...prev, [ip]: countryName }));
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');
                    await updateDoc(doc(db, 'search_logs', docId), { country: countryName });
                    return;
                }
            }
            setIpMap(prev => ({ ...prev, [ip]: 'N/D' }));
        } catch (e) {
            setIpMap(prev => ({ ...prev, [ip]: 'N/D' }));
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo log?')) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await deleteDoc(doc(db, 'search_logs', id));
            setLogs(prev => prev.filter(log => log.id !== id));
            setSelectedIds(prev => prev.filter(i => i !== id));
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'eliminazione del log.');
        }
    };

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.length} log selezionati?`)) return;

        try {
            const { doc, writeBatch } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const batch = writeBatch(db);

            selectedIds.forEach(id => {
                batch.delete(doc(db, 'search_logs', id));
            });

            await batch.commit();
            setLogs(prev => prev.filter(log => !selectedIds.includes(log.id)));
            setSelectedIds([]);
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'eliminazione massiva dei log.');
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === logs.length) setSelectedIds([]);
        else setSelectedIds(logs.map(l => l.id));
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento log ricerche...</div>;

    return (
        <div className="space-y-4">
            {selectedIds.length > 0 && (
                <div className="flex justify-between items-center bg-red-50 border border-red-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <div className="text-red-700 text-sm font-medium">
                        Hai selezionato <span className="font-black">{selectedIds.length}</span> log
                    </div>
                    <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 font-bold text-xs transition-all"
                    >
                        <Trash2 size={14} /> Elimina Selezionati
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 text-sm">Cronologia Ricerche Sito</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={logs.length > 0 && selectedIds.length === logs.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                />
                            </th>
                            <th className="px-6 py-4">Data / IP</th>
                            <th className="px-6 py-4">Query / Filtri</th>
                            <th className="px-6 py-4 text-center">Risultati</th>
                            <th className="px-6 py-4">Destinazione Scelta</th>
                            <th className="px-6 py-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log: any) => (
                            <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(log.id) ? 'bg-indigo-50/30' : ''}`}>
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(log.id)}
                                        onChange={() => toggleSelectOne(log.id)}
                                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-slate-500 text-xs font-medium">
                                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('it-IT') : 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                                        <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            {log.ip || '0.0.0.0'}
                                        </span>
                                        {(log.country || ipMap[log.ip]) && (
                                            <span className="text-indigo-500 font-black uppercase text-[9px]">
                                                {log.country || ipMap[log.ip]}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {log.query && (
                                        <div className="font-bold text-slate-900 mb-1 italic">"{log.query}"</div>
                                    )}
                                    <div className="flex flex-wrap gap-1">
                                        {log.tags?.map((tag: string) => (
                                            <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded border border-slate-200">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-slate-500">
                                        {log.resultsCount || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {log.choices?.length > 0 ? (
                                            log.choices.map((choice: string, i: number) => (
                                                <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 text-[9px] font-bold border border-green-100">
                                                    <Check size={10} /> {choice}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[9px] text-slate-300 italic uppercase font-bold text-[8px]">Nessun click</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Elimina Log"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {hasMore && (
                    <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-center">
                        <button
                            onClick={() => fetchLogs(true)}
                            disabled={loadingMore}
                            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-all shadow-sm flex items-center gap-2"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    Caricamento...
                                </>
                            ) : (
                                <>
                                    <Plus size={14} /> Carica altri log ricerche
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ShareLogsView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [ipMap, setIpMap] = useState<Record<string, string>>({});

    const PAGE_SIZE = 15;

    const fetchLogs = async (isMore = false) => {
        if (isMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const { collection, getDocs, orderBy, query, limit, startAfter } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            let q = query(
                collection(db, 'share_logs'),
                orderBy('timestamp', 'desc'),
                limit(PAGE_SIZE)
            );

            if (isMore && lastDoc) {
                q = query(
                    collection(db, 'share_logs'),
                    orderBy('timestamp', 'desc'),
                    startAfter(lastDoc),
                    limit(PAGE_SIZE)
                );
            }

            const snap = await getDocs(q);
            const newLogs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

            if (isMore) setLogs(prev => [...prev, ...newLogs]);
            else setLogs(newLogs);

            setLastDoc(snap.docs[snap.docs.length - 1]);
            setHasMore(snap.docs.length === PAGE_SIZE);

            // Fetch IPs
            newLogs.forEach(log => {
                if (log.ip && log.ip !== '0.0.0.0' && !log.country && !ipMap[log.ip]) {
                    resolveIP(log.ip, log.id);
                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const resolveIP = async (ip: string, docId: string) => {
        if (!ip || ip === '0.0.0.0' || ip === '127.0.0.1' || ip === '::1' || ipMap[ip]) return;

        try {
            setIpMap(prev => ({ ...prev, [ip]: '...' }));
            const res = await fetch(`https://ipinfo.io/${ip}/json`);
            if (res.ok) {
                const data = await res.json();
                if (data.country) {
                    const regionNames = new Intl.DisplayNames(['it'], { type: 'region' });
                    const countryName = regionNames.of(data.country) || data.country;
                    setIpMap(prev => ({ ...prev, [ip]: countryName }));
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');
                    await updateDoc(doc(db, 'share_logs', docId), { country: countryName });
                    return;
                }
            }
            setIpMap(prev => ({ ...prev, [ip]: 'N/D' }));
        } catch (e) {
            setIpMap(prev => ({ ...prev, [ip]: 'N/D' }));
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo log?')) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await deleteDoc(doc(db, 'share_logs', id));
            setLogs(prev => prev.filter(log => log.id !== id));
            setSelectedIds(prev => prev.filter(i => i !== id));
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'eliminazione del log.');
        }
    };

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.length} log selezionati?`)) return;

        try {
            const { doc, writeBatch } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const batch = writeBatch(db);

            selectedIds.forEach(id => {
                batch.delete(doc(db, 'share_logs', id));
            });

            await batch.commit();
            setLogs(prev => prev.filter(log => !selectedIds.includes(log.id)));
            setSelectedIds([]);
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'eliminazione massiva dei log.');
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === logs.length) setSelectedIds([]);
        else setSelectedIds(logs.map(l => l.id));
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento log condivisioni...</div>;

    const getPageLabel = (page: string) => {
        switch (page) {
            case 'search': return 'Ricerca';
            case 'compare': return 'Comparazione';
            case 'match': return 'Match Wizard';
            case 'location_detail': return 'Dettaglio';
            default: return page;
        }
    };

    const getActionLabel = (action?: string) => {
        switch (action) {
            case 'copy': return 'Copiato';
            case 'view': return 'Visualizzato';
            default: return 'Copiato';
        }
    };

    const getActionColor = (action?: string) => {
        switch (action) {
            case 'copy': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
            case 'view': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-cyan-50 text-cyan-700 border-cyan-100';
        }
    };

    const getPageColor = (page: string) => {
        switch (page) {
            case 'search': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'compare': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'match': return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'location_detail': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <div className="space-y-4">
            {selectedIds.length > 0 && (
                <div className="flex justify-between items-center bg-red-50 border border-red-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <div className="text-red-700 text-sm font-medium">
                        Hai selezionato <span className="font-black">{selectedIds.length}</span> log
                    </div>
                    <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 font-bold text-xs transition-all"
                    >
                        <Trash2 size={14} /> Elimina Selezionati
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 text-sm">Cronologia Condivisioni Link</h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={logs.length > 0 && selectedIds.length === logs.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                />
                            </th>
                            <th className="px-6 py-4">Data / IP</th>
                            <th className="px-6 py-4">Azione</th>
                            <th className="px-6 py-4">Pagina Sorgente</th>
                            <th className="px-6 py-4">Link Condiviso / Oggetto</th>
                            <th className="px-6 py-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log: any) => (
                            <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(log.id) ? 'bg-indigo-50/30' : ''}`}>
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(log.id)}
                                        onChange={() => toggleSelectOne(log.id)}
                                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-slate-500 text-xs font-medium">
                                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('it-IT') : 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                                        <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            {log.ip || '0.0.0.0'}
                                        </span>
                                        {(log.country || ipMap[log.ip]) && (
                                            <span className="text-indigo-500 font-black uppercase text-[9px]">
                                                {log.country || ipMap[log.ip]}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getActionColor(log.action)}`}>
                                        {getActionLabel(log.action)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getPageColor(log.page)}`}>
                                        {getPageLabel(log.page)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="max-w-md">
                                        {log.locationName && (
                                            <div className="font-bold text-slate-900 mb-1">{log.locationName}</div>
                                        )}
                                        {log.logId && (
                                            <div className="text-[10px] text-slate-400 font-mono mb-1">ID Log: {log.logId}</div>
                                        )}
                                        <div className="text-[10px] text-primary truncate hover:underline cursor-help" title={log.url}>
                                            {log.url}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Elimina Log"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {hasMore && (
                    <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-center">
                        <button
                            onClick={() => fetchLogs(true)}
                            disabled={loadingMore}
                            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-all shadow-sm flex items-center gap-2"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    Caricamento...
                                </>
                            ) : (
                                <>
                                    <Plus size={14} /> Carica altri log
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}


function HighlightLogsView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [ipMap, setIpMap] = useState<Record<string, string>>({});

    const PAGE_SIZE = 15;

    const fetchLogs = async (isMore = false) => {
        if (isMore) setLoadingMore(true);
        else setLoading(true);

        try {
            const { collection, getDocs, orderBy, query, limit, startAfter } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            let q = query(
                collection(db, 'highlight_logs'),
                orderBy('timestamp', 'desc'),
                limit(PAGE_SIZE)
            );

            if (isMore && lastDoc) {
                q = query(
                    collection(db, 'highlight_logs'),
                    orderBy('timestamp', 'desc'),
                    startAfter(lastDoc),
                    limit(PAGE_SIZE)
                );
            }

            const snap = await getDocs(q);
            const newLogs = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

            if (isMore) setLogs(prev => [...prev, ...newLogs]);
            else setLogs(newLogs);

            setLastDoc(snap.docs[snap.docs.length - 1]);
            setHasMore(snap.docs.length === PAGE_SIZE);

            // Fetch IPs
            newLogs.forEach(log => {
                if (log.ip && log.ip !== '0.0.0.0' && !log.country && !ipMap[log.ip]) {
                    resolveIP(log.ip, log.id);
                }
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const resolveIP = async (ip: string, docId: string) => {
        if (!ip || ip === '0.0.0.0' || ip === '127.0.0.1' || ip === '::1' || ipMap[ip]) return;

        try {
            setIpMap(prev => ({ ...prev, [ip]: '...' }));
            const res = await fetch(`https://ipinfo.io/${ip}/json`);
            if (res.ok) {
                const data = await res.json();
                if (data.country) {
                    const regionNames = new Intl.DisplayNames(['it'], { type: 'region' });
                    const countryName = regionNames.of(data.country) || data.country;
                    setIpMap(prev => ({ ...prev, [ip]: countryName }));
                    const { doc, updateDoc } = await import('firebase/firestore');
                    const { db } = await import('@/lib/firebase');
                    await updateDoc(doc(db, 'highlight_logs', docId), { country: countryName });
                    return;
                }
            }
            setIpMap(prev => ({ ...prev, [ip]: 'N/D' }));
        } catch (e) {
            setIpMap(prev => ({ ...prev, [ip]: 'N/D' }));
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo log?')) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            await deleteDoc(doc(db, 'highlight_logs', id));
            setLogs(prev => prev.filter(log => log.id !== id));
            setSelectedIds(prev => prev.filter(i => i !== id));
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'eliminazione del log.');
        }
    };

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.length} log selezionati?`)) return;

        try {
            const { doc, writeBatch } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');
            const batch = writeBatch(db);

            selectedIds.forEach(id => {
                batch.delete(doc(db, 'highlight_logs', id));
            });

            await batch.commit();
            setLogs(prev => prev.filter(log => !selectedIds.includes(log.id)));
            setSelectedIds([]);
        } catch (e) {
            console.error(e);
            alert('Errore durante l\'eliminazione massiva dei log.');
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === logs.length) setSelectedIds([]);
        else setSelectedIds(logs.map(l => l.id));
    };

    const toggleSelectOne = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Caricamento log highlight...</div>;

    return (
        <div className="space-y-4">
            {selectedIds.length > 0 && (
                <div className="flex justify-between items-center bg-red-50 border border-red-100 p-4 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <div className="text-red-700 text-sm font-medium">
                        Hai selezionato <span className="font-black">{selectedIds.length}</span> log
                    </div>
                    <button
                        onClick={handleDeleteSelected}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 font-bold text-xs transition-all"
                    >
                        <Trash2 size={14} /> Elimina Selezionati
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        <Heart size={16} className="text-rose-500" /> Cronologia Highlight Elementi
                    </h3>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <tr>
                            <th className="px-6 py-4 w-10">
                                <input
                                    type="checkbox"
                                    checked={logs.length > 0 && selectedIds.length === logs.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                />
                            </th>
                            <th className="px-6 py-4">Data / IP</th>
                            <th className="px-6 py-4">Località</th>
                            <th className="px-6 py-4">Elemento / Azione</th>
                            <th className="px-6 py-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log: any) => (
                            <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(log.id) ? 'bg-indigo-50/30' : ''}`}>
                                <td className="px-6 py-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(log.id)}
                                        onChange={() => toggleSelectOne(log.id)}
                                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-slate-500 text-xs font-medium">
                                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('it-IT') : 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono">
                                        <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                            {log.ip || '0.0.0.0'}
                                        </span>
                                        {(log.country || ipMap[log.ip]) && (
                                            <span className="text-indigo-500 font-black uppercase text-[9px]">
                                                {log.country || ipMap[log.ip]}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{log.locationName || 'N/D'}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">ID: {log.locationId}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-700 truncate max-w-[200px]" title={log.itemId}>{log.itemId}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${log.action === 'add' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {log.action === 'add' ? 'Aggiunto' : 'Rimosso'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Elimina Log"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {hasMore && (
                    <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex justify-center">
                        <button
                            onClick={() => fetchLogs(true)}
                            disabled={loadingMore}
                            className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 hover:border-primary/30 hover:text-primary transition-all shadow-sm flex items-center gap-2"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                    Caricamento...
                                </>
                            ) : (
                                <>
                                    <Plus size={14} /> Carica altri log
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
