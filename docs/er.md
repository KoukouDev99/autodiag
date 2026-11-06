# Diagramme Entité-Relation (ERD) AutoDiag — Architecture Consolidée

Ce document présente la structure relationnelle complète de la base de données **`autodiag_dev`** après l'application des migrations 001 à 008 (Phases 1 à 4).

---

## 1. Diagramme Mermaid Global

```mermaid
erDiagram
    users ||--o{ vehicles : "possède"
    users ||--o{ diagnostic_sessions : "démarre"
    vehicles ||--o{ diagnostic_sessions : "fait l'objet de"
    symptoms ||--o{ diagnostic_sessions : "détecté dans"
    
    symptoms ||--o{ diagnostic_questions : "comporte"
    diagnostic_questions ||--o{ answer_options : "propose"
    answer_options ||--o{ diagnostic_rules : "déclenche"
    
    faults ||--o{ diagnostic_rules : "influencé par"
    symptoms ||--o{ fault_symptoms : "lié à"
    faults ||--o{ fault_symptoms : "manifesté par"
    
    faults ||--o{ solutions : "résolu par"
    faults ||--o{ diagnostic_tests : "validé par"
    faults ||--o{ fault_vehicles : "spécifique à"
    
    diagnostic_sessions ||--o{ session_answers : "enregistre"
    diagnostic_questions ||--o{ session_answers : "répond à"
    answer_options ||--o{ session_answers : "sélectionne"
    
    diagnostic_sessions ||--o{ diagnostic_results : "persiste"
    faults ||--o{ diagnostic_results : "classe"
    
    diagnostic_sessions ||--o{ verified_cases : "confirme"
    faults ||--o{ verified_cases : "valide"
    vehicles ||--o{ verified_cases : "concerne"
    diagnostic_sessions ||--o{ ai_audit_log : "trace"
    
    source_records ||--o{ fault_vehicles : "source"
    
    users {
        int id PK
        string email
        string password
        string name
        string phone
        string city
        datetime created_at
    }

    vehicles {
        int id PK
        int user_id FK
        string brand
        string model
        int year
        string fuel
        string engine
        int mileage
        boolean is_primary
    }

    symptoms {
        int id PK
        string code UK
        string label
        string category
        string icon
        boolean is_critical
    }

    diagnostic_sessions {
        int id PK
        int user_id FK
        int vehicle_id FK
        int symptom_id FK
        string status
        int current_step
        datetime created_at
        datetime completed_at
    }

    diagnostic_questions {
        int id PK
        int symptom_id FK
        int step_num
        string category
        string title
        string description
        string question_type
        boolean safety_critical
    }

    answer_options {
        int id PK
        int question_id FK
        string label
        string subtitle
        string icon
        int order_index
        boolean is_default
    }

    diagnostic_rules {
        int id PK
        int question_id FK
        int answer_option_id FK
        int fault_id FK
        string effect
        decimal weight
        int next_question_id
    }

    faults {
        int id PK
        string code UK
        string name
        string description
        string gravity_label
        decimal cost_min
        decimal cost_max
        boolean is_danger
    }

    fault_symptoms {
        int id PK
        int fault_id FK
        int symptom_id FK
        decimal relevance_score
        boolean is_primary
        string evidence_level
    }

    fault_vehicles {
        int id PK
        int fault_id FK
        string make
        string model
        string fuel_type
        string engine_code
        int year_start
        int year_end
        int mileage_min
        string compatibility
        string evidence_level
        int source_record_id FK
        string notes
    }

    solutions {
        int id PK
        int fault_id FK
        string title
        string difficulty
        int estimated_time_min
        decimal professional_cost
        json steps
    }

    diagnostic_tests {
        int id PK
        int fault_id FK
        string title
        string instruction
        string expected_result
        string test_type
    }

    session_answers {
        int id PK
        int session_id FK
        int question_id FK
        int option_id FK
        datetime created_at
    }

    diagnostic_results {
        int id PK
        int session_id FK
        int fault_id FK
        decimal score
        int rank
        datetime created_at
    }

        int id PK
        int session_id FK
        int vehicle_id FK
        int confirmed_fault_id FK
        boolean was_correct
        string user_feedback
        text feedback_notes
        json symptoms_json
        decimal confidence_initial
        datetime created_at
    }

    safety_rules {
        int id PK
        string symptom_pattern
        string fault_code
        string severity
        text message
        datetime created_at
    }

    ai_audit_log {
        int id PK
        int session_id FK
        string module
        string prompt_hash
        longtext response
        int latency_ms
        datetime created_at
    }
```

---

## 2. Tables d'Archivage et Tables Historiques Isolées

### A. Tables d'Archivage Actives
- **`archive_diagnostic_sessions`** : Stocke les sessions de test purgées (sans réponses).
- **`archive_verified_cases`** : Stocke les anciens enregistrements orphelins isolés lors de la Migration 001.

### B. Table de Traçabilité
- **`legacy_id_map`** : Maintient la correspondance stricte `(entity_type, old_id) -> new_id` pour toutes les entités migrées de l'ancien moteur vers le nouveau moteur (`hypothesis`, `question`, `answer_option`).

### C. Tables Historiques Renommées (Lecture Seule / Réserve)
- **`legacy_questions`**
- **`legacy_question_options`**
- **`legacy_hypotheses`**
- **`legacy_repair_guides`**
- **`legacy_repair_steps`**

---

## 3. Catalogues de Référence & Spécifications
- **`car_catalog`** (2 649 modèles)
- **`car_specs_models`** (7 207 fiches modèles)
- **`car_specs_engines`** (30 066 motorisations détaillées avec index `idx_name`)
- **`dtc_codes`** (12 412 codes défauts OBD-II standard et constructeur)
