/**
 * Test de non-régression & validation - Migration 005
 * Vérifie la création de legacy_id_map, l'ajout des 28 pannes standardisées,
 * le mapping exact des 39 hypothèses (11 réutilisations, 28 créations),
 * et la réversibilité transactionnelle du rollback.
 */
const mysql = require('c:/Users/yakoub/Desktop/development web/Mes projets dev/Mes projets personnale/projet front-end/projet application Diagnostic auto/backend/node_modules/mysql2/promise');
const fs = require('fs');
const assert = require('assert');

async function testMigration005() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'autodiag_dev',
    multipleStatements: true
  });

  console.log('🧪 Test Migration 005 : Démarrage du banc de validation...');

  // 1. Lire et appliquer la migration 005
  const migrationSql = fs.readFileSync('db/migrations/005_legacy_id_map_and_faults.sql', 'utf8');
  console.log('  -> Exécution de 005_legacy_id_map_and_faults.sql...');
  await conn.query(migrationSql);

  // 2. Contrôle du nombre de pannes (19 initiales + 28 nouvelles = 47)
  const [faultCount] = await conn.query('SELECT COUNT(*) as count FROM faults');
  console.log(`  -> Nombre total de pannes dans faults : ${faultCount[0].count} (attendu: 47)`);
  assert.strictEqual(faultCount[0].count, 47, `Échec : attendu 47 pannes, trouvé ${faultCount[0].count}`);

  // 3. Contrôle du nombre de correspondances dans legacy_id_map (39 attendues pour IDs >= 20)
  const [mapCount] = await conn.query("SELECT COUNT(*) as count FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id >= 20");
  console.log(`  -> Nombre de correspondances hypotheses dans legacy_id_map (old_id >= 20) : ${mapCount[0].count} (attendu: 39)`);
  assert.strictEqual(mapCount[0].count, 39, `Échec : attendu 39 lignes dans legacy_id_map, trouvé ${mapCount[0].count}`);

  // 4. Contrôle de l'exhaustivité des IDs 20 à 58
  const [mappedIds] = await conn.query("SELECT old_id FROM legacy_id_map WHERE entity_type = 'hypothesis' AND old_id >= 20 ORDER BY old_id");
  const actualOldIds = mappedIds.map(r => r.old_id);
  const expectedOldIds = Array.from({ length: 39 }, (_, i) => i + 20);
  assert.deepStrictEqual(actualOldIds, expectedOldIds, 'Échec : Certains IDs d\'hypothèses entre 20 et 58 sont manquants !');
  console.log('  -> Intégrité des 39 IDs (20 à 58) : 100% présents sans trou.');

  // 5. Contrôle de cohérence référentielle (aucun new_id orphelin)
  const [orphans] = await conn.query(`
    SELECT m.old_id, m.new_id
    FROM legacy_id_map m
    LEFT JOIN faults f ON m.new_id = f.id
    WHERE m.entity_type = 'hypothesis' AND f.id IS NULL
  `);
  assert.strictEqual(orphans.length, 0, `Échec : ${orphans.length} nouveaux IDs n'existent pas dans faults !`);
  console.log('  -> Intégrité référentielle : 0 new_id orphelin.');

  // 6. Test de réversibilité (Rollback)
  console.log('  -> Test de la réversibilité (Exécution du Rollback 005)...');
  const rollbackSql = fs.readFileSync('db/rollback/005_legacy_id_map_and_faults_rollback.sql', 'utf8');
  await conn.query(rollbackSql);

  const [faultCountPostRollback] = await conn.query('SELECT COUNT(*) as count FROM faults');
  const [tableExists] = await conn.query("SHOW TABLES LIKE 'legacy_id_map'");
  assert.strictEqual(faultCountPostRollback[0].count, 19, `Échec Rollback : faults devrait revenir à 19, trouvé ${faultCountPostRollback[0].count}`);
  assert.strictEqual(tableExists.length, 0, 'Échec Rollback : legacy_id_map devrait être supprimée');
  console.log('  -> Rollback validé : Base restaurée à 19 pannes sans résidu.');

  // 7. Ré-application définitive pour persister l'état
  console.log('  -> Ré-application définitive de la migration 005...');
  await conn.query(migrationSql);
  const [finalFaults] = await conn.query('SELECT COUNT(*) as count FROM faults');
  assert.strictEqual(finalFaults[0].count, 47);

  console.log('✓ Succès : Migration 005 et Rollback 005 validés avec succès !');
  await conn.end();
}

testMigration005().catch(err => {
  console.error('❌ Échec test Migration 005 :', err);
  process.exit(1);
});
