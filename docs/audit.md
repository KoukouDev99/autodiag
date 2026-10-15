# Rapport d'Audit Initial — AutoDiag

## Résumé Exécutif
AutoDiag est une application de diagnostic automobile articulée autour d'un frontend moderne Angular 20 Standalone et d'un backend Node.js Express 5 connecté à une base MySQL `autodiag`. Le système s'appuie sur une base de connaissances unifiée (`unified_schema.sql`, standard SAE J2012 / OBD-II et catalogue constructeurs) et un moteur déterministe (`diagnosticEngine.js`) avec élimination progressive des pannes impossibles, inférence de compatibilité motorisation (Essence/Diesel) et sélection de questions à fort pouvoir discriminant.
L'objectif est d'intégrer une couche IA locale (FastAPI en microservice Python 100% hors ligne) pour la normalisation sémantique, la reformulation pour automobilistes débutants, le RAG documentaire et la vulgarisation structurée, tout en préservant le moteur déterministe comme seul maître décisionnaire pour la sécurité.

---

## 1. Structure Détectée
```
projet application Diagnostic auto/
├── backend/                       # API HTTP Node.js Express (port 3000)
│   ├── src/
│   │   ├── index.js               # Serveur principal, middlewares CORS
│   │   ├── routes/
│   │   │   └── api.js             # Fichier de routes monolithique (1 150 lignes)
│   │   ├── services/
│   │   │   └── diagnosticEngine.js# Moteur de diagnostic déterministe (scoring & élimination)
│   │   └── db/
│   │       ├── db.js              # Pool MySQL
│   │       ├── unified_schema.sql # Schéma unifié (sources, faults, rules, solutions)
│   │       └── seed_*.js          # Peuplement KB, DTC et catalogues
│   ├── package.json               # Express 5.3, MySQL2 3.24, dotenv, cors
│   └── test_*.js                  # Tests d'intégration du moteur
├── frontend/                      # Client Angular 20 Standalone (port 4200)
│   ├── src/app/
│   │   ├── components/            # vehicle, quiz, results, guide, garage, design-system
│   │   ├── services/              # diagnostic, vehicle, catalog
│   │   └── data/                  # Données statiques complémentaires
│   └── package.json               # Angular 20.3, node-vehicle-logos, rxjs
├── docs/                          # Documentation et spécifications
└── prototype V1 & V2              # Maquettes et spécifications initiales
```

---

## 2. Schéma de Base de Données Détecté
Base de données : MySQL `autodiag` (Tables unifiées) :
* `data_sources` : Traçabilité des sources (SAE J2012, ateliers, constructeurs).
* `symptoms` : 64 symptômes canoniques avec libellé, icône et catégorie.
* `faults` : 19 pannes maîtresses avec gravité, coûts min/max, badge priorité.
* `fault_symptoms` : Liaison N:M avec poids `weight_initial`.
* `fault_vehicles` : Règles de compatibilité motorisation (Essence / Diesel / Électrique).
* `diagnostic_questions` : 15 questions sensorielles (vue, ouïe, toucher, odeur).
* `answer_options` : 40 options de constat formulation grand public.
* `diagnostic_rules` : 101 règles (`exclude`, `reinforce`, `reduce`) avec traçabilité `reason`.
* `diagnostic_tests` : 19 vérifications sans outillage.
* `solutions` : 19 guides de réparation par étapes.
* `diagnostic_sessions`, `session_answers`, `session_hypotheses`, `user_feedback` : Persistance du parcours et boucle d'apprentissage.

---

## 3. Moteur de Diagnostic Déterminé (`diagnosticEngine.js`)
* **Filtrage physique initial** : Élimination immédiate des pannes incompatibles avec le carburant du véhicule.
* **Scoring pondéré** : Initialisé par `fault_symptoms.weight_initial`, ajusté par les coefficients de règles.
* **Élimination formelle** : Les règles `effect: 'exclude'` retirent définitivement les hypothèses incompatibles avec les réponses de l'automobiliste et enregistrent la raison explicite.
* **Sélection adaptative des questions** : Sélection de la question suivante maximisant l'entropie et le contraste entre les hypothèses en tête.
* **Garde-fous** : Confiance plafonnée à 95% maximum, disclaimer légal et alerte sécurité immédiate en cas de danger vital (freinage, surchauffe moteur, direction).

---

## 4. Points Faibles Identifiés (Par Priorité)

### [P0 - Bloquant / Architecture] Absence de Runtime Python pour l'IA Locale
* Le backend actuel est en Node.js Express. Les modules IA imposés (`sentence-transformers`, `faiss-cpu`, `llama-cpp-python`) nécessitent Python 3.10+.
* **Solution retenue** : Création d'un microservice Python FastAPI sous `/app/` ou `/ai_service/` (port 8000), interconnecté avec le backend Node.js (port 3000) et le frontend Angular (port 4200). Le backend Express ou le frontend peuvent appeler FastAPI directement avec fallback systématique si le service IA est hors ligne.

### [P1 - Haute] Monolithe `api.js` (1 150 lignes) & Requêtes N+1
* `api.js` gère à la fois le catalogue, les véhicules, les questions du quiz, le scoring, les sessions et les retours utilisateurs.
* Certaines boucles chargent les tests et solutions par requêtes SQL successives (N+1).
* **Solution** : Découpage modulaire par routeurs et jointures `LEFT JOIN / JSON_ARRAYAGG`.

### [P2 - Moyenne] Absence d'Entrée en Langage Naturel & RAG
* L'automobiliste doit choisir parmi les tuiles fixes de symptômes. S'il saisit une phrase libre, l'application ne sait pas la mapper vers le symptôme canonique.
* Les questions techniques ne sont pas reformulées pour les personnes sans connaissances en mécanique.
* Aucun système ne synthétise les solutions en 4 blocs clairs (Ce qui se passe, Cause probable, Quoi faire avec coûts, Attention).

### [P3 - Basse] Performance & Cache
* Pas de cache mémoire (LRU / Redis) sur les calculs de scoring identiques.
* Pas de compression gzip sur les gros catalogues.

---

## 5. Plan d'Action Retenu

1. **PHASE A — Couche IA Locale (FastAPI + Sentence-Transformers + FAISS + Qwen2.5)** :
   * IA #1 : Normalisation sémantique des symptômes (`POST /api/normalize-symptom`, seuil 0.6).
   * IA #2 : Reformulation des questions pour débutants (`POST /api/reformulate-question`, fallback question originale).
   * IA #3 : RAG technique sur la base unifiée (`POST /api/retrieve-context`, FAISS + traçabilité source/licence).
   * IA #4 : Synthèse d'explication en 4 parties claires (`POST /api/explain-diagnosis`, max 95% de confiance).
   * IA #5 : Garde-fou sécurité déterministe d'abord, IA en second (`POST /api/check-safety`).

2. **PHASE B — Optimisations & Robustesse** :
   * B1 : Index MySQL & suppression requêtes N+1.
   * B2 : Cache mémoire & diagnostic < 500ms.
   * B3 : Modularisation API (< 300 lignes / fichier) & validation Pydantic.
   * B4 : Lazy loading des modèles IA & retours UX.
   * B5 : Tests unitaires & benchmarks.
   * B6 : Observabilité & boucle d'apprentissage `verified_cases`.
