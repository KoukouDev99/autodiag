# Journal des Migrations de la Base de Données AutoDiag

Ce document constitue le journal officiel d'audit et de traçabilité des migrations exécutées sur la base de données **`autodiag_dev`** (MariaDB 10.4).

---

## Règles d'Or & Protocole d'Exécution

1. **Environnement de Travail** : Les migrations s'exécutent EXCLUSIVEMENT sur `autodiag_dev`. La base `autodiag` et le dump initial restent des sauvegardes intouchables.
2. **Atomicité & Transactions** : Chaque script est encadré par `START TRANSACTION;` et `COMMIT;` pour garantir qu'aucune modification partielle n'est persistée en cas d'erreur.
3. **Idempotence & Réversibilité** : Tout script dans `db/migrations/XXX_nom.sql` possède son pendant exact dans `db/rollback/XXX_nom_rollback.sql`.
4. **Vérification Avant/Après** : Chaque migration est accompagnée de requêtes de comptage et de validation d'absence d'orphelins.

---

## Historique des Migrations Appliquées

| N° | Date & Heure | Fichier de Migration | Fichier de Rollback | Description | Statut | Contrôle d'Intégrité |
| :---: | :---: | :--- | :--- | :--- | :---: | :--- |
| **001** | 2026-10-15 19:41 | `001_archive_verified_cases.sql` | `001_archive_verified_cases_rollback.sql` | Création de `archive_verified_cases` et archivage transactionnel des 3 cas orphelins (sessions 28-30, question 113) | **APPLIQUÉ** | `verified_cases` : 0 actif<br>`archive_verified_cases` : 3 archivés |
| **002** | 2026-10-15 22:07 | `002_archive_test_sessions.sql` | `002_archive_test_sessions_rollback.sql` | Création de `archive_diagnostic_sessions` et archivage de 268 sessions de test sans réponses | **APPLIQUÉ** | `diagnostic_sessions` : 20 conservées<br>`archive_diagnostic_sessions` : 268 archivées<br>0 orphelin |
| **003** | 2026-10-15 20:30 | `003_fix_seed_integrity.sql` | `003_fix_seed_integrity_rollback.sql` | Suppression de la suppression sauvage des `session_answers` dans `seed_diagnostic_structure.js` | **APPLIQUÉ** | Test de non-régression validé (`tests/test_migration_003_seed_integrity.js`) |
| **004** | 2026-10-15 20:35 | `004_fix_autocomplete_guard.sql` | `004_fix_autocomplete_guard_rollback.sql` | Interdiction du statut 'completed' si `answers.length === 0` ; affectation de 'no_questions_available' | **APPLIQUÉ** | Test de non-régression validé (`tests/test_migration_004_autocomplete.js`) |
| **005** | 2026-10-15 22:12 | `005_legacy_id_map_and_faults.sql` | `005_legacy_id_map_and_faults_rollback.sql` | Création de `legacy_id_map`, ajout de 28 pannes standardisées dans `faults` et mapping des 39 hypothèses | **APPLIQUÉ** | `legacy_id_map` : 39 correspondances<br>`faults` : 47 pannes (19 + 28)<br>0 new_id orphelin |
| **006** | 2026-10-15 22:19 | `006_migrate_questions_and_rules.sql` | `006_migrate_questions_and_rules_rollback.sql` | Migration unifiée des questions (10 à 64), options, règles déterministes, solutions et tests | **APPLIQUÉ** | `diagnostic_questions` : 125<br>`answer_options` : 260<br>`diagnostic_rules` : 211<br>`solutions` : 47<br>`diagnostic_tests` : 47<br>0 orphelin |
| **007** | 2026-10-15 22:50 | `007_phase3_integrity_and_constraints.sql` | `007_phase3_integrity_and_constraints_rollback.sql` | Intégrité référentielle (FKs session_answers, verified_cases, diagnostic_results), unicité, table diagnostic_results et renommage legacy_* | **APPLIQUÉ** | `session_answers` : 32 unifiées, 0 orphelin<br>`fault_symptoms` : 90 liens (64/64 symptômes couverts)<br>FKs actives : 8 |
| **008** | 2026-10-15 23:18 | `008_engine_specs_compatibility.sql` | `008_engine_specs_compatibility_rollback.sql` | Spécifications motorisations, indexation car_specs_engines et compatibilités fault_vehicles (Phase 4b) | **APPLIQUÉ** | `fault_vehicles` : 28 règles (dont PureTech unverified + TODO)<br>`car_specs_engines` : idx_name actif |
| **009** | 2026-10-15 23:50 | `009_ai_audit_log.sql` | `009_ai_audit_log_rollback.sql` | Table de traçabilité des inférences IA avec latence et hash du prompt | **APPLIQUÉ** | Table `ai_audit_log` créée avec index `idx_session_created` |
| **010** | 2026-10-15 23:50 | `010_safety_rules.sql` | `010_safety_rules_rollback.sql` | Table des règles de sécurité vitale prioritaires et seed minimal (freins, direction, airbag, fuite) | **APPLIQUÉ** | Table `safety_rules` créée, 4 règles critiques seedées |

