'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Users } from 'lucide-react';

export default function ComparisonsListClient({ comparisons }: { comparisons: any[] }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredComparisons = comparisons.filter((comp) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        // Search in list of names in the comparison
        if (comp.locations && Array.isArray(comp.locations)) {
            const names = comp.locations.map((l: any) => l.name.toLowerCase()).join(' ');
            return names.includes(term);
        }
        return false;
    });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-4">
                    Recent Comparisons
                </h1>
                <p className="text-lg text-slate-600 mb-8">
                    See what other travelers are comparing and discover popular head-to-head match-ups.
                </p>

                {/* Quick Search */}
                <div className="max-w-md mx-auto relative">
                    <input
                        type="text"
                        placeholder="Search locations (e.g. Cortina)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredComparisons.map((comp: any) => {
                    const locationNames = comp.locations.map((l: any) => l.name).join(', ');
                    // const title = `Comparison of: ${locationNames}`;
                    const title = `Comparison of:`;

                    return (
                        <Link
                            key={comp.id}
                            href={`/compare?id=${comp.id}`}
                            className="group block bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-primary/20 transition-all duration-300 flex flex-col justify-between h-full"
                        >
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                                    {title}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {comp.locations.map((l: any) => (
                                        <span key={l.id} className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-md text-[11px] font-bold uppercase tracking-wider border border-slate-100">
                                            {l.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end">
                                <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                                    View <ArrowRight size={14} />
                                </span>
                            </div>
                        </Link>
                    );
                })}

                {filteredComparisons.length === 0 && (
                    <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-slate-100">
                        <p className="text-slate-400 mb-4">No comparisons found matching "{searchTerm}".</p>
                        <button onClick={() => setSearchTerm('')} className="text-primary font-bold hover:underline">
                            Clear search
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
