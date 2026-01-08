'use client';

import { Navbar } from '@/components/layout/Navbar';
import { useTranslations } from 'next-intl';
import { Shield, Cookie, Settings, CheckCircle2 } from 'lucide-react';

export default function CookiePolicyPage() {
    const t = useTranslations('Footer');

    const openCookieSettings = () => {
        if (typeof window !== 'undefined') {
            const cc = (window as any).CookieConsent;
            if (cc) {
                if (typeof cc.showPreferences === 'function') {
                    cc.showPreferences();
                } else if (typeof cc.showSettings === 'function') {
                    cc.showSettings();
                } else if (typeof cc.show === 'function') {
                    cc.show(true);
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="container mx-auto px-6 py-24 max-w-4xl">
                <div className="bg-white rounded-[40px] p-8 md:p-16 shadow-xl border border-slate-100">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                            <Cookie size={32} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900">{t('cookies')}</h1>
                            <p className="text-slate-500 font-medium">Manage your privacy preferences</p>
                        </div>
                    </div>

                    <div className="prose prose-slate max-w-none">
                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Shield className="text-primary" size={24} />
                                What are Cookies?
                            </h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                Cookies are small text files that are stored on your computer or mobile device when you visit a website.
                                They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
                            </p>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Settings className="text-primary" size={24} />
                                Your Preferences
                            </h2>
                            <p className="text-slate-600 leading-relaxed mb-6">
                                You can change your cookie preferences at any time. By clicking the button below, you can access the configuration panel and choose which categories of cookies to enable or disable.
                            </p>

                            <button
                                onClick={openCookieSettings}
                                className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-primary transition-all duration-300 shadow-lg hover:shadow-primary/30 group"
                            >
                                <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                Open Cookie Settings
                            </button>
                        </section>

                        <section className="mb-12">
                            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <CheckCircle2 className="text-primary" size={24} />
                                Types of Cookies we use
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="font-bold text-slate-900 mb-2">Strictly Necessary</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        These cookies are essential for the website to function and cannot be switched off in our systems.
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="font-bold text-slate-900 mb-2">Analytics & Performance</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