---

## Détail des Changements par Migration

### Migration 001 : `001_archive_verified_cases.sql`
* **Objectif** : Sécuriser les 3 enregistrements de `verified_cases` qui pointaient vers des sessions inexistantes (IDs 28, 29, 30) et une question fantôme (ID 113).
* **Tables impactées** :
  * `archive_verified_cases` (créée avec timestamp d'archivage et motif)
  * `verified_cases` (3 lignes orphelines déplacées)
* **Preuve de vérification** :
  ```sql
  SELECT 
    (SELECT COUNT(*) FROM verified_cases) as verified_cases_active,
    (SELECT COUNT(*) FROM archive_verified_cases) as verified_cases_archived;
  -- Résultat : 0 actif, 3 archivés
  ```

### Migration 002 : `002_archive_test_sessions.sql`
* **Objectif** : Archiver de façon hermétique les 268 sessions de test vides créées avant le 15/10/2026 19:30 par les utilisateurs de test (IDs 1, 2).
* **Clause WHERE de ciblage** :
  ```sql
  WHERE id NOT IN (SELECT DISTINCT session_id FROM session_answers)
    AND created_at < '2026-10-15 19:30:00'
    AND user_id IN (1, 2);
  ```
* **Tables impactées** :
  * `archive_diagnostic_sessions` (268 sessions copiées avec motif d'archivage)
  * `diagnostic_sessions` (268 sessions supprimées, 20 sessions légitimes avec réponses préservées)
* **Preuve de vérification** :
  ```sql
  SELECT 
    (SELECT COUNT(*) FROM diagnostic_sessions) as sessions_active,
    (SELECT COUNT(*) FROM archive_diagnostic_sessions) as sessions_archived,
    (SELECT COUNT(DISTINCT session_id) FROM session_answers) as answered_sessions;
  -- Résultat : 20 actives, 268 archivées, 20 avec réponses (0 orphelin)
  ```

### Migration 003 : `003_fix_seed_integrity.sql`
* **Objectif** : Empêcher le script de seed de connaissances d'écraser les réponses des utilisateurs existants.
* **Fichier modifié** : `backend/src/db/seed_diagnostic_structure.js:L805`
* **Validation** : Script `tests/test_migration_003_seed_integrity.js` passé avec succès.

### Migration 004 : `004_fix_autocomplete_guard.sql`
* **Objectif** : Empêcher toute session de basculer en 'completed' avec zéro réponse si aucune question n'est configurée pour son symptôme.
* **Fichier modifié** : `backend/src/routes/diagnostics.js:L271` (passage au statut `'no_questions_available'`)
* **Validation** : Script `tests/test_migration_004_autocomplete.js` passé avec succès.

### Migration 005 : `005_legacy_id_map_and_faults.sql`
* **Objectif** : Déployer la table de correspondance `legacy_id_map` et standardiser les 39 hypothèses restantes (IDs 20 à 58) :
  * 11 hypothèses mappées vers des pannes existantes (`faults` IDs 1..19).
  * 28 hypothèses converties en pannes techniques standardisées (`FAULT-***-***`) insérées dans `faults`.
* **Tables impactées** :
  * `legacy_id_map` (créée avec contrainte UNIQUE `(entity_type, old_id)`, 39 correspondances enregistrées)
  * `faults` (28 nouvelles pannes ajoutées avec classification, sévérité, coûts et dangerosité)
* **Preuve de vérification** :
  ```sql
  SELECT 
    (SELECT COUNT(*) FROM faults) AS faults_count,
    (SELECT COUNT(*) FROM legacy_id_map WHERE entity_type = 'hypothesis') AS legacy_mapped_count,
    (SELECT COUNT(*) FROM legacy_id_map m LEFT JOIN faults f ON m.new_id = f.id WHERE f.id IS NULL) AS orphan_new_ids;
  -- Résultat : 47 faults, 39 mappings, 0 orphelin
  ```
* **Validation** : Script `tests/test_migration_005_legacy_map.js` passé avec succès (test aller + retour rollback + ré-application).

### Migration 006 : `006_migrate_questions_and_rules.sql`
* **Objectif** : Migrer l'intégralité du socle déterministe restant (symptômes 10 à 64) vers les tables unifiées du nouveau moteur :
  * Migration de 110 questions vers `diagnostic_questions` avec traçabilité dans `legacy_id_map`.
  * Migration de 220 options de réponses vers `answer_options` avec traçabilité dans `legacy_id_map`.
  * Conversion de 110 pondérations JSON `hypothesis_weights` en règles déterministes relationnelles dans `diagnostic_rules`.
  * Création de 28 guides de solutions complètes (étapes pas-à-pas, outillage, temps estimé) dans `solutions`.
  * Création de 28 procédures de tests de confirmation dans `diagnostic_tests`.
* **Tables impactées** :
  * `diagnostic_questions` : 125 questions actives (100% des symptômes 1 à 64 couverts).
  * `answer_options` : 260 options de réponses actives.
  * `diagnostic_rules` : 211 règles d'inférence actives (0 orphelin).
  * `solutions` : 47 fiches de réparation complètes (1 par panne pour 100% des pannes).
  * `diagnostic_tests` : 47 tests diagnostiques de terrain (1 par panne).
  * `legacy_id_map` : complétée avec toutes les correspondances `question`, `answer_option` et `hypothesis`.
* **Preuve de vérification** :
  ```sql
  SELECT 
    (SELECT COUNT(*) FROM diagnostic_questions) AS total_questions,
    (SELECT COUNT(*) FROM answer_options) AS total_options,
    (SELECT COUNT(*) FROM diagnostic_rules) AS total_rules,
    (SELECT COUNT(*) FROM solutions) AS total_solutions,
    (SELECT COUNT(*) FROM diagnostic_tests) AS total_tests;
  -- Résultat : 125 questions, 260 options, 211 règles, 47 solutions, 47 tests
  ```
* **Validation** : Script `tests/test_migration_006_questions_and_rules.js` passé avec succès à 100% (test aller + rollback complet + ré-application).

### Migration 007 : `007_phase3_integrity_and_constraints.sql` (Phase 3)
* **Objectif** :
  1. Harmoniser les 14 anciennes réponses dans `session_answers` (IDs `question_id` 126..132 et `option_id` 272..296) vers les IDs correspondants du modèle relationnel unifié (`diagnostic_questions` 1..6 et `answer_options` 1..18).
  2. Mettre en place l'intégrité référentielle stricte avec clés étrangères (FK) :
     - `session_answers` : `fk_sa_session` (REFERENCES `diagnostic_sessions(id)` ON DELETE CASCADE), `fk_sa_question` (REFERENCES `diagnostic_questions(id)` ON DELETE CASCADE), `fk_sa_option` (REFERENCES `answer_options(id)` ON DELETE CASCADE).
     - `verified_cases` : `fk_vc_session` (REFERENCES `diagnostic_sessions(id)` ON DELETE CASCADE), `fk_vc_fault` (REFERENCES `faults(id)` ON DELETE SET NULL), `fk_vc_vehicle` (REFERENCES `vehicles(id)` ON DELETE SET NULL).
     - `diagnostic_results` : `fk_dr_session` (REFERENCES `diagnostic_sessions(id)` ON DELETE CASCADE), `fk_dr_fault` (REFERENCES `faults(id)` ON DELETE CASCADE).
  3. Poser la contrainte d'unicité `uk_session_question` sur `session_answers(session_id, question_id)` après dédoublonnage.
  4. Compléter les liaisons `fault_symptoms` pour les 16 symptômes historiques (10 à 25), garantissant 100% de couverture (64 sur 64 symptômes avec pannes directes).
  5. Créer la table `diagnostic_results` pour la persistance temps-réel des probabilités, scores et classements lors de l'appel `/diagnostic/:sessionId/results`.
  6. Renommer définitivement les 5 tables historiques en `legacy_*` (`legacy_questions`, `legacy_question_options`, `legacy_hypotheses`, `legacy_repair_guides`, `legacy_repair_steps`).
* **Tables impactées** :
  - `session_answers` : 32 réponses cohérentes, contraintes FKs actives, index unique `uk_session_question`.
  - `verified_cases` : 0 orphelin, 3 FKs actives (`fk_vc_*`).
  - `diagnostic_results` : créée et alimentée dynamiquement avec FK cascade.
  - `fault_symptoms` : 90 liaisons (couvrant la totalité des 64 symptômes).
  - Tables historiques renommées en `legacy_*`.
* **Preuve de vérification** :
  ```sql
  SELECT 
    (SELECT COUNT(*) FROM diagnostic_results) AS diagnostic_results_count,
    (SELECT COUNT(*) FROM fault_symptoms) AS total_fault_symptom_links,
    (SELECT COUNT(DISTINCT symptom_id) FROM fault_symptoms) AS covered_symptoms,
    (SELECT COUNT(*) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = 'autodiag_dev' AND CONSTRAINT_NAME IN ('fk_sa_session', 'fk_sa_question', 'fk_sa_option', 'fk_vc_session', 'fk_vc_fault', 'fk_vc_vehicle', 'fk_dr_session', 'fk_dr_fault')) AS active_phase3_fks;
  -- Résultat : 90 liaisons, 64/64 symptômes couverts, 8 clés étrangères actives, 0 orphelin
  ```
* **Validation** :
  - `tests/test_migration_007_phase3.js` validé à 100% (aller + test rejet FK/doublon + rollback intégral + ré-application).
  - `tests/test_e2e_diagnostic_flow.js` validé à 100% (cycle complet de diagnostic, persistance dans `diagnostic_results` et suppression en cascade vérifiée).

### Migration 008 : `008_engine_specs_compatibility.sql` (Phase 4b)
* **Objectif** :
  1. Optimiser les requêtes de recherche de motorisations dans `car_specs_engines` en ajoutant l'index `idx_name (name)`.
  2. Enrichir la table `fault_vehicles` avec le suivi de traçabilité des sources :
     - `evidence_level VARCHAR(50) NOT NULL DEFAULT 'verified'`
     - `source_record_id INT DEFAULT NULL` (REFERENCES `source_records(id)` ON DELETE SET NULL)
  3. Intégrer les règles de motorisation pour les architectures sensibles (PureTech) en respectant scrupuleusement le principe de précaution :
     - Lignes insérées avec `evidence_level = 'unverified'`, `source_record_id = NULL`, et la mention obligatoire `TODO: Source technique requise (RTA/Stellantis TSB). Non vérifié formellement.`
     - Règle courroie de distribution (`fault_id = 310`) et crépine d'huile (`fault_id = 314`) sur Peugeot et Citroën `1.2 PureTech` (>= 60 000 km).
  4. Intégrer les incompatibilités physiques strictes :
     - Électrovanne de purge canister EVAP (`fault_id = 318`) : déclarée `incompatible` sur motorisations Diesel.
     - Embrayage hydraulique (`fault_id = 324`) : déclaré `incompatible` sur véhicules 100% Électriques.
  5. Mettre à niveau le moteur déterministe [`backend/src/services/diagnosticEngine.js`](file:///c:/Users/yakoub/Desktop/development%20web/Mes%20projets%20dev/Mes%20projets%20personnale/projet%20front-end/projet%20application%20Diagnostic%20auto/backend/src/services/diagnosticEngine.js) pour prendre en compte les filtres `make`, `model`, `engine_code`, `year_start`..`year_end`, `mileage_min` et ajuster la pondération selon `evidence_level` (+10 pts si non vérifié, +20 pts si vérifié).
* **Tables impactées** :
  - `car_specs_engines` : index `idx_name` créé.
  - `fault_vehicles` : 2 colonnes ajoutées, clé étrangère `fk_fv_source`, 6 nouvelles règles (IDs 23 à 28).
* **Preuve de vérification** :
  ```sql
  SELECT 
    (SELECT COUNT(*) FROM fault_vehicles) AS total_rules,
    (SELECT COUNT(*) FROM fault_vehicles WHERE evidence_level = 'unverified') AS unverified_rules,
    (SELECT COUNT(*) FROM fault_vehicles WHERE notes LIKE '%TODO%') AS todo_rules,
    (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'autodiag_dev' AND TABLE_NAME = 'car_specs_engines' AND INDEX_NAME = 'idx_name') AS idx_name_present;
  -- Résultat : 28 règles au total, 4 règles unverified avec mention TODO, index idx_name actif
  ```
* **Validation** :
  - `tests/test_migration_008_engine_specs.js` validé à 100% (aller + test unitaire d'évaluation déterministe + rollback + ré-application).
  - Régression globale validée : tests 007, 008 et E2E exécutés d'affilée sans aucune erreur.

### Migration 009 : `009_ai_audit_log.sql`
* **Objectif** : Mettre en place la traçabilité complète de chaque sollicitation de la couche IA périphérique.
* **Tables impactées** :
  - `ai_audit_log` (créée avec colonnes `session_id`, `module`, `prompt_hash`, `response`, `latency_ms`, `created_at` et index).
* **Preuve de vérification** :
  ```sql
  SHOW TABLES LIKE 'ai_audit_log';
  -- Table présente, index idx_session_created et idx_module_created actifs.
  ```

### Migration 010 : `010_safety_rules.sql`
* **Objectif** : Déployer la table des règles d'arrêt d'urgence absolu (freinage, direction assistée, airbag, fuite de carburant).
* **Tables impactées** :
  - `safety_rules` (créée et alimentée avec 4 règles d'interruption immédiate `SAFETY_STOP`).
* **Preuve de vérification** :
  ```sql
  SELECT COUNT(*) FROM safety_rules;
  -- Résultat : 4 règles critiques actives.
  ```




