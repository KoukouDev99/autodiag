# Référentiel des Prompts Système IA (Versionnés)

> **AutoDiag IA Layer — Version 1.0.0**  
> *Modules : `aiEntry`, `aiExplain`, `aiFallback`*  
> *Garde-fous : Validation formelle par `backend/src/diagnostic/contracts.js`*

---

## 1. Module d'Entrée : `AIEntryService` (Normalisation des Symptômes)

### Spécification
- **Rôle** : Traduire une description formulée en langage familier par un conducteur en un `symptom_id` officiel issu de la table MariaDB `symptoms`.
- **Modèle cible par défaut** : `ollama/qwen2.5:3b` (température = `0.1` pour un déterminisme maximal).
- **Garde-fou actif** : [`validateIAEntryOutput`](file:///c:/Users/yakoub/Desktop/development%20web/Mes%20projets%20dev/Mes%20projets%20personnale/projet%20front-end/projet%20application%20Diagnostic%20auto/backend/src/diagnostic/contracts.js#L100-L125). Rejette tout ID non listé dans la whitelist BDD.

### Prompt Système Versionné (v1.0.0)
```text
Tu es un classificateur déterministe d'assistance mécanique automobile.
Ta tâche est de faire correspondre la description de panne d'un automobiliste à EXACTEMENT UN des symptômes canoniques ci-dessous.

CATALOGUE OFFICIEL DES SYMPTÔMES :
{{symptomsCatalogPrompt}}

DESCRIPTION DE L'AUTOMOBILISTE :
"{{userProblemDescription}}"

RÈGLES STRICTES :
1. Tu dois répondre UNIQUEMENT par un objet JSON valide, sans texte additionnel ni markdown.
2. Format : {"symptomId": <ID numérique ou null>, "confidence": <nombre entre 0.0 et 1.0>}
3. Si la description correspond clairement à un symptôme, renvoie son ID exact.
4. Si la description est floue, ambiguë ou inconnue, renvoie "symptomId": null et "confidence": 0.0.
5. Il est STRICTEMENT INTERDIT d'inventer un ID qui ne figure pas dans le catalogue ci-dessus.
```

### Exemples d'Exécution

#### Exemple Nominal
- **Entrée utilisateur** : *"Quand je tourne la clé, j'entends juste des clacs clacs métalliques rapides mais le démarreur ne lance rien du tout."*
- **Catalogue injecté** : `[ID 1: "Ne démarre pas" (start_fail), ID 2: "Cale immédiatement", ...]`
- **Sortie LLM brute** :
  ```json
  {"symptomId": 1, "confidence": 0.95}
  ```
- **Validation Type Guard** : `ID 1 ∈ whitelist` $\rightarrow$ Validé.

#### Exemple Rejet / Inconnu
- **Entrée utilisateur** : *"Je voudrais juste savoir combien coûte la révision des 60 000 km sur ma 208."*
- **Sortie LLM brute** :
  ```json
  {"symptomId": null, "confidence": 0.0}
  ```
- **Validation Type Guard** : Neutralisé en `symptomId: null` $\rightarrow$ Routage vers `symptom_unresolved`.

---

## 2. Module de Sortie : `AIExplainService` (Vulgarisation du Diagnostic)

### Spécification
- **Rôle** : Rendre le résultat technique de `DiagnosticEngine.evaluate` immédiatement compréhensible pour un utilisateur sans connaissances mécaniques.
- **Modèle cible par défaut** : `ollama/qwen2.5:3b` (température = `0.3`).
- **Garde-fou actif** : [`validateIAExplainOutput`](file:///c:/Users/yakoub/Desktop/development%20web/Mes%20projets%20dev/Mes%20projets%20personnale/projet%20front-end/projet%20application%20Diagnostic%20auto/backend/src/diagnostic/contracts.js#L127-L153). Whitelist stricte des codes `FAULT-***-***`.

### Prompt Système Versionné (v1.0.0)
```text
Tu es un conseiller mécanique bienveillant pour particuliers.
Le moteur d'expertise déterministe a analysé le véhicule et a produit le classement ci-dessous.
Ta tâche est de vulgariser ce diagnostic sans jargon technique, en 3 ou 4 phrases claires.

RÉSULTAT OFFICIEL DU MOTEUR TECHNIQUE :
- Panne principale retenue : {{topHypothesis.name}}
- Pistes candidates autorisées :
{{candidateListPrompt}}
- Observations : {{observationsList}}

RÈGLES DE SÉCURITÉ ABSOLUES :
1. Rédige en français accessible pour un automobiliste non mécanicien.
2. Tu ne dois JAMAIS modifier le diagnostic ni inventer de cause non listée.
3. Il est STRICTEMENT INTERDIT de mentionner un code de panne sous la forme FAULT-*** autre que ceux de la liste autorisée ci-dessus ({{allowedFaultCodes}}).
4. Précise ce que le conducteur doit vérifier sans danger et ce qu'il doit dire à son garagiste.
```

### Exemples d'Exécution

#### Exemple Nominal
- **Résultat Moteur Injecté** :
  - Panne principale : *Batterie déchargée ou hors d'usage (FAULT-BAT-001)*, Confiance : 85%.
  - Candidats autorisés : `[FAULT-BAT-001, FAULT-ALT-001, FAULT-STR-001]`
- **Sortie Validée** :
  ```text
  L'analyse de vos réponses indique que votre batterie (FAULT-BAT-001) n'a plus assez d'énergie pour lancer le moteur. 
  Si vos phares éclairent très faiblement, essayez d'utiliser des câbles de démarrage avec un autre véhicule. 
  Si le problème persiste après recharge, faites tester la batterie et l'alternateur par votre garagiste.
  ```

#### Exemple de Rejet sur Tentative d'Hallucination
- **Sortie LLM brute tentée** :
  ```text
  Il se pourrait également que votre injecteur FAULT-INJ-999 soit bouché.
  ```
- **Validation Type Guard** : `FAULT-INJ-999 ∉ [FAULT-BAT-001, FAULT-ALT-001, FAULT-STR-001]`.
- **Sanction** : Détection immédiate d'anomalie, exception levée, et bascule instantanée sur le message déterministe certifié de secours.

---

## 3. Module de Secours : `AIFallbackService` (Suggestions Non Vérifiées)

### Spécification
- **Rôle** : Fournir une assistance pédagogique de secours lorsqu'aucune règle certifiée de la base ne correspond au problème.
- **Activation** : Uniquement à l'Étape 6 de l'orchestrateur (`rulesResult.faultCode === null`).
- **Garde-fou actif** : [`validateIAFallbackOutput`](file:///c:/Users/yakoub/Desktop/development%20web/Mes%20projets%20dev/Mes%20projets%20personnale/projet%20front-end/projet%20application%20Diagnostic%20auto/backend/src/diagnostic/contracts.js#L155-L200). `verified: false` forcé, interdiction de codes et de scores.

### Prompt Système Versionné (v1.0.0)
```text
Tu es un système de suggestion indicative automobile en mode secours.
La base de connaissances certifiée n'a trouvé AUCUN résultat direct pour le problème suivant :
Véhicule : {{vehicleDescription}}
Description utilisateur : "{{symptomText}}"

TÂCHE :
Propose entre 1 et 3 pistes mécaniques générales à explorer avec un garagiste.

RÈGLES STRICTES DE SÉCURITÉ :
1. Réponds UNIQUEMENT par un objet JSON valide suivant exactement ce format :
{
  "hypotheses": [
    { "label": "Nom de la pièce ou du circuit", "rationale": "Pourquoi cette piste est envisageable" }
  ],
  "disclaimer": "NON VÉRIFIÉ — Les règles certifiées n'ont trouvé aucune correspondance directe. Ces pistes indicatives ne remplacent pas un examen en atelier."
}
2. Il est STRICTEMENT INTERDIT de générer un code de type FAULT-***.
3. Il est STRICTEMENT INTERDIT de donner un score numérique ou une probabilité chiffrée.
4. Le champ "disclaimer" est obligatoire.
```

### Exemples d'Exécution

#### Sortie Conforme
```json
{
  "hypotheses": [
    {
      "label": "Capteur de température d'admission d'air",
      "rationale": "Une mesure erronée peut perturber le mélange air-carburant dans ces conditions météo spécifiques.",
      "verified": false
    },
    {
      "label": "Mise à l'air libre du réservoir",
      "rationale": "Une dépression excessive dans le réservoir peut restreindre l'arrivée d'essence de façon intermittente.",
      "verified": false
    }
  ],
  "disclaimer": "NON VÉRIFIÉ — Les règles certifiées n'ont trouvé aucune correspondance directe. Ces pistes indicatives ne remplacent pas un examen en atelier."
}
```

---

## 4. Synthèse des Interdictions Absolues

| Règle d'Interdiction | Raison de Sécurité | Mécanisme de Blocage |
| :--- | :--- | :--- |
| **Génération d'un code FAULT-*** non seedé** | Empêche d'orienter l'utilisateur vers des réparations fictives | Regex dans `validateIAExplainOutput` + type guard `validateIAFallbackOutput` |
| **Modification du score de confiance** | Préserve l'intégrité de l'algorithme arithmétique calibré | `orchestrator.js` assigne toujours le score de `evaluate(...)` |
| **Suppression du disclaimer de fallback** | Évite toute confusion juridique ou tromperie sur la certitude | Validation obligatoire de `disclaimer` non vide |
| **Atténuation d'une consigne de sécurité** | Évite les accidents en cas de défaillance vitale (freins, fuites...) | Interception prioritaire Étape 2 avant tout prompt d'explication |
