'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Search, MapPin, ArrowRight, Filter, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSeasonStore } from '@/store/season-store';

// Helper to normalize strings for search (remove accents, lowercase)
const normalize = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";

export default function SearchPage() {
    const { currentSeason } = useSeasonStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const searchParams = useSearchParams();

    // Load Data & Handle Query Params
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { collection, getDocs } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const querySnapshot = await getDocs(collection(db, 'locations'));
                const locs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setLocations(locs);
            } catch (error) {
                console.error("Error loading locations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Initialize from URL
        const q = searchParams.get('q');
        const tag = searchParams.get('tag');

        if (q) setSearchTerm(q);
        if (tag) {
            // Optional: if you want strict tag filtering from URL
            setSelectedTags([tag]);
            // OR just use search term for broader matching:
            // setSearchTerm(tag); 
        }
    }, [searchParams]);

    // Extract all unique tags for filter suggestions
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        locations.forEach(loc => {
            if (loc.tags) {
                Object.values(loc.tags).forEach((tagList: any) => {
                    if (Array.isArray(tagList)) {
                        tagList.forEach(t => tags.add(t));
                    }
                });
            }
        });
        return Array.from(tags).sort();
    }, [locations]);

    // Filter Logic
    const filteredLocations = useMemo(() => {
        const query = normalize(searchTerm);

        return locations.filter(loc => {
            // 1. Text Search
            const nameMatch = normalize(loc.name).includes(query);
            const regionMatch = normalize(loc.region || '').includes(query);
            const descMatch = normalize(loc.description?.[currentSeason] || '').includes(query);

            // Search inside tags
            let tagMatch = false;
            let tagsList: string[] = [];
            if (loc.tags) {
                Object.values(loc.tags).forEach((list: any) => {
                    if (Array.isArray(list)) tagsList = [...tagsList, ...list];
                });
            }
            if (tagsList.some(t => normalize(t).includes(query))) tagMatch = true;

            const textMatches = !query || nameMatch || regionMatch || descMatch || tagMatch;

            // 2. Tag Filter (Selected Tags from clickable pills)
            const tagFilterMatches = selectedTags.length === 0 || selectedTags.every(selTag =>
                tagsList.some(t => t === selTag)
            );

            return textMatches && tagFilterMatches;
        });
    }, [searchTerm, locations, currentSeason, selectedTags]);

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(prev => prev.filter(t => t !== tag));
        } else {
            setSelectedTags(prev => [...prev, tag]);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="pt-24 pb-12 px-6 container mx-auto max-w-5xl">

                {/* Search Header */}
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-3xl font-black text-slate-900">Trova la tua prossima destinazione</h1>
                    <p className="text-slate-500">Esplora per nome, attività, atmosfera o caratteristiche uniche.</p>
                </div>

                {/* Search Bar */}
                <div className="relative mb-8 max-w-2xl mx-auto">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                        <Search size={22} />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cerca 'Spa', 'Freeride', 'Dolomiti'..."
                        className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 text-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400 font-medium"
                        autoFocus
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Popular Tags / Filters */}
                <div className="mb-12 flex flex-wrap justify-center gap-2">
                    {/* Show random subset of popular tags or simple popular ones manually if preferred. Showing first 15 for now */}
                    {allTags.slice(0, 15).map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${selectedTags.includes(tag)
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                        >
                            {tag}
                        </button>
                    ))}
                    {allTags.length > 15 && <span className="text-xs text-slate-400 flex items-center px-2">+{allTags.length - 15} altri</span>}
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between mb-6 text-sm text-slate-500 font-medium border-b border-slate-200 pb-4">
                    <span>{filteredLocations.length} Destinazioni trovate</span>
                    {selectedTags.length > 0 && (
                        <button onClick={() => setSelectedTags([])} className="text-primary hover:underline">
                            Resetta filtri
                        </button>
                    )}
                </div>

                {/* Results Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {filteredLocations.length > 0 ? (
                            filteredLocations.map(location => (
                                <Link
                                    href={`/locations/${location.id}`}
                                    key={location.id}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all flex h-48"
                                >
                                    {/* Image */}
                                    <div className="w-1/3 relative overflow-hidden">
                                        <img
                                            src={location.seasonalImages?.[currentSeason] || location.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'}
                                            alt={location.name}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-6 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors">{location.name}</h3>
                                                    <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                                                        <MapPin size={12} /> {location.region}, {location.country}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                                                {location.description?.[currentSeason] || location.description?.['winter'] || 'Descrizione non disponibile.'}
                                            </p>
                                        </div>

                                        {/* Tags Preview */}
                                        <div className="flex gap-2 overflow-hidden masking-gradient-right">
                                            {location.tags?.vibe?.slice(0, 2).map((t: string) => (
                                                <span key={t} className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">{t}</span>
                                            ))}
                                            {location.tags?.highlights?.slice(0, 1).map((t: string) => (
                                                <span key={t} className="text-[10px] uppercase font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md whitespace-nowrap">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                                <Search size={48} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-900 mb-2">Nessun risultato</h3>
                                <p className="text-slate-500">Prova a cercare qualcos'altro o rimuovi i filtri.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
