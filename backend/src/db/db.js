const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autodiag',
  multipleStatements: true
};

let pool = null;

async function initDatabase() {
  try {
    // 1. Connect without database to ensure database exists
    const initialConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });

    console.log('[DB] Connected to MySQL server.');
    await initialConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await initialConnection.end();

    // 2. Connect with database
    pool = mysql.createPool(dbConfig);

    // 3. Apply schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      console.log('[DB] Schema verified & applied.');
    }

    // Ensure columns for mileage_unit and plate_country exist
    try {
      await pool.query(`ALTER TABLE vehicles ADD COLUMN mileage_unit VARCHAR(10) DEFAULT 'km'`);
    } catch (_) {}
    try {
      await pool.query(`ALTER TABLE vehicles ADD COLUMN plate_country VARCHAR(10) DEFAULT 'F'`);
    } catch (_) {}

    // 4. Check if seeding is needed
    const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      console.log('[DB] Database is empty. Seeding prototype data...');
      await seedDatabase(pool);
      console.log('[DB] Prototype data seeded successfully.');
    } else {
      console.log('[DB] Existing records found (' + users[0].count + ' users).');
    }

    // 5. Check and seed Car Catalog
    await pool.query(`
      CREATE TABLE IF NOT EXISTS car_catalog (
        id INT AUTO_INCREMENT PRIMARY KEY,
        make_group VARCHAR(80) NOT NULL,
        make VARCHAR(80) NOT NULL,
        model VARCHAR(120) NOT NULL,
        year_start INT DEFAULT NULL,
        year_end INT DEFAULT NULL,
        INDEX idx_make (make),
        INDEX idx_model (model)
      ) ENGINE=InnoDB;
    `);

    const [catalogRows] = await pool.query('SELECT COUNT(*) as count FROM car_catalog');
    if (catalogRows[0].count === 0) {
      console.log('[DB] Seeding Car Catalog from car_catalog_data.json...');
      await seedCarCatalog(pool);
      console.log('[DB] Car Catalog seeded successfully.');
    } else {
      console.log('[DB] Car catalog already seeded (' + catalogRows[0].count + ' models).');
    }

    return pool;
  } catch (error) {
    console.error('[DB] Database initialization error:', error.message);
    throw error;
  }
}

