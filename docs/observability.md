# Observabilité & Audit de la Couche IA Hybride

> **Guide Opérationnel — Table `ai_audit_log` (Migration 009)**  
> *Base : `autodiag_dev` (MariaDB 10.4)*  
> *Objectif : Traçabilité complète, surveillance des latences et détection des anomalies*

---

## 1. Modèle de Données : Table `ai_audit_log`

La table `ai_audit_log` conserve une trace immuable de chaque sollicitation du modèle de langage par les services périphériques (`aiEntry`, `aiExplain`, `aiFallback`).

```sql
CREATE TABLE IF NOT EXISTS ai_audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT DEFAULT NULL,
  module VARCHAR(30) NOT NULL COMMENT 'entry, explain, fallback',
  prompt_hash VARCHAR(64) NOT NULL,
  response LONGTEXT NOT NULL,
  latency_ms INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_session_created (session_id, created_at),
  INDEX idx_module_created (module, created_at),
  CONSTRAINT fk_ai_audit_session FOREIGN KEY (session_id) 
    REFERENCES diagnostic_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Description des Champs

| Champ | Type SQL | Rôle et Description |
| :--- | :--- | :--- |
| `id` | `INT AUTO_INCREMENT` | Identifiant unique de l'inférence. |
| `session_id` | `INT (NULLABLE)` | Clé étrangère vers `diagnostic_sessions(id)`. Positionné à `NULL` si l'appel a lieu avant la création de session. En cas de suppression de session, la contrainte `ON DELETE SET NULL` préserve l'audit. |
| `module` | `VARCHAR(30)` | Module source de l'appel : `'entry'`, `'explain'` ou `'fallback'`. |
| `prompt_hash` | `VARCHAR(64)` | Empreinte cryptographique **SHA-256** du prompt complet injecté au LLM. Permet de vérifier l'exactitude du prompt sans surcharger inutilement l'espace de stockage. |
| `response` | `LONGTEXT` | Réponse textuelle brute retournée par le LLM (ou libellé de l'erreur en cas d'échec/timeout). |
| `latency_ms` | `INT` | Temps d'exécution mesuré en millisecondes entre l'envoi de la requête et la réception du dernier token. |
| `created_at` | `TIMESTAMP` | Horodatage de l'inférence (fuseau serveur). |

---

## 2. Cycle de Vie du Logging Asynchrone

L'enregistrement dans `ai_audit_log` est orchestré par la fonction helper [`logAiAudit`](file:///c:/Users/yakoub/Desktop/development%20web/Mes%20projets%20dev/Mes%20projets%20personnale/projet%20front-end/projet%20application%20Diagnostic%20auto/backend/src/diagnostic/ai/llmClient.js#L140-L160) :
1. **Exécution Non-Bloquante** : L'appel SQL `INSERT` s'exécute en tâche asynchrone détachée (`.catch(...)`). Il n'ajoute **aucune latence** sur le temps de réponse renvoyé au navigateur ou à l'application mobile.
2. **Hachage Automatique** : Le hash SHA-256 est calculé dynamiquement via le module natif Node.js `crypto`.
3. **Capture des Erreurs Réseau** : En cas de timeout (3 000 ms) ou d'échec du client HTTP, la ligne est tout de même insérée avec le préfixe `ERROR: ...` dans la colonne `response`.

---

## 3. Requêtes SQL Types pour l'Audit et la Surveillance

### A. Audit Complet d'une Session Spécifique
Pour reconstituer l'intégralité des inférences et réponses IA liées à une session de diagnostic (par exemple la session `364`) :

```sql
SELECT 
  id,
  module,
  prompt_hash,
  LEFT(response, 120) as apercu_reponse,
  latency_ms,
  created_at
FROM ai_audit_log
WHERE session_id = 364
ORDER BY created_at ASC;
```

---

### B. Détection des Requêtes Lentes (> 2 000 ms) ou en Timeout
Permet d'identifier si le fournisseur LLM local ou distant subit des ralentissements impactant le parcours utilisateur :

```sql
SELECT 
  module,
  COUNT(*) as nb_requetes_lentes,
  ROUND(AVG(latency_ms), 0) as latence_moyenne_ms,
  MAX(latency_ms) as latence_max_ms
FROM ai_audit_log
WHERE latency_ms >= 2000
  AND created_at >= NOW() - INTERVAL 24 HOUR
GROUP BY module;
```

---

### C. Distribution des Inférences et Taux de Succès par Module
Permet de mesurer l'activité globale et de détecter d'éventuels pics d'erreurs :

```sql
SELECT 
  module,
  COUNT(*) as total_appels,
  ROUND(AVG(latency_ms), 1) as latence_moy_ms,
  SUM(CASE WHEN response LIKE 'ERROR:%' THEN 1 ELSE 0 END) as nb_erreurs,
  ROUND(SUM(CASE WHEN response LIKE 'ERROR:%' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as taux_erreur_pct
FROM ai_audit_log
WHERE created_at >= NOW() - INTERVAL 7 DAY
GROUP BY module;
```

---

### D. Détection des Tentatives de Sortie Non Conformes
Permet de vérifier si le modèle a cherché à insérer des codes de pannes non autorisés dans le module d'explication ou de fallback :

```sql
SELECT 
  id,
  session_id,
  module,
  response,
  created_at
FROM ai_audit_log
WHERE module IN ('explain', 'fallback')
  AND (response REGEXP 'FAULT-[A-Z0-9]+-[A-Z0-9]+' OR response LIKE '%score%')
ORDER BY created_at DESC
LIMIT 20;
```

---

## 4. Politique de Rétention et Purge Périodique

Pour éviter une croissance excessive de la table `ai_audit_log` en production, une procédure de maintenance planifiée peut être appliquée :

```sql
-- Purge des logs de plus de 90 jours
DELETE FROM ai_audit_log
WHERE created_at < NOW() - INTERVAL 90 DAY;
```

> [!NOTE]
> La suppression des logs d'audit anciens ne supprime ni n'altère aucune session de diagnostic (`diagnostic_sessions`) ni aucun résultat certifié (`diagnostic_results`).
