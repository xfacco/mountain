'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { useTranslations } from 'next-intl';
import { Mail, Send, CheckCircle2, AlertCircle, MessageSquare, Bug, MapPin, Lightbulb } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ContactPage() {
    const t = useTranslations('Contact');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        reason: 'info',
        description: '',
        passions: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(false);
        setSuccess(false);

        try {
            await addDoc(collection(db, 'contacts'), {
                ...formData,
                createdAt: serverTimestamp(),
                status: 'unread'
            });
            setSuccess(true);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                reason: 'info',
                description: '',
                passions: ''
            });
        } catch (err) {
            console.error("Error submitting contact form:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <main className="pt-32 pb-20">
                <div className="container mx-auto px-6 max-w-5xl">

                    <div className="text-center mb-16 space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                            {t('title')}
                        </h1>
                        <p className="text-xl text-slate-500 font-medium">
                            {t('subtitle')}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12 bg-white rounded-[32px] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12">

                        {/* Info Section */}
                        <div className="md:col-span-1 space-y-8 h-full flex flex-col justify-between">
                            <div className="space-y-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-6">How can we help you?</h2>

                                <div className="flex gap-4 group">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Bug size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Report an Error</h4>
                                        <p className="text-sm text-slate-500">Help us improve by reporting bugs or inaccuracies.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 group">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Lightbulb size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">Suggest Location</h4>
                                        <p className="text-sm text-slate-500">Know a great place? Let us know!</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 group">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <MessageSquare size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">More Information</h4>
                                        <p className="text-sm text-slate-500">For any other questions about our platform.</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Form Section */}
                        <div className="md:col-span-2">
                            {success ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-green-50 rounded-3xl border border-green-100 animate-in fade-in zoom-in">
                                    <CheckCircle2 size={64} className="text-green-500 mb-6" />
                                    <h2 className="text-2xl font-bold text-slate-900 mb-4">Grazie!</h2>
                                    <p className="text-slate-600 max-w-sm">
                                        {t('form.success')}
                                    </p>
                                    <button
                                        onClick={() => setSuccess(false)}
                                        className="mt-8 text-primary font-bold hover:underline"
                                    >
                                        Invia un altro messaggio
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-1">{t('form.first_name')}</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all bg-slate-50/50"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 ml-1">{t('form.last_name')}</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all bg-slate-50/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">{t('form.email')}</label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all bg-slate-50/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">{t('form.reason')}</label>
                                        <select
                                            value={formData.reason}
                                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all bg-slate-50/50 appearance-none cursor-pointer"
                                        >
                                            <option value="info">{t('reasons.info')}</option>
                                            <option value="bug">{t('reasons.bug')}</option>
                                            <option value="new_location">{t('reasons.new_location')}</option>
                                            <option value="other">{t('reasons.other')}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">{t('form.passions')}</label>
                                        <input
                                            type="text"
                                            placeholder={t('form.passions_hint')}
                                            value={formData.passions}
                                            onChange={(e) => setFormData({ ...formData, passions: e.target.value })}
                                            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all bg-slate-50/50"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">{t('form.description')}</label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all bg-slate-50/50 resize-none"
                                        />
                                    </div>

                                    {error && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100">
                                            <AlertCircle size={18} /> {t('form.error')}
                                        </div>
                                    )}

                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-primary transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <span className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {t('form.submit')} <Send size={20} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