async function seedDatabase(connection) {
  // 1. Insert user Thomas
  const [userResult] = await connection.query(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    ['Thomas', 'thomas@autodiag.fr']
  );
  const userId = userResult.insertId;

  // 2. Insert primary vehicle Peugeot 208 (matches prototype V1 page 1 & 2)
  const [vehicleResult] = await connection.query(
    `INSERT INTO vehicles (user_id, brand, model, year, fuel, engine, mileage, license_plate, is_primary) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, 'Peugeot', '208', 2019, 'Essence', '1.2 PureTech 82 ch', 68420, 'AA-123-BB', true]
  );
  const vehicleId = vehicleResult.insertId;

  // 3. Symptoms (matches prototype V1 page 1 grid)
  const symptoms = [
    { code: 'start_fail', label: 'Ne démarre pas', category: 'Démarrage', icon: 'key', desc: 'Le véhicule refuse de démarrer ou cale immédiatement.', critical: false },
    { code: 'check_engine', label: 'Voyant moteur', category: 'Moteur', icon: 'engine', desc: 'Voyant orange ou rouge allumé au combiné.', critical: false },
    { code: 'strange_noise', label: 'Bruit inhabituel', category: 'Mécanique', icon: 'sound', desc: 'Claquement, grincement, sifflement ou vibration anormale.', critical: false },
    { code: 'smoke', label: 'Fumée', category: 'Échappement', icon: 'smoke', desc: 'Fumée blanche, noire ou bleutée à l’échappement ou sous le capot.', critical: true },
    { code: 'overheat', label: 'Surchauffe', category: 'Moteur', icon: 'thermometer', desc: 'Aiguille de température trop haute ou voyant de liquide allumé.', critical: true },
    { code: 'brakes', label: 'Freins', category: 'Sécurité', icon: 'brakes', desc: 'Pédale spongieuse, couinement ou perte d’efficacité.', critical: true },
    { code: 'battery', label: 'Batterie', category: 'Électrique', icon: 'battery', desc: 'Tension faible, accessoires lents ou voyant batterie.', critical: false },
    { code: 'electric', label: 'Problème électrique', category: 'Électrique', icon: 'zap', desc: 'Éclairage, vitres, fusibles ou tableau de bord capricieux.', critical: false },
    { code: 'high_fuel', label: 'Consommation excessive', category: 'Carburant', icon: 'fuel', desc: 'Hausse brutale de la consommation de carburant.', critical: false }
  ];

  const symptomMap = {};
  for (const s of symptoms) {
    const [res] = await connection.query(
      'INSERT INTO symptoms (code, label, category, icon, description, is_critical) VALUES (?, ?, ?, ?, ?, ?)',
      [s.code, s.label, s.category, s.icon, s.desc, s.critical]
    );
    symptomMap[s.code] = res.insertId;
  }

  // 4. Hypotheses for 'start_fail' (matches prototype V1 page 4)
  const startFailId = symptomMap['start_fail'];

  const [hyp1] = await connection.query(
    `INSERT INTO hypotheses (symptom_id, name, priority_badge, priority_label, order_index, description, gravity, check_action, check_type, cost_min, cost_max)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      startFailId,
      'Batterie faible ou déchargée',
      'PRIORITÉ 1',
      'Piste principale',
      1,
      'Les clics et la baisse d’intensité des voyants peuvent correspondre à une batterie insuffisamment chargée.',
      'Gravité modérée · Immobilisation possible',
      'Observer la batterie sans la toucher, puis faire tester sa charge par un professionnel.',
      'Facile · Observation',
      120,
      250
    ]
  );

  const [hyp2] = await connection.query(
    `INSERT INTO hypotheses (symptom_id, name, priority_badge, priority_label, order_index, description, gravity, check_action, check_type, cost_min, cost_max)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      startFailId,
      'Connexion de batterie dégradée',
      'PRIORITÉ 2',
      'À envisager',
      2,
      'Une cosse desserrée ou oxydée peut limiter l’alimentation, même si la batterie est encore chargée.',
      'Gravité modérée · Immobilisation possible',
      'Rechercher une corrosion visible, sans débrancher ni resserrer les cosses.',
      'Facile · Observation',
      30,
      90
    ]
  );

  const [hyp3] = await connection.query(
    `INSERT INTO hypotheses (symptom_id, name, priority_badge, priority_label, order_index, description, gravity, check_action, check_type, cost_min, cost_max)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      startFailId,
      'Démarreur ou circuit en défaut',
      'PRIORITÉ 3',
      'Autre possibilité',
      3,
      'Si la batterie et ses connexions sont correctes, le démarreur ou son circuit peuvent être en cause.',
      'Gravité modérée · Immobilisation possible',
      'Faire contrôler le circuit de démarrage en atelier. Aucune intervention à domicile.',
      'Professionnel',
      250,
      600
    ]
  );

  // 5. Questions for 'start_fail' (matches prototype V1 page 3)
  const [q1] = await connection.query(
    `INSERT INTO questions (symptom_id, step_num, total_steps, category, title, description, warning_text)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      startFailId,
      2,
      5,
      'Le démarrage',
      'Que se passe-t-il quand vous essayez de démarrer ?',
      'Choisissez la réponse qui ressemble le plus à ce que vous avez déjà observé.',
      'Inutile de réessayer plusieurs fois. Ne forcez pas le démarrage. En cas d’odeur de brûlé, de fumée ou de fuite, arrêtez et appelez l’assistance.'
    ]
  );

  await connection.query(
    `INSERT INTO question_options (question_id, title, subtitle, icon, is_default, hypothesis_weights) VALUES
     (?, 'Des clics, mais rien ne démarre', 'Les voyants faiblissent en même temps.', 'speaker', TRUE, ?),
     (?, 'Le moteur tourne sans démarrer', 'Vous entendez un bruit régulier.', 'rotate', FALSE, ?),
     (?, 'Aucun bruit, aucun voyant', 'Le tableau de bord reste éteint.', 'power', FALSE, ?),
     (?, 'Je ne sais pas', 'Pas de souci, on vous accompagne.', 'help', FALSE, ?)`,
    [
      q1.insertId, JSON.stringify({ [hyp1.insertId]: 15, [hyp2.insertId]: 8, [hyp3.insertId]: 4 }),
      q1.insertId, JSON.stringify({ [hyp3.insertId]: 8, [hyp1.insertId]: 2 }),
      q1.insertId, JSON.stringify({ [hyp1.insertId]: 10, [hyp2.insertId]: 10 }),
      q1.insertId, JSON.stringify({ [hyp1.insertId]: 5 })
    ]
  );

  // Step 3 question
  const [q2] = await connection.query(
    `INSERT INTO questions (symptom_id, step_num, total_steps, category, title, description, warning_text)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      startFailId,
      3,
      5,
      'Conditions d’apparition',
      'Quand la voiture a-t-elle roulé pour la dernière fois ?',
      'Le délai d’immobilisation aide à déterminer si la batterie a pu se vider naturellement.',
      'Une batterie déchargée en quelques heures indique souvent un consommateur parasite ou un défaut d’alternateur.'
    ]
  );

  await connection.query(
    `INSERT INTO question_options (question_id, title, subtitle, icon, is_default, hypothesis_weights) VALUES
     (?, 'Hier ou il y a moins de 24h', 'Le véhicule était utilisé récemment.', 'calendar', FALSE, ?),
     (?, 'Il y a plusieurs jours ou semaines', 'Le véhicule est resté stationné un long moment.', 'clock', TRUE, ?),
     (?, 'Grand froid ou intempéries récentes', 'Températures négatives la nuit dernière.', 'snowflake', FALSE, ?),
     (?, 'Je ne sais pas', 'Pas de date précise.', 'help', FALSE, ?)`,
    [
      q2.insertId, JSON.stringify({ [hyp2.insertId]: 5, [hyp3.insertId]: 5 }),
      q2.insertId, JSON.stringify({ [hyp1.insertId]: 10 }),
      q2.insertId, JSON.stringify({ [hyp1.insertId]: 8 }),
      q2.insertId, JSON.stringify({ [hyp1.insertId]: 2 })
    ]
  );

  // 6. Repair guide for Battery (matches prototype V1 page 5)
  const [guide] = await connection.query(
    `INSERT INTO repair_guides (hypothesis_id, title, subtitle, difficulty, est_time, total_steps, safety_warning, tools_needed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      hyp1.insertId,
      'Contrôler sans démonter',
      'Un contrôle visuel pour savoir quoi signaler au professionnel, pas pour confirmer une panne.',
      'Facile',
      '5 min environ',
      3,
      'La sécurité avant tout : Garez-vous hors circulation, frein de stationnement serré, moteur froid et contact coupé. Retirez la clé. Ne touchez ni les bornes ni les câbles.',
      JSON.stringify(['Lampe de poche', 'Notice du véhicule'])
    ]
  );

  await connection.query(
    `INSERT INTO repair_steps (guide_id, step_num, title, time_est, description, subtext, caution_warning) VALUES
     (?, 1, 'Repérez la batterie, sans la toucher', '2 min', 
      'Consultez la notice pour ouvrir et maintenir le capot. Repérez le boîtier de batterie. Si un cache gêne la vue, laissez-le en place et passez au professionnel.',
      'Illustration indicative : l’emplacement et les caches peuvent varier selon la version.',
      'Un signe anormal ? Arrêtez le contrôle. Fuite, batterie gonflée, chaleur, fumée ou odeur : éloignez-vous et contactez un professionnel. Aucun démarrage avec câbles ni remplacement n’est guidé ici.'
     ),
     (?, 2, 'Observez à distance', '1 min',
      'Cherchez une fuite, une déformation ou un dépôt blanchâtre. Ne nettoyez pas et ne manipulez rien.',
      'Vérifiez visuellement les cosses positive (+) et négative (-) pour détecter d’éventuelles traces de sulfate.',
      'Ne frottez pas le sulfate avec les mains nues, c’est une matière corrosive acide.'
     ),
     (?, 3, 'Faites contrôler la batterie', '2 min',
      'Notez vos observations et demandez un test de charge à un garage ou à votre assistance.',
      'Un testeur électronique de batterie permet de mesurer l’état de santé (SOH) et la capacité de démarrage (CCA) en moins de 2 minutes.',
      'Si la batterie a plus de 4 ans, son remplacement complet est généralement recommandé.'
     )`,
    [guide.insertId, guide.insertId, guide.insertId]
  );

  // 7. Recent diagnostic sessions (matches prototype V1 page 1)
  await connection.query(
    `INSERT INTO diagnostic_sessions (user_id, vehicle_id, symptom_id, status, current_step, summary_title, summary_desc, created_at) VALUES
     (?, ?, ?, 'in_progress', 2, 'Démarrage difficile', 'Clics au démarrage · Voyants faiblissants', NOW()),
     (?, ?, ?, 'archived', 5, 'Voyant moteur allumé', 'Code P0300 détecté lors du précédent contrôle', '2026-09-12 14:30:00')`,
    [userId, vehicleId, startFailId, userId, vehicleId, symptomMap['check_engine']]
  );

  // 8. DTC Knowledge base (DiagAuto V3 specs)
  await connection.query(
    `INSERT INTO dtc_codes (code, title, system, description, possible_causes, urgency, garage_advice) VALUES
     ('P0300', 'Ratés d''allumage multiples / aléatoires', 'Allumage / Injection', 
      'Le calculateur a détecté des ratés de combustion sur plusieurs cylindres, provoquant des vibrations et une perte de puissance.',
      ?, 'Modérée', 'Faire vérifier les bougies et bobines en priorité. Éviter les fortes accélérations.'),
     ('P0420', 'Efficacité du catalyseur inférieure au seuil', 'Échappement',
      'La sonde lambda aval indique que le pot catalytique ne traite plus les gaz avec l''efficacité requise.',
      ?, 'Faible', 'Pas d''immobilisation immédiate, mais contre-visite garantie au contrôle technique antipollution.'),
     ('P0562', 'Tension du système électrique basse', 'Électrique / Alternateur',
      'La tension mesurée par le calculateur est inférieure à 10.5V moteur tournant.',
      ?, 'Élevée', 'Risque de panne totale en roulant. Faire contrôler immédiatement l''alternateur.')`,
    [
      JSON.stringify(['Bougies d\'allumage encrassées ou usées', 'Bobines d\'allumage défaillantes', 'Injecteurs encrassés', 'Prise d\'air à l\'admission']),
      JSON.stringify(['Catalyseur encrassé ou en fin de vie', 'Sonde lambda défaillante', 'Fuite sur la ligne d\'échappement']),
      JSON.stringify(['Alternateur défaillant', 'Courroie d\'accessoires détendue', 'Batterie en court-circuit interne'])
    ]
  );

  // 9. Maintenance records for Peugeot 208
  await connection.query(
    `INSERT INTO maintenance_records (vehicle_id, service_date, service_type, cost, mileage, notes) VALUES
     (?, '2026-03-12', 'Vidange + Filtre à huile', 120.00, 60000, 'Huile Total 0W20 certifiée PureTech'),
     (?, '2025-10-05', 'Remplacement liquide de frein', 65.00, 52000, 'Purge complète circuit DOT4')`,
    [vehicleId, vehicleId]
  );
}

async function seedCarCatalog(connection) {
  const catalogPath = path.join(__dirname, 'car_catalog_data.json');
  if (!fs.existsSync(catalogPath)) {
    console.warn('[DB] car_catalog_data.json not found, skipping catalog seed.');
    return;
  }
  const items = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  console.log(`[DB] Seeding ${items.length} vehicle models into car_catalog...`);

  // Insert in batches of 150
  const batchSize = 150;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const values = batch.map(b => [b.make_group, b.make, b.model, b.year_start, b.year_end]);
    await connection.query(
      'INSERT INTO car_catalog (make_group, make, model, year_start, year_end) VALUES ?',
      [values]
    );
  }
}

module.exports = {
  getPool: () => pool,
  initDatabase
};
