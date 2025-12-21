import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mountain-comparator.vercel.app';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/alpeadminmatch/', '/private/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
