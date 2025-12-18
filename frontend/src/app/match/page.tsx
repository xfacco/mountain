import { getTranslations } from 'next-intl/server';
import MatchWizard from './MatchWizard';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }) {
    const t = await getTranslations({ locale, namespace: 'Match' });

    return {
        title: `${t('title')} | Alpe Match`,
        description: t('subtitle'),
    };
}

export default function MatchPage() {
    return <MatchWizard />;
}
