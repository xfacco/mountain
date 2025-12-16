# Guida alla Configurazione di Firebase e Ambiente

Poiché non posso interagire direttamente con la Google Cloud Console per te, segui questi passaggi per abilitare il database e l'autenticazione.

## 1. Creare un Progetto Firebase
1. Vai su [console.firebase.google.com](https://console.firebase.google.com/).
2. Clicca su **"Aggiungi un progetto"** e chiamalo `mountcomp` (o simile).
3. Abilita (o disabilita) Google Analytics secondo preferenza.
4. Clicca **"Crea progetto"**.

## 2. Abilitare Firestore
1. Nel menu a sinistra, vai su **Costruisci (Build)** -> **Firestore Database**.
2. Clicca su **Crea Database**.
3. Seleziona una regione (es. `eur3` per Europa/Occidentale).
4. Scegli **Start in Test Mode** (per ora va bene, poi imposteremo le regole di sicurezza).

## 3. Ottenere le Chiavi API (Frontend)
1. Vai su **Impostazioni Progetto** (icona ingranaggio in alto a sinistra).
2. Nella sezione "Le tue app", clicca sull'icona **Web (</>)**.
3. Registra l'app col nome "MountComp Web".
4. Ti verrà mostrato un oggetto di configurazione `const firebaseConfig = { ... }`.
5. Copia questi valori e inseriscili nel file `frontend/.env.local`.

Crea il file `frontend/.env.local` partendo dal template che ho generato (`frontend/env.local.template`):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mountcomp-....firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mountcomp-...
...
```

## 4. Setup Backend (Service Account)
Per permettere al backend (Python) di scrivere su Firestore senza limiti:
1. Nelle Impostazioni Progetto, vai su **Account di servizio**.
2. Clicca su **Genera nuova chiave privata**.
3. Verrà scaricato un file `.json`. Rinonimalo `service-account.json` e spostalo nella cartella `backend/`.
4. **IMPORTANTE**: Non committare mai questo file su Git!

## 5. Avvio
Una volta configurato:
- **Frontend**: `cd frontend && npm run dev`
- **Backend**: `cd backend && pip install -r requirements.txt && python main.py`
