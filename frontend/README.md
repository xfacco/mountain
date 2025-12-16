# MountComp - Mountain Services Comparator

## Panoramica
Questa è la Web Application per **MountComp**, il comparatore definitivo di servizi montani.
Il progetto è costruito con **Next.js 16**, **Tailwind CSS 4** e **TypeScript**, ed è pronto per il deploy su **Google Cloud Run**.

## Funzionalità Implementate
1.  **Frontend Multi-Stagione**: L'interfaccia cambia tema automaticamente (Inverno/Estate) grazie a Zustand e Variabili CSS.
2.  **Sistema di Comparazione**: Pagina `/compare` interattiva per confrontare fino a 3 località.
3.  **Griglia Località**: Listing dinamico delle località disponibili.
4.  **Mock Data System**: Dati di esempio pre-caricati per dimostrare le funzionalità senza un database attivo.
5.  **Predisposizione Firebase**: Configurazione presente in `src/lib/firebase.ts` per collegarsi a Firestore.

## Installazione e Avvio

Il progetto è composto da due parti: Frontend (Next.js) e Backend (Python FastAPI). È necessario avviare entrambi.

### 1. Frontend (Next.js Application)
```bash
cd frontend
npm install
npm run dev
```
Il frontend sarà disponibile su: [http://localhost:3000](http://localhost:3000)

### 2. Backend (AI Engine API)
Il backend gestisce la ricerca automatica delle informazioni tramite Google Gemini AI.

**Prerequisiti:**
- Python 3.9+
- Una API Key di Google Gemini (Opzionale per test, obbligatoria per dati reali).

**Installazione dipendenze:**
```bash
cd backend
pip install -r requirements.txt
# Se riscontri errori di PATH su Mac, usa:
pip3 install -r requirements.txt
```

**Avvio del Server:**
```bash
# Avvio standard
uvicorn main:app --reload --port 8000

# Avvio con API KEY Reale (Consigliato per test AI)
GEMINI_API_KEY="tua-chiave-qui" uvicorn main:app --reload --port 8000
```
Il backend risponderà su: [http://localhost:8000](http://localhost:8000)
Endpoint di test AI: `POST http://localhost:8000/api/ai/research`

### Integrazione Frontend-Backend
Il frontend è configurato per cercare il backend su `localhost:8000`. Se cambi porta, aggiorna la configurazione.

## Struttura del Progetto
*   `frontend/`: App React/Next.js (Interfaccia Utente e Admin).
*   `backend/`: API Python (FastAPI) per AI e Scraping.
    *   `main.py`: Entry point dell'API.
    *   `prompts.py`: Definizione sistematica dei prompt per l'AI Gemini secondo le specifiche di progetto (Turismo, Ricettività, Infrastrutture, Servizi Essenziali).
*   `src/store`: Gestione dello stato (Zustand) per la stagione corrente.

## Configurazione Firebase
Per far funzionare il login:
1.  Segui la guida `FIREBASE_SETUP.md` per creare il progetto.
2.  Copia le chiavi in `frontend/.env.local`.
3.  Esegui lo script di setup iniziale da: `http://localhost:3000/admin/setup-first-account`.

## Prossimi Passi (Roadmap)
1.  **Backend AI**: Creare un servizio Python/Node su Cloud Run per lo scraping.
2.  **Admin Dashboard**: Creare la sezione `/admin` protetta da login Firebase per gestire i dati reali.
3.  **Database**: Sostituire `mock-locations.ts` con le chiamate reali a Firestore.
