'use client';

import { useEffect, useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Navbar } from '@/components/layout/Navbar';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSeasonStore } from '@/store/season-store';
import { useTranslations } from 'next-intl';
import { locationNameToSlug } from '@/lib/url-utils';

export default function CompareMapClient({ locations }: { locations: any[] }) {
    const { currentSeason } = useSeasonStore();
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState<any>(null);
    const t = useTranslations('Map');
    const tCompare = useTranslations('Compare');

    // API Key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    useEffect(() => {
        // Simulate loading briefly
        setLoading(false);
    }, []);

    // Initial center if needed (fallback)
    const startPosition = { lat: 46.0748, lng: 11.1217 };

    if (!apiKey) {
        return <div className="p-10 text-center">API Key missing</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
            <Navbar />

            <div className="relative flex-1 bg-slate-200 w-full h-full overflow-hidden pt-16">
                {/* Back Button */}
                <div className="absolute top-20 left-4 z-10">
                    <Link
                        href="/compare"
                        className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur text-slate-700 rounded-lg shadow-md border border-slate-200 hover:bg-white transition-all font-bold"
                    >
                        <ArrowLeft size={18} />
                        {tCompare('title')}
                    </Link>
                </div>

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
                            style={{ width: '100%', height: '100%' }}
                        >
                            <MapEffect locations={locations} />

                            {locations.map((loc) => (
                                <AdvancedMarker
                                    key={loc.id}
                                    position={{ lat: loc.coordinates.lat, lng: loc.coordinates.lng }}
                                    onClick={() => setSelectedLocation(loc)}
                                >
                                    <Pin background={'#0f172a'} glyphColor={'#ffffff'} borderColor={'#000000'} scale={1.2} />
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
                                            target="_blank"
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
            </div>
        </div>
    );
}

// Helper component to fit bounds
function MapEffect({ locations }: { locations: any[] }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !locations || locations.length === 0 || !window.google) return;

        const bounds = new google.maps.LatLngBounds();
        let hasCoords = false;
        locations.forEach(loc => {
            if (loc.coordinates?.lat && loc.coordinates?.lng) {
                bounds.extend({ lat: loc.coordinates.lat, lng: loc.coordinates.lng });
                hasCoords = true;
            }
        });

        if (hasCoords) {
            map.fitBounds(bounds, {
                top: 100, bottom: 50, left: 50, right: 50
            });

            // Prevent excessive zoom if only 1 point
            if (locations.length === 1) {
                const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
                    if (map.getZoom()! > 12) map.setZoom(12);
                });
            }
        }
    }, [map, locations]);

    return null;
}

// Minimal context hook access if not exported by library (it usually is useMap)
const useMapContext = () => {
    const map = useMap();
    return { map };
};
