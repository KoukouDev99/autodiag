# 🚗 AutoDiag · Copilote Mécanique Intelligent

Application complète de diagnostic automobile grand public conçue fidèlement à partir du cahier des charges et du **Prototype V1** (`prototype V1.pdf` et `DiagAuto V3.txt`).

---

## 🏗️ Architecture Technique

```
┌────────────────────────────────────────────────────────┐
│               Frontend: Angular 20                     │
│  • Composants Standalone & Signaux                    │
│  • Design System V1 (Inter / Outfit / Palette sobre)   │
│  • Mode Simulateur Mobile (402px) & Plein écran        │
│  • Barre de navigation 5 destinations constantes       │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST
                           ▼
┌────────────────────────────────────────────────────────┐
│               Backend: Node.js + Express               │
│  • Moteur de diagnostic & scoring dynamique            │
│  • Règles de sécurité indépendantes (Safety Guard)     │
│  • Endpoints REST : Véhicules, Symptômes, Guide, DTC   │
└──────────────────────────┬─────────────────────────────┘
                           │ mysql2 / SQL
                           ▼
┌────────────────────────────────────────────────────────┐
│              Base de Données: MySQL                    │
│  • Schéma relationnel complet (`autodiag`)             │
│  • Tables : users, vehicles, symptoms, hypotheses,     │
│    questions, question_options, repair_guides,         │
│    repair_steps, diagnostic_sessions, dtc_codes,       │
│    maintenance_records                                 │
└────────────────────────────────────────────────────────┘
```

---

## 📱 Les 7 Écrans Implémentés (Conformes au Prototype V1)

1. **Écran 1 · Accueil (`/`)**
   - Salutation personnalisée : *"Bonjour Thomas, Comprendre la panne. Reprendre la route."*
   - Carte Hero **Votre copilote mécanique** avec image réaliste de la Peugeot 208.
   - Bouton d'action principal : `Commencer un diagnostic ->` (Sans jargon • ~3 min).
   - Grille de 9 symptômes interactifs : *Ne démarre pas, Voyant moteur, Bruit inhabituel, Fumée, Surchauffe, Freins, Batterie, Problème électrique, Consommation excessive*.
   - Carte de synthèse du véhicule principal (Peugeot 208, 2019, 1.2 PureTech 82 ch, 68 420 km).
   - Section des diagnostics récents (*Démarrage difficile · En cours*, *Voyant moteur allumé · Archivé*).

2. **Écran 2 · Mon Véhicule (`/vehicle`)**
   - Fiche d'identification complète : Marque, Modèle, Année, Carburant, Motorisation, Kilométrage compteur.
   - Boîte d'aide pédagogique Carte Grise.
   - Enregistrement et mise à jour en temps réel dans la base MySQL.

3. **Écran 3 · Diagnostic Guidé (`/diagnostic/:sessionId`)**
   - Stepper d'avancement : *Question 2 sur 5 · Le démarrage*.
   - Rappel du symptôme : *Votre symptôme : la voiture ne démarre pas*.
   - Cartes de réponses à choix unique avec icônes dédiées et radios intégrés.
   - Encadré de sécurité : *Inutile de réessayer plusieurs fois. Ne forcez pas le démarrage.*
   - Mention rassurante : *Aucun lecteur OBD2 nécessaire*.

4. **Écran 4 · Vos Pistes de Diagnostic (`/results/:sessionId`)**
   - Synthèse d'analyse : *Une alimentation électrique faible est une piste à explorer.*
   - Avertissement prudent : *Des hypothèses, pas une certitude.*
   - Classement des causes par priorité calculée par le moteur de scoring :
     - **PRIORITÉ 1 (Piste principale)** : Batterie faible ou déchargée (120–250 €¹, Facile · Observation)
     - **PRIORITÉ 2 (À envisager)** : Connexion de batterie dégradée (30–90 €¹, Facile · Observation)
     - **PRIORITÉ 3 (Autre possibilité)** : Démarreur ou circuit en défaut (250–600 €¹, Professionnel)
   - Bouton : `Voir les étapes de réparation ->`.

5. **Écran 5 · Guide de Réparation (`/guide/:guideId`)**
   - Titre : *Contrôler sans démonter* (Facile · 5 min · 3 étapes).
   - Encadré strict : *La sécurité avant tout* (Garez-vous hors circulation, clé retirée...).
   - Outils nécessaires : Lampe de poche, Notice du véhicule.
   - Étape 1 : *Repérez la batterie, sans la toucher* avec illustration du compartiment moteur.
   - Aperçu des prochaines étapes (Observer à distance, Faire tester).
   - Procédure d'arrêt d'urgence : *Un signe anormal ? Arrêtez le contrôle.*

6. **Écran 6 · Mon Garage & Historique (`/garage`)**
   - Historique complet des sessions de diagnostic avec états et dates.
   - Carnet d'entretien numérique de la Peugeot 208 (Vidange, liquide de frein...).
   - **Décodeur de codes défaut OBD2 (DTC)** : Recherche manuelle de codes (P0300, P0420, P0562, etc.) avec causes probables, niveau d'urgence et conseils pour le garagiste.

7. **Écran 7 · Design System (`/design-system`)**
   - Présentation de la palette (Bleu nuit `#101828`, Action `#2563EB`, Fond `#F3F5F9`, etc.).
   - Spécifications typographiques (Inter / Outfit) et grille mobile 402 px.
   - Éléments et composants réutilisables.

---

## 🚀 Démarrage Rapide

### 1. Prérequis
- **Node.js** (v18+) & **npm**
- **MySQL** démarré en local (ex: XAMPP, WAMP ou service MySQL standard sur le port 3306)

### 2. Démarrer le Backend
```bash
cd backend
npm install
npm start
```
Le serveur Node.js démarrera sur **`http://localhost:3000`**, créera automatiquement la base de données `autodiag`, exécutera les scripts SQL et initialisera les données de test.

### 3. Démarrer le Frontend Angular
```bash
cd frontend
npm install
npm start
```
L'application Angular sera accessible sur **`http://localhost:4200`**.

---

## 🎨 Options d'Affichage
- **Simulateur Mobile (402 px)** : Cliquez sur le bouton *"Simulateur Mobile"* dans la barre supérieure pour vivre l'expérience ergonomique exacte de l'application smartphone avec navigation tactile et Dynamic Island.
- **Plein Écran Responsive** : Basculez en mode plein écran pour utiliser l'application de façon fluide sur tablette ou ordinateur de bureau.
- **Bouton SOS Panne** : Déclenche les consignes d'urgence immédiate (gilet jaune, triangle, numéros utiles 112).
