'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { PlusCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function SuggestLocationBanner() {
    const t = useTranslations('Common');

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 relative overflow-hidden rounded-3xl bg-slate-900 p-8 md:p-12 text-center md:text-left group"
        >
            {/* Background pattern/gradient */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-4">
                        <PlusCircle size={14} /> AI Data Expansion
                    </div>
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
                        {t('suggest_location_title')}
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        {t('suggest_location_desc')}
                    </p>
                </div>

                <Link
                    href="/contact"
                    className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 group shrink-0 whitespace-nowrap"
                >
                    {t('suggest_location_button')}
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                </Link>
            </div>
        </motion.div>
    );
}
