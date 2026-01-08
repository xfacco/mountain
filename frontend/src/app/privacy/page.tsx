'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Shield, Search, Sparkles, BarChart, Mail, Lock, Eye } from 'lucide-react';
import privacyConfig from '@/config/privacy-config.json';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />
            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    <div className="text-center mb-16">
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
                            <Shield size={40} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                            Informativa sulla Privacy
                        </h1>
                        <p className="text-slate-500 font-medium tracking-wide border-b border-slate-200 pb-8 inline-block">
                            Versione 1.0.0 • Ultimo aggiornamento: {privacyConfig.lastUpdated}.
                            <br />
                            L'Informativa è in continua revisione visto le continue evoluzioni del servizio.
                        </p>
                    </div>

                    <div className="space-y-12 bg-white rounded-[40px] p-8 md:p-16 shadow-xl border border-slate-100">

                        {/* Introduzione */}
                        <section className="prose prose-slate max-w-none">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Eye className="text-primary" size={28} />
                                1. Panoramica
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Benvenuto su {privacyConfig.siteName}. La tua privacy è fondamentale per noi. Questa informativa spiega come raccogliamo, utilizziamo e proteggiamo i tuoi dati quando utilizzi i nostri servizi di ricerca, matching e comparazione di località montane.
                            </p>
                        </section>

                        {/* Sezioni Analizzate */}
                        <div className="grid gap-8">

                            {/* Search */}
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                        <Search size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Sezione Ricerca</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                            {privacyConfig.sections.search.description_it}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {privacyConfig.sections.search.dataCollected_it.map((item, i) => (
                                                <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded-md text-slate-500 border border-slate-200">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Match */}
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                        <Sparkles size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Alpe Match Wizard</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                            {privacyConfig.sections.match.description_it}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {privacyConfig.sections.match.dataCollected_it.map((item, i) => (
                                                <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded-md text-slate-500 border border-slate-200">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Compare */}
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                        <BarChart size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Compara Località</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                            {privacyConfig.sections.compare.description_it}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {privacyConfig.sections.compare.dataCollected_it.map((item, i) => (
                                                <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded-md text-slate-500 border border-slate-200">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:shadow-md">
                                <div className="flex items-start gap-5">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                        <Mail size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Contatti e Supporto</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                                            {privacyConfig.sections.contact.description_it}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {privacyConfig.sections.contact.dataCollected_it.map((item, i) => (
                                                <span key={i} className="text-[10px] font-bold uppercase tracking-wider bg-white px-2 py-1 rounded-md text-slate-500 border border-slate-200">
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sicurezza e Conservazione */}
                        <section className="prose prose-slate max-w-none pt-8 border-t border-slate-100">
                            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Lock className="text-primary" size={28} />
                                2. Sicurezza dei Dati
                            </h2>
                            <p className="text-slate-600 leading-relaxed">
                                Utilizziamo tecnologie sicure come Firebase (Google) per la gestione dei database e delle comunicazioni. I dati raccolti tramite i moduli di contatto sono accessibili solo al nostro team amministrativo per il tempo necessario a evadere le tue richieste.
                            </p>
                            <p className="text-slate-600 leading-relaxed">
                                I dati di navigazione e le preferenze espresse nel Match Wizard vengono analizzati in forma aggregata e anonima per migliorare l'accuratezza del nostro algoritmo.
                            </p>
                        </section>

                        {/* Diritti dell'utente */}
                        <section className="prose prose-slate max-w-none">
                            <h2 className="text-2xl font-bold text-slate-900">3. I Tuoi Diritti</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Hai il diritto di richiedere l'accesso, la rettifica o la cancellazione dei tuoi dati personali forniti utilizzando il modulo di contatto.
                            </p>
                        </section>
                    </div>
                </div>
            </main>


        </div>
    );
}
