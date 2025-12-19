'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FileText, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Navbar />

            <main className="flex-grow pt-32 pb-20 px-6 max-w-4xl mx-auto flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mb-8 text-amber-600">
                    <FileText size={40} />
                </div>

                <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 mb-6">
                    Terms of Service
                </h1>

                <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} /> Work in progress
                        </div>
                    </div>

                    <p className="text-lg text-slate-600 leading-relaxed mb-8">
                        Il servizio Alpe Match è in una fase iniziale di sviluppo. Stiamo redigendo i Termini di Servizio completi per riflettere al meglio l'evoluzione della nostra piattaforma.
                    </p>

                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left mb-8">
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4">Punti chiave in fase di stesura:</h2>
                        <ul className="space-y-3 text-slate-600 text-sm">
                            <li className="flex items-start gap-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>Condizioni d'uso gratuite e accesso alla piattaforma.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>Responsabilità sui contenuti e accuratezza dei dati comparati.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>Proprietà intellettuale del marchio e degli algoritmi di matching.</span>
                            </li>
                        </ul>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                    >
                        <ArrowLeft size={18} /> Torna alla Home
                    </Link>
                </div>
            </main>

            <Footer />
        </div>
    );
}
