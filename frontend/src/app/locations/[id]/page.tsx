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
            return querySnapshot.docs[0].data();
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
            title: 'Località non trovata | MountComp',
            description: 'La località cercata non è disponibile.'
        };
    }

    // Determine description text (fallback chain)
    // Try current season if we could know it (we can't server side easily without cookies/headers, defaulting to winter or generic)
    const description = location.description?.winter || location.description?.summer || 'Scopri questa fantastica destinazione alpina.';
    const image = location.coverImage || location.seasonalImages?.winter || '/og-image.jpg';

    return {
        title: location.name,
        description: description.substring(0, 160), // Truncate for SEO
        openGraph: {
            title: `${location.name} - Info, Prezzi e Attività`,
            description: description.substring(0, 200),
            images: [{ url: image }],
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${location.name} | MountComp`,
            description: description.substring(0, 200),
            images: [image],
        }
    };
}

export default async function Page({ params }: Props) {
    // We don't strictly need to pass fetched data to client if client fetches itself, 
    // but for SEO/Perfo we could. For now, let's keep it simple and just render the client wrapper.
    // The client component uses useParams() so it works independently.
    return <LocationDetailClient />;
}
