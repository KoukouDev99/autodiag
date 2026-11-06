# Guide des Migrations de la Base de Données AutoDiag

Ce document décrit en détail l'ensemble des migrations de schéma et de données appliquées sur la base **`autodiag_dev`** (MariaDB 10.4), les procédures pour rejouer l'ensemble des migrations et les commandes de rollback.

---

## 1. Principes & Règles d'Or

1. **Environnement étanche** : Toutes les opérations s'exécutent EXCLUSIVEMENT sur la base `autodiag_dev`. La base `autodiag` et le dump initial restent des sauvegardes intouchables.
2. **Atomicité & Transactions** : Chaque migration est transactionnelle (`START TRANSACTION;` ... `COMMIT;`).
3. **Idempotence & Réversibilité** : Tout fichier `db/migrations/XXX.sql` possède son pendant strict `db/rollback/XXX_rollback.sql`.
4. **Zéro Orphelin** : Contrôles stricts de clés étrangères avec rejet et comptage d'orphelins.
5. **Neutralité Mécanique** : Aucune assertion technique inventée. Règles spécifiques (ex: PureTech) tracées avec `evidence_level = 'unverified'`, `source_record_id = NULL` et mention explicite `TODO`.

---

## 2. Inventaire des Migrations

| N° | Script de Migration | Script de Rollback | Description Sommaire |
| :---: | :--- | :--- | :--- |
| **001** | `001_archive_verified_cases.sql` | `001_archive_verified_cases_rollback.sql` | Création de `archive_verified_cases` et archivage hermétique des 3 cas orphelins (sessions 28-30). |
| **002** | `002_archive_test_sessions.sql` | `002_archive_test_sessions_rollback.sql` | Création de `archive_diagnostic_sessions` et archivage de 268 sessions de test vides. 20 sessions avec réponses conservées. |
| **003** | `003_fix_seed_integrity.sql` | `003_fix_seed_integrity_rollback.sql` | Suppression du `DELETE` destructeur dans `backend/src/db/seed_diagnostic_structure.js`. |
| **004** | `004_fix_autocomplete_guard.sql` | `004_fix_autocomplete_guard_rollback.sql` | Interdiction du statut 'completed' avec 0 réponse (`no_questions_available`) dans `backend/src/routes/diagnostics.js`. |
| **005** | `005_legacy_id_map_and_faults.sql` | `005_legacy_id_map_and_faults_rollback.sql` | Déploiement de `legacy_id_map`, ajout de 28 pannes standardisées dans `faults` (total: 47) et mapping des 39 hypothèses. |
| **006** | `006_migrate_questions_and_rules.sql` | `006_migrate_questions_and_rules_rollback.sql` | Migration unifiée de 110 questions (total: 125), 220 options (total: 260), 110 règles (total: 211), 28 solutions et tests (total: 47). |
| **007** | `007_phase3_integrity_and_constraints.sql` | `007_phase3_integrity_and_constraints_rollback.sql` | Clés étrangères actives (`fk_sa_*`, `fk_vc_*`, `fk_dr_*`), contrainte UNIQUE `uk_session_question`, création de `diagnostic_results`, couverture 100% de `fault_symptoms` (90 liens) et renommage des 5 tables en `legacy_*`. |
| **008** | `008_engine_specs_compatibility.sql` | `008_engine_specs_compatibility_rollback.sql` | Index `idx_name` sur `car_specs_engines`, ajout de `evidence_level` et `source_record_id` sur `fault_vehicles`, incompatibilités physiques (EVAP/Diesel, Embrayage/EV) et règles atelier PureTech unverified avec `TODO`. |
| **009** | `009_ai_audit_log.sql` | `009_ai_audit_log_rollback.sql` | Création de la table `ai_audit_log` (session_id, module, prompt_hash SHA-256, response, latency_ms) et index de surveillance. |
| **010** | `010_safety_rules.sql` | `010_safety_rules_rollback.sql` | Création de la table `safety_rules` et seed des 4 règles de sécurité vitale prioritaires (freinage, direction, airbag, fuite carburant). |

---

## 3. Procédure pour Rejouer les Migrations (Aller)

Pour rejouer l'ensemble des migrations dans l'ordre chronologique depuis le client MySQL / MariaDB ou un script Node.js :

