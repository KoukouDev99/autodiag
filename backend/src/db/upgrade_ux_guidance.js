const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autodiag'
};

async function runUpgrade() {
  const pool = mysql.createPool(dbConfig);
  console.log('[Upgrade] Connected to MySQL database...');

  // 1. Add UX Guidance columns to questions table
  const questionCols = [
    { name: 'why_ask', type: 'TEXT' },
    { name: 'image_url', type: 'VARCHAR(255)' },
    { name: 'reformulation', type: 'TEXT' },
    { name: 'test_action', type: 'TEXT' },
    { name: 'test_type', type: 'VARCHAR(50) DEFAULT "observation"' } // observation, action, comparaison, contexte, historique
  ];

  for (const col of questionCols) {
    try {
      await pool.query(`ALTER TABLE questions ADD COLUMN ${col.name} ${col.type}`);
      console.log(`[Upgrade] Added column questions.${col.name}`);
    } catch (e) {
      // Column might already exist
    }
  }

  // 2. Create verified_cases table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS verified_cases (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      confirmed_fault_id INT DEFAULT NULL,
      was_correct BOOLEAN DEFAULT TRUE,
      user_feedback VARCHAR(50) DEFAULT 'confirmed', -- confirmed, disproved, partially
      feedback_notes TEXT,
      symptoms_json JSON,
      vehicle_id INT DEFAULT NULL,
      confidence_initial DECIMAL(5,2) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_session (session_id)
    ) ENGINE=InnoDB;
  `);
  console.log('[Upgrade] Table verified_cases is ready.');

  // 3. Update existing questions with UX guidance principles
  // Question 1: Que se passe-t-il au démarrage ?
  await pool.query(`
    UPDATE questions SET 
      why_ask = 'Cette question permet de savoir immédiatement si le problème vient de l''alimentation électrique (batterie) ou de la mécanique du moteur.',
      image_url = 'assets/icons/ignition-key.svg',
      reformulation = 'Quand vous tournez la clé, entendez-vous le démarreur faire tourner le moteur (bruit de rotation rapide), ou est-ce le silence complet ?',
      test_action = 'Mettez le contact sans forcer et écoutez attentivement le bruit sous le capot.',
      test_type = 'observation'
    WHERE id = 1
  `);

  // Question 2: Délai d'immobilisation
  await pool.query(`
    UPDATE questions SET 
      why_ask = 'Une voiture stationnée longtemps vide sa batterie naturellement. À l''inverse, une panne après un court arrêt oriente vers l''alternateur ou un faux contact.',
      image_url = 'assets/icons/calendar-clock.svg',
      reformulation = 'Le véhicule roulait-il encore hier normalement, ou était-il garé depuis plusieurs jours ?',
      test_action = 'Rappelez-vous simplement du dernier trajet effectué avec la voiture.',
      test_type = 'historique'
    WHERE id = 2
  `);

  // 4. Add sensory test question for Battery vs Starter (Principe 1: Phares faibles ?)
  // Check if Q3 exists for symptom 1
  const [existingQ3] = await pool.query('SELECT id FROM questions WHERE symptom_id = 1 AND step_num = 4');
  if (existingQ3.length === 0) {
    const [q3Res] = await pool.query(`
      INSERT INTO questions (symptom_id, step_num, total_steps, category, title, description, warning_text, why_ask, image_url, reformulation, test_action, test_type)
      VALUES (
        1, 4, 5, 'Test d''éclairage',
        'Les phares et le tableau de bord faiblissent-ils quand vous essayez de démarrer ?',
        'Observez l''intensité des lumières au moment précis où vous tournez la clé à fond.',
        'Ne maintenez pas la clé tournée plus de 5 secondes pour ne pas surchauffer le démarreur.',
        'Si les feux s''effondrent complètement, la batterie n''a plus assez de puissance pour alimenter le démarreur.',
        'assets/icons/headlights.svg',
        'Allumez simplement vos phares. Éclairent-ils avec une lumière vive et blanche, ou une lumière jaune et très faible ?',
        'Allumez vos phares ou le plafonnier, puis donnez un coup de clé pour démarrer.',
        'action'
      )
    `);
    const q3Id = q3Res.insertId;

    // Add options for Q3
    await pool.query(`
      INSERT INTO question_options (question_id, title, subtitle, icon, is_default, hypothesis_weights) VALUES
      (?, 'Oui, les phares s''éteignent presque', 'Chute brutale de la tension électrique', 'power', 1, '{"1":25,"2":-10,"3":-10}'),
      (?, 'Non, les phares restent très vifs', 'La batterie semble avoir une bonne puissance', 'zap', 0, '{"1":-15,"2":15,"3":20}'),
      (?, 'Je ne sais pas', 'Pas pu faire le test des phares', 'help', 0, '{"1":5}')
    `, [q3Id, q3Id, q3Id]);
    console.log('[Upgrade] Added sensory test question Q3 (Phares faibles).');
  }

  console.log('[Upgrade] Completed successfully.');
  await pool.end();
}

runUpgrade().catch(err => {
  console.error('[Upgrade] Error:', err);
  process.exit(1);
});
