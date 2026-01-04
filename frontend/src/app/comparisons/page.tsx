import { Navbar } from '@/components/layout/Navbar';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { Metadata } from 'next';
import ComparisonsListClient from './ComparisonsListClient';

export const metadata: Metadata = {
    title: 'Recent Comparisons | Alpe Match',
    description: 'Explore recent comparisons made by other users to find your perfect mountain destination.',
    robots: {
        index: true,
        follow: true
    }
};

async function getRecentComparisons() {
    try {
        const q = query(collection(db, 'compare_logs'), orderBy('timestamp', 'desc'), limit(50));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Serialize timestamps for Client Component
            return {
                id: doc.id,
                ...data,
                timestamp: data.timestamp ? { seconds: data.timestamp.seconds } : null
            };
        });
    } catch (e) {
        console.error("Error fetching comparisons", e);
        return [];
    }
}

export default async function ComparisonsPage() {
    const comparisons = await getRecentComparisons();

    // Filter out empty or broken logs if any
    const validComparisons = comparisons.filter((c: any) => c.locations && Array.isArray(c.locations) && c.locations.length > 1);

    // Deduplicate comparisons (keep only one per unique set of locations)
    const uniqueComparisons: any[] = [];
    const seenSignatures = new Set<string>();

    validComparisons.forEach((comp: any) => {
        // Create a unique signature by sorting location IDs 
        // (assuming IDs are stable, otherwise names could work too but IDs are safer)
        const signature = comp.locations
            .map((l: any) => l.id)
            .sort()
            .join('|');

        if (!seenSignatures.has(signature)) {
            seenSignatures.add(signature);
            uniqueComparisons.push(comp);
        }
    });

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="pt-32 pb-16 container mx-auto px-4 md:px-6">
                <ComparisonsListClient comparisons={uniqueComparisons} />
            </div>
        </div>
    );
}
