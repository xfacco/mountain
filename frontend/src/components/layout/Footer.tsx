'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Mail, MapPin, Phone, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function Footer() {
    const t = useTranslations('Footer');
    const tNav = useTranslations('Navbar'); // Reuse some nav terms

    return (
        <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-slate-800 pb-12">
                    {/* Brand & Payoff */}
                    <div className="col-span-1">
                        <Link href="/" className="flex items-center gap-3 mb-6 group">
                            <img
                                src="/logo_alpematch.png"
                                alt="Alpe Match Logo"
                                className="h-12 w-auto object-contain group-hover:scale-105 transition-transform"
                            />
                            <span className="font-display font-bold text-xl text-white">
                                Alpe Match
                            </span>
                        </Link>
                        <p className="text-sm leading-relaxed text-slate-400 mb-6">
                            {t('description')}
                        </p>
                        <p className="text-sm leading-relaxed text-slate-400 mb-6">© 2026 Alpe Match - {t('rights_reserved')}</p>

                        <div className="flex gap-4">
                            <a href="#" className="hover:text-white transition-colors"><Facebook size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="font-bold text-white mb-6">{t('explore')}</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
                            <li><Link href="/locations" className="hover:text-primary transition-colors">{tNav('destinations')}</Link></li>
                            <li><Link href="/compare" className="hover:text-primary transition-colors">{tNav('compare')}</Link></li>
                            <li><Link href="/match" className="hover:text-primary transition-colors">{tNav('match')}</Link></li>
                            <li><Link href="/comparisons" className="hover:text-primary transition-colors">Recent Comparisons</Link></li>
                            <li><Link href="/search" className="hover:text-primary transition-colors">{tNav('search_placeholder')}</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-bold text-white mb-6">{t('company')}</h4>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/about" className="hover:text-primary transition-colors">{t('about')}</Link></li>
                            <li><Link href="/contact" className="hover:text-primary transition-colors">{t('contact')}</Link></li>
                            <li><Link href="/privacy" className="hover:text-primary transition-colors">{t('privacy')}</Link></li>
                            <li><Link href="/terms" className="hover:text-primary transition-colors">{t('terms')}</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8">
                    <MetaInspector />
                </div>
            </div>
        </footer>
    );
}

function MetaInspector() {
    const [metaTags, setMetaTags] = useState<{ name: string; content: string }[]>([]);
    const [title, setTitle] = useState('');
    const [show, setShow] = useState(false);

    useEffect(() => {
        const updateMeta = () => {
            const tags: { name: string; content: string }[] = [];

            // Get Title
            setTitle(document.title);

            // Get Meta Tags
            document.querySelectorAll('meta').forEach(meta => {
                const name = meta.getAttribute('name') || meta.getAttribute('property');
                const content = meta.getAttribute('content');
                if (name && content && (
                    name.includes('description') ||
                    name.includes('keyword') ||
                    name.includes('image') ||
                    name.startsWith('og:') ||
                    name.startsWith('twitter:')
                )) {
                    tags.push({ name, content });
                }
            });
            setMetaTags(tags);
        };

        updateMeta();

        // Use MutationObserver to detect dynamic changes set by Next.js
        const observer = new MutationObserver(updateMeta);
        observer.observe(document.head, { childList: true, subtree: true, attributes: true });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="border-t border-slate-800/30 pt-6">
            <button
                onClick={() => setShow(!show)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-primary transition-colors mx-auto"
            >
                <Code size={12} /> {show ? 'Hide SEO Inspector' : 'Show SEO Inspector'}
                {show ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {show && (
                <div className="mt-6 bg-slate-950 rounded-2xl border border-white/5 p-6 animate-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto shadow-2xl">
                    <div className="grid gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Document Title (Head)</span>
                            <span className="text-sm text-slate-300 font-mono break-all">{title}</span>
                        </div>
                        {metaTags.map((tag, i) => (
                            <div key={i} className="flex flex-col gap-1 border-t border-white/5 pt-3">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{tag.name}</span>
                                <span className="text-xs text-slate-400 font-mono break-all leading-relaxed">{tag.content}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
