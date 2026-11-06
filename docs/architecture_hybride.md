# Architecture du Moteur de Diagnostic Hybride (DB + IA)

> **Document de Référence Technique — Projet AutoDiag**  
> *Base de données cible : `autodiag_dev` (MariaDB 10.4)*  
> *Autorité décisionnelle : Moteur de Règles Déterministe (`DiagnosticEngine`)*  
> *Couche périphérique : Services de Langage Naturel & Vulgarisation (`AIEntry`, `AIExplain`, `AIFallback`)*

---

## 1. Principe Fondateur : Souveraineté de la Base de Données

Le système repose sur un axiome technique non négociable :
- **Le Moteur de Règles DB (`DiagnosticEngine.evaluate`) est la SEULE ET UNIQUE AUTORITÉ DE DÉCISION.**
- **L'Intelligence Artificielle est une COUCHE PÉRIPHÉRIQUE STRICTEMENT CONFINÉE.** Elle n'a aucun pouvoir de décision mécanique, n'arbitre jamais un score, n'attribue jamais de code de panne, et ne peut en aucun cas contourner ou adoucir une consigne de sécurité vitale.
- **Toute donnée de diagnostic présentée à l'utilisateur final provient exclusivement de la base certifiée.** L'IA n'intervient qu'en amont (normalisation lexicale du besoin) ou en aval (vulgarisation pédagogique bienveillante).

---

## 2. Schéma Global du Flux de Diagnostic (ASCII Flow)

```
                            [ Requête Utilisateur ]
                         (userId, vehicleId, input)
                                     │
                                     ▼
                ┌──────────────────────────────────────────┐
                │       DiagnosticInput Validateur         │
                │     (backend/src/diagnostic/contracts)   │
                └────────────────────┬─────────────────────┘
                                     │
                                     ▼
        ┌──────────────────────────────────────────────────────────┐
        │  ÉTAPE 1 : Résolution du Symptôme Canonique              │
        │  - symptomId fourni ? ────────────────────────┐          │
        │  - symptomText libre ?                        │          │
        │      ├─ [AI_ENABLED=true] ──> AIEntry         │          │
        │      │   (Whitelist DB anti-hallucination)    │          │
        │      └─ [AI_ENABLED=false] ─> Regex/Mots-clés │          │
        └────────────────────┬──────────────────────────┴──────────┘
                             │
                             ├─ Échec résolution ──> [ symptom_unresolved ]
                             │                        source: 'rules', faultCode: null
                             ▼
        ┌──────────────────────────────────────────────────────────┐
        │  ÉTAPE 2 : Interception Prioritaire Sécurité Vitale      │
        │  (Table safety_rules : freins, direction, fuites...)     │
        └────────────────────┬─────────────────────────────────────┘
                             │
                             ├─ MATCH DANGER ─────> 🛑 [ ARRÊT D'URGENCE (HARD STOP) ]
                             │                         source: 'rules', safetyAlert: true,
                             │                         needsProfessional: true
                             │                         (L'IA ne peut JAMAIS l'atténuer)
                             ▼
        ┌──────────────────────────────────────────────────────────┐
        │  ÉTAPE 3 : Exécution Déterministe DB                     │
        │  DiagnosticEngine.evaluate(hypotheses, answers, vehicle) │
        │  -> Calcule topHypothesis, scores, contrastes            │
        └────────────────────┬─────────────────────────────────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
  [ Match DB trouvé ]                     [ Aucun match DB ]
         │                                       │
         ▼                                       ▼
  Confiance >= 60% ?                      ┌─────────────────────────────┐
   ├─ OUI (Étape 4)                       │ ÉTAPE 6 : Fallback Indicatif│
   │   │                                  │ [AI_ENABLED=true]           │
   │   ▼                                  │  AIFallbackService          │
   │  ┌───────────────────────────────┐   │  - verified: false FORCÉ    │
   │  │ IAExplainService              │   │  - Disclaimer obligatoire   │
   │  │ - Vulgarisation pédagogique   │   │  - Zéro code FAULT-***      │
   │  │ - Whitelist de codes stricte  │   │  - Zéro score chiffré       │
   │  └──────────────┬────────────────┘   └──────────────┬──────────────┘
   │                 ▼                                   ▼
   │  [ Diagnostic Confirmé ]            [ Suggestions Non Vérifiées ]
   │   source: 'rules'                    source: 'ai_fallback_unverified'
   │   faultCode certifié DB              faultCode: null, confidence: null
   │   confidence officielle              needsProfessional: true
   │
   └─ NON (Étape 5 : Confiance < 60%)
       │
       ▼
      [ Diagnostic Indéterminé ]
       source: 'rules', needsProfessional: true
       faultCode DB conservé, retenue pédagogique
```

---

## 3. Matrice de Répartition des Rôles

| Domaine d'Action | Moteur Déterministe (DB + `DiagnosticEngine`) | Couche IA Périphérique (`ai/`) |
| :--- | :--- | :--- |
| **Sécurité Vitale** | **Autorité absolue** via `safety_rules`. Déclenche l'interdiction de rouler immédiate. | **Interdiction totale d'intervention.** Ne peut ni modifier, ni adoucir, ni relativiser un danger. |
| **Sélection de la Panne** | **Autorité unique**. Identifie le `fault_code` parmi la table `faults` (19 seedées + 28 unifiées). | **Stricte spectatrice**. Ne sélectionne ni ne propose de code technique. |
| **Calcul de Confiance** | **Algorithme arithmétique calibré** (pondérations règles + compatibilité motorisation/km + contraste). | **Aucune influence**. Tout score inventé par l'IA est intercepté et jeté. |
| **Questions Suivantes** | Sélection adaptative par gain d'information (`getQuestionsForSymptom`, `next_question_id`). | Aucune intervention sur l'ordonnancement des questions du diagnostic. |
| **Normalisation d'Entrée** | Fournit le catalogue de référence `symptoms` pour borner les correspondances. | `AIEntryService` convertit le langage familier de l'automobiliste vers un `symptom_id` officiel. |
| **Restitution du Résultat** | Fournit les faits mécaniques, coûts et vérifications d'atelier certifiés. | `AIExplainService` traduit le diagnostic en vocabulaire compréhensible pour un conducteur novice. |
| **Cas Sans Correspondance** | Constate l'absence de règle matching (`hypotheses.length === 0`). | `AIFallbackService` suggère 1 à 3 pistes indicatives explicitement étiquetées `verified: false`. |

