# Architecture de la Couche IA Locale — AutoDiag

## 1. Principes Directeurs et Garde-fous

1. **Souveraineté Déterministe** :
   Le moteur déterministe (`diagnosticEngine.js`) reste **le seul et unique décisionnaire** sur le diagnostic technique, l'ordre des tests et les alertes de sécurité vitale.
   L'intelligence artificielle n'a aucun pouvoir de décision sur les pannes ; son rôle exclusif est le **traitement du langage naturel** (compréhension d'expressions libres, vulgarisation, reformulation, recherche contextuelle).

2. **100 % Local & Hors-ligne** :
   Aucun appel vers des API cloud tierces (OpenAI, Anthropic, etc.). Tous les calculs s'exécutent localement sur CPU.

3. **Tolérance aux Pannes & Fallback Systématique** :
   Si le runtime IA est indisponible, surchargé ou en échec, un fallback déterministe immédiat prend le relais avec le flag `fallback_applied: true`. L'application ne bloque jamais l'utilisateur.

---

## 2. Vue d'Ensemble des 5 Modules IA

```mermaid
flowchart TD
    USER[\"Automobiliste (Langage naturel)\"] --> NORM[\"IA #1: Normalisation Sémantique<br/>(MiniLM + FAISS-CPU)\"]
    NORM -->|Score >= 0.6| CANON[\"Symptôme Canonique (ex: start_fail)\"]
    NORM -->|Score < 0.6| CLARIF[\"Demande de Précision + Top 3 Alternatives\"]
    
    CANON --> ENGINE[\"Moteur Déterministe (diagnosticEngine.js)<br/>Scoring, Élimination, Réfutation\"]\n    
    ENGINE --> REFORM[\"IA #2: Reformulation Questions<br/>(Vulgarisation débutants Qwen2.5-3B)\"]
    REFORM --> QUIZ[\"Questionnaire Sensoriel\"]
    QUIZ --> ENGINE
    
    ENGINE --> RAG[\"IA #3: RAG Base Technique<br/>(Index FAISS SAE J2012 / Procédures)\"]
    ENGINE --> EXPL[\"IA #4: Explication Vulgarisée<br/>(Synthèse 4 parties max 95%)\"]
    
    SAFETY[\"IA #5: Garde-fou Sécurité<br/>(Règles déterministes d'abord, LLM ensuite)\"] -.->|Supervise| EXPL
```

---

## 3. Module IA #1 — Normalisation Sémantique des Symptômes

* **Objectif** : Mapper une phrase libre de l'utilisateur (ex. : *"ma voiture fait des clics et rien ne tourne"*) vers l'un des 64 symptômes canoniques indexés.
* **Modèle d'embedding** : `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (dimension 384, optimisé multilingue et français).
* **Indexation** : `faiss.IndexFlatIP` (produit scalaire sur vecteurs normalisés L2 = similarité cosinus exacte).
* **Seuil de confiance** : `0.60`.
  * Si $\text{score} \ge 0.60$ : identification automatique du symptôme (`symptom_id`, `code`, `label`).
  * Si $\text{score} < 0.60$ : `needs_clarification: true`, le système demande une reformulation et propose les 3 alternatives les plus proches.
* **Fallback déterministe** : Moteur par mots-clés et racines lexicales (`démarr`, `voyant`, `bruit`, `fumé`, `chauff`, `frein`, `batterie`).

### Schéma de Réponse API (`POST /api/normalize-symptom`)
```json
{
  "symptom_id": 1,
  "code": "start_fail",
  "label": "Ne démarre pas",
  "category": "Démarrage",
  "score": 0.8632,
  "needs_clarification": false,
  "message": null,
  "threshold": 0.6,
  "top_3_alternatives": [
    { "symptom_id": 1, "code": "start_fail", "label": "Ne démarre pas", "score": 0.8632 },
    { "symptom_id": 6, "code": "brakes", "label": "Freins", "score": 0.6951 },
    { "symptom_id": 8, "code": "electric", "label": "Problème électrique", "score": 0.6163 }
  ],
  "fallback_applied": false
}
```

---

## 4. Module IA #2 — Reformulation des Questions pour Débutants

* **Objectif** : Traduire le jargon technique issu du diagnostic en constat sensoriel (ce que l'utilisateur entend, voit, sent ou ressent).
* **Runtime** : `llama-cpp-python` (version 0.3.36, roues officielles Windows CPU pré-compilées).
* **Modèle local** : `Qwen2.5-3B-Instruct Q4_K_M` (~2.09 Go GGUF).
* **Règle absolue de Fallback** : Si le LLM n'est pas présent, met plus de 4 secondes ou échoue, le système retourne immédiatement la question originale (avec indice pédagogique si disponible) avec `fallback_applied: true`. L'application n'est jamais bloquée.

### Schéma de Réponse API (`POST /api/reformulate-question`)
```json
{
  "original_question": "Le démarreur entraîne-t-il le volant moteur normalement ?",
  "reformulated_question": "Pour débutant : entendez-vous le démarreur lancer le moteur avec force ou fait-il seulement un bruit de clic ?",
  "explanation_hint": "Le démarreur est le moteur électrique qui lance le moteur quand vous tournez la clé.",
  "fallback_applied": true
}
```

---

## 5. Organisation des Dossiers Livrables

```
├── app/
│   └── ai/
│       ├── __init__.py
│       ├── main.py                  # Point d'entrée FastAPI (port 8001)
│       ├── embeddings/              # IA #1 : Normalisation sémantique
│       │   ├── __init__.py
│       │   ├── service.py           # SymptomNormalizer & FAISS
│       │   └── router.py            # POST /api/normalize-symptom
│       ├── reformulation/           # IA #2 : Reformulation pour débutants
│       │   ├── __init__.py
│       │   ├── service.py           # QuestionReformulator & llama_cpp
│       │   └── router.py            # POST /api/reformulate-question
│       ├── rag/                     # IA #3 : RAG documentaire (à venir Étape 5)
│       ├── explanation/             # IA #4 : Explication vulgarisée (à venir Étape 5)
│       └── safety/                  # IA #5 : Garde-fou sécurité (à venir Étape 6)
├── data/
│   ├── canonical_symptoms.json      # Référentiel des 64 symptômes
│   └── faiss_index/                 # Index FAISS CPU + métadonnées
├── scripts/
│   ├── download_models.py           # Téléchargement & mise en cache locale
│   └── build_index.py               # Construction de l'index FAISS
└── tests/
    └── test_embeddings.py           # 10 tests unitaires & intégration (100% passants)
```
