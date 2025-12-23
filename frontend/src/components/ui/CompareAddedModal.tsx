'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface CompareAddedModalProps {
    isOpen: boolean;
    onClose: () => void;
    locationName: string;
}

export function CompareAddedModal({ isOpen, onClose, locationName }: CompareAddedModalProps) {
    const t = useTranslations('Common');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
                    >
                        <div className="p-8">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex flex-col items-center text-center">
                                {/* Success Icon */}
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200">
                                        <Check size={24} strokeWidth={3} />
                                    </div>
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-2">
                                    {locationName}
                                </h3>
                                <p className="text-slate-500 mb-8 leading-relaxed">
                                    {t('added_to_compare_desc') || 'Aggiunto con successo al tuo comparatore!'}
                                </p>

                                <div className="flex flex-col gap-3 w-full">
                                    <Link
                                        href="/compare"
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-primary transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/30 group"
                                    >
                                        {t('go_to_compare') || 'Vai al comparatore'}
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>

                                    <button
                                        onClick={onClose}
                                        className="w-full py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                                    >
                                        {t('continue_browsing') || 'Continua quello che stai facendo'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
