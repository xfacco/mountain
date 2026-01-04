import { Metadata } from 'next';
import CompareMapClient from './CompareMapClient';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { slugToLocationName, locationNameToSlug } from '@/lib/url-utils';

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getSingleLocation(slugOrId: string) {
    try {
        const locationsRef = collection(db, 'locations');

        // 1. Try by ID (if it looks like an ID, though slugs can look like anything. IDs are usually auto-generated alphanumeric)
        // Actually, let's try strict Slug match first as that is the intent.
        let q = query(locationsRef, where('slug', '==', slugOrId));
        let snapshot = await getDocs(q);

        // 2. Try by Name (decoded slug)
        if (snapshot.empty) {
            const name = slugToLocationName(slugOrId); // Heuristic
            // Also try exact decodedURIComponent if it was passed encoded
            const decoded = decodeURIComponent(slugOrId);

            q = query(locationsRef, where('name', '==', decoded)); // Try exact name
            snapshot = await getDocs(q);

            if (snapshot.empty) {
                q = query(locationsRef, where('name', '==', name)); // Try heuristic name
                snapshot = await getDocs(q);
            }
        }

        // 3. Try by ID directly as fallback
        if (snapshot.empty) {
            const docRef = doc(db, 'locations', slugOrId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                return { id: docSnap.id, ...data };
            }
        }

        if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            return { id: docSnap.id, ...docSnap.data() };
        }

    } catch (e) {
        console.error("Error fetching location", slugOrId, e);
    }
    return null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const resolvedParams = await searchParams;
    const locsParam = resolvedParams.locations as string;

    if (!locsParam) {
        return { title: 'Compare Locations Map' };
    }

    const slugs = locsParam.split(',');
    // We can just format the slugs for the title for speed, instead of ensuring DB names.
    // "alpe-d-huez" -> "Alpe D Huez"
    const names = slugs.map(s => slugToLocationName(s)).join(', ');

    return {
        title: `Compare ${names} - Interactive Map | Alpe Match`,
        description: `View and compare ${names} on an interactive map. Explore altitude, terrain, and distances.`,
        robots: {
            index: true,
            follow: true
        }
    };
}

export default async function CompareMapPage({ searchParams }: Props) {
    const resolvedParams = await searchParams;
    const locsParam = resolvedParams.locations as string;

    if (!locsParam) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>No locations selected.</p>
            </div>
        );
    }

    const slugs = locsParam.split(',');

    // Fetch all locations in parallel
    const locations = await Promise.all(
        slugs.map(slug => getSingleLocation(slug.trim()))
    );

    const validLocations = locations.filter(l => l !== null);

    // Filter mainly for valid coordinates to be safe
    const mappedLocations = validLocations.filter((l: any) => l.coordinates?.lat && l.coordinates?.lng);

    return <CompareMapClient locations={JSON.parse(JSON.stringify(mappedLocations))} />;
}
