export type Season = 'winter' | 'summer' | 'spring' | 'autumn';

export interface Location {
    id: string;
    name: string;
    region: string;
    country: string;
    coverImage: string;
    description: Record<string, string>;
    altitude?: number; // meters
    coordinates?: {
        lat: number;
        lng: number;
    };
    seasonalImages?: Record<string, string>; // Description can change per season
    services: Service[];
}

export interface ServiceCategory {
    id: 'tourism' | 'accommodation' | 'transport' | 'essential';
    label: string;
}

export interface Service {
    id: string;
    locationId: string;
    category: ServiceCategory['id'];
    name: string;
    description: string;
    seasonAvailability: Season[]; // Available in which seasons?
    icon?: string;
    metadata?: Record<string, any>; // Specific attributes (e.g. km of slopes, number of rooms)
}
