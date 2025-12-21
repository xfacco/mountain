# Sistema di Match con Percentuali AI

## Panoramica delle Modifiche

Questo documento descrive le modifiche apportate al sistema di match per integrare le percentuali di rilevanza generate dall'AI per ogni tag.

## Modifiche Implementate

### 1. Backend (`/backend/main.py`)

**Endpoint**: `/api/ai/generate-tags` (modalità `wizard`)

**Modifiche**:
- Aggiornato il prompt AI per richiedere TUTTI i pesi per TUTTI gli ID disponibili (20 tag totali: 8 vibe + 4 target + 8 activities)
- L'AI ora ritorna sempre un oggetto completo con:
  - `weights`: Oggetto con percentuali 0-100 per OGNI tag ID
  - `selected`: Array dei top 3-4 tag più rilevanti per categoria

**Esempio risposta AI**:
```json
{
  "weights": {
    "vibe": {
      "relax": 90,
      "sport": 10,
      "party": 5,
      "luxury": 30,
      "nature": 80,
      "tradition": 60,
      "work": 15,
      "silence": 70
    },
    "target": {
      "family": 70,
      "couple": 30,
      "friends": 40,
      "solo": 20
    },
    "activities": {
      "ski": 100,
      "hiking": 50,
      "wellness": 40,
      "food": 60,
      "culture": 30,
      "adrenaline": 20,
      "shopping": 10,
      "photography": 45
    }
  },
  "selected": {
    "vibe": ["relax", "nature", "silence"],
    "target": ["family"],
    "activities": ["ski", "food", "hiking", "wellness"]
  }
}
```

### 2. Frontend Admin (`/frontend/src/app/admin/page.tsx`)

**Modifiche**:

1. **Inizializzazione dati location**:
   - Aggiunto `tagWeights: location.tagWeights || {}` al formData
   - Inizializzato lo stato `tagWeights` con i dati esistenti: `useState<any>(location.tagWeights || null)`

2. **Salvataggio nel database**:
   - Quando l'AI genera i tag wizard, ora salva sia i `selected` che i `weights` nel formData
   - Il campo `tagWeights` viene salvato nel database insieme agli altri dati della location

**Codice chiave**:
```typescript
// Update the actual selected tags AND save the weights to DB
setFormData((prev: any) => ({
    ...prev,
    tags: {
        ...(prev.tags || {}),
        ...(data.data.selected || {})
    },
    // Save weights for use in matching algorithm
    tagWeights: data.data.weights || {}
}));
```

3. **Visualizzazione UI**:
   - Le percentuali sono già visualizzate accanto ai tag nell'interfaccia admin
   - Esempio: `Relax 90%`, `Nature 80%`, ecc.

### 3. Match Algorithm (`/frontend/src/app/match/MatchWizard.tsx`)

**Modifiche sostanziali all'algoritmo di matching**:

**Prima** (hardcoded):
```typescript
if (hasTargetMatch) score += 30; // Fixed value
```

**Dopo** (AI-powered):
```typescript
// Utilizza i pesi AI salvati nel database
const locationWeights = loc.tagWeights || {};
const targetWeights = locationWeights.target || {};

if (Object.keys(targetWeights).length > 0) {
    // Calculate average score from selected preferences
    const targetScores = preferences.target.map(pref => targetWeights[pref] || 0);
    const avgTargetScore = targetScores.reduce((a, b) => a + b, 0) / Math.max(targetScores.length, 1);
    score += (avgTargetScore / 100) * 30; // Normalize to 0-30 range
}
```

**Categorie con pesi AI**:
1. **Target** (peso massimo: 30 punti)
2. **Vibe** (peso massimo: 25 punti)
3. **Activities** (peso massimo: 30 punti)

**Fallback**: Se una location non ha `tagWeights` salvati, l'algoritmo usa il vecchio sistema di matching binario.

## Come Funziona il Sistema

### Flow Completo

1. **Admin crea/modifica una location**
   - Apre il pannello admin
   - Clicca su "✨ Autoconfigura Wizard"
   - L'AI analizza descrizioni, servizi e dati della location

2. **Backend genera i pesi**
   - L'AI valuta OGNI tag (20 totali) con una percentuale 0-100
   - Esempio: Per Cortina - `ski: 100`, `luxury: 85`, `shopping: 30`

3. **Admin salva i dati**
   - I pesi vengono salvati nel campo `tagWeights` del database
   - I tag selezionati (top 3-4) vengono salvati in `tags`

4. **Utente fa il match**
   - Seleziona le sue preferenze nel Match Wizard
   - Esempio: Target = "family", Vibe = "relax", Activities = "ski, food"

5. **Algoritmo calcola il match**
   - Per ogni location, prende i pesi AI salvati
   - Calcola la media dei pesi per i tag selezionati dall'utente
   - Normalizza il punteggio (0-100%)
   - Mostra i risultati ordinati per percentuale di match

### Esempio Pratico

**Location: Cortina** (tagWeights salvati):
```json
{
  "vibe": {"luxury": 85, "sport": 90, "relax": 30},
  "target": {"couple": 75, "family": 50},
  "activities": {"ski": 100, "shopping": 60, "food": 80}
}
```

**Utente seleziona**:
- Target: family
- Vibe: luxury
- Activities: ski, food

**Calcolo match**:
- Target: `family = 50` → `(50/100) * 30 = 15 punti`
- Vibe: `luxury = 85` → `(85/100) * 25 = 21.25 punti`
- Activities: `(ski:100 + food:80)/2 = 90` → `(90/100) * 30 = 27 punti`

**Score totale**: `15 + 21.25 + 27 = 63.25/85` = **~74% Match**

## Vantaggi del Sistema

1. **Precisione**: Ogni location ha pesi personalizzati basati sulle sue caratteristiche reali
2. **Flessibilità**: L'AI può valutare sfumature (es. "Cortina è luxury ma anche sportiva")
3. **Scalabilità**: Nuovi tag possono essere aggiunti facilmente
4. **Trasparenza**: Gli admin vedono e possono modificare i pesi
5. **Backward compatible**: Locations senza pesi usano il vecchio algoritmo

## Testing

### Per testare il sistema:

1. **Creare una nuova location o modificarne una esistente**
2. **Cliccare "✨ Autoconfigura Wizard"** nell'admin
3. **Verificare che le percentuali appaiono** accanto ai tag
4. **Salvare la location**
5. **Andare su `/match`** e fare una ricerca
6. **Verificare che i risultati** riflettano le percentuali AI

## Note Tecniche

- I pesi sono salvati in Firestore nel campo `tagWeights`
- Il campo è opzionale (backward compatible)
- Le percentuali sono visualizzate nell'UI admin per trasparenza
- L'algoritmo normalizza i pesi nella scala 0-100

## Future Improvements

- [ ] Dashboard per visualizzare l'efficacia dei match
- [ ] A/B testing tra algoritmo AI e tradizionale
- [ ] Machine learning per migliorare i pesi nel tempo
- [ ] User feedback per raffinare le percentuali
