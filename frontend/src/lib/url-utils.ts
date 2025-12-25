/**
 * Converts a location name to a SEO-friendly URL slug
 * Example: "Alagna Valsesia" -> "alagna-valsesia"
 */
export function locationNameToSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars except hyphens
        .replace(/\-\-+/g, '-')         // Replace multiple hyphens with single hyphen
        .replace(/^-+/, '')             // Trim hyphens from start
        .replace(/-+$/, '');            // Trim hyphens from end
}

/**
 * Converts a URL slug back to the original location name
 * This requires looking up the actual name from the database
 * For now, we'll just reverse the slug transformation as best we can
 */
export function slugToLocationName(slug: string): string {
    // This is a temporary solution - ideally we'd query the database
    // to get the exact original name
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Encodes a location name for use in URLs
 */
export function encodeLocationName(name: string): string {
    return encodeURIComponent(locationNameToSlug(name));
}

/**
 * Decodes a location name from a URL
 */
export function decodeLocationName(encoded: string): string {
    return decodeURIComponent(encoded);
}
