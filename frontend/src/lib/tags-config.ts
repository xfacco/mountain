export const TAG_CATEGORIES = {
    target: [
        { id: 'family', label: 'Family' },
        { id: 'couple', label: 'Couple' },
        { id: 'friends', label: 'Friends' },
        { id: 'solo', label: 'Solo' }
    ],
    vibe: [
        { id: 'relax', label: 'Relax & Wellness' },
        { id: 'sport', label: 'Sport & Adrenaline' },
        { id: 'party', label: 'Party & Fun' },
        { id: 'luxury', label: 'Luxury & Comfort' },
        { id: 'nature', label: 'Nature & Silence' },
        { id: 'tradition', label: 'Authenticity & Tradition' },
        { id: 'work', label: 'Smart Working & Long Stay' },
        { id: 'silence', label: 'Silence & Contemplation' }
    ],
    activities: [
        { id: 'ski', label: 'Skiing & Snowboarding' },
        { id: 'hiking', label: 'Hiking & Trekking' },
        { id: 'wellness', label: 'Spa & Wellness' },
        { id: 'food', label: 'Food & Wine' },
        { id: 'culture', label: 'Culture & History' },
        { id: 'adrenaline', label: 'Extreme Sports & Experience' },
        { id: 'shopping', label: 'Retail & Shopping' },
        { id: 'photography', label: 'Photography & Sightseeing' }
    ],
    nations: [
        { id: 'italy', label: 'Italy' },
        { id: 'austria', label: 'Austria' },
        { id: 'switzerland', label: 'Switzerland' },
        { id: 'france', label: 'France' },
        { id: 'slovenia', label: 'Slovenia' },
        { id: 'spain', label: 'Spain' },
        { id: 'bulgaria', label: 'Bulgaria' }
    ]
} as const;

export type TagCategory = keyof typeof TAG_CATEGORIES;
export type TagId = typeof TAG_CATEGORIES[TagCategory][number]['id'];

