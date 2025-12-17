import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: `${t('map_title')} | MountComp`,
        description: t('map_description'),
    };
}

import MapClient from './MapClient';

export default function Page() {
    return <MapClient />;
}
