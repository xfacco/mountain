'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            // Custom Auth: Query Firestore directly
            const { doc, getDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            // Check if admin document exists with this email (using email as Doc ID)
            const adminDocRef = doc(db, 'admins', email);
            const adminDoc = await getDoc(adminDocRef);

            if (adminDoc.exists()) {
                const adminData = adminDoc.data();

                // Simple password check (Note: In production use hashing!)
                if (adminData.password === password) {
                    // Success! 
                    // We need to persist this 'logged in' state manually since we aren't using Firebase Auth token.
                    // For this session, we'll store a simple flag in localStorage/sessionStorage
                    sessionStorage.setItem('mountcomp_admin_user', email);

                    router.push('/admin');
                } else {
                    setError('Password non valida.');
                }
            } else {
                setError('Utente non trovato.');
            }

        } catch (err: any) {
            console.error(err);
            setError('Errore di connessione al database: ' + err.message);
        }
    };
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <div className="flex justify-center mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <Lock size={24} />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-center text-slate-900 mb-8">
                    Admin Login
                </h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="admin@AlpeMatch.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg mt-4"
                    >
                        Accedi
                    </button>
                </form>
            </div>
        </div>
    );
}
