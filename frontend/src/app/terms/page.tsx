'use client';

import { Navbar } from '@/components/layout/Navbar';
import { FileText, Search, Sparkles, BarChart, ShieldCheck, Scale, Info } from 'lucide-react';
import termsConfig from '@/config/terms-config.json';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-16">
                        <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-amber-600">
                            <FileText size={40} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                            Termini e Condizioni
                        </h1>
                        <p className="text-slate-500 font-medium tracking-wide border-b border-slate-200 pb-8 inline-block">
                            Versione {termsConfig.version} • Ultimo aggiornamento: {termsConfig.lastUpdated}
                            <br />
                            I Termini e Condizioni sono in continua revisione visto le continue evoluzioni del servizio.
                        </p>
                    </div>

                    <div className="space-y-12 bg-white rounded-[40px] p-8 md:p-16 shadow-xl border border-slate-100">

                        {/* Introduzione */}
                        <section className="prose prose-slate max-w-none">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Scale className="text-amber-600" size={28} />
                                1. Accettazione dei Termini
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                L'accesso e l'utilizzo di {termsConfig.siteName} sono soggetti ai seguenti Termini e Condizioni. Utilizzando il sito, l'utente conferma di aver letto, compreso e accettato integralmente tali termini. Il servizio è in continua evoluzione e i presenti termini possono essere aggiornati in qualsiasi momento.
                            </p>
                        </section>

                        {/* Sezioni Analizzate */}
                        <div className="grid gap-8">

                            {/* Search */}
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                                        <Search size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{termsConfig.sections.search.title_it}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {termsConfig.sections.search.content_it}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Match */}
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{termsConfig.sections.match.title_it}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {termsConfig.sections.match.content_it}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Compare */}
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
                                        <BarChart size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">{termsConfig.sections.compare.title_it}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            {termsConfig.sections.compare.content_it}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Proprietà Intellettuale */}
                        <section className="prose prose-slate max-w-none pt-8 border-t border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <ShieldCheck className="text-amber-600" size={28} />
                                2. {termsConfig.sections.intellectual_property.title_it}
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                {termsConfig.sections.intellectual_property.content_it}
                            </p>
                        </section>

                        {/* Limitazione di Responsabilità */}
                        <section className="prose prose-slate max-w-none">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Info className="text-amber-600" size={28} />
                                3. {termsConfig.sections.liability.title_it}
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                {termsConfig.sections.liability.content_it}
                            </p>
                        </section>

                        {/* Nota finale */}
                        <div className="mt-8 p-8 bg-amber-50 rounded-3xl border border-amber-100 text-amber-900 text-sm italic">
                            L'obiettivo di Alpe Match è fornire uno strumento utile e gratuito per gli amanti della montagna. Cerchiamo di fare del nostro meglio per garantire la qualità dei dati, ma invitiamo sempre ad una verifica finale presso le strutture di riferimento.
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
