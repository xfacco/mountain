import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.alpematch.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/alpeadminmatch/', '/private/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
