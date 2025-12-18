import { getTranslations } from 'next-intl/server';
import SearchClient from './SearchClient';
import { Suspense } from 'react';

export async function generateMetadata({
    params: { locale },
    searchParams
}: {
    params: { locale: string },
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const resolvedSearchParams = await searchParams;
    const tag = resolvedSearchParams?.tag as string;
    const query = resolvedSearchParams?.q as string;

    const baseTitle = t('search_title');
    let dynamicTitle = baseTitle;

    if (tag) {
        dynamicTitle = `${tag} - ${baseTitle}`;
    } else if (query) {
        dynamicTitle = `${query} - ${baseTitle}`;
    }

    return {
        title: `${dynamicTitle} | Alpe Match`,
        description: tag
            ? `Discover all mountain destinations tagged with ${tag}. Compare features and find your ideal spot on Alpe Match.`
            : t('search_description'),
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
