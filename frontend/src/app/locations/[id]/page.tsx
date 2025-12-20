import { Metadata } from 'next';
import LocationDetailClient from './LocationClient';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getLocationData(name: string) {
    try {
        const locationsRef = collection(db, 'locations');
        const q = query(locationsRef, where('name', '==', name));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            // Convert to plain object to avoid "Only plain objects can be passed to Client Components" error
            // This handles Firestore Timestamps and other non-serializable objects
            return JSON.parse(JSON.stringify(data));
        }
    } catch (error) {
        console.error("Error fetching location for metadata:", error);
    }
    return null;
}

export async function generateMetadata(
    { params }: Props
): Promise<Metadata> {
    const resolvedParams = await params;
    const decodedName = decodeURIComponent(resolvedParams.id);
    const location = await getLocationData(decodedName);

    if (!location) {
        return {
            title: 'Location not found',
            description: 'The requested mountain destination is not available.'
        };
    }

    const description = location.description?.winter || location.description?.summer || location.description?.spring || location.description?.autumn || 'Discover this amazing Alpine destination with Alpe Match.';

    // Prioritize winter image, then coverImage, then other available seasonal images
    const image = location.seasonalImages?.winter ||
        location.coverImage ||
        location.seasonalImages?.summer ||
        location.seasonalImages?.autumn ||
        location.seasonalImages?.spring ||
        '/logo_alpematch.png';

    const canonical = `https://www.alpematch.com/locations/${encodeURIComponent(location.name)}`;

    // Build keywords
    const keywords = [
        location.name,
        location.region,
        location.country,
        'mountain',
        'ski resort',
        'alpine destination',
        'holiday',
        ...(location.tags?.highlights || []),
        ...(location.tags?.vibe || [])
    ].filter(Boolean);

    const pageTitle = `${location.name} - Info & Activities | Compare or Match Alpine Destinations`;

    return {
        title: pageTitle,
        description: description.substring(0, 160),
        keywords: keywords.join(', '),
        alternates: {
            canonical: canonical,
        },
        openGraph: {
            title: `${location.name} - Info & Activities | Compare or Match Alpine Destinations`,
            description: description.substring(0, 200),
            url: canonical,
            siteName: 'Alpe Match',
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: `${location.name} view`,
                },
            ],
            locale: 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${location.name} | Alpe Match`,
            description: description.substring(0, 200),
            images: [image],
        },
        robots: {
            index: true,
            follow: true,
        }
    };
}

export default async function Page({ params }: Props) {
    const resolvedParams = await params;
    const decodedName = decodeURIComponent(resolvedParams.id);
    const location = await getLocationData(decodedName);

    // Schema.org JSON-LD
    const jsonLd = location ? {
        '@context': 'https://schema.org',
        '@type': 'TouristAttraction',
        'name': location.name,
        'description': location.description?.winter || location.description?.summer || '',
        'image': location.coverImage || '',
        'address': {
            '@type': 'PostalAddress',
            'addressRegion': location.region,
            'addressCountry': location.country
        },
        'geo': location.coordinates ? {
            '@type': 'GeoCoordinates',
            'latitude': location.coordinates.lat,
            'longitude': location.coordinates.lng
        } : undefined
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <LocationDetailClient initialData={location ? { ...location, id: decodedName } : null} />
        </>
    );
}
