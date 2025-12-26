import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { History, ArrowRight, Sparkles, Calendar, MapPin, Trash2, ExternalLink, Share2 } from 'lucide-react';
import Link from 'next/link';

interface MatchHistoryItem {
    timestamp: number;
    date: string;
    logId: string;
    results?: {
        name: string;
        score: number;
    }[];
    preferences: any;
}

interface MatchHistoryListProps {
    history: MatchHistoryItem[];
    onStartNew: () => void;
    onDeleteHistory: (timestamp: number) => void;
}

export const MatchHistoryList: React.FC<MatchHistoryListProps> = ({ history, onStartNew, onDeleteHistory }) => {
    const t = useTranslations('Match');
    // Reverse history to show newest first
    const sortedHistory = [...history].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                        <History className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">
                        {t('history.welcome_back')}
                    </h2>
                    <p className="text-slate-500">
                        {t('history.subtitle')}
                    </p>
                </div>

                <button
                    onClick={onStartNew}
                    className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-xl font-bold font-display text-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group mb-8"
                >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    {t('history.new_search')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('history.recent_searches')}</h3>
                    </div>
                    <div className="max-h-[450px] overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {sortedHistory.length > 0 ? sortedHistory.map((item) => (
                            <div
                                key={item.timestamp}
                                className="p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group relative"
                            >
                                <div className="flex justify-between items-start mb-3 pr-12">
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                                        <Calendar size={10} />
                                        {new Date(item.timestamp).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="flex gap-1">
                                        {item.results && item.results.slice(0, 1).map((res, i) => (
                                            <span key={i} className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                {res.score}% MATCH
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="absolute top-4 right-4 flex gap-1">
                                    <button
                                        onClick={() => onDeleteHistory(item.timestamp)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors bg-white rounded-lg border border-slate-100 shadow-sm"
                                        title={t('history.delete_hint')}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center flex-shrink-0">
                                            <MapPin size={14} className="text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1 overflow-hidden">
                                                {item.results && item.results.slice(0, 3).map((res, i) => (
                                                    <span key={i} className="text-[11px] font-bold text-slate-800 truncate">
                                                        {res.name}{i < Math.min(item.results!.length, 3) - 1 ? ',' : ''}
                                                    </span>
                                                ))}
                                                {(item.results?.length ?? 0) > 3 && (
                                                    <span className="text-[10px] text-slate-400 flex-shrink-0">
                                                        +{item.results!.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="block text-[9px] text-slate-400 uppercase font-bold">{t('history.locations_found')}</span>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/match?id=${item.logId}`}
                                        className="mt-1 w-full py-2 bg-slate-900 text-white rounded-lg hover:bg-primary transition-colors flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
                                    >
                                        <Share2 size={12} />
                                        {t('history.view_results')}
                                        <ExternalLink size={12} />
                                    </Link>
                                </div>
                            </div>
                        )) : (
                            <div className="py-12 text-center">
                                <History className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                <p className="text-slate-400 text-xs italic">{t('history.no_history')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


