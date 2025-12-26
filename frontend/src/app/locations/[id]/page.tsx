import { Metadata } from 'next';
import LocationDetailClient from './LocationClient';
import { collection, query, where, getDocs, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { locationNameToSlug, slugToLocationName } from '@/lib/url-utils';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getLocationData(slugOrName: string) {
    try {
        const { doc, getDoc } = await import('firebase/firestore');
        const locationsRef = collection(db, 'locations');

        // First try to find by slug (new format)
        let q = query(locationsRef, where('slug', '==', slugOrName));
        let querySnapshot = await getDocs(q);

        // If not found by slug, try by name (backward compatibility)
        if (querySnapshot.empty) {
            // Try exact name match
            const decodedName = decodeURIComponent(slugOrName);
            q = query(locationsRef, where('name', '==', decodedName));
            querySnapshot = await getDocs(q);

            // If still not found, try converting slug back to name format
            if (querySnapshot.empty) {
                const possibleName = slugToLocationName(slugOrName);
                q = query(locationsRef, where('name', '==', possibleName));
                querySnapshot = await getDocs(q);
            }
        }

        if (!querySnapshot.empty) {
            const snap = querySnapshot.docs[0];
            const lightData = snap.data();
            const locId = snap.id;

            // Fetch details from the split collection
            try {
                const detailsDoc = await getDoc(doc(db, 'location_details', locId));
                if (detailsDoc.exists()) {
                    const combined = {
                        ...lightData,
                        ...detailsDoc.data(),
                        id: locId
                    };
                    return JSON.parse(JSON.stringify(combined));
                }
            } catch (e) {
                console.error("Error fetching details for", slugOrName, e);
            }

            // Fallback if details don't exist yet (migration period)
            return JSON.parse(JSON.stringify({ ...lightData, id: locId }));
        }
    } catch (error) {
        console.error("Error fetching location data:", error);
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

    const slug = location.slug || locationNameToSlug(location.name);
    const canonical = `https://www.alpematch.com/locations/${slug}`;

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

import JsonLd from '@/components/seo/JsonLd';

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

    const breadcrumbSchema = location ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [
            {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': 'https://www.alpematch.com'
            },
            {
                '@type': 'ListItem',
                'position': 2,
                'name': 'Locations',
                'item': 'https://www.alpematch.com/locations'
            },
            {
                '@type': 'ListItem',
                'position': 3,
                'name': location.name,
                'item': `https://www.alpematch.com/locations/${location.slug || locationNameToSlug(location.name)}`
            }
        ]
    } : null;

    return (
        <>
            {jsonLd && <JsonLd data={jsonLd} />}
            {breadcrumbSchema && <JsonLd data={breadcrumbSchema} />}
            <LocationDetailClient initialData={location ? { ...location, id: decodedName } : null} />
        </>
    );
}
