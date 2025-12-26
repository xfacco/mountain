import { Navbar } from '@/components/layout/Navbar';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { locationNameToSlug } from '@/lib/url-utils';
import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

type Props = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const t = await getTranslations('Directory');
    const resolvedSearchParams = await searchParams;
    const locationName = resolvedSearchParams?.location as string;

    if (locationName) {
        const title = `${locationName} - All Insights & Details | Alpe Match`;
        const description = `Explore all seasonal descriptions, services, and detailed insights for ${locationName}.Complete mountain directory profile.`;

        return {
            title: title,
            description: description,
            robots: { index: true, follow: true },
            openGraph: {
                title: title,
                description: description,
                images: ['/logo_alpematch.png'],
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: title,
                description: description,
                images: ['/logo_alpematch.png'],
            }
        };
    }

    const defaultTitle = `${t('title')} | Alpe Match`;
    const defaultDesc = t('subtitle');

    return {
        title: defaultTitle,
        description: defaultDesc,
        robots: { index: true, follow: true },
        openGraph: {
            title: defaultTitle,
            description: defaultDesc,
            images: ['/logo_alpematch.png'],
        },
        twitter: {
            card: 'summary_large_image',
            title: defaultTitle,
            description: defaultDesc,
        }
    };
}

async function getLocations() {
    try {
        const locationsRef = collection(db, 'locations');
        const q = query(locationsRef);
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as any))
            .filter(loc => loc.status === 'published' || loc.published === true || !loc.status);
    } catch (e) {
        console.error("Error in directory fetch:", e);
        return [];
    }
}

import JsonLd from '@/components/seo/JsonLd';

export default async function DirectoryPage({ searchParams }: Props) {
    let locations = await getLocations();
    const t = await getTranslations('Directory');
    const resolvedSearchParams = await searchParams;
    const filterLocation = resolvedSearchParams?.location as string;

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
                'name': 'Directory',
                'item': 'https://www.alpematch.com/directory'
            }
        ]
    };

    if (filterLocation) {
        breadcrumbSchema.itemListElement.push({
            '@type': 'ListItem',
            'position': 3,
            'name': filterLocation,
            'item': `https://www.alpematch.com/directory?location=${encodeURIComponent(filterLocation)}`
        });
    }

    if (filterLocation) {
        locations = locations.filter(loc => {
            const search = filterLocation.toLowerCase();
            const name = loc.name.toLowerCase();
            const slug = (loc.slug || locationNameToSlug(loc.name)).toLowerCase();

            return name === search || slug === search || locationNameToSlug(name) === search;
        });
    }

    // Fetch heavy data (including services) for the locations we're about to display
    if (locations.length > 0) {
        locations = await Promise.all(locations.map(async (loc) => {
            try {
                const detailsSnap = await getDoc(doc(db, 'location_details', loc.id));
                if (detailsSnap.exists()) {
                    return { ...loc, ...detailsSnap.data() };
                }
            } catch (err) {
                console.error(`Error fetching details for ${loc.id}:`, err);
            }
            return loc;
        }));
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <JsonLd data={breadcrumbSchema} />
            <Navbar />

            <main className="pt-32 pb-20 container mx-auto px-6 max-w-6xl">
                <header className="mb-16 text-center max-w-3xl mx-auto">
                    <h1 className="text-4xl font-black text-slate-900 mb-6 uppercase tracking-tight">
                        {filterLocation ? `${filterLocation} - Insights` : t('title')}
                    </h1>
                    <p className="text-lg text-slate-600 font-medium">
                        {filterLocation
                            ? `Detailed list of all seasonal descriptions and specific services for ${filterLocation}.`
                            : t('subtitle')
                        }
                    </p>
                </header>

                <div className="space-y-12">
                    {locations.map((loc) => (
                        <section key={loc.id} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-slate-50 gap-4">
                                <h2 className="text-3xl font-black text-slate-900">{loc.name}</h2>
                                <Link
                                    href={`/locations/${loc.slug || locationNameToSlug(loc.name)}`}
                                    className="text-primary font-bold text-sm uppercase tracking-wider flex items-center gap-2 hover:underline"
                                >
                                    {t('full_destination')} <ArrowRight size={14} />
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                {/* Seasons Section */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{t('seasonal_overviews')}</h3>
                                    {['winter', 'summer', 'spring', 'autumn'].map(season => {
                                        const desc = loc.description?.[season];
                                        if (!desc) return null;
                                        return (
                                            <Link
                                                key={season}
                                                href={`/insights/${loc.slug || locationNameToSlug(loc.name)}/seasons/${season}`}
                                                className="block p-4 rounded-2xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
                                            >
                                                <h4 className="font-bold text-slate-900 capitalize flex items-center gap-2">
                                                    {season} Season <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">{t('read_more')} →</span>
                                                </h4>
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{desc}</p>
                                            </Link>
                                        );
                                    })}
                                </div>

                                {/* Services Section */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{t('specific_insights')}</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {loc.services?.filter((s: any) => s.description).map((service: any, idx: number) => (
                                            <Link
                                                key={idx}
                                                href={`/insights/${loc.slug || locationNameToSlug(loc.name)}/services/${locationNameToSlug(service.name)}`}
                                                className="block p-4 rounded-2xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-100"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">{service.name}</h4>
                                                    <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 uppercase font-black">{service.category}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 line-clamp-1 mt-1">{service.description}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                {(locations.length === 0) && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 font-medium">No results found.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
