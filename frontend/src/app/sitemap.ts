import { MetadataRoute } from 'next';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { locationNameToSlug } from '@/lib/url-utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.alpematch.com';

    // Static pages
    const staticPages = [
        '',
        '/locations',
        '/search',
        '/compare',
        '/comparisons',
        '/match',
        '/map',
        '/about',
        '/contact',
        '/blog',
        '/directory',
        '/privacy',
        '/terms'
    ].map(route => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: (route === '/privacy' || route === '/terms' ? 'monthly' : 'weekly') as any,
        priority: route === '' ? 1 : (route === '/blog' ? 0.9 : 0.8),
    }));

    // Dynamic pages
    let dynamicPages: MetadataRoute.Sitemap = [];
    try {
        // 1. Locations
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
                    url: `${baseUrl}/locations/${locationNameToSlug(locationName)}`,
                    lastModified: new Date(),
                    changeFrequency: 'monthly' as const,
                    priority: 0.8,
                });

                // Insight: Seasons
                if (data.description) {
                    Object.keys(data.description).forEach(season => {
                        if (data.description[season]) {
                            dynamicPages.push({
                                url: `${baseUrl}/insights/${locationNameToSlug(locationName)}/seasons/${season}`,
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
                                url: `${baseUrl}/insights/${locationNameToSlug(locationName)}/services/${locationNameToSlug(service.name)}`,
                                lastModified: new Date(),
                                changeFrequency: 'monthly' as const,
                                priority: 0.5,
                            });
                        }
                    });
                }
            }
        });

        // 2. Blog Posts
        const blogRef = collection(db, 'blog_posts');
        const blogSnapshot = await getDocs(blogRef);
        blogSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.status === 'published' && data.slug) {
                dynamicPages.push({
                    url: `${baseUrl}/blog/${data.slug}`,
                    lastModified: data.updatedAt?.toDate?.() || new Date(),
                    changeFrequency: 'monthly' as const,
                    priority: 0.7,
                });
            }
        });

        // 3. Comparison Detail Pages (/compare?id=...)
        const compareLogsRef = collection(db, 'compare_logs');
        const compareSnapshot = await getDocs(compareLogsRef);

        compareSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Only index comparisons with multiple locations (consistent with ComparisonsPage)
            if (data.locations && Array.isArray(data.locations) && data.locations.length > 1) {
                dynamicPages.push({
                    url: `${baseUrl}/compare?id=${doc.id}`,
                    lastModified: new Date(),
                    changeFrequency: 'weekly' as const,
                    priority: 0.7,
                });
            }
        });

    } catch (error) {
        console.error("Error generating sitemap:", error);
    }

    return [...staticPages, ...dynamicPages];
}
