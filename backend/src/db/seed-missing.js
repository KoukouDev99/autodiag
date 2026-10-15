const { getPool, initDatabase } = require('./db');

async function run() {
  await initDatabase();
  const pool = getPool();

  console.log('[Seed] Inserting DTC codes...');
  await pool.query(`
    INSERT INTO dtc_codes (code, title, system, description, possible_causes, urgency, garage_advice) VALUES
     ('P0300', 'Ratés d''allumage multiples / aléatoires', 'Allumage / Injection', 
      'Le calculateur a détecté des ratés de combustion sur plusieurs cylindres, provoquant des vibrations et une perte de puissance.',
      ?, 'Modérée', 'Faire vérifier les bougies et bobines en priorité. Éviter les fortes accélérations.'),
     ('P0420', 'Efficacité du catalyseur inférieure au seuil', 'Échappement',
      'La sonde lambda aval indique que le pot catalytique ne traite plus les gaz avec l''efficacité requise.',
      ?, 'Faible', 'Pas d''immobilisation immédiate, mais contre-visite garantie au contrôle technique antipollution.'),
     ('P0562', 'Tension du système électrique basse', 'Électrique / Alternateur',
      'La tension mesurée par le calculateur est inférieure à 10.5V moteur tournant.',
      ?, 'Élevée', 'Risque de panne totale en roulant. Faire contrôler immédiatement l''alternateur.')
  `, [
    JSON.stringify(['Bougies d\'allumage encrassées ou usées', 'Bobines d\'allumage défaillantes', 'Injecteurs encrassés', 'Prise d\'air à l\'admission']),
    JSON.stringify(['Catalyseur encrassé ou en fin de vie', 'Sonde lambda défaillante', 'Fuite sur la ligne d\'échappement']),
    JSON.stringify(['Alternateur défaillant', 'Courroie d\'accessoires détendue', 'Batterie en court-circuit interne'])
  ]);

  console.log('[Seed] Inserting maintenance records...');
  await pool.query(`
    INSERT INTO maintenance_records (vehicle_id, service_date, service_type, cost, mileage, notes) VALUES
     (1, '2026-03-12', 'Vidange + Filtre à huile', 120.00, 60000, 'Huile Total 0W20 certifiée PureTech'),
     (1, '2025-10-05', 'Remplacement liquide de frein', 65.00, 52000, 'Purge complète circuit DOT4')
  `);

  console.log('[Seed] Completed successfully!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
