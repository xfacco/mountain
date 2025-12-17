import { MetadataRoute } from 'next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mountain-comparator.vercel.app';

    // Static routes
    const routes = [
        '',
        '/search',
        '/compare',
        '/map',
        '/locations',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic routes (Locations)
    let locationRoutes: MetadataRoute.Sitemap = [];
    try {
        const q = query(collection(db, 'locations'), where('status', '==', 'published'));
        const querySnapshot = await getDocs(q);

        locationRoutes = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                url: `${baseUrl}/locations/${encodeURIComponent(data.name)}`,
                lastModified: new Date(data.updatedAt || Date.now()),
                changeFrequency: 'weekly' as const,
                priority: 0.9,
            };
        });
    } catch (error) {
        console.error('Error generating sitemap locations:', error);
    }

    return [...routes, ...locationRoutes];
}
