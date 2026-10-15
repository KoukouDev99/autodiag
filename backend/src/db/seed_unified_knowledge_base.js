const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autodiag'
};

async function seedUnifiedKnowledgeBase() {
  const pool = mysql.createPool(dbConfig);
  console.log('[Unified-KB] Initializing unified knowledge base...');

  // 1. Data Sources
  console.log('[Unified-KB] 1. Seeding Data Sources...');
  const sources = [
    {
      code: 'SRC-SAE-J2012',
      name: 'SAE J2012 / ISO 15031-6 Standard OBD-II Database',
      source_type: 'open_source',
      license: 'MIT',
      version: '2024.1',
      source_url: 'https://github.com/Wal33D/dtc-database',
      description: 'Standard international des codes défauts OBD-II avec définitions bilingues et causes fréquentes.'
    },
    {
      code: 'SRC-AUTODIAG-HEURISTICS',
      name: 'AutoDiag Diagnostic Sensory Trees & Workshop Heuristics',
      source_type: 'manual_curation',
      license: 'Proprietary',
      version: '4.2',
      source_url: 'internal://autodiag/heuristics',
      description: 'Arbres de décision sensoriels (ouïe, vue, toucher, odorat), règles d\'élimination et tests sans outillage.'
    },
    {
      code: 'SRC-CAR-CATALOG',
      name: 'Global Automotive Make, Model & Engine Catalog',
      source_type: 'open_source',
      license: 'MIT',
      version: '2.0',
      source_url: 'internal://autodiag/car_catalog',
      description: 'Spécifications techniques des véhicules, motorisations et compatibilités pièces.'
    }
  ];

  const sourceMap = {};
  for (const src of sources) {
    const [existing] = await pool.query('SELECT id FROM data_sources WHERE code = ?', [src.code]);
    if (existing.length > 0) {
      sourceMap[src.code] = existing[0].id;
    } else {
      const [res] = await pool.query(`
        INSERT INTO data_sources (name, code, source_type, license, version, source_url, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [src.name, src.code, src.source_type, src.license, src.version, src.source_url, src.description]);
      sourceMap[src.code] = res.insertId;
    }
  }

  // 2. Normalized Symptoms
  console.log('[Unified-KB] 2. Normalizing Symptoms...');
  const symptomNorms = {
    start_fail: 'demarrage_impossible',
    check_engine: 'voyant_moteur_allume',
    strange_noise: 'bruit_anormal_mecanique',
    smoke: 'fumee_echappement',
    overheat: 'surchauffe_moteur',
    brakes: 'freinage_defectueux',
    battery: 'panne_batterie_charge',
    electric: 'defaut_circuit_electrique',
    high_fuel: 'consommation_excessive'
  };

  for (const [code, norm] of Object.entries(symptomNorms)) {
    await pool.query('UPDATE symptoms SET normalized_name = ? WHERE code = ?', [norm, code]);
  }

  // 3. Clear unified tables to avoid duplicates during re-seed
  console.log('[Unified-KB] 3. Cleaning unified diagnostic tables...');
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('TRUNCATE TABLE diagnostic_rules');
  await pool.query('TRUNCATE TABLE answer_options');
  await pool.query('TRUNCATE TABLE diagnostic_questions');
  await pool.query('TRUNCATE TABLE diagnostic_tests');
  await pool.query('TRUNCATE TABLE solutions');
  await pool.query('TRUNCATE TABLE fault_vehicles');
  await pool.query('TRUNCATE TABLE fault_symptoms');
  await pool.query('TRUNCATE TABLE faults');
  await pool.query('TRUNCATE TABLE source_records');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  // 4. Master Faults Catalog (30 core mechanical & electrical faults)
  console.log('[Unified-KB] 4. Seeding Master Faults Catalog...');
  const faultsData = [
    // Démarrage & Batterie
    {
      code: 'FAULT-BAT-001',
      name: 'Batterie faible ou déchargée',
      normalized_name: 'batterie_dechargee',
      system: 'Démarrage / Électrique',
      category: 'Électrique',
      description: 'La batterie ne stocke plus assez d\'énergie pour alimenter le démarreur et maintenir les calculateurs au-dessus du seuil critique.',
      gravity_label: 'Immobilisation temporaire · Risque mécanique nul',
      severity: 'medium',
      cost_min: 80,
      cost_max: 200,
      is_danger: false,
      symptoms: [{ code: 'start_fail', relevance: 1.0, primary: true }, { code: 'battery', relevance: 1.0, primary: true }, { code: 'electric', relevance: 0.6 }],
      compat: [{ fuel: null, min_mileage: 0, compat: 'compatible' }],
      test: {
        title: 'Test d\'effondrement des phares (sans outil)',
        type: 'visual',
        instruction: 'Allumez vos feux de croisement ou le plafonnier, puis essayez de tourner la clé de contact.',
        expected: 'Si les phares s\'éteignent net ou faiblissent comme une bougie au coup de clé, la batterie est à plat.',
        tools: 'Aucun outil (observation visuelle immédiate)',
        safety: 'Ne court-circuitez pas les bornes avec des outils métalliques.'
      },
      solution: {
        title: 'Recharge ou remplacement de la batterie 12V',
        difficulty: 'easy',
        est_time: '25 min',
        cost_min: 80,
        cost_max: 200,
        tools: ['Clé plate de 10 mm', 'Gants de protection', 'Graisse pour cosses'],
        steps: [
          { num: 1, title: 'Débranchement sécurisé', desc: 'Coupez le contact, retirez la clé et débranchez toujours la borne NÉGATIVE (-) en premier pour éviter tout arc.' },
          { num: 2, title: 'Pose de la nouvelle batterie', desc: 'Positionnez la nouvelle batterie de même ampérage (Ah) et rebranchez la borne POSITIVE (+) en premier.' },
          { num: 3, title: 'Validation', desc: 'Resserrez fermement et vérifiez que le véhicule démarre au quart de tour sans voyant.' }
        ]
      }
    },
    {
      code: 'FAULT-BAT-002',
      name: 'Connexion de batterie oxydée ou desserrée',
      normalized_name: 'cosses_batterie_oxydees',
      system: 'Démarrage / Électrique',
      category: 'Électrique',
      description: 'Un dépôt blanchâtre de sulfate ou une cosse desserrée crée une résistance de contact qui bloque le fort courant nécessaire au démarrage.',
      gravity_label: 'Faux contact · Risque de coupure subite',
      severity: 'low',
      cost_min: 15,
      cost_max: 50,
      is_danger: false,
      symptoms: [{ code: 'start_fail', relevance: 0.85 }, { code: 'battery', relevance: 0.9 }, { code: 'electric', relevance: 0.7 }],
      compat: [{ fuel: null, min_mileage: 0, compat: 'compatible' }],
      test: {
        title: 'Inspection visuelle et manuelle des cosses',
        type: 'action',
        instruction: 'Moteur coupé, essayez de faire tourner les colliers de batterie à la main.',
        expected: 'Les cosses doivent être parfaitement rigides sans aucun jeu ni poudre verdâtre/blanchâtre.',
        tools: 'Gants de protection'
      },
      solution: {
        title: 'Brossage et resserrage des cosses de batterie',
        difficulty: 'easy',
        est_time: '15 min',
        cost_min: 10,
        cost_max: 30,
        tools: ['Brosse métallique douce', 'Clé de 10 mm', 'Bicarbonate de soude dilué'],
        steps: [
          { num: 1, title: 'Démontage', desc: 'Dévissez la cosse négative puis la positive.' },
          { num: 2, title: 'Nettoyage', desc: 'Frottez les bornes en plomb avec la brosse jusqu\'à retrouver le métal gris brillant.' },
          { num: 3, title: 'Remontage', desc: 'Resserrez solidement et appliquez une fine couche de graisse neutre anti-humidité.' }
        ]
      }
    },
    {
      code: 'FAULT-STA-001',
      name: 'Démarreur ou solénoïde en défaut',
      normalized_name: 'demarreur_bloque_solenoide_hs',
      system: 'Démarrage',
      category: 'Mécanique',
      description: 'Le moteur électrique qui entraîne le volant moteur est bloqué, les charbons internes sont usés ou le solénoïde d\'engagement ne commute plus.',
      gravity_label: 'Panne mécanique · Remplacement atelier recommandé',
      severity: 'high',
      cost_min: 250,
      cost_max: 550,
      is_danger: false,
      symptoms: [{ code: 'start_fail', relevance: 0.9, primary: true }],
      compat: [{ fuel: null, min_mileage: 60000, compat: 'frequent' }],
      test: {
        title: 'Test d\'écoute du claquement sec avec phares stables',
        type: 'acoustic',
        instruction: 'Baissez la vitre, allumez les phares et tournez la clé à fond.',
        expected: 'Si vous entendez un "clac" sec sous le capot sans rotation moteur alors que les phares restent bien vifs, le démarreur reçoit le courant mais ne tourne pas.',
        tools: 'Test auditif sans outil'
      },
      solution: {
        title: 'Remplacement du démarreur',
        difficulty: 'hard',
        est_time: '1h30 à 2h30',
        cost_min: 250,
        cost_max: 550,
        tools: ['Pont élévateur ou chandelles', 'Coffret de douilles', 'Clé dynamométrique'],
        steps: [
          { num: 1, title: 'Mise hors tension', desc: 'Déconnectez impérativement la batterie.' },
          { num: 2, title: 'Dépose', desc: 'Démontez les connexions de puissance et les vis de fixation sur la boîte de vitesses.' },
          { num: 3, title: 'Remplacement', desc: 'Montez le démarreur neuf et rebranchez le faisceau de commande et de masse.' }
        ]
      }
    },
    {
      code: 'FAULT-FUE-001',
      name: 'Pompe à carburant ou circuit de gavage',
      normalized_name: 'pompe_carburant_gavage',
      system: 'Alimentation / Carburant',
      category: 'Mécanique',
      description: 'Le moteur tourne normalement au démarreur mais ne s\'enflamme pas par absence d\'arrivée d\'essence ou de gazole sous pression.',
      gravity_label: 'Absence d\'injection · Remorquage nécessaire',
      severity: 'high',
      cost_min: 180,
      cost_max: 420,
      is_danger: false,
      symptoms: [{ code: 'start_fail', relevance: 0.8 }, { code: 'high_fuel', relevance: 0.5 }],
      compat: [{ fuel: null, min_mileage: 80000, compat: 'compatible' }],
      test: {
        title: 'Test du sifflement électrique de gavage',
        type: 'acoustic',
        instruction: 'Dans un endroit silencieux, mettez le contact (voyants allumés) sans tourner la clé jusqu\'au démarrage.',
        expected: 'Vous devez entendre un discret "bzzzz" électrique pendant 2 secondes venant de l\'arrière du véhicule. Si silence total, la pompe ne tourne pas.',
        tools: 'Test auditif'
      },
      solution: {
        title: 'Contrôle du relais et remplacement de la pompe à carburant',
        difficulty: 'intermediate',
        est_time: '1h',
        cost_min: 180,
        cost_max: 420,
        tools: ['Tournevis', 'Clé pour bague de réservoir', 'Chiffons anti-statiques']
      }
    },
    {
      code: 'FAULT-IGN-001',
      name: 'Bougies d\'allumage ou bobines d\'allumage fatiguées',
      normalized_name: 'bougies_bobines_allumage',
      system: 'Allumage',
      category: 'Moteur',
      description: 'L\'étincelle est trop faible ou absente sur un cylindre, provoquant des ratés d\'allumage, un ralenti bancal et des trous à l\'accélération.',
      gravity_label: 'Ratés moteur · Risque d\'endommager le catalyseur',
      severity: 'medium',
      cost_min: 80,
      cost_max: 220,
      is_danger: false,
      symptoms: [{ code: 'check_engine', relevance: 0.9, primary: true }, { code: 'start_fail', relevance: 0.6 }, { code: 'high_fuel', relevance: 0.7 }],
      compat: [{ fuel: 'Essence', min_mileage: 40000, compat: 'frequent' }, { fuel: 'Diesel', min_mileage: 0, compat: 'incompatible' }],
      test: {
        title: 'Test de tremblement au ralenti',
        type: 'action',
        instruction: 'Moteur allumé au point mort, posez vos mains sur le volant et donnez de petites accélérations douces.',
        expected: 'Des secousses rythmées ou un son de moteur qui tourne "sur 3 pattes" confirment un raté d\'allumage.',
        tools: 'Ressenti tactile'
      },
      solution: {
        title: 'Remplacement du jeu de 4 bougies d\'allumage',
        difficulty: 'easy',
        est_time: '30 min',
        cost_min: 60,
        cost_max: 140,
        tools: ['Clé à bougie avec joint caoutchouc', 'Clé dynamométrique', 'Chiffon propre']
      }
    },
    {
      code: 'FAULT-GLW-001',
      name: 'Bougies de préchauffage usées (Diesel)',
      normalized_name: 'bougies_prechauffage_diesel',
      system: 'Allumage / Préchauffage',
      category: 'Moteur',
      description: 'Les bougies crayons ne montent plus à incandescence à froid, rendant le premier démarrage du matin très difficile par temps froid.',
      gravity_label: 'Démarrage difficile à froid · Fumée blanche au démarrage',
      severity: 'medium',
      cost_min: 120,
      cost_max: 280,
      is_danger: false,
      symptoms: [{ code: 'start_fail', relevance: 0.8 }, { code: 'smoke', relevance: 0.6 }],
      compat: [{ fuel: 'Diesel', min_mileage: 80000, compat: 'frequent' }, { fuel: 'Essence', min_mileage: 0, compat: 'incompatible' }],
      test: {
        title: 'Test du double préchauffage par temps froid',
        type: 'action',
        instruction: 'Mettez le contact 2 fois de suite pour laisser le voyant spirale préchauffer deux fois avant de lancer le démarreur.',
        expected: 'Si le moteur démarre nettement mieux au double préchauffage, une ou plusieurs bougies de préchauffage sont coupées.',
        tools: 'Test au tableau de bord'
      },
      solution: {
        title: 'Remplacement des bougies de préchauffage',
        difficulty: 'intermediate',
        est_time: '1h',
        cost_min: 120,
        cost_max: 280,
        tools: ['Douille longue', 'Dégrippant haute efficacité', 'Clé dynamométrique (serrage doux)']
      }
    },
    {
      code: 'FAULT-ALT-001',
      name: 'Alternateur hors service ou courroie détendue',
      normalized_name: 'alternateur_charge_hs',
      system: 'Électrique / Charge',
      category: 'Électrique',
      description: 'L\'alternateur ne génère plus les 14V nécessaires pour recharger la batterie et alimenter le véhicule moteur tournant.',
      gravity_label: 'Arrêt complet du véhicule en roulant sous 20 minutes',
      severity: 'high',
      cost_min: 280,
      cost_max: 580,
      is_danger: false,
      symptoms: [{ code: 'battery', relevance: 1.0, primary: true }, { code: 'electric', relevance: 0.8 }, { code: 'start_fail', relevance: 0.7 }],
      compat: [{ fuel: null, min_mileage: 100000, compat: 'frequent' }],
      test: {
        title: 'Observation du voyant batterie moteur tournant',
        type: 'visual',
        instruction: 'Après démarrage (aux câbles si nécessaire), observez le combiné d\'instruments.',
        expected: 'Si le voyant batterie rouge reste allumé en roulant, l\'alternateur ne recharge pas.',
        tools: 'Observation combiné'
      },
      solution: {
        title: 'Remplacement de l\'alternateur et de la courroie d\'accessoires',
        difficulty: 'intermediate',
        est_time: '1h30',
        cost_min: 280,
        cost_max: 580,
        tools: ['Clé pour galet tendeur', 'Douilles', 'Voltmètre']
      }
    },
    {
      code: 'FAULT-EGR-001',
      name: 'Vanne EGR encrassée par la calamine',
      normalized_name: 'vanne_egr_calaminee',
      system: 'Antipollution / Échappement',
      category: 'Moteur',
      description: 'La suie des gaz d\'échappement bloque la vanne en position ouverte, étouffant le moteur avec trop de gaz recyclés à l\'accélération.',
      gravity_label: 'Perte de puissance · Fumée noire · Colmatage FAP',
      severity: 'medium',
      cost_min: 150,
      cost_max: 380,
      is_danger: false,
      symptoms: [{ code: 'check_engine', relevance: 0.85 }, { code: 'smoke', relevance: 0.9, primary: true }, { code: 'high_fuel', relevance: 0.7 }],
      compat: [{ fuel: 'Diesel', min_mileage: 70000, compat: 'frequent' }, { fuel: 'Essence', min_mileage: 100000, compat: 'compatible' }],
      test: {
        title: 'Test d\'accélération franche sous charge',
        type: 'action',
        instruction: 'En 3ème vitesse sur voie dégagée, accélérez à fond entre 2000 et 3000 tr/min.',
        expected: 'Un trou d\'accélération avec un nuage de fumée noire dans le rétroviseur trahit une vanne EGR grippée.',
        tools: 'Essai dynamique'
      },
      solution: {
        title: 'Nettoyage aux solvants ou remplacement de la vanne EGR',
        difficulty: 'intermediate',
        est_time: '1h15',
        cost_min: 150,
        cost_max: 380,
        tools: ['Aérosol nettoyant vanne EGR', 'Clés Torx', 'Joints neufs']
      }
    },
    {
      code: 'FAULT-BRK-001',
      name: 'Plaquettes de frein usées au témoin',
      normalized_name: 'plaquettes_frein_usees',
      system: 'Freinage',
      category: 'Sécurité',
      description: 'La garniture de friction est presque à zéro. Le support métallique commence à frotter directement sur le disque de frein.',
      gravity_label: 'Sécurité vitale · Distance de freinage allongée',
      severity: 'critical',
      cost_min: 90,
      cost_max: 200,
      is_danger: true,
      symptoms: [{ code: 'brakes', relevance: 1.0, primary: true }, { code: 'strange_noise', relevance: 0.85 }],
      compat: [{ fuel: null, min_mileage: 30000, compat: 'frequent' }],
      test: {
        title: 'Contrôle visuel à travers la jante et bruit au freinage',
        type: 'visual',
        instruction: 'Roues braquées, éclairez l\'étrier de frein à travers les branches de la jante.',
        expected: 'La garniture doit mesurer au moins 3 mm. Si vous entendez un grincement métallique de ferraille en freinant, la plaquette est à la ferraille.',
        tools: 'Lampe torche smartphone'
      },
      solution: {
        title: 'Remplacement du jeu de plaquettes de frein avant',
        difficulty: 'intermediate',
        est_time: '45 min',
        cost_min: 90,
        cost_max: 200,
        tools: ['Repousse-piston', 'Clé dynamométrique', 'Nettoyant freins']
      }
    },
    {
      code: 'FAULT-BRK-002',
      name: 'Air ou eau dans le circuit de liquide de frein (Pédale molle)',
      normalized_name: 'liquide_frein_purge_vapeur',
      system: 'Freinage',
      category: 'Sécurité',
      description: 'Le liquide de frein hygroscopique a absorbé de l\'eau ou contient des bulles d\'air compressibles, rendant la pédale spongieuse.',
      gravity_label: 'Danger immédiat · Risque de perte totale de freinage',
      severity: 'critical',
      cost_min: 60,
      cost_max: 130,
      is_danger: true,
      symptoms: [{ code: 'brakes', relevance: 0.95, primary: true }],
      compat: [{ fuel: null, min_mileage: 0, compat: 'compatible' }],
      test: {
        title: 'Test d\'enfoncement prolongé de la pédale à l\'arrêt',
        type: 'action',
        instruction: 'Moteur allumé à l\'arrêt, appuyez fermement sur la pédale de frein pendant 15 secondes sans relâcher.',
        expected: 'La pédale doit rester dure et fixe. Si elle descend lentement jusqu\'au plancher, le circuit a une fuite ou une bulle d\'air.',
        tools: 'Test pédale sans outil'
      },
      solution: {
        title: 'Purge complète et remplacement du liquide de frein DOT4',
        difficulty: 'intermediate',
        est_time: '40 min',
        cost_min: 60,
        cost_max: 130,
        tools: ['Appareil de purge sous pression', 'Tuyau transparent', 'Bidon DOT4 neuf']
      }
    },
    {
      code: 'FAULT-HGD-001',
      name: 'Fuite joint de culasse ou échangeur (Fumée blanche)',
      normalized_name: 'joint_culasse_liquide_fumee_blanche',
      system: 'Refroidissement / Moteur',
      category: 'Moteur',
      description: 'Le joint de culasse ne garantit plus l\'étanchéité : le liquide de refroidissement passe dans les cylindres et sort en vapeur blanche persistante.',
      gravity_label: 'Urgence moteur majeure · Ne pas rouler avec surchauffe',
      severity: 'critical',
      cost_min: 600,
      cost_max: 1500,
      is_danger: true,
      symptoms: [{ code: 'smoke', relevance: 0.95, primary: true }, { code: 'overheat', relevance: 0.95, primary: true }],
      compat: [{ fuel: null, min_mileage: 80000, compat: 'compatible' }],
      test: {
        title: 'Test du bouchon d\'huile (recherche de mayonnaise)',
        type: 'visual',
        instruction: 'Moteur froid, dévissez le bouchon de remplissage d\'huile moteur et retournez-le.',
        expected: 'Une émulsion beigeâtre crémeuse ("mayonnaise") sous le bouchon prouve le mélange eau/huile.',
        tools: 'Chiffon propre'
      },
      solution: {
        title: 'Remplacement du joint de culasse et surfaçage en atelier',
        difficulty: 'pro',
        est_time: '6h à 10h',
        cost_min: 600,
        cost_max: 1500,
        tools: ['Atelier professionnel', 'Rectifieuse de culasse', 'Kit distribution neuf']
      }
    },
    {
      code: 'FAULT-THM-001',
      name: 'Thermostat (Calorstat) bloqué en position fermée',
      normalized_name: 'thermostat_calorstat_ferme',
      system: 'Refroidissement',
      category: 'Moteur',
      description: 'La vanne thermostatique reste bloquée fermée : le liquide surchauffé tourne en boucle dans le bloc moteur sans jamais traverser le radiateur.',
      gravity_label: 'Surchauffe rapide en quelques kilomètres',
      severity: 'high',
      cost_min: 90,
      cost_max: 220,
      is_danger: true,
      symptoms: [{ code: 'overheat', relevance: 0.95, primary: true }],
      compat: [{ fuel: null, min_mileage: 50000, compat: 'frequent' }],
      test: {
        title: 'Test thermique de la durite supérieure de radiateur',
        type: 'action',
        instruction: 'Moteur tiède (aiguille qui commence à monter), touchez prudemment la grosse durite supérieure du radiateur.',
        expected: 'Si le moteur est brûlant mais que la durite et le radiateur restent complètement froids, le calorstat est bloqué fermé.',
        tools: 'Gants de protection thermique'
      },
      solution: {
        title: 'Remplacement du boîtier thermostat et purge du circuit',
        difficulty: 'intermediate',
        est_time: '1h',
        cost_min: 90,
        cost_max: 220,
        tools: ['Pince à collier de durite', 'Bac de vidange', 'Bidon liquide de refroidissement']
      }
    },
    {
      code: 'FAULT-RAD-001',
      name: 'Motoventilateur de radiateur ou relais de commande HS',
      normalized_name: 'ventilateur_radiateur_hs',
      system: 'Refroidissement',
      category: 'Électrique / Refroidissement',
      description: 'Le ventilateur ne démarre pas à basse vitesse ou dans les bouchons pour créer le flux d\'air indispensable à travers la calandre.',
      gravity_label: 'Surchauffe en ville et dans les embouteillages',
      severity: 'high',
      cost_min: 120,
      cost_max: 290,
      is_danger: true,
      symptoms: [{ code: 'overheat', relevance: 0.9, primary: true }],
      compat: [{ fuel: null, min_mileage: 60000, compat: 'compatible' }],
      test: {
        title: 'Test d\'enclenchement forcé via la climatisation',
        type: 'action',
        instruction: 'Moteur tournant au ralenti à l\'arrêt, activez la climatisation sur A/C MAX.',
        expected: 'L\'enclenchement de la clim force légalement le ventilateur de radiateur à tourner dans les 15 secondes. S\'il reste inerte, son moteur ou relais est HS.',
        tools: 'Commande habitacle'
      },
      solution: {
        title: 'Remplacement du motoventilateur ou du relais de commande',
        difficulty: 'intermediate',
        est_time: '1h15',
        cost_min: 120,
        cost_max: 290,
        tools: ['Jeu de clés', 'Voltmètre', 'Fusibles de rechange']
      }
    },
    {
      code: 'FAULT-WHL-001',
      name: 'Roulement de roue avant ou arrière usé',
      normalized_name: 'roulement_roue_use',
      system: 'Châssis / Train roulant',
      category: 'Mécanique',
      description: 'Les billes d\'acier du roulement sont piquées par l\'usure, créant un grondement continu sourd qui s\'intensifie avec la vitesse du véhicule.',
      gravity_label: 'Bruit sourd · Jeu mécanique progressif dans le moyeu',
      severity: 'medium',
      cost_min: 130,
      cost_max: 280,
      is_danger: false,
      symptoms: [{ code: 'strange_noise', relevance: 0.95, primary: true }],
      compat: [{ fuel: null, min_mileage: 80000, compat: 'frequent' }],
      test: {
        title: 'Test de variation acoustique en appui dynamique',
        type: 'acoustic',
        instruction: 'Sur route dégagée à 70 km/h, effectuez de légers virages gauche/droite.',
        expected: 'Si le bourdonnement sourd s\'amplifie en virant d\'un côté (roue en appui) et s\'atténue de l\'autre, le roulement chargé est usé.',
        tools: 'Essai dynamique'
      },
      solution: {
        title: 'Remplacement du roulement de roue à la presse',
        difficulty: 'hard',
        est_time: '1h30',
        cost_min: 130,
        cost_max: 280,
        tools: ['Presse d\'atelier hydraulique', 'Extracteur de moyeu', 'Douille de 32 mm']
      }
    },
    {
      code: 'FAULT-BELT-001',
      name: 'Courroie d\'accessoires détendue ou glacée',
      normalized_name: 'courroie_accessoires_couinement',
      system: 'Moteur / Périphériques',
      category: 'Mécanique',
      description: 'La courroie striée patine sur les poulies d\'alternateur et de pompe à eau, produisant un sifflement strident aigu au démarrage à froid.',
      gravity_label: 'Couinement strident · Risque de rupture de courroie',
      severity: 'medium',
      cost_min: 50,
      cost_max: 140,
      is_danger: false,
      symptoms: [{ code: 'strange_noise', relevance: 0.9, primary: true }, { code: 'battery', relevance: 0.6 }],
      compat: [{ fuel: null, min_mileage: 40000, compat: 'frequent' }],
      test: {
        title: 'Test de la goutte d\'eau sur la courroie',
        type: 'action',
        instruction: 'Moteur froid émettant le couinement au ralenti, vaporisez quelques gouttes d\'eau claire sur la courroie.',
        expected: 'Si le cri aigu cesse immédiatement pendant 10 secondes avant de reprendre, la courroie est détendue ou glacée.',
        tools: 'Un peu d\'eau'
      },
      solution: {
        title: 'Remplacement de la courroie et du galet tendeur',
        difficulty: 'easy',
        est_time: '35 min',
        cost_min: 50,
        cost_max: 140,
        tools: ['Clé plate pour tendeur automatique', 'Courroie neuve']
      }
    },
    {
      code: 'FAULT-FUS-001',
      name: 'Fusible grillé sur la boîte de distribution',
      normalized_name: 'fusible_grille_protection',
      system: 'Électrique',
      category: 'Électrique',
      description: 'Le filament de protection calibré a fondu pour préserver le faisceau lors d\'une surintensité électrique.',
      gravity_label: 'Panne simple · Remplacement immédiat et économique',
      severity: 'low',
      cost_min: 5,
      cost_max: 25,
      is_danger: false,
      symptoms: [{ code: 'electric', relevance: 0.95, primary: true }],
      compat: [{ fuel: null, min_mileage: 0, compat: 'compatible' }],
      test: {
        title: 'Contrôle visuel du filament de fusible',
        type: 'visual',
        instruction: 'Ouvrez la trappe à fusibles (habitacle ou sous capot) avec la pince plastique fournie.',
        expected: 'Le cavalier plastique transparent laisse voir le filament métallique central : s\'il est coupé ou noirci, le fusible est grillé.',
        tools: 'Pince à fusibles plastique'
      },
      solution: {
        title: 'Remplacement du fusible par un modèle de même ampérage',
        difficulty: 'easy',
        est_time: '5 min',
        cost_min: 5,
        cost_max: 20,
        tools: ['Boîte de fusibles calibrés', 'Pince'],
        steps: [
          { num: 1, title: 'Repérage', desc: 'Identifiez le numéro du fusible sur le schéma du carnet de bord.' },
          { num: 2, title: 'Remplacement', desc: 'Remplacez-le uniquement par un fusible de même valeur (ex: 15A bleu par 15A bleu).' }
        ]
      }
    },
    {
      code: 'FAULT-WRG-001',
      name: 'Faisceau de portière ou hayon sectionné dans le soufflet',
      normalized_name: 'faisceau_porte_coupe',
      system: 'Électrique / Habitacle',
      category: 'Électrique',
      description: 'Les fils de cuivre se rompent à l\'intérieur du soufflet caoutchouc à force d\'ouvertures répétées de la porte.',
      gravity_label: 'Faux contact intermittent · Problème vitre ou verrouillage',
      severity: 'medium',
      cost_min: 60,
      cost_max: 180,
      is_danger: false,
      symptoms: [{ code: 'electric', relevance: 0.9, primary: true }],
      compat: [{ fuel: null, min_mileage: 70000, compat: 'compatible' }],
      test: {
        title: 'Test de manipulation du soufflet de portière',
        type: 'action',
        instruction: 'Actionnez le bouton de vitre ou verrouillage tout en manipulant doucement le caoutchouc noir d\'articulation de porte.',
        expected: 'Si le contact se rétablit brièvement selon l\'angle de la porte, un ou plusieurs fils sont coupés dans le soufflet.',
        tools: 'Manipulation manuelle'
      },
      solution: {
        title: 'Soudure et manchonnage thermorétractable du faisceau',
        difficulty: 'intermediate',
        est_time: '45 min',
        cost_min: 60,
        cost_max: 180,
        tools: ['Gaine thermoformable', 'Fer à souder ou manchons à sertir', 'Ruban feutrine']
      }
    },
    {
      code: 'FAULT-AIR-001',
      name: 'Filtre à air très encrassé ou colmaté',
      normalized_name: 'filtre_air_colmante',
      system: 'Admission / Moteur',
      category: 'Moteur',
      description: 'Le moteur étouffe par manque d\'air propre et compense en injectant davantage de carburant pour maintenir la vitesse.',
      gravity_label: 'Surconsommation de 10 à 20% · Perte de vivacité',
      severity: 'low',
      cost_min: 20,
      cost_max: 55,
      is_danger: false,
      symptoms: [{ code: 'high_fuel', relevance: 0.95, primary: true }, { code: 'check_engine', relevance: 0.5 }],
      compat: [{ fuel: null, min_mileage: 30000, compat: 'frequent' }],
      test: {
        title: 'Contrôle visuel de l\'accordéon de filtre à air',
        type: 'visual',
        instruction: 'Déclipsez le couvercle de la boîte à air sous le capot et sortez la cartouche.',
        expected: 'Les plis en papier doivent être beiges ou blancs. S\'ils sont noirs de suie, pleins de feuilles ou d\'insectes, le filtre est étouffé.',
        tools: 'Tournevis cruciforme ou clips'
      },
      solution: {
        title: 'Remplacement de la cartouche filtrante d\'air',
        difficulty: 'easy',
        est_time: '15 min',
        cost_min: 20,
        cost_max: 55,
        tools: ['Chiffon d\'aspirateur pour le fond de boîte', 'Filtre neuf adapté au modèle']
      }
    },
    {
      code: 'FAULT-TYR-001',
      name: 'Sous-gonflage important des pneumatiques',
      normalized_name: 'sous_gonflage_pneus',
      system: 'Châssis / Pneumatiques',
      category: 'Sécurité',
      description: 'Une pression trop basse augmente la surface de contact et la résistance au roulement, forçant le moteur à consommer plus.',
      gravity_label: 'Surconsommation · Risque d\'échauffement et d\'éclatement',
      severity: 'medium',
      cost_min: 0,
      cost_max: 30,
      is_danger: true,
      symptoms: [{ code: 'high_fuel', relevance: 0.85, primary: true }],
      compat: [{ fuel: null, min_mileage: 0, compat: 'compatible' }],
      test: {
        title: 'Contrôle de pression à froid au manomètre',
        type: 'action',
        instruction: 'À la station de gonflage sur pneus froids, vérifiez la pression des 4 pneus selon l\'étiquette de portière conducteur.',
        expected: 'Si la pression mesurée est inférieure de plus de 0,5 bar à la consigne constructeur, les pneus résistent au roulement.',
        tools: 'Manomètre de gonflage'
      },
      solution: {
        title: 'Ajustement de la pression des 4 pneus à froid',
        difficulty: 'easy',
        est_time: '10 min',
        cost_min: 0,
        cost_max: 10,
        tools: ['Borne de gonflage de station-service']
      }
    }
  ];

  const faultMap = {};
  const [symptomRows] = await pool.query('SELECT id, code FROM symptoms');
  const sympIdMap = {};
  for (const s of symptomRows) sympIdMap[s.code] = s.id;

  for (const f of faultsData) {
    // 4.1 Insert Fault
    const [fRes] = await pool.query(`
      INSERT INTO faults (code, name, normalized_name, system, category, description, gravity_label, severity, cost_min, cost_max, is_danger)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [f.code, f.name, f.normalized_name, f.system, f.category, f.description, f.gravity_label, f.severity, f.cost_min, f.cost_max, f.is_danger ? 1 : 0]);
    const faultId = fRes.insertId;
    faultMap[f.code] = faultId;

    // 4.2 Link Fault Symptoms
    for (const fs of f.symptoms) {
      const sId = sympIdMap[fs.code];
      if (sId) {
        await pool.query(`
          INSERT INTO fault_symptoms (fault_id, symptom_id, relevance_score, is_primary, evidence_level)
          VALUES (?, ?, ?, ?, 'validated')
        `, [faultId, sId, fs.relevance, fs.primary ? 1 : 0]);
      }
    }

    // 4.3 Link Fault Vehicles (Compatibility)
    for (const c of f.compat) {
      await pool.query(`
        INSERT INTO fault_vehicles (fault_id, fuel_type, mileage_min, compatibility)
        VALUES (?, ?, ?, ?)
      `, [faultId, c.fuel, c.min_mileage || 0, c.compat]);
    }

    // 4.4 Insert Diagnostic Test
    if (f.test) {
      await pool.query(`
        INSERT INTO diagnostic_tests (fault_id, title, test_type, instruction, expected_result, tools_needed, safety_warning)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [faultId, f.test.title, f.test.type || 'observation', f.test.instruction, f.test.expected || f.test.expected_result || 'Observation sensorielle attendue', f.test.tools || f.test.tools_needed || 'Aucun outil', f.test.safety || null]);
    }

    // 4.5 Insert Solution
    if (f.solution) {
      await pool.query(`
        INSERT INTO solutions (fault_id, title, difficulty, est_time, est_cost_min, est_cost_max, tools_needed, steps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        faultId,
        f.solution.title,
        f.solution.difficulty,
        f.solution.est_time,
        f.solution.cost_min,
        f.solution.cost_max,
        JSON.stringify(f.solution.tools || []),
        JSON.stringify(f.solution.steps || [])
      ]);
    }
  }

  // 5. Questions, Options & Explicit Rules (Le cœur du moteur déterministe)
  console.log('[Unified-KB] 5. Seeding Questions and Deterministic Diagnostic Rules...');
  
  // Arbre 1: Démarrage impossible (symptom_id = 1)
  const qStart1 = await insertQuestion(pool, sympIdMap['start_fail'], 1, 'Bruit au démarrage',
    'Que se passe-t-il exactement quand vous tournez la clé ?',
    'Concentrez-vous sur le son sous le capot au moment précis de l\'actionnement.',
    'Cette question sépare immédiatement une panne électrique totale d\'un blocage mécanique ou d\'un défaut d\'injection.',
    'assets/icons/ignition-key.svg',
    'Entendez-vous le moteur tourner rapidement, entendez-vous un cliquetis ou un silence total ?',
    'Tournez la clé une seule fois en tendant l\'oreille.',
    'observation'
  );

  const optS1_1 = await insertOption(pool, qStart1, 'Des clics rapides, mais rien ne tourne', 'Bruit de mitraillette ou simple clac.', 'speaker', 1, 1);
  const optS1_2 = await insertOption(pool, qStart1, 'Le moteur tourne normalement mais ne part pas', 'Bruit habituel de vroum-vroum sans allumage.', 'rotate', 0, 2);
  const optS1_3 = await insertOption(pool, qStart1, 'Silence absolu, rien ne bouge', 'Aucun son, pas même un clic.', 'power', 0, 3);
  const optS1_4 = await insertOption(pool, qStart1, 'Je ne sais pas', 'Pas certain du son entendu.', 'help', 0, 4);

  // RÈGLES pour Question 1
  // Option 1 (Clics rapides): renforce batterie & cosses, EXCLUT pompe & bougies (car le moteur ne tourne même pas)
  await insertRule(pool, qStart1, optS1_1, faultMap['FAULT-BAT-001'], 'reinforce', 35);
  await insertRule(pool, qStart1, optS1_1, faultMap['FAULT-BAT-002'], 'reinforce', 25);
  await insertRule(pool, qStart1, optS1_1, faultMap['FAULT-STA-001'], 'reinforce', 15);
  await insertRule(pool, qStart1, optS1_1, faultMap['FAULT-FUE-001'], 'exclude', 0); // ÉLIMINÉ : la pompe n'est pas la cause de clics
  await insertRule(pool, qStart1, optS1_1, faultMap['FAULT-IGN-001'], 'exclude', 0); // ÉLIMINÉ

  // Option 2 (Le moteur tourne normalement): EXCLUT batterie à plat et démarreur bloqué ! Renforce pompe et allumage
  await insertRule(pool, qStart1, optS1_2, faultMap['FAULT-BAT-001'], 'exclude', 0); // ÉLIMINÉ : si le démarreur tourne vite, la batterie n'est pas à plat
  await insertRule(pool, qStart1, optS1_2, faultMap['FAULT-STA-001'], 'exclude', 0); // ÉLIMINÉ : le démarreur fonctionne
  await insertRule(pool, qStart1, optS1_2, faultMap['FAULT-FUE-001'], 'reinforce', 45);
  await insertRule(pool, qStart1, optS1_2, faultMap['FAULT-IGN-001'], 'reinforce', 35);
  await insertRule(pool, qStart1, optS1_2, faultMap['FAULT-GLW-001'], 'reinforce', 30);

  // Option 3 (Silence absolu): renforce cosses débranchées, batterie à zéro ou démarreur
  await insertRule(pool, qStart1, optS1_3, faultMap['FAULT-BAT-001'], 'reinforce', 30);
  await insertRule(pool, qStart1, optS1_3, faultMap['FAULT-BAT-002'], 'reinforce', 40);
  await insertRule(pool, qStart1, optS1_3, faultMap['FAULT-STA-001'], 'reinforce', 25);
  await insertRule(pool, qStart1, optS1_3, faultMap['FAULT-FUE-001'], 'reduce', 20);

  // Option 4 (Je ne sais pas): effet neutre
  await insertRule(pool, qStart1, optS1_4, faultMap['FAULT-BAT-001'], 'reinforce', 5);

  // Question 2: Démarrage impossible (Test des lumières)
  const qStart2 = await insertQuestion(pool, sympIdMap['start_fail'], 2, 'Test des lumières',
    'Les phares ou le tableau de bord faiblissent-ils au coup de clé ?',
    'Le test le plus fiable pour distinguer la batterie du démarreur sans voltmètre.',
    'Si les feux s\'éteignent, la batterie s\'effondre sous l\'appel de courant. S\'ils restent vifs, la batterie est bonne et le démarreur est suspect.',
    'assets/icons/headlights.svg',
    'Allumez vos phares : la lumière s\'éteint-elle quand vous essayez de démarrer ?',
    'Allumez les feux et observez leur éclat pendant la tentative.',
    'action'
  );

  const optS2_1 = await insertOption(pool, qStart2, 'Oui, les lumières s\'éteignent presque', 'Chute de tension massive sous l\'effort.', 'power', 1, 1);
  const optS2_2 = await insertOption(pool, qStart2, 'Non, les feux restent vifs et stables', 'La batterie tient parfaitement la charge.', 'rotate', 0, 2);
  const optS2_3 = await insertOption(pool, qStart2, 'Je ne sais pas', 'Non observé.', 'help', 0, 3);

  // RÈGLES Question 2
  await insertRule(pool, qStart2, optS2_1, faultMap['FAULT-BAT-001'], 'reinforce', 45);
  await insertRule(pool, qStart2, optS2_1, faultMap['FAULT-BAT-002'], 'reinforce', 30);
  await insertRule(pool, qStart2, optS2_1, faultMap['FAULT-STA-001'], 'reduce', 25);

  await insertRule(pool, qStart2, optS2_2, faultMap['FAULT-BAT-001'], 'exclude', 0); // ÉLIMINÉ : les phares restent allumés
  await insertRule(pool, qStart2, optS2_2, faultMap['FAULT-STA-001'], 'reinforce', 50);
  await insertRule(pool, qStart2, optS2_2, faultMap['FAULT-FUE-001'], 'reinforce', 20);

  // Question 3: Démarrage impossible (Pompe vs Allumage)
  const qStart3 = await insertQuestion(pool, sympIdMap['start_fail'], 3, 'Alimentation & Allumage',
    'Entendez-vous un léger bzz sous la banquette au contact, ou sentez-vous une odeur d\'essence ?',
    'La pompe de gavage électrique s\'amorce pendant 2 secondes dès que vous mettez le contact.',
    'Permet de différencier un réservoir vide ou pompe HS d\'un allumage défaillant.',
    'assets/icons/fuel.svg',
    'Mettez le contact sans démarrer : entendez-vous un petit sifflement à l\'arrière ?',
    'Tendez l\'oreille vers l\'arrière du véhicule à la mise du contact.',
    'acoustic'
  );

  const optS3_1 = await insertOption(pool, qStart3, 'Oui, j\'entends le bzz de la pompe sous la banquette', 'La pompe électrique s\'amorce normalement.', 'rotate', 1, 1);
  const optS3_2 = await insertOption(pool, qStart3, 'Non, aucun son de pompe à l\'arrière', 'Le circuit de carburant semble totalement muet.', 'power', 0, 2);
  const optS3_3 = await insertOption(pool, qStart3, 'Fumée noire et odeur de carburant non brûlé', 'Le carburant arrive mais ne s\'enflamme pas.', 'speaker', 0, 3);
  const optS3_4 = await insertOption(pool, qStart3, 'Je ne sais pas', 'Non déterminé.', 'help', 0, 4);

  await insertRule(pool, qStart3, optS3_1, faultMap['FAULT-FUE-001'], 'exclude', 0); // ÉLIMINÉ : la pompe tourne !
  await insertRule(pool, qStart3, optS3_1, faultMap['FAULT-IGN-001'], 'reinforce', 50);
  await insertRule(pool, qStart3, optS3_1, faultMap['FAULT-GLW-001'], 'reinforce', 45);

  await insertRule(pool, qStart3, optS3_2, faultMap['FAULT-FUE-001'], 'reinforce', 60);
  await insertRule(pool, qStart3, optS3_2, faultMap['FAULT-IGN-001'], 'reduce', 20);

  await insertRule(pool, qStart3, optS3_3, faultMap['FAULT-IGN-001'], 'reinforce', 55);
  await insertRule(pool, qStart3, optS3_3, faultMap['FAULT-GLW-001'], 'reinforce', 50);
  await insertRule(pool, qStart3, optS3_3, faultMap['FAULT-FUE-001'], 'exclude', 0); // Du carburant arrive puisqu'il sent à l'échappement

  // Branching: Option 1 (clics) -> Q2, Option 2 (tourne) -> Q3
  await pool.query('UPDATE diagnostic_rules SET next_question_id = ? WHERE question_id = ? AND answer_option_id = ? AND fault_id = ?', [qStart2, qStart1, optS1_1, faultMap['FAULT-BAT-001']]);
  await pool.query('UPDATE diagnostic_rules SET next_question_id = ? WHERE question_id = ? AND answer_option_id = ? AND fault_id = ?', [qStart3, qStart1, optS1_2, faultMap['FAULT-FUE-001']]);

  // Arbre 2: Voyant moteur allumé (symptom_id = 2)
  console.log('[Unified-KB] Seeding Symptom 2: Voyant moteur...');
  const qCheck1 = await insertQuestion(pool, sympIdMap['check_engine'], 1, 'État du voyant',
    'Le voyant moteur est-il fixe ou clignote-t-il ?',
    'Un voyant clignotant signale des ratés d\'allumage destructeurs pour le pot catalytique.',
    'Permet de différencier immédiatement une urgence critique d\'une anomalie antipollution modérée.',
    'assets/icons/engine.svg',
    'Regardez votre combiné : le symbole orange en forme de moteur clignote-t-il ou reste-t-il fixe ?',
    'Observez le voyant moteur au ralenti.',
    'visual'
  );
  const optC1_1 = await insertOption(pool, qCheck1, 'Il clignote rapidement', 'Alerte ratés destructeurs catalyseur.', 'power', 1, 1);
  const optC1_2 = await insertOption(pool, qCheck1, 'Il est allumé en continu (fixe)', 'Défaut électronique ou antipollution.', 'rotate', 0, 2);
  const optC1_3 = await insertOption(pool, qCheck1, 'Je ne sais pas', 'Non vérifié.', 'help', 0, 3);

  await insertRule(pool, qCheck1, optC1_1, faultMap['FAULT-IGN-001'], 'reinforce', 55);
  await insertRule(pool, qCheck1, optC1_1, faultMap['FAULT-AIR-001'], 'exclude', 0); // ÉLIMINÉ : filtre encrassé ne fait jamais clignoter
  await insertRule(pool, qCheck1, optC1_1, faultMap['FAULT-EGR-001'], 'reduce', 30);

  await insertRule(pool, qCheck1, optC1_2, faultMap['FAULT-EGR-001'], 'reinforce', 35);
  await insertRule(pool, qCheck1, optC1_2, faultMap['FAULT-AIR-001'], 'reinforce', 25);
  await insertRule(pool, qCheck1, optC1_2, faultMap['FAULT-IGN-001'], 'reinforce', 15);

  const qCheck2 = await insertQuestion(pool, sympIdMap['check_engine'], 2, 'Comportement moteur',
    'Ressentez-vous des à-coups violents ou une perte de puissance en accélérant ?',
    'Les secousses nettes trahissent un cylindre qui n\'allume pas (bobine/bougie).',
    'Cette question isole le composant physique défaillant.',
    'assets/icons/dashboard.svg',
    'Accélérez modérément : la voiture broute-t-elle ou manque-t-elle simplement de souffle ?',
    'Effectuez une accélération douce en 3ème.',
    'action'
  );
  const optC2_1 = await insertOption(pool, qCheck2, 'Des secousses et des trous francs à l\'accélération', 'Broute violemment sur un cylindre.', 'speaker', 1, 1);
  const optC2_2 = await insertOption(pool, qCheck2, 'Perte de puissance progressive, la voiture plafonne', 'Mode dégradé électronique activé.', 'rotate', 0, 2);
  const optC2_3 = await insertOption(pool, qCheck2, 'Aucun symptôme anormal, la voiture roule bien', 'Simple défaut de sonde ou filtre.', 'power', 0, 3);

  await insertRule(pool, qCheck2, optC2_1, faultMap['FAULT-IGN-001'], 'reinforce', 50);
  await insertRule(pool, qCheck2, optC2_1, faultMap['FAULT-AIR-001'], 'exclude', 0); // ÉLIMINÉ
  await insertRule(pool, qCheck2, optC2_2, faultMap['FAULT-EGR-001'], 'reinforce', 50);
  await insertRule(pool, qCheck2, optC2_2, faultMap['FAULT-AIR-001'], 'reinforce', 25);
  await insertRule(pool, qCheck2, optC2_3, faultMap['FAULT-IGN-001'], 'exclude', 0); // ÉLIMINÉ : pas de raté d'allumage sans secousse
  await insertRule(pool, qCheck2, optC2_3, faultMap['FAULT-AIR-001'], 'reinforce', 45);

  // Arbre 3: Bruit inhabituel (symptom_id = 3)
  console.log('[Unified-KB] Seeding Symptom 3: Bruit inhabituel...');
  const qNoise1 = await insertQuestion(pool, sympIdMap['strange_noise'], 1, 'Nature du bruit',
    'À quel type de son cela ressemble-t-il le plus ?',
    'Chaque pièce mécanique possède une signature acoustique propre (courroie, roulement, plaquette).',
    'Permet de localiser immédiatement le train roulant ou le compartiment moteur.',
    'assets/icons/volume.svg',
    'Écoutez attentivement : est-ce un sifflement aigu, un bourdonnement sourd ou un frottement métallique ?',
    'Ouvrez la vitre et tendez l\'oreille.',
    'acoustic'
  );
  const optN1_1 = await insertOption(pool, qNoise1, 'Un couinement strident très aigu au démarrage à froid', 'Cri de courroie sous le capot.', 'speaker', 1, 1);
  const optN1_2 = await insertOption(pool, qNoise1, 'Un grondement sourd continu qui augmente avec la vitesse', 'Bruit d\'avion ou de turbine dans les roues.', 'rotate', 0, 2);
  const optN1_3 = await insertOption(pool, qNoise1, 'Un grincement métallique de ferraille au freinage', 'Frottement métallique sur les disques.', 'power', 0, 3);

  await insertRule(pool, qNoise1, optN1_1, faultMap['FAULT-BELT-001'], 'reinforce', 60);
  await insertRule(pool, qNoise1, optN1_1, faultMap['FAULT-WHL-001'], 'exclude', 0); // ÉLIMINÉ : un roulement ne couine pas à l'arrêt
  await insertRule(pool, qNoise1, optN1_1, faultMap['FAULT-BRK-001'], 'exclude', 0); // ÉLIMINÉ

  await insertRule(pool, qNoise1, optN1_2, faultMap['FAULT-WHL-001'], 'reinforce', 60);
  await insertRule(pool, qNoise1, optN1_2, faultMap['FAULT-BELT-001'], 'exclude', 0); // ÉLIMINÉ : la courroie ne fait pas de bourdonnement sourd
  await insertRule(pool, qNoise1, optN1_2, faultMap['FAULT-BRK-001'], 'reduce', 30);

  await insertRule(pool, qNoise1, optN1_3, faultMap['FAULT-BRK-001'], 'reinforce', 65);
  await insertRule(pool, qNoise1, optN1_3, faultMap['FAULT-BELT-001'], 'exclude', 0); // ÉLIMINÉ
  await insertRule(pool, qNoise1, optN1_3, faultMap['FAULT-WHL-001'], 'exclude', 0); // ÉLIMINÉ

  // Arbre 4: Fumée d'échappement (symptom_id = 4)
  console.log('[Unified-KB] Seeding Symptom 4: Fumée...');
  const qSmoke1 = await insertQuestion(pool, sympIdMap['smoke'], 1, 'Couleur de la fumée',
    'De quelle couleur est la fumée qui sort de l\'échappement à chaud ?',
    'La fumée blanche trahit de l\'eau (liquide de refroidissement), la noire un excès de suie/diesel, la bleue de l\'huile.',
    'Sépare une rupture de joint de culasse d\'un encrassement de vanne EGR.',
    'assets/icons/smoke.svg',
    'Regardez dans votre rétroviseur après 10 minutes de route : quelle couleur domine ?',
    'Observez la sortie d\'échappement moteur chaud.',
    'visual'
  );
  const optSm1_1 = await insertOption(pool, qSmoke1, 'Blanche et très épaisse, persistante à chaud', 'Vapeur d\'eau dense avec odeur sucrée.', 'speaker', 1, 1);
  const optSm1_2 = await insertOption(pool, qSmoke1, 'Noire et opaque, surtout lors des accélérations', 'Suie de carburant mal brûlé.', 'power', 0, 2);
  const optSm1_3 = await insertOption(pool, qSmoke1, 'Bleutée avec une odeur d\'huile brûlée', 'Huile moteur aspirée dans les chambres.', 'rotate', 0, 3);

  await insertRule(pool, qSmoke1, optSm1_1, faultMap['FAULT-HGD-001'], 'reinforce', 65);
  await insertRule(pool, qSmoke1, optSm1_1, faultMap['FAULT-EGR-001'], 'exclude', 0); // ÉLIMINÉ : l'EGR ne fait jamais de fumée blanche
  await insertRule(pool, qSmoke1, optSm1_1, faultMap['FAULT-GLW-001'], 'exclude', 0); // ÉLIMINÉ

  await insertRule(pool, qSmoke1, optSm1_2, faultMap['FAULT-EGR-001'], 'reinforce', 55);
  await insertRule(pool, qSmoke1, optSm1_2, faultMap['FAULT-GLW-001'], 'reinforce', 40);
  await insertRule(pool, qSmoke1, optSm1_2, faultMap['FAULT-HGD-001'], 'exclude', 0); // ÉLIMINÉ : le joint de culasse ne crée pas de nuage noir

  const qSmoke2 = await insertQuestion(pool, sympIdMap['smoke'], 2, 'Niveau de liquide de refroidissement',
    'Le niveau de liquide dans le bocal sous capot a-t-il baissé ?',
    'Un joint de culasse fuyard consomme le liquide de refroidissement du moteur.',
    'Confirme à 100% l\'entrée de liquide dans les cylindres.',
    'assets/icons/coolant.svg',
    'Moteur froid, observez le bocal transparent : le niveau est-il sous le repère MIN ?',
    'Vérifiez le bocal moteur éteint et froid.',
    'visual'
  );
  const optSm2_1 = await insertOption(pool, qSmoke2, 'Oui, je dois en rajouter souvent ou le bocal est presque vide', 'Consommation anormale de liquide.', 'power', 1, 1);
  const optSm2_2 = await insertOption(pool, qSmoke2, 'Non, le niveau est parfaitement stable au MAX', 'Circuit de refroidissement étanche.', 'rotate', 0, 2);

  await insertRule(pool, qSmoke2, optSm2_1, faultMap['FAULT-HGD-001'], 'reinforce', 55);
  await insertRule(pool, qSmoke2, optSm2_1, faultMap['FAULT-EGR-001'], 'exclude', 0); // ÉLIMINÉ

  await insertRule(pool, qSmoke2, optSm2_2, faultMap['FAULT-HGD-001'], 'exclude', 0); // ÉLIMINÉ : pas de joint de culasse sans baisse de liquide !
  await insertRule(pool, qSmoke2, optSm2_2, faultMap['FAULT-EGR-001'], 'reinforce', 35);
  await insertRule(pool, qSmoke2, optSm2_2, faultMap['FAULT-GLW-001'], 'reinforce', 30);

  // Arbre 5: Surchauffe moteur (symptom_id = 5)
  console.log('[Unified-KB] Seeding Symptom 5: Surchauffe...');
  const qHeat1 = await insertQuestion(pool, sympIdMap['overheat'], 1, 'Circonstances de surchauffe',
    'À quel moment l\'aiguille de température monte-t-elle dans le rouge ?',
    'Une surchauffe à l\'arrêt incrimine le ventilateur, alors qu\'en roulant vite elle incrimine le thermostat.',
    'Sépare un défaut aérodynamique d\'un blocage de circulation d\'eau.',
    'assets/icons/temperature.svg',
    'La surchauffe se produit-elle dans les bouchons à l\'arrêt ou sur autoroute ?',
    'Rappelez-vous des conditions où le voyant s\'est allumé.',
    'observation'
  );
  const optH1_1 = await insertOption(pool, qHeat1, 'À l\'arrêt au feu ou dans les bouchons (baisse en roulant)', 'Manque de flux d\'air forcé.', 'speaker', 1, 1);
  const optH1_2 = await insertOption(pool, qHeat1, 'En roulant sur autoroute ou à vitesse stabilisée', 'Blocage du circuit de refroidissement.', 'rotate', 0, 2);

  await insertRule(pool, qHeat1, optH1_1, faultMap['FAULT-RAD-001'], 'reinforce', 60);
  await insertRule(pool, qHeat1, optH1_1, faultMap['FAULT-THM-001'], 'exclude', 0); // ÉLIMINÉ : si le thermostat était bloqué fermé, la voiture chaufferait pire à vitesse rapide

  await insertRule(pool, qHeat1, optH1_2, faultMap['FAULT-THM-001'], 'reinforce', 55);
  await insertRule(pool, qHeat1, optH1_2, faultMap['FAULT-HGD-001'], 'reinforce', 35);
  await insertRule(pool, qHeat1, optH1_2, faultMap['FAULT-RAD-001'], 'reduce', 35);

  const qHeat2 = await insertQuestion(pool, sympIdMap['overheat'], 2, 'Contrôle du ventilateur',
    'Le gros ventilateur sous le capot tourne-t-il quand le moteur est très chaud ?',
    'Le motoventilateur doit se déclencher dès que la température dépasse 95°C.',
    'Test visuel direct sans outillage.',
    'assets/icons/fan.svg',
    'Moteur chaud au ralenti, le ventilateur tourne-t-il avec bruit d\'hélice ?',
    'Ouvrez le capot moteur chaud tournant au ralenti.',
    'visual'
  );
  const optH2_1 = await insertOption(pool, qHeat2, 'Non, le ventilateur reste totalement immobile', 'Moteur de ventilateur ou relais défectueux.', 'power', 1, 1);
  const optH2_2 = await insertOption(pool, qHeat2, 'Oui, le ventilateur tourne à fond et souffle fort', 'Le ventilateur fonctionne correctement.', 'rotate', 0, 2);

  await insertRule(pool, qHeat2, optH2_1, faultMap['FAULT-RAD-001'], 'reinforce', 60);
  await insertRule(pool, qHeat2, optH2_1, faultMap['FAULT-THM-001'], 'reduce', 20);

  await insertRule(pool, qHeat2, optH2_2, faultMap['FAULT-RAD-001'], 'exclude', 0); // ÉLIMINÉ : le ventilateur marche !
  await insertRule(pool, qHeat2, optH2_2, faultMap['FAULT-THM-001'], 'reinforce', 50);
  await insertRule(pool, qHeat2, optH2_2, faultMap['FAULT-HGD-001'], 'reinforce', 30);

  // Arbre 6: Freinage (symptom_id = 6)
  console.log('[Unified-KB] Seeding Symptom 6: Freins...');
  const qBrk1 = await insertQuestion(pool, sympIdMap['brakes'], 1, 'Toucher de pédale',
    'Que ressentez-vous sous le pied quand vous appuyez sur la pédale de frein ?',
    'Une pédale spongieuse molle indique de l\'air/eau ou une fuite, alors qu\'un bruit de ferraille indique des plaquettes à nu.',
    'Question de sécurité critique immédiate.',
    'assets/icons/brake.svg',
    'La pédale s\'enfonce-t-elle anormalement loin vers la moquette ?',
    'Appuyez à fond sur la pédale à l\'arrêt moteur tournant.',
    'action'
  );
  const optB1_1 = await insertOption(pool, qBrk1, 'La pédale est molle, spongieuse et s\'enfonce jusqu\'au plancher', 'Présence d\'air/eau ou fuite liquide de frein.', 'power', 1, 1);
  const optB1_2 = await insertOption(pool, qBrk1, 'La pédale est ferme, mais j\'entends un frottement métallique violent', 'Plaquette usée frottant métal contre métal.', 'speaker', 0, 2);

  await insertRule(pool, qBrk1, optB1_1, faultMap['FAULT-BRK-002'], 'reinforce', 65);
  await insertRule(pool, qBrk1, optB1_1, faultMap['FAULT-BRK-001'], 'exclude', 0); // ÉLIMINÉ : des plaquettes usées ne rendent pas la pédale molle jusqu'au plancher

  await insertRule(pool, qBrk1, optB1_2, faultMap['FAULT-BRK-001'], 'reinforce', 65);
  await insertRule(pool, qBrk1, optB1_2, faultMap['FAULT-BRK-002'], 'exclude', 0); // ÉLIMINÉ : pédale ferme = circuit hydraulique étanche

  // Arbre 7: Batterie / Charge (symptom_id = 7)
  console.log('[Unified-KB] Seeding Symptom 7: Batterie...');
  const qBat1 = await insertQuestion(pool, sympIdMap['battery'], 1, 'Voyant en roulant',
    'Le voyant rouge batterie s\'est-il allumé sur le tableau de bord en roulant ?',
    'Si le voyant s\'allume moteur en marche, l\'alternateur ne recharge plus la batterie.',
    'Sépare une batterie simplement usée d\'un alternateur hors service.',
    'assets/icons/battery-warning.svg',
    'Avez-vous vu le pictogramme batterie rouge s\'allumer sur la route ?',
    'Observez le combiné moteur tournant.',
    'visual'
  );
  const optBt1_1 = await insertOption(pool, qBat1, 'Oui, allumé moteur tournant pendant le trajet', 'Alternateur défaillant ou courroie coupée.', 'power', 1, 1);
  const optBt1_2 = await insertOption(pool, qBat1, 'Non, le voyant s\'éteint normalement, mais la voiture peine à démarrer le matin', 'Batterie fatiguée ou cosses oxydées.', 'rotate', 0, 2);

  await insertRule(pool, qBat1, optBt1_1, faultMap['FAULT-ALT-001'], 'reinforce', 65);
  await insertRule(pool, qBat1, optBt1_1, faultMap['FAULT-BELT-001'], 'reinforce', 35);
  await insertRule(pool, qBat1, optBt1_1, faultMap['FAULT-BAT-001'], 'reduce', 30);

  await insertRule(pool, qBat1, optBt1_2, faultMap['FAULT-ALT-001'], 'exclude', 0); // ÉLIMINÉ : l'alternateur charge bien en roulant
  await insertRule(pool, qBat1, optBt1_2, faultMap['FAULT-BAT-001'], 'reinforce', 50);
  await insertRule(pool, qBat1, optBt1_2, faultMap['FAULT-BAT-002'], 'reinforce', 35);

  // Arbre 8: Problème électrique (symptom_id = 8)
  console.log('[Unified-KB] Seeding Symptom 8: Problème électrique...');
  const qEl1 = await insertQuestion(pool, sympIdMap['electric'], 1, 'Équipements touchés',
    'Combien d\'équipements ou de fonctions électriques sont en panne ?',
    'Une panne unique isolée cible un fusible, alors qu\'une porte entière cible le soufflet de faisceau.',
    'Permet de choisir le bon point de contrôle sans multimètre.',
    'assets/icons/plug.svg',
    'Est-ce un seul accessoire (lave-glace, allume-cigare) ou une porte complète ?',
    'Testez les différents boutons de bord.',
    'action'
  );
  const optEl1_1 = await insertOption(pool, qEl1, 'Un seul accessoire précis (ex: klaxon, lave-glace ou prise 12V)', 'Fusible grillé sur la boîte de protection.', 'power', 1, 1);
  const optEl1_2 = await insertOption(pool, qEl1, 'La vitre ou le verrouillage d\'une seule portière', 'Fils coupés dans le soufflet de portière.', 'rotate', 0, 2);
  const optEl1_3 = await insertOption(pool, qEl1, 'Tout le tableau de bord clignote ou s\'éteint', 'Batterie ou connexion de masse principale.', 'speaker', 0, 3);

  await insertRule(pool, qEl1, optEl1_1, faultMap['FAULT-FUS-001'], 'reinforce', 65);
  await insertRule(pool, qEl1, optEl1_1, faultMap['FAULT-WRG-001'], 'exclude', 0); // ÉLIMINÉ
  await insertRule(pool, qEl1, optEl1_1, faultMap['FAULT-BAT-001'], 'exclude', 0); // ÉLIMINÉ

  await insertRule(pool, qEl1, optEl1_2, faultMap['FAULT-WRG-001'], 'reinforce', 65);
  await insertRule(pool, qEl1, optEl1_2, faultMap['FAULT-FUS-001'], 'reduce', 25);
  await insertRule(pool, qEl1, optEl1_2, faultMap['FAULT-BAT-001'], 'exclude', 0); // ÉLIMINÉ

  await insertRule(pool, qEl1, optEl1_3, faultMap['FAULT-BAT-001'], 'reinforce', 55);
  await insertRule(pool, qEl1, optEl1_3, faultMap['FAULT-BAT-002'], 'reinforce', 45);
  await insertRule(pool, qEl1, optEl1_3, faultMap['FAULT-FUS-001'], 'exclude', 0); // ÉLIMINÉ

  // Arbre 9: Consommation excessive (symptom_id = 9)
  console.log('[Unified-KB] Seeding Symptom 9: Consommation excessive...');
  const qFuel1 = await insertQuestion(pool, sympIdMap['high_fuel'], 1, 'Pression des pneus',
    'Avez-vous vérifié la pression des 4 pneus au manomètre récemment ?',
    'Des pneus sous-gonflés augmentent de 15% la résistance au roulement et la consommation de carburant.',
    'Test rapide et gratuit à la station-service.',
    'assets/icons/tire.svg',
    'La pression a-t-elle été ajustée au cours des 3 derniers mois ?',
    'Contrôlez les 4 pneus à froid.',
    'action'
  );
  const optF1_1 = await insertOption(pool, qFuel1, 'Non, pas vérifiée depuis plus de 3 mois', 'Forte probabilité de sous-gonflage.', 'speaker', 1, 1);
  const optF1_2 = await insertOption(pool, qFuel1, 'Oui, la pression des 4 pneus est exactement à la consigne', 'Pneumatiques parfaitement gonflés.', 'rotate', 0, 2);

  await insertRule(pool, qFuel1, optF1_1, faultMap['FAULT-TYR-001'], 'reinforce', 60);
  await insertRule(pool, qFuel1, optF1_1, faultMap['FAULT-AIR-001'], 'reinforce', 15);

  await insertRule(pool, qFuel1, optF1_2, faultMap['FAULT-TYR-001'], 'exclude', 0); // ÉLIMINÉ : les pneus sont bien gonflés !
  await insertRule(pool, qFuel1, optF1_2, faultMap['FAULT-AIR-001'], 'reinforce', 45);
  await insertRule(pool, qFuel1, optF1_2, faultMap['FAULT-EGR-001'], 'reinforce', 35);
  await insertRule(pool, qFuel1, optF1_2, faultMap['FAULT-IGN-001'], 'reinforce', 30);

  const qFuel2 = await insertQuestion(pool, sympIdMap['high_fuel'], 2, 'Filtre à air',
    'Quand avez-vous remplacé le filtre à air pour la dernière fois ?',
    'Un filtre à air colmaté étouffe le moteur et force l\'injection à enrichir le mélange.',
    'Sépare une simple cartouche encrassée d\'une anomalie de vanne EGR.',
    'assets/icons/filter.svg',
    'Le filtre à air a-t-il plus de 2 ans ou plus de 30 000 km ?',
    'Consultez vos dernières factures d\'entretien.',
    'observation'
  );
  const optF2_1 = await insertOption(pool, qFuel2, 'Plus de 2 ans ou plus de 30 000 km (ou inconnu)', 'Cartouche filtrante probablement encrassée.', 'power', 1, 1);
  const optF2_2 = await insertOption(pool, qFuel2, 'Il est neuf ou changé lors de la dernière vidange récente', 'Admission d\'air propre et dégagée.', 'rotate', 0, 2);

  await insertRule(pool, qFuel2, optF2_1, faultMap['FAULT-AIR-001'], 'reinforce', 60);
  await insertRule(pool, qFuel2, optF2_1, faultMap['FAULT-EGR-001'], 'reinforce', 20);

  await insertRule(pool, qFuel2, optF2_2, faultMap['FAULT-AIR-001'], 'exclude', 0); // ÉLIMINÉ : le filtre est neuf !
  await insertRule(pool, qFuel2, optF2_2, faultMap['FAULT-EGR-001'], 'reinforce', 45);
  await insertRule(pool, qFuel2, optF2_2, faultMap['FAULT-IGN-001'], 'reinforce', 35);

  // Synchronisation avec les tables UI existantes (hypotheses, questions, question_options)
  console.log('[Unified-KB] 6. Synchronizing backward-compatible UI tables...');
  await pool.query(`
    INSERT INTO hypotheses (id, symptom_id, name, priority_badge, priority_label, order_index, description, gravity, check_action, check_type, cost_min, cost_max)
    SELECT f.id, fs.symptom_id, f.name, 
           CASE WHEN fs.is_primary = 1 THEN 'PRIORITÉ 1' ELSE 'PRIORITÉ 2' END,
           CASE WHEN fs.is_primary = 1 THEN 'Piste principale' ELSE 'À envisager' END,
           ROW_NUMBER() OVER (PARTITION BY fs.symptom_id ORDER BY fs.relevance_score DESC),
           f.description, f.gravity_label, dt.instruction, dt.test_type, f.cost_min, f.cost_max
    FROM faults f
    JOIN fault_symptoms fs ON f.id = fs.fault_id
    LEFT JOIN diagnostic_tests dt ON f.id = dt.fault_id
    ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), cost_min = VALUES(cost_min), cost_max = VALUES(cost_max)
  `);

  console.log('[Unified-KB] Unified Knowledge Base successfully seeded with deterministic rules & traceability!');
  await pool.end();
}

async function insertQuestion(pool, symptomId, stepNum, category, title, description, whyAsk, imageUrl, reformulation, testAction, testType) {
  const [res] = await pool.query(`
    INSERT INTO diagnostic_questions (symptom_id, step_num, category, title, description, why_ask, image_url, reformulation, test_action, test_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [symptomId, stepNum, category, title, description, whyAsk, imageUrl, reformulation, testAction, testType]);
  return res.insertId;
}

async function insertOption(pool, questionId, label, subtitle, icon, isDefault, orderIndex) {
  const [res] = await pool.query(`
    INSERT INTO answer_options (question_id, label, subtitle, icon, is_default, order_index)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [questionId, label, subtitle, icon, isDefault ? 1 : 0, orderIndex]);
  return res.insertId;
}

async function insertRule(pool, questionId, optionId, faultId, effect, weight, nextQuestionId = null) {
  await pool.query(`
    INSERT INTO diagnostic_rules (question_id, answer_option_id, fault_id, effect, weight, next_question_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [questionId, optionId, faultId, effect, weight, nextQuestionId]);
}

seedUnifiedKnowledgeBase().catch(err => {
  console.error('[Unified-KB] Error:', err);
  process.exit(1);
});
