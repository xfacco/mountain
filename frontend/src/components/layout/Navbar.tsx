'use client';

import Link from 'next/link';
import { SeasonSelector } from '@/components/ui/SeasonSelector';
import { useState } from 'react';
import { Menu, Search, X } from 'lucide-react';

import { useTranslations } from 'next-intl';

// ...

export function Navbar() {
    const t = useTranslations('Navbar');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/70 backdrop-blur-lg border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow">
                            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 3L2 20H22L12 3Z" fill="currentColor" fillOpacity="0.2" />
                                <path d="M12 3L2 20H22L12 3ZM12 3L16 11H8L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 7L14.5 12H9.5L12 7Z" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="font-display font-bold text-xl text-slate-800 group-hover:text-primary transition-colors">
                            MountComp
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/locations" className="text-slate-600 hover:text-primary transition-colors font-medium">{t('destinations')}</Link>
                        <Link href="/compare" className="text-slate-600 hover:text-primary transition-colors font-medium">{t('compare')}</Link>
                        <Link href="/map" className="text-slate-600 hover:text-primary transition-colors font-medium">{t('map')}</Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <SeasonSelector />
                        <Link href="/search" className="p-2 text-slate-500 hover:text-primary transition-colors">
                            <Search size={20} />
                        </Link>
                        <button
                            className="md:hidden p-2 text-slate-500 hover:text-slate-900 transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
                    <Link
                        href="/locations"
                        className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700 hover:text-primary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {t('destinations')}
                    </Link>
                    <Link
                        href="/compare"
                        className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700 hover:text-primary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {t('compare')}
                    </Link>
                    <Link
                        href="/map"
                        className="p-3 rounded-lg hover:bg-slate-50 font-medium text-slate-700 hover:text-primary transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        {t('map')}
                    </Link>
                </div>
            )}
        </nav>
    );
}
