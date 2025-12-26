import { getTranslations, getLocale } from 'next-intl/server';
import LocationsClient from './LocationsClient';

export async function generateMetadata() {
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: `${t('locations_title')} | Alpe Match`,
        description: t('locations_description'),
    };
}

import JsonLd from '@/components/seo/JsonLd';

export default function Page() {
    const breadcrumbSchema = {
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
            }
        ]
    };

    return (
        <>
            <JsonLd data={breadcrumbSchema} />
            <LocationsClient />
        </>
    );
}
