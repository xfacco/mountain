import { MetadataRoute } from 'next';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.alpematch.com';

    // Static pages
    const staticPages = [
        '',
        '/locations',
        '/search',
        '/compare',
        '/match',
        '/map',
        '/about',
        '/contact',
        '/directory'
    ].map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic pages
    let dynamicPages: MetadataRoute.Sitemap = [];
    try {
        const locationsRef = collection(db, 'locations');
        const q = query(locationsRef);
        const querySnapshot = await getDocs(q);

        querySnapshot.docs.forEach(doc => {
            const data = doc.data() as any;

            // Filtering logic consistent with Directory & LocationsClient
            if (data.status === 'published' || data.published === true || !data.status) {
                const locationName = data.name;

                // Full Location Page
                dynamicPages.push({
                    url: `${baseUrl}/locations/${encodeURIComponent(locationName)}`,
                    lastModified: new Date(),
                    changeFrequency: 'monthly' as const,
                    priority: 0.8,
                });

                // Insight: Seasons
                if (data.description) {
                    Object.keys(data.description).forEach(season => {
                        if (data.description[season]) {
                            dynamicPages.push({
                                url: `${baseUrl}/insights/${encodeURIComponent(locationName)}/seasons/${season}`,
                                lastModified: new Date(),
                                changeFrequency: 'monthly' as const,
                                priority: 0.6,
                            });
                        }
                    });
                }

                // Insight: Services
                if (data.services) {
                    data.services.forEach((service: any) => {
                        if (service.description) {
                            dynamicPages.push({
                                url: `${baseUrl}/insights/${encodeURIComponent(locationName)}/services/${encodeURIComponent(service.name)}`,
                                lastModified: new Date(),
                                changeFrequency: 'monthly' as const,
                                priority: 0.5,
                            });
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.error("Error generating sitemap:", error);
    }

    return [...staticPages, ...dynamicPages];
}
