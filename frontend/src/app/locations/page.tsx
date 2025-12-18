import { getTranslations } from 'next-intl/server';
import LocationsClient from './LocationsClient';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: `${t('locations_title')} | Alpe Match`,
        description: t('locations_description'),
    };
}

export default function Page() {
    return <LocationsClient />;
}