```bash
# 1. Se positionner à la racine du projet
cd "c:/Users/yakoub/Desktop/development web/Mes projets dev/Mes projets personnale/projet front-end/projet application Diagnostic auto"

# 2. Exécution séquentielle sur autodiag_dev
mysql -u root -p autodiag_dev < db/migrations/001_archive_verified_cases.sql
mysql -u root -p autodiag_dev < db/migrations/002_archive_test_sessions.sql
mysql -u root -p autodiag_dev < db/migrations/003_fix_seed_integrity.sql
mysql -u root -p autodiag_dev < db/migrations/004_fix_autocomplete_guard.sql
mysql -u root -p autodiag_dev < db/migrations/005_legacy_id_map_and_faults.sql
mysql -u root -p autodiag_dev < db/migrations/006_migrate_questions_and_rules.sql
mysql -u root -p autodiag_dev < db/migrations/007_phase3_integrity_and_constraints.sql
mysql -u root -p autodiag_dev < db/migrations/008_engine_specs_compatibility.sql
mysql -u root -p autodiag_dev < db/migrations/009_ai_audit_log.sql
mysql -u root -p autodiag_dev < db/migrations/010_safety_rules.sql
```

---

## 4. Procédure de Retour Arrière (Rollback)

Pour annuler une ou plusieurs migrations, exécuter les scripts de rollback dans **l'ordre inverse** :

```bash
# Annulation de la migration 010 (Sécurité vitale)
mysql -u root -p autodiag_dev < db/rollback/010_safety_rules_rollback.sql

# Annulation de la migration 009 (Audit log IA)
mysql -u root -p autodiag_dev < db/rollback/009_ai_audit_log_rollback.sql

# Annulation de la migration 008 (Phase 4b)
mysql -u root -p autodiag_dev < db/rollback/008_engine_specs_compatibility_rollback.sql

# Annulation de la migration 007 (Phase 3)
mysql -u root -p autodiag_dev < db/rollback/007_phase3_integrity_and_constraints_rollback.sql

# Annulation de la migration 006 (Questions et Règles)
mysql -u root -p autodiag_dev < db/rollback/006_migrate_questions_and_rules_rollback.sql

# Annulation de la migration 005 (Legacy Map et Pannes)
mysql -u root -p autodiag_dev < db/rollback/005_legacy_id_map_and_faults_rollback.sql

# Annulation de la migration 004 (Garde Autocomplete)
mysql -u root -p autodiag_dev < db/rollback/004_fix_autocomplete_guard_rollback.sql

# Annulation de la migration 003 (Intégrité Seed)
mysql -u root -p autodiag_dev < db/rollback/003_fix_seed_integrity_rollback.sql

# Annulation de la migration 002 (Purge Sessions)
mysql -u root -p autodiag_dev < db/rollback/002_archive_test_sessions_rollback.sql

# Annulation de la migration 001 (Archivage Verified Cases)
mysql -u root -p autodiag_dev < db/rollback/001_archive_verified_cases_rollback.sql
```

---

## 5. Suite de Tests Automatisés

Chaque migration est couverte par un script de test automatisé validant le cycle complet : **état initial -> application -> vérification -> rollback -> ré-application**.

| Test | Commande d'exécution | Ce qu'il valide |
| :--- | :--- | :--- |
| **Test Migration 003** | `node tests/test_migration_003_seed_integrity.js` | Non-écrasement des sessions utilisateurs lors du seed. |
| **Test Migration 004** | `node tests/test_migration_004_autocomplete.js` | Statut `no_questions_available` si 0 réponse. |
| **Test Migration 005** | `node tests/test_migration_005_legacy_map.js` | Intégrité de `legacy_id_map` et des 47 pannes. |
| **Test Migration 006** | `node tests/test_migration_006_questions_and_rules.js` | Intégrité des 125 questions, 260 options et 211 règles. |
| **Test Migration 007** | `node tests/test_migration_007_phase3.js` | Clés étrangères FKs, contrainte UNIQUE, table `diagnostic_results`. |
| **Test Migration 008** | `node tests/test_migration_008_engine_specs.js` | Spécifications moteur, traçabilité PureTech et incompatibilités. |
| **Test E2E Flow** | `node tests/test_e2e_diagnostic_flow.js` | Parcours complet, persistance temps réel et cascade ON DELETE. |
| **Test DoD Global** | `node tests/test_dod_validation_journey.js` | Parcours 5 réponses, calcul déterministe, feedback et zéro orphelin. |
