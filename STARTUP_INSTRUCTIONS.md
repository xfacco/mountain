# Avvio del Servizio Mountain AI

## 📋 Sommario
- **Prerequisiti**
- **Backend (FastAPI)**
- **Frontend (Next.js)**
- **Esecuzione simultanea**
- **Pulizia**

---

## 1️⃣ Prerequisiti
- **Python ≥ 3.9**
- **Node.js ≥ 18** (consigliato LTS) e **npm**
- **Docker** (opzionale, per eseguire il backend in container)
- **Git** (per clonare il repository, se necessario)
- **Chiave API Gemini** (`GEMINI_API_KEY`) – da inserire nel file `.env` nella cartella `backend`.

---

## 2️⃣ Backend – FastAPI
### a) Installazione dipendenze
```bash
cd /Users/corrado/Downloads/Corrado/mountain/backend
python -m venv venv          # (opzionale) crea un virtualenv
source venv/bin/activate    # attiva il virtualenv
pip install -r requirements.txt
```
### b) Configurazione variabili d'ambiente
Copia il file di esempio e aggiungi la tua chiave:
```bash
cp .env.example .env   # se esiste, altrimenti crea .env manualmente
# Apri .env e aggiungi:
# GEMINI_API_KEY=la-tua-chiave
```
### c) Avvio del server
```bash
uvicorn main:app --host 0.0.0.0 --port 8080
```
Il backend sarà disponibile all'indirizzo `http://localhost:8080`.

---

## 3️⃣ Frontend – Next.js (React)
### a) Installazione dipendenze
```bash
cd /Users/corrado/Downloads/Corrado/mountain/frontend
npm ci   # installa le dipendenze esattamente come nel lockfile
```
### b) Variabili d'ambiente per il frontend
Copia il template e modifica se necessario:
```bash
cp .env.local.template .env.local
# (opzionale) aggiungi variabili personalizzate)
```
### c) Avvio in modalità sviluppo
```bash
npm run dev
```
Il frontend sarà raggiungibile su `http://localhost:3000`.

---

## 4️⃣ Esecuzione simultanea
Apri due terminali:
1️⃣ **Terminale 1** – avvia il backend (passo 2c).<br>
2️⃣ **Terminale 2** – avvia il frontend (passo 3c).

Il frontend è già configurato per fare richieste CORS al backend (`http://localhost:8080`).

---

## 5️⃣ Opzionale: Esecuzione del backend con Docker
```bash
cd /Users/corrado/Downloads/Corrado/mountain/backend
docker build -t mountain-backend .
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=la-tua-chiave \
  mountain-backend
```

---

## 6️⃣ Pulizia
- **Backend**: `deactivate` (se usi virtualenv) o `docker rm -f <container-id>`.
- **Frontend**: `Ctrl+C` nel terminale di `npm run dev`.

---

## 🛠️ Debug & Log
- I log del backend sono scritti in `backend/backend_debug.log`.
- Per visualizzare i log in tempo reale:
```bash
tail -f backend/backend_debug.log
```
- Il frontend mostra errori nella console del browser (F12 → Console).

---

**Buon lavoro!** 🎉
