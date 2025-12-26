export const TAG_ALIASES: Record<string, string> = {
    // Cycling / Biking
    "mountain biking": "Mountain Biking",
    "mountain biking routes": "Mountain Biking",
    "mtb": "Mountain Biking",
    "mtb trails": "Mountain Biking",
    "downhill biking": "Downhill",
    "downhill": "Downhill",
    "cycling": "Cycling",
    "road cycling": "Road Cycling",
    "e-bike": "E-Bike",
    "ebike": "E-Bike",

    // Hiking / Trekking
    "hiking": "Hiking",
    "hiking trails": "Hiking",
    "trekking": "Trekking",
    "walking": "Walking",
    "nordic walking": "Nordic Walking",

    // Winter
    "skiing": "Skiing",
    "alpine skiing": "Alpine Skiing",
    "cross-country skiing": "Cross-country Skiing",
    "cross country skiing": "Cross-country Skiing",
    "xc skiing": "Cross-country Skiing",
    "snowboarding": "Snowboarding",
    "freeride": "Freeride",
    "ski touring": "Ski Touring",
    "snowshoeing": "Snowshoeing",

    // Wellness
    "spa": "Spa & Wellness",
    "wellness": "Spa & Wellness",
    "sauna": "Sauna",
    "thermal baths": "Thermal Baths",

    // Climbing
    "climbing": "Climbing",
    "rock climbing": "Climbing",
    "via ferrata": "Via Ferrata",

    // Water
    "swimming": "Swimming",
    "indoor swimming pool": "Swimming Pool",
    "outdoor swimming pool": "Swimming Pool",
    "lake": "Lake",

    // Generic
    "families": "Family Friendly",
    "family": "Family Friendly",
    "kids": "Family Friendly",
    "nightlife": "Nightlife",
    "apres ski": "Après-ski",
    "après-ski": "Après-ski",
    "apresski": "Après-ski"
};

/**
 * Normalizes a tag string using a dictionary of aliases.
 * If no alias is found, returns the original tag.
 * Allows fixing capitalization and merging similar tags.
 */
export function normalizeTag(tag: string): string {
    if (!tag) return "";

    const cleanTag = tag.trim();
    const lowerTag = cleanTag.toLowerCase();

    // Check for exact match in aliases (case-insensitive key)
    if (TAG_ALIASES[lowerTag]) {
        return TAG_ALIASES[lowerTag];
    }

    // Optional: Capitalize first letter of each word if not in alias map
    // return titleCase(cleanTag);

    return cleanTag;
}

/**
 * Normalizes a list of tags and removes duplicates.
 */
export function normalizeTags(tags: string[]): string[] {
    if (!tags || !Array.isArray(tags)) return [];

    const uniqueTags = new Set(
        tags.map(tag => normalizeTag(tag))
            .filter(tag => tag.length > 0)
    );

    return Array.from(uniqueTags).sort();
}
