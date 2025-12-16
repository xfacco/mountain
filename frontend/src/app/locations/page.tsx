'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useSeasonStore } from '@/store/season-store';
import Link from 'next/link';

export default function LocationsPage() {
    const { currentSeason } = useSeasonStore();
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const { collection, getDocs, query } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                // Fetch all locations and filter client-side for simplicity (avoids index creation issues)
                const q = query(collection(db, 'locations'));
                const querySnapshot = await getDocs(q);

                const docs = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as any))
                    .filter(loc => loc.status === 'published'); // Only show published

                setLocations(docs);
            } catch (e) {
                console.error("Error loading locations:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchLocations();
    }, []);

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="pt-24 pb-16 px-6 lg:px-12 max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">
                        Destinazioni Alpine
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        Esplora le migliori località di montagna. Filtra, analizza e trova la tua prossima meta perfetta.
                    </p>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-96 rounded-2xl bg-slate-200 animate-pulse" />
                        ))}
                    </div>
                ) : locations.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                        <p className="text-slate-500 text-lg">Nessuna località trovata nel database.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {locations.map((location) => (
                            <Link
                                key={location.id}
                                href={`/locations/${location.name}`}
                                className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="aspect-[4/3] relative overflow-hidden bg-slate-200">
                                    <img
                                        src={location.seasonalImages?.[currentSeason] || location.coverImage || 'https://images.unsplash.com/photo-1519681393784-d120267933ba'}
                                        alt={location.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                    <div className="absolute bottom-4 left-4 right-4">
                                        <div className="text-white/90 text-sm font-medium mb-1 uppercase tracking-wider">
                                            {location.region}, {location.country}
                                        </div>
                                        <h3 className="text-2xl font-display font-bold text-white">
                                            {location.name}
                                        </h3>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <p className="text-slate-600 line-clamp-3 mb-4 text-sm leading-relaxed">
                                        {location.description?.[currentSeason] || location.description?.['winter'] || 'Descrizione non disponibile.'}
                                    </p>

                                    <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 uppercase font-bold">Altitudine</span>
                                            <span className="text-sm font-bold text-slate-800">
                                                {location.altitude ? `${location.altitude}m` : 'N/D'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-slate-400 uppercase font-bold">Servizi</span>
                                            <span className="text-sm font-bold text-slate-800">{location.services?.length || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