---

## 4. Inventaire Exhaustif des Garde-Fous de Sécurité

### A. Garde-fou Anti-Hallucination des Symptômes (Entrée)
- **Fichier** : [`backend/src/diagnostic/contracts.js`](file:///c:/Users/yakoub/Desktop/development%20web/Mes%20projets%20dev/Mes%20projets%20personnale/projet%20front-end/projet%20application%20Diagnostic%20auto/backend/src/diagnostic/contracts.js) (`validateIAEntryOutput`).
- **Mécanisme** : Le module compare le `symptomId` proposé par le LLM à la liste blanche issue de la table `symptoms`. Si l'ID est absent, inventé ou hors catalogue, il est immédiatement neutralisé en `null` avec une confiance de 0, forçant l'orchestrateur en statut `symptom_unresolved`.

### B. Garde-fou Anti-Invention de Codes Pannes (Explication Sortie)
- **Fichier** : [`backend/src/diagnostic/contracts.js`](file:///c:/Users/yakoub/Desktop/development%20web/Mes%20projets%20dev/Mes%20projets%20personnale/projet%20front-end/projet%20application%20Diagnostic%20auto/backend/src/diagnostic/contracts.js) (`validateIAExplainOutput`).
- **Mécanisme** : Une expression régulière inspecte l'intégralité du texte produit par le LLM pour détecter tout motif `FAULT-[A-Z0-9]+-[A-Z0-9]+`. Si un code détecté ne figure pas dans la liste blanche des candidats certifiés renvoyés par `DiagnosticEngine.evaluate`, la sortie est rejetée avec une exception et bascule sur le texte déterministe certifié de secours.

### C. Garde-fou d'Étiquetage Strict du Fallback
- **Fichier** : [`backend/src/diagnostic/contracts.js`](file:///c:/Users/yakoub/Desktop/development%20web/Mes%20projets%20dev/Mes%20projets%20personnale/projet%20front-end/projet%20application%20Diagnostic%20auto/backend/src/diagnostic/contracts.js) (`validateIAFallbackOutput`).
- **Mécanisme** :
  1. `verified: false` est obligatoirement forcé sur chaque hypothèse.
  2. Présence obligatoire de la clause de non-responsabilité `disclaimer` rappelant la nécessité d'un examen en atelier.
  3. Interdiction formelle de tout attribut `score` ou `confidence`.
  4. Interdiction formelle de tout identifiant technique `faultCode`.

### D. Interdiction d'Écriture Directe en Base de Données
- Aucun module IA ne possède de handle d'écriture ou de référence SQL `INSERT`/`UPDATE` vers les tables `diagnostic_sessions`, `session_answers`, `faults` ou `verified_cases`.
- Seul l'orchestrateur et les routes Express contrôlées écrivent en base, sous contrôle d'intégrité transactionnelle MariaDB.

### E. Résilience Réseau & Timeout Strict
- Tout appel vers un fournisseur LLM (`HttpLLMClient`) est bridé par un `AbortController` configuré à un timeout strict de **3 000 ms**.
- En cas de dépassement, d'erreur HTTP ou d'indisponibilité du modèle local/distant, l'orchestrateur bascule silencieusement en mode déterministe pur sans bloquer le parcours de l'automobiliste.

---

## 5. Matrice de Provenance des Réponses (`meta`)

Toutes les réponses de l'API de diagnostic intègrent un objet standardisé de métadonnées de traçabilité (`attachProvenanceMeta`) :

```json
{
  "sessionId": 364,
  "faultCode": "FAULT-BAT-001",
  "confidence": 0.88,
  "source": "rules",
  "reason": "deterministic_match_high_confidence",
  "safetyAlert": false,
  "explanation": "Votre batterie ou son circuit de charge présente un affaiblissement important...",
  "meta": {
    "source": "rules",
    "model": "ollama/qwen2.5:3b",
    "ai_enabled": true
  }
}
```

### Grille des Sources selon les Scénarios

| Scénario Utilisateur | `result.source` | `meta.source` | `faultCode` | `confidence` | `needsProfessional` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Règle de sécurité vitale (freins, fuite...)** | `'rules'` | `'rules'` | Code de sécurité ou `null` | `1.0` | `true` |
| **Diagnostic certifié ($\ge 60\%$)** | `'rules'` | `'rules'` | Code certifié (`FAULT-***`) | Score réel (ex: `0.88`) | `false` |
| **Diagnostic ambigu ($< 60\%$)** | `'rules'` | `'rules'` | Code principal DB | Score réel (ex: `0.45`) | `true` |
| **Symptôme libre non reconnu** | `'rules'` | `'rules'` | `null` | `null` | `true` |
| **Panne inconnue en base certifiée** | `'ai_fallback_unverified'` | `'ai_fallback_unverified'` | `null` | `null` | `true` |
| **Mode DB-only (`AI_ENABLED=false`)** | `'rules'` | `'rules'` | Code certifié DB | Score réel | Selon seuil |
