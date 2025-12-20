import { Metadata } from 'next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Navbar } from '@/components/layout/Navbar';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

type Props = {
    params: Promise<{ slug: string[] }>;
}

async function getLocationData(name: string) {
    const locationsRef = collection(db, 'locations');
    const q = query(locationsRef, where('name', '==', name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        return JSON.parse(JSON.stringify(querySnapshot.docs[0].data()));
    }
    return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const [locationName, type, ...rest] = resolvedParams.slug.map(s => decodeURIComponent(s));
    const location = await getLocationData(locationName);
    const t = await getTranslations('Insights');

    if (!location) return { title: t('not_found') };

    let contentTitle = '';
    let description = '';

    if (type === 'seasons') {
        const season = rest[0];
        contentTitle = `${season.charAt(0).toUpperCase() + season.slice(1)} in ${location.name}`;
        description = location.description?.[season] || '';
    } else if (type === 'services') {
        const serviceName = rest[0];
        const service = location.services?.find((s: any) => s.name === serviceName);
        if (service) {
            contentTitle = `${service.name} - ${location.name}`;
            description = service.description || '';
        }
    }

    const fullTitle = `${contentTitle} - Compare with Alpe Match`;

    return {
        title: fullTitle,
        description: description.substring(0, 160),
        openGraph: {
            title: fullTitle,
            description: description.substring(0, 200),
            images: [location.coverImage || '/logo_alpematch.png'],
        }
    };
}

export default async function InsightPage({ params }: Props) {
    const resolvedParams = await params;
    const [locationName, type, ...rest] = resolvedParams.slug.map(s => decodeURIComponent(s));
    const location = await getLocationData(locationName) as any;
    const t = await getTranslations('Insights');

    if (!location) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <p>{t('content_not_found')}</p>
            </div>
        );
    }

    let mainTitle = '';
    let mainDescription = '';
    let categoryLabel = '';

    if (type === 'seasons') {
        const season = rest[0];
        mainTitle = `${season.charAt(0).toUpperCase() + season.slice(1)} Season at ${location.name}`;
        mainDescription = location.description?.[season];
        categoryLabel = t('seasonal_experience');
    } else if (type === 'services') {
        const serviceName = rest[0];
        const service = location.services?.find((s: any) => s.name === serviceName);
        mainTitle = service?.name || 'Service Detail';
        mainDescription = service?.description || '';
        categoryLabel = service?.category || 'Service';
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-4xl">
                {/* 1. PRIMARY INFORMATION (THE DESCRIPTION) */}
                <article className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                            {categoryLabel}
                        </span>
                    </div>

                    <h1 className="text-4xl font-black text-slate-900 mb-8 leading-tight">
                        {mainTitle}
                    </h1>

                    <div className="prose prose-lg text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {mainDescription || 'No detailed description available for this item.'}
                    </div>
                </article>

                {/* 2. LOCATION BRIEF DATA */}
                <aside className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0">
                        <img
                            src={location.coverImage || '/logo_alpematch.png'}
                            alt={location.name}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h2 className="text-2xl font-bold">{location.name}</h2>
                            <p className="text-slate-400 flex items-center justify-center md:justify-start gap-2 text-sm mt-1">
                                <MapPin size={14} /> {location.region}, {location.country}
                            </p>
                        </div>

                        {/* 3. LINK TO FULL LOCATION */}
                        <Link
                            href={`/locations/${encodeURIComponent(location.name)}`}
                            className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-primary hover:text-white transition-all group"
                        >
                            {t('view_full_profile')}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </aside>
            </main>
        </div>
    );
}
