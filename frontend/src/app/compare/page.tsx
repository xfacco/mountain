import { getTranslations, getLocale } from 'next-intl/server';
import CompareClient from './CompareClient';

export async function generateMetadata() {
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: `${t('compare_title')} | Alpe Match`,
        description: t('compare_description'),
    };
}

export default function Page() {
    return (
        <CompareClient />
    );
}
