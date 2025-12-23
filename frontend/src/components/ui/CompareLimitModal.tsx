'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Info, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CompareLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedLocations: any[];
    onRemove: (id: string) => void;
}

export function CompareLimitModal({ isOpen, onClose, selectedLocations, onRemove }: CompareLimitModalProps) {
    const t = useTranslations('Common');

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
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
                                {/* Warning Icon */}
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                                    <AlertCircle size={32} className="text-amber-500" />
                                </div>

                                <h3 className="text-2xl font-black text-slate-900 mb-2">
                                    {t('compare_limit_title') || 'Limite raggiunto'}
                                </h3>
                                <p className="text-slate-500 mb-8 leading-relaxed">
                                    {t('compare_limit_desc') || 'Puoi confrontare al massimo 3 località. Rimuovine una per aggiungerne una nuova.'}
                                </p>

                                {/* Locations List */}
                                <div className="w-full space-y-3 mb-8">
                                    {selectedLocations.map((loc) => (
                                        <div
                                            key={loc.id}
                                            className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-red-100 hover:bg-red-50/30 transition-all duration-300"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm">
                                                    <img
                                                        src={loc.coverImage || loc.seasonalImages?.winter}
                                                        alt={loc.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <span className="font-bold text-slate-800">{loc.name}</span>
                                            </div>
                                            <button
                                                onClick={() => onRemove(loc.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-all shadow-sm hover:shadow-red-100"
                                                title={t('remove') || 'Rimuovi'}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-primary transition-colors shadow-lg shadow-slate-200"
                                >
                                    {t('close') || 'Chiudi'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
