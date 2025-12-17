import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: `${t('compare_title')} | MountComp`,
        description: t('compare_description'),
    };
}

import CompareClient from './CompareClient';

export default function Page() {
    return <CompareClient />;
}
