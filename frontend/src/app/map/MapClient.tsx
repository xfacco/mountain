'use client';

import { useState, useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Navbar } from '@/components/layout/Navbar';
import { Loader2, AlertTriangle, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useSeasonStore } from '@/store/season-store';
import { useTranslations } from 'next-intl';
import { locationNameToSlug } from '@/lib/url-utils';

const defaultCenter = {
    lat: 46.0748, // Trento/Dolomites area center
    lng: 11.1217
};

export default function MapClient() {
    const { currentSeason } = useSeasonStore();
    const [locations, setLocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [mapBounds, setMapBounds] = useState<google.maps.LatLngBounds | null>(null);
    const t = useTranslations('Map');

    // API Key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const { collection, getDocs } = await import('firebase/firestore');
                const { db } = await import('@/lib/firebase');

                const querySnapshot = await getDocs(collection(db, 'locations'));
                const docs = querySnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() } as any))
                    .filter(loc => loc.status === 'published' && loc.coordinates?.lat && loc.coordinates?.lng);

                setLocations(docs);
            } catch (e) {
                console.error("Error loading locations:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, []);

    const filteredLocations = useMemo(() => {
        return locations.filter(loc => {
            // Text filter
            const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Viewport filter
            if (!mapBounds) return true; // Show all if bounds not yet ready
            const point = new google.maps.LatLng(loc.coordinates.lat, loc.coordinates.lng);
            return mapBounds.contains(point);
        });
    }, [locations, searchTerm, mapBounds]);

    // Calculate dynamic center based on locations, or fallback
    const startPosition = useMemo(() => {
        if (locations.length > 0) {
            return {
                lat: locations[0].coordinates.lat,
                lng: locations[0].coordinates.lng
            };
        }
        return defaultCenter;
    }, [locations]);

    if (!apiKey) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-slate-100">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600">
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('config_required')}</h2>
                        <p className="text-slate-600 mb-6 font-medium">
                            {t('api_key_instructions')}
                        </p>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-left mb-6">
                            <p className="text-xs font-mono text-slate-500 mb-2">Aggiungi al file `.env.local`:</p>
                            <code className="text-xs font-mono text-slate-800 break-all bg-white p-2 rounded block border border-slate-200">
                                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tua_chiave_qui
                            </code>
                        </div>
                        <Link href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                            {t('back_home')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
            <Navbar />

            <div className="relative flex-1 bg-slate-200 w-full h-full overflow-hidden">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-10">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-slate-500 font-medium">{t('loading')}</p>
                        </div>
                    </div>
                ) : (
                    <APIProvider apiKey={apiKey}>
                        <Map
                            defaultCenter={startPosition}
                            defaultZoom={9}
                            mapId="78e2144e4744279358a7cdc0"
                            style={{ width: '100%', height: 'calc(100vh - 64px)' }}
                            onBoundsChanged={(ev) => setMapBounds(ev.map.getBounds() || null)}
                        >
                            {locations.map((loc) => (
                                <AdvancedMarker
                                    key={loc.id}
                                    position={{ lat: loc.coordinates.lat, lng: loc.coordinates.lng }}
                                    onClick={() => setSelectedLocation(loc)}
                                >
                                    <Pin background={'#0f172a'} glyphColor={'#ffffff'} borderColor={'#000000'} />
                                </AdvancedMarker>
                            ))}

                            {selectedLocation && (
                                <InfoWindow
                                    position={{
                                        lat: selectedLocation.coordinates.lat,
                                        lng: selectedLocation.coordinates.lng
                                    }}
                                    onCloseClick={() => setSelectedLocation(null)}
                                    maxWidth={300}
                                >
                                    <div className="p-1 min-w-[200px]">
                                        <div className="relative h-32 mb-3 rounded-lg overflow-hidden bg-slate-100">
                                            <img
                                                src={selectedLocation.seasonalImages?.[currentSeason] || selectedLocation.coverImage}
                                                alt={selectedLocation.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-slate-800 shadow-sm">
                                                {selectedLocation.region}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight text-center">
                                            {selectedLocation.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-3 text-center">
                                            {t('altitude')}: {selectedLocation.altitude ? `${selectedLocation.altitude}m` : 'N/D'}
                                        </p>

                                        <Link
                                            href={`/locations/${locationNameToSlug(selectedLocation.name)}`}
                                            className="block w-full text-center py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                                        >
                                            {t('explore')}
                                        </Link>
                                    </div>
                                </InfoWindow>
                            )}
                        </Map>
                    </APIProvider>
                )}

                {/* Sidebar Overlay List - Desktop Only */}
                <div className="hidden lg:flex absolute top-24 left-4 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-white/50 w-72 h-[calc(100vh-120px)] flex-col z-10 transition-all duration-300">
                    <div className="shrink-0 mb-4">
                        <h1 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                            <MapPin className="text-primary" size={20} /> {t('destinations_title')}
                        </h1>

                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={t('search_placeholder') || "Search here..."}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                            />
                        </div>

                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                            Showing {filteredLocations.length} visible locations
                        </p>
                    </div>

                    <div className="overflow-y-auto space-y-2 pr-1 flex-1 custom-scrollbar mt-4">
                        {filteredLocations.map(loc => (
                            <button
                                key={loc.id}
                                onClick={() => setSelectedLocation(loc)}
                                className={`w-full text-left flex items-center gap-3 p-2 rounded-lg transition-colors group ${selectedLocation?.id === loc.id ? 'bg-slate-100 ring-1 ring-slate-200' : 'hover:bg-slate-50'
                                    }`}
                            >
                                <img src={loc.seasonalImages?.[currentSeason] || loc.coverImage} className="w-11 h-11 rounded-lg object-cover bg-slate-200 border border-slate-100" alt="" />
                                <div>
                                    <div className="text-xs font-bold text-slate-800 group-hover:text-primary transition-colors">{loc.name}</div>
                                    <div className="text-[10px] text-slate-400 font-medium">{loc.region}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
