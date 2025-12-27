'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Heart, ArrowRight, MapPin, Trash2, Mountain, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { locationNameToSlug } from '@/lib/url-utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function FavoritesPage() {
    const t = useTranslations('LocationDetail');
    const tCommon = useTranslations('Common');
    const [allFavorites, setAllFavorites] = useState<{ id: string, name?: string, items: string[] }[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAllFavorites = () => {
        const favorites: { id: string, name?: string, items: string[] }[] = [];
        const namesRepo = JSON.parse(localStorage.getItem('alpematch_location_names') || '{}');

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('alpematch_highlights_')) {
                const id = key.replace('alpematch_highlights_', '');
                try {
                    const items = JSON.parse(localStorage.getItem(key) || '[]');
                    if (items.length > 0) {
                        favorites.push({ id, name: namesRepo[id], items });
                    }
                } catch (e) {
                    console.error("Error parsing favorites for", id, e);
                }
            }
        }
        setAllFavorites(favorites);
        setLoading(false);
    };

    useEffect(() => {
        loadAllFavorites();

        // Listen for storage changes in other tabs
        window.addEventListener('storage', loadAllFavorites);
        return () => window.removeEventListener('storage', loadAllFavorites);
    }, []);

    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name?: string }>({
        isOpen: false,
        id: '',
        name: ''
    });

    const removeLocationFavorites = (id: string, name?: string) => {
        localStorage.removeItem(`alpematch_highlights_${id}`);
        // Notify other components like Navbar to update
        window.dispatchEvent(new Event('highlightsUpdated'));
        loadAllFavorites();
        setDeleteModal({ isOpen: false, id: '', name: '' });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Custom Delete Modal */}
            <AnimatePresence>
                {deleteModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10 max-w-md w-full text-center space-y-8 overflow-hidden"
                        >
                            {/* Decoration */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-rose-500 to-red-500" />

                            <div className="mx-auto w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-2 rotate-3 hover:rotate-0 transition-transform duration-500">
                                <Trash2 size={36} />
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-slate-900 leading-tight">Are you sure?</h3>
                                <p className="text-slate-500 font-medium">
                                    You are about to remove all favorited items for <span className="text-slate-900 font-bold">"{deleteModal.name || deleteModal.id}"</span>. This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => removeLocationFavorites(deleteModal.id, deleteModal.name)}
                                    className="w-full py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-200 active:scale-95"
                                >
                                    Yes, Clear All Favorites
                                </button>
                                <button
                                    onClick={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
                                    className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="pt-32 pb-20 container mx-auto px-6">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-4 bg-rose-500 rounded-3xl shadow-xl shadow-rose-200 mb-4">
                            <Heart size={40} className="text-white fill-current" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                            {t('your_favorites_summary')}
                        </h1>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
                            Discover and manage all the elements you've bookmarked across your favorite mountain destinations.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : allFavorites.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[40px] p-12 text-center border border-slate-100 shadow-xl space-y-6"
                        >
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <Heart size={32} className="text-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-slate-900">Your collection is empty</h3>
                                <p className="text-slate-500">Start exploring locations and click the heart icon to save items you love.</p>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left pt-12 pb-6 max-w-3xl mx-auto">
                                    <div className="space-y-3 p-6 bg-slate-50 rounded-[32px] border border-slate-100/50">
                                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-800 font-black shadow-sm border border-slate-100">1</div>
                                        <h4 className="font-bold text-slate-900 tracking-tight">Discover</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Browse resorts and find local services, specific activities, or insights you find useful.</p>
                                    </div>
                                    <div className="space-y-3 p-6 bg-rose-50/50 rounded-[32px] border border-rose-100/50">
                                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-rose-500 font-black shadow-sm border border-rose-100">2</div>
                                        <h4 className="font-bold text-slate-900 tracking-tight">Save</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Click the heart icon on any item to pin it to your private local collection instantly.</p>
                                    </div>
                                    <div className="space-y-3 p-6 bg-slate-50 rounded-[32px] border border-slate-100/50">
                                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-slate-800 font-black shadow-sm border border-slate-100">3</div>
                                        <h4 className="font-bold text-slate-900 tracking-tight">Revisit</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed font-medium">Access this summary anytime from the heart icon in the main menu across any device.</p>
                                    </div>
                                </div>
                            </div>
                            <Link href="/locations" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-200">
                                Explore Destinations <ArrowRight size={20} />
                            </Link>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AnimatePresence>
                                {allFavorites.map((fav) => (
                                    <motion.div
                                        key={fav.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="group bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col"
                                    >
                                        <div className="p-8 space-y-6 flex-1">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <h2 className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors">
                                                        {fav.name || fav.id}
                                                    </h2>
                                                </div>
                                                <button
                                                    onClick={() => setDeleteModal({ isOpen: true, id: fav.id, name: fav.name })}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                    title="Remove all favorites for this location"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-1 h-3 bg-rose-500 rounded-full"></div>
                                                    Bookmarked Items ({fav.items.length})
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {fav.items.map(item => (
                                                        <span key={item} className="px-3 py-1.5 bg-slate-50 text-slate-600 text-[11px] font-bold rounded-xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/30 transition-colors">
                                                            {item}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/locations/${locationNameToSlug(fav.name || fav.id)}`}
                                            className="bg-slate-50 hover:bg-primary p-5 flex items-center justify-center gap-2 text-slate-600 hover:text-white font-black uppercase text-xs tracking-widest transition-all border-t border-slate-100 group-hover:border-primary"
                                        >
                                            View Full Destination <ArrowRight size={16} />
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Footer Stats summary */}
                    {allFavorites.length > 0 && (
                        <div className="bg-slate-900 rounded-[40px] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-white/10 rounded-3xl backdrop-blur-md border border-white/10">
                                    <Mountain size={40} className="text-primary-light" />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-3xl font-black">{allFavorites.length}</div>
                                    <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Saved Destinations</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="p-5 bg-white/10 rounded-3xl backdrop-blur-md border border-white/10">
                                    <LayoutGrid size={40} className="text-rose-400" />
                                </div>
                                <div className="space-y-1">
                                    <div className="text-3xl font-black">
                                        {allFavorites.reduce((acc, curr) => acc + curr.items.length, 0)}
                                    </div>
                                    <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Highlights</div>
                                </div>
                            </div>
                            <Link href="/match" className="px-8 py-5 bg-white text-slate-900 rounded-full font-black uppercase text-xs tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10">
                                Find more matches
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
