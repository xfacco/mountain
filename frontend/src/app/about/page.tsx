'use client';

import { Navbar } from '@/components/layout/Navbar';
import { useTranslations } from 'next-intl';
import { Linkedin, Heart, ShieldCheck, Users, Mountain } from 'lucide-react';

export default function AboutPage() {
    const t = useTranslations('About');

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-6 max-w-4xl">

                    {/* Hero Section */}
                    <div className="text-center mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-bold tracking-wide uppercase mb-4">
                            <Mountain size={16} /> Alpe Match Story
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                            {t('title')}
                        </h1>
                        <p className="text-xl text-slate-500 font-medium">
                            {t('subtitle')}
                        </p>
                    </div>

                    {/* Mission Section */}
                    <div className="bg-slate-50 rounded-3xl p-8 md:p-12 mb-12 border border-slate-100">
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="flex-1 space-y-6">
                                <h2 className="text-3xl font-bold text-slate-900 border-l-4 border-primary pl-4">
                                    {t('mission_title')}
                                </h2>
                                <p className="text-lg text-slate-600 leading-relaxed">
                                    {t('mission_desc')}
                                </p>
                            </div>
                            <div className="w-full md:w-1/3 grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center justify-center aspect-square">
                                    <Heart className="text-red-500 mb-2" size={32} />
                                    <span className="text-xs font-bold text-slate-900 uppercase">{t('passion')}</span>
                                </div>
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center justify-center aspect-square">
                                    <Users className="text-blue-500 mb-2" size={32} />
                                    <span className="text-xs font-bold text-slate-900 uppercase">{t('community')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 gap-8 mb-20">
                        <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 space-y-4 hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">{t('free_service')}</h3>
                            <p className="text-slate-500 leading-relaxed">
                                {t('free_desc')}
                            </p>
                        </div>

                        <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/20 space-y-4 hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                                <Mountain size={24} />
                            </div>
                            <h3 className="text-xl font-bold">{t('tech_title')}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {t('tech_desc')}
                            </p>
                        </div>
                    </div>

                    {/* Creator Section */}
                    <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 p-8 md:p-12 shadow-sm">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                        <div className="relative flex flex-col md:flex-row items-center gap-12">
                            <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                <Mountain size={64} />
                            </div>

                            <div className="flex-1 space-y-6 text-center md:text-left">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 mb-1">{t('creator_name')}</h2>
                                    <p className="text-primary font-bold uppercase tracking-widest text-sm">{t('creator_role')}</p>
                                </div>
                                <p className="text-slate-600 text-lg leading-relaxed italic">
                                    "{t('creator_desc')}"
                                </p>
                                <a
                                    href="https://www.linkedin.com/in/corrado-facchini-8948553b/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-full font-bold hover:bg-primary transition-all shadow-lg group"
                                >
                                    <Linkedin size={20} className="group-hover:scale-110" />
                                    {t('linkedin')}
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
