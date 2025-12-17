import { getTranslations } from 'next-intl/server';
import SearchClient from './SearchClient';
import { Suspense } from 'react';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Metadata' });

    return {
        title: `${t('search_title')} | MountComp`,
        description: t('search_description'),
    };
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <SearchClient />
        </Suspense>
    );
}
