import { getTranslations, getLocale } from 'next-intl/server';
import CompareClient from './CompareClient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Metadata } from 'next';

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function getComparisonParams(id: string) {
    if (!id) return null;
    try {
        const docRef = doc(db, 'compare_logs', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data();
        }
    } catch (e) {
        console.error("Error fetching comparison log metadata", e);
    }
    return null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: 'Metadata' });
    const resolvedParams = await searchParams;
    const compareId = resolvedParams.id as string;

    let dynamicTitle = null;

    if (compareId) {
        const data = await getComparisonParams(compareId);
        if (data && data.locations && Array.isArray(data.locations)) {
            const names = data.locations.map((l: any) => l.name).join(', ');
            dynamicTitle = `Comparison of: ${names}`;
        }
    }

    return {
        title: dynamicTitle ? `${dynamicTitle} | Alpe Match` : `${t('compare_title')} | Alpe Match`,
        description: t('compare_description'),
        robots: {
            index: true,
            follow: true
        }
    };
}

export default function Page() {
    return (
        <CompareClient />
    );
}
