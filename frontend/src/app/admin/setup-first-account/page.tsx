'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export default function SetupPage() {
    const [status, setStatus] = useState('Pronto');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

    const createAdmin = async () => {
        setStatus('In esecuzione...');
        addLog('Inizio procedura...');

        const email = 'facchini.corrado@gmail.com';
        const password = '1234567Asz'; // Nota: Assicurati che non sia una vera password tua in produzione!

        try {
            // Custom Auth: Just write to Firestore
            addLog(`Scrittura in Firestore (admins/${email})...`);

            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('@/lib/firebase');

            await setDoc(doc(db, 'admins', email), {
                role: 'superadmin',
                password: password, // Storing plain text password as requested (unsafe for production!)
                createdAt: new Date().toISOString(),
                managedBy: 'setup-script-custom-auth'
            });

            addLog('Documento admin creato con successo!');
            setStatus('COMPLETATO! Ora puoi andare al login.');
        } catch (err: any) {
            console.error(err);
            addLog(`ERRORE: ${err.message}`);
            setStatus('Fallito');
        }
    };

    return (
        <div className="p-10 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Setup Primo Admin</h1>
            <p className="mb-4 text-slate-600">
                Questa pagina crea l'utente <b>facchini.corrado@gmail.com</b> e lo aggiunge alla collezione `admins`.
                <br /><br />
                ⚠️ Funziona solo se Firestore è in <b>Test Mode</b> (scrivibile da chiunque).
            </p>

            <button
                onClick={createAdmin}
                className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
            >
                CREA ADMIN ORA
            </button>

            <div className="mt-8 p-4 bg-slate-900 text-green-400 font-mono text-sm rounded-lg min-h-[200px]">
                {logs.map((L, i) => <div key={i}>{`> ${L}`}</div>)}
                <div className="mt-2 text-white font-bold">Status: {status}</div>
            </div>
        </div>
    );
}
