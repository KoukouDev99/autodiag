/**
 * Script complet de francisation et de réparation d'encodage UTF-8 de la base de données AutoDiag.
 * - Répare toutes les corruptions d'accents ("??" / "???") sur toutes les tables.
 * - Traduit en français les 55 éléments de diagnostic_kb ainsi que symptoms (10-64),
 *   diagnostic_questions (16-125), answer_options (41-260), faults (306-329),
 *   diagnostic_tests (24-47), solutions (20-47), legacy_hypotheses, legacy_repair_guides,
 *   legacy_repair_steps et dtc_codes.
 */

const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./db');
const {
  CATEGORY_FR,
  GRAVITY_FR,
  CHECK_TYPE_FR,
  SYMPTOMS_FR,
  QUESTIONS_FR,
  OPTIONS_FR
} = require('./kb_translations_fr');
const { SOLUTIONS_FR } = require('./kb_solutions_fr');

// Traducteur technique automobile EN -> FR pour les textes génériques, guides et codes OBD2
function translateAutoEnToFr(text) {
  if (!text || typeof text !== 'string') return text;
  let s = text.trim();

  // Remplacements exacts fréquents
  const exactMap = {
    'Powertrain (Engine & Transmission)': 'Groupe motopropulseur (Moteur & Boîte)',
    'Body (Safety, Airbags, Comfort)': 'Habitacle & Carrosserie (Sécurité, Airbags, Confort)',
    'Chassis (Braking, ABS, Suspension)': 'Châssis (Freinage, ABS, Suspension)',
    'Network (CAN Bus, ECU Communication)': 'Réseau multiplexé (Bus CAN, Communication calculateurs)',
    'Urgent / Danger': 'Urgent / Danger immédiat',
    'High': 'Élevée',
    'Moderate': 'Modérée',
    'Low': 'Faible',
    'Top Suspect': 'Piste principale',
    'PRIORITY 1': 'PRIORITÉ 1',
    'PRIORITY 2': 'PRIORITÉ 2',
    'PRIORITY 3': 'PRIORITÉ 3',
    'PRIORIT?? 1': 'PRIORITÉ 1',
    'PRIORIT?? 2': 'PRIORITÉ 2',
    'PRIORIT?? 3': 'PRIORITÉ 3',
    'PRIORIT?? 4': 'PRIORITÉ 4',
    'Visual · Easy': 'Contrôle visuel · Facile',
    'Visual ?? Easy': 'Contrôle visuel · Facile',
    'Multimeter / Test · Moderate': 'Multimètre / Test · Modéré',
    'Multimeter / Test ?? Moderate': 'Multimètre / Test · Modéré',
    'Easy · Visual inspection': 'Facile · Contrôle visuel',
    'Easy ?? Visual inspection': 'Facile · Contrôle visuel',
    'Moderate · Basic hand tools': 'Modéré · Outillage standard',
    'Moderate ?? Basic hand tools': 'Modéré · Outillage standard',
    'Advanced · Professional workshop': 'Avancé · Atelier professionnel',
    'Advanced ?? Professional workshop': 'Avancé · Atelier professionnel',
    'Critical · Stop Driving': 'Critique · Arrêt immédiat conseillé',
    'Critical ?? Stop Driving': 'Critique · Arrêt immédiat conseillé',
    'High · Immediate Repair': 'Élevée · Réparation rapide requise',
    'High ?? Immediate Repair': 'Élevée · Réparation rapide requise',
    'Moderate · Inspection Required': 'Modérée · Contrôle nécessaire',
    'Moderate ?? Inspection Required': 'Modérée · Contrôle nécessaire',
    'Low · Maintenance Item': 'Faible · Entretien courant',
    'Low ?? Maintenance Item': 'Faible · Entretien courant',
    'Ignition System or Misfire': 'Système d\'allumage ou ratés de combustion',
    'Auxiliary Emissions Controls (EGR, EVAP, Cat)': 'Contrôle antipollution auxiliaire (EGR, EVAP, Catalyseur)',
    'Vehicle Speed Controls & Idle System': 'Contrôle de vitesse véhicule et régulation du ralenti',
    'Airbags & Passive Restraints (SRS)': 'Airbags et retenue passive (SRS)',
    'Manufacturer Specific Body & Electronics': 'Électronique habitacle spécifique constructeur',
    'Body System': 'Système carrosserie et habitacle',
    'ABS & Wheel Speed Sensors': 'ABS et capteurs de vitesse de roue',
    'Electronic Stability & Suspension': 'Stabilité électronique (ESP) et suspension',
    'Chassis System': 'Système châssis et liaison au sol',
    'Manufacturer Specific Chassis': 'Châssis spécifique constructeur',
    'Fuel and Air Metering': 'Dosage air / carburant et injection',
    'Computer Output Circuits (PCM / ECM)': 'Circuits de sortie calculateur moteur (PCM / ECM)',
    'Transmission Controls': 'Gestion de boîte de vitesses et transmission',
    'Powertrain System': 'Groupe motopropulseur',
    'Manufacturer Specific Powertrain': 'Groupe motopropulseur spécifique constructeur',
    'Fuel, Air & Emission Controls (SAE)': 'Dosage air/carburant et antipollution (SAE)',
    'Hybrid / Auxiliary Powertrain': 'Propulsion hybride / électrique auxiliaire',
    'CAN Bus Physical & Data Link': 'Bus de données CAN et liaison physique',
    'Lost Communication with Modules': 'Perte de communication avec les calculateurs',
    'Network Data & Sensor Signals': 'Données réseau et signaux de capteurs',
    'Network & Communication': 'Réseau multiplexé et communication',
    'Manufacturer Specific Network': 'Réseau spécifique constructeur',
    'Flashlight': 'Lampe torche',
    'Fuse puller': 'Pince à fusibles',
    'Multimeter': 'Multimètre',
    'Digital multimeter': 'Multimètre numérique',
    'Contact cleaner spray': 'Spray nettoyant contacts',
    'Floor jack': 'Cric rouleur',
    'Jack stands': 'Chandelles de sécurité',
    'Jack stand': 'Chandelle de sécurité',
    'Jack & stands': 'Cric et chandelles',
    'Wheel wrench': 'Clé de roue',
    '10mm socket': 'Douille de 10 mm',
    '10mm wrench': 'Clé plate de 10 mm',
    'Brake cleaner': 'Nettoyant freins',
    'None (Operator test)': 'Aucun outil (test au volant)',
    'Wire brush': 'Brosse métallique',
    'Clean shop rag': 'Chiffon d\'atelier propre',
    'Clean rag': 'Chiffon propre',
    'Socket set': 'Coffret de douilles',
    'Torque wrench': 'Clé dynamométrique',
    'Flat screwdriver': 'Tournevis plat',
    'Pliers': 'Pince universelle',
    'Gloves': 'Gants de protection',
    'Safety glasses': 'Lunettes de protection',
    'Inspection mirror': 'Miroir d\'inspection',
    'Mirror': 'Miroir d\'inspection',
    'Funnel': 'Entonnoir',
    'Catch pan': 'Bac de vidange',
    'Pry bar': 'Levier / démonte-pneu',
    'Helper': 'Assistant (2e personne)'
  };

  if (exactMap[s]) return exactMap[s];

  // Réparation d'encodage de devises
  s = s.replace(/\?\?\?C/g, '°C').replace(/\?\?C/g, '°C').replace(/O\?\?\?clock/g, 'heures').replace(/\?\?\?/g, '€');

  // Règles de traduction de phrases récurrentes
  const rules = [
    [/^Inspection and repair guide for (.+)$/i, 'Guide d\'inspection et de réparation : $1'],
    [/^Test de confirmation : (.+)$/i, 'Test de confirmation : $1'],
    [/^Failure in (.+?) matches observed symptoms: (.+)\.$/i, 'Une défaillance de « $1 » correspond aux symptômes observés : $2.'],
    [/Estimated repair:\s*(\d+)\s*€?\s*-\s*(\d+)\s*€?\s*\(([^)]+)\s*labor\)\.\s*DIY feasible with standard tools\./gi, 'Coût estimé : $1 € - $2 € ($3 de main-d\'œuvre). Réalisable soi-même avec un outillage standard.'],
    [/Estimated repair:\s*(\d+)\s*€?\s*-\s*(\d+)\s*€?\s*\(([^)]+)\s*labor\)\.\s*Professional workshop recommended\./gi, 'Coût estimé : $1 € - $2 € ($3 de main-d\'œuvre). Intervention en atelier professionnel recommandée.'],
    [/Estimated repair:\s*(\d+)\s*€?\s*-\s*(\d+)\s*€?\s*\(([^)]+)\s*labor\)\./gi, 'Coût estimé : $1 € - $2 € ($3 de main-d\'œuvre).'],
    [/\[HIGH\]/g, '[PRIORITÉ HAUTE]'],
    [/\[MEDIUM\]/g, '[PRIORITÉ MOYENNE]'],
    [/\[LOW\]/g, '[PRIORITÉ FAIBLE]'],
    [/\bCheck engine light on, flashing at a catalyst-damaging rate\b/gi, 'Voyant moteur allumé ou clignotant (risque pour le catalyseur)'],
    [/\bCheck engine light on\b/gi, 'Voyant moteur (MIL) allumé'],
    [/\bCheck Engine Light illuminated\b/gi, 'Voyant moteur allumé au tableau de bord'],
    [/\bWarning light or symbol related to the affected system\b/gi, 'Voyant d\'alerte allumé concernant le système affecté'],
    [/\bComfort or safety function impaired\b/gi, 'Fonction de confort ou de sécurité dégradée'],
    [/\bRough idle, jerking, vibration\b/gi, 'Ralenti instable, à-coups, vibrations'],
    [/\bLoss of power, hesitation\b/gi, 'Perte de puissance, hésitation à l\'accélération'],
    [/\bSmell of unburnt fuel, higher consumption\b/gi, 'Odeur de carburant imbrûlé, surconsommation'],
    [/\bBattery or charge warning lamp\b/gi, 'Voyant de batterie ou de charge allumé'],
    [/\bStarting problems, dim lights\b/gi, 'Démarrage difficile, éclairage faible'],
    [/\bCodes in several modules\b/gi, 'Codes défauts enregistrés dans plusieurs calculateurs'],
    [/\bReduced engine power or limp mode\b/gi, 'Puissance moteur réduite ou mode dégradé'],
    [/\bIncreased fuel consumption\b/gi, 'Augmentation de la consommation de carburant'],
    [/\bPoor acceleration or hesitation\b/gi, 'Mauvaise accélération ou trous à l\'accélération'],
    [/\bEngine stalling or rough idle\b/gi, 'Calage moteur ou ralenti irrégulier'],
    [/\bHard starting cold or hot\b/gi, 'Démarrage difficile à froid ou à chaud'],
    [/\bABS or ESP warning light on\b/gi, 'Voyant ABS ou ESP allumé'],
    [/\bAirbag \/ SRS warning light on\b/gi, 'Voyant Airbag / SRS allumé'],
    [/\bCommunication error between ECUs\b/gi, 'Erreur de communication réseau entre calculateurs'],
    // Termes OBD2 fréquents pour bilingual_title et descriptions
    [/\bRandom\/Multiple Cylinder Misfire Detected\b/gi, 'Ratés d\'allumage aléatoires ou sur plusieurs cylindres détectés'],
    [/\bCylinder (\d+) Misfire Detected\b/gi, 'Ratés d\'allumage détectés sur le cylindre $1'],
    [/\bCatalyst System Efficiency Below Threshold\b/gi, 'Efficacité du système catalytique inférieure au seuil'],
    [/\bSystem Too Lean\b/gi, 'Mélange trop pauvre'],
    [/\bSystem Too Rich\b/gi, 'Mélange trop riche'],
    [/\bSystem Voltage Low\b/gi, 'Tension du système électrique trop basse'],
    [/\bSystem Voltage High\b/gi, 'Tension du système électrique trop haute'],
    [/\bMass or Volume Air Flow\b/gi, 'Débitmètre d\'air massique ou volumique (MAF)'],
    [/\bManifold Absolute Pressure\/Barometric Pressure\b/gi, 'Capteur de pression absolue d\'admission / pression barométrique (MAP)'],
    [/\bEngine Coolant Temperature\b/gi, 'Capteur de température de liquide de refroidissement (ECT)'],
    [/\bIntake Air Temperature\b/gi, 'Capteur de température d\'air d\'admission (IAT)'],
    [/\bThrottle\/Pedal Position Sensor\/Switch\b/gi, 'Capteur / contacteur de position du papillon ou de pédale d\'accélérateur'],
    [/\bThrottle Actuator Control\b/gi, 'Commande d\'actuateur de boîtier papillon motorisé'],
    [/\bO2 Sensor Circuit\b/gi, 'Circuit de sonde Lambda (capteur d\'oxygène O2)'],
    [/\bHO2S Heater Control Circuit\b/gi, 'Circuit de commande de chauffage de sonde Lambda'],
    [/\bO2 Sensor Heater Circuit\b/gi, 'Circuit de chauffage de sonde Lambda (O2)'],
    [/\bExhaust Gas Recirculation\b/gi, 'Recirculation des gaz d\'échappement (Vanne EGR)'],
    [/\bEvaporative Emission System\b/gi, 'Système de recyclage des vapeurs de carburant (EVAP / Canister)'],
    [/\bCrankshaft Position Sensor\b/gi, 'Capteur de position de vilebrequin (PMH)'],
    [/\bCamshaft Position Sensor\b/gi, 'Capteur de position d\'arbre à cames (AAC)'],
    [/\bKnock Sensor\b/gi, 'Capteur de cliquetis'],
    [/\bVehicle Speed Sensor\b/gi, 'Capteur de vitesse du véhicule (VSS)'],
    [/\bIdle Air Control System\b/gi, 'Système de régulation d\'air de ralenti (IAC)'],
    [/\bFuel Rail\/System Pressure - Too Low\b/gi, 'Pression de rampe d\'injection de carburant trop basse'],
    [/\bFuel Rail\/System Pressure - Too High\b/gi, 'Pression de rampe d\'injection de carburant trop élevée'],
    [/\bTurbocharger\/Supercharger Boost System\b/gi, 'Système de suralimentation turbocompresseur'],
    [/\bUnderboost Condition\b/gi, 'Pression de suralimentation insuffisante'],
    [/\bOverboost Condition\b/gi, 'Suralimentation excessive (dépassement de consigne)'],
    [/\bInjector Circuit\/Open\b/gi, 'Circuit d\'injecteur ouvert'],
    [/\bGlow Plug\/Heater Circuit\b/gi, 'Circuit de bougies ou boîtier de préchauffage'],
    [/\bParticulate Trap\b/gi, 'Filtre à particules (FAP / DPF)'],
    [/\bDiesel Particulate Filter\b/gi, 'Filtre à particules Diesel (FAP)'],
    [/\bLost Communication With\b/gi, 'Perte de communication réseau avec'],
    [/\bInvalid Data Received From\b/gi, 'Données invalides reçues depuis'],
    [/\bControl Module\b/gi, 'Calculateur / Module de commande'],
    [/\bWheel Speed Sensor\b/gi, 'Capteur de vitesse de roue ABS'],
    [/\bDriver Frontal Stage (\d+) Deployment Control\b/gi, 'Commande de déclenchement airbag frontal conducteur niveau $1'],
    [/\bPassenger Frontal Stage (\d+) Deployment Control\b/gi, 'Commande de déclenchement airbag frontal passager niveau $1'],
    [/\bCircuit Malfunction\b/gi, 'Dysfonctionnement du circuit'],
    [/\bRange\/Performance\b/gi, 'Plage de mesure / Performance'],
    [/\bCircuit Low\b/gi, 'Tension de circuit trop basse (court-circuit à la masse)'],
    [/\bCircuit High\b/gi, 'Tension de circuit trop haute (court-circuit au +12V)'],
    [/\bCircuit Open\b/gi, 'Circuit électrique ouvert (coupure)'],
    [/\bCircuit Intermittent\b/gi, 'Faux contact / défaut intermittent du circuit'],
    [/\bBank 1\b/gi, 'Banc 1'],
    [/\bBank 2\b/gi, 'Banc 2'],
    [/\bSensor 1\b/gi, 'Capteur 1 (Amont)'],
    [/\bSensor 2\b/gi, 'Capteur 2 (Aval)'],
    [/\bSensor 3\b/gi, 'Capteur 3'],
    [/\bInsufficient Flow Detected\b/gi, 'Débit insuffisant détecté'],
    [/\bExcessive Flow Detected\b/gi, 'Débit excessif détecté'],
    [/\bLeak Detected \(Small Leak\)\b/gi, 'Fuite détectée (petite fuite)'],
    [/\bLeak Detected \(Large Leak\)\b/gi, 'Fuite détectée (fuite importante)'],
    [/\bIncorrect Purge Flow\b/gi, 'Débit de purge incorrect'],
    [/\bSlow Response\b/gi, 'Réponse trop lente'],
    [/\bNo Activity Detected\b/gi, 'Aucune activité détectée'],
    [/\bStuck Open\b/gi, 'Bloqué en position ouverte'],
    [/\bStuck Closed\b/gi, 'Bloqué en position fermée'],
    [/\bPerformance\/Stuck Off\b/gi, 'Performance / Bloqué fermé'],
    [/\b1 hour\b/gi, '1h00']
  ];

  for (const [regex, replacement] of rules) {
    s = s.replace(regex, replacement);
  }

  return s;
}

// Réparation générale des mots français corrompus contenant "??"
function fixCorruptedFrench(text) {
  if (!text || typeof text !== 'string') return text;
  if (!text.includes('??')) return text;

  const wordFixes = [
    ['PRIORIT??', 'PRIORITÉ'],
    ['D??marrage', 'Démarrage'],
    ['d??marre', 'démarre'],
    ['d??marrer', 'démarrer'],
    ['d??marreur', 'démarreur'],
    ['D??marreur', 'Démarreur'],
    ['d??charg??e', 'déchargée'],
    ['d??charg??', 'déchargé'],
    ['d??charge', 'décharge'],
    ['M??canique', 'Mécanique'],
    ['m??canique', 'mécanique'],
    ['??lectrique', 'Électrique'],
    ['??lectriques', 'électriques'],
    ['??lectronique', 'Électronique'],
    ['??lectroniques', 'électroniques'],
    ['??lectricit??', 'électricité'],
    ['??chappement', 'Échappement'],
    ['S??curit??', 'Sécurité'],
    ['s??curit??', 'sécurité'],
    ['s??curis??', 'sécurisé'],
    ['Fum??e', 'Fumée'],
    ['fum??e', 'fumée'],
    ['P??dale', 'Pédale'],
    ['p??dale', 'pédale'],
    ['t??moin', 'témoin'],
    ['T??moin', 'Témoin'],
    ['Contr??le', 'Contrôle'],
    ['contr??le', 'contrôle'],
    ['Contr??ler', 'Contrôler'],
    ['contr??ler', 'contrôler'],
    ['V??rifier', 'Vérifier'],
    ['v??rifier', 'vérifier'],
    ['V??rifiez', 'Vérifiez'],
    ['v??rifiez', 'vérifiez'],
    ['V??rification', 'Vérification'],
    ['v??rification', 'vérification'],
    ['R??paration', 'Réparation'],
    ['r??paration', 'réparation'],
    ['R??gulateur', 'Régulateur'],
    ['r??gulateur', 'régulateur'],
    ['sol??no??de', 'solénoïde'],
    ['Sol??no??de', 'Solénoïde'],
    ['pr??chauffage', 'préchauffage'],
    ['Pr??chauffage', 'Préchauffage'],
    ['pr??chauffer', 'préchauffer'],
    ['d??tendue', 'détendue'],
    ['encrass??e', 'encrassée'],
    ['encrass??', 'encrassé'],
    ['us??es', 'usées'],
    ['us??e', 'usée'],
    ['us??s', 'usés'],
    ['us??', 'usé'],
    ['bloqu??e', 'bloquée'],
    ['bloqu??', 'bloqué'],
    ['ferm??e', 'fermée'],
    ['ferm??', 'fermé'],
    ['arri??re', 'arrière'],
    ['Arri??re', 'Arrière'],
    ['glac??e', 'glacée'],
    ['grill??', 'grillé'],
    ['grill??e', 'grillée'],
    ['bo??te', 'boîte'],
    ['Bo??te', 'Boîte'],
    ['bo??tier', 'boîtier'],
    ['Bo??tier', 'Boîtier'],
    ['porti??re', 'portière'],
    ['porti??res', 'portières'],
    ['sectionn??', 'sectionné'],
    ['colmat??', 'colmaté'],
    ['colmat??e', 'colmatée'],
    ['étouff??', 'étouffé'],
    ['??touff??', 'étouffé'],
    ['??touffe', 'étouffe'],
    ['d??bitm??tre', 'débitmètre'],
    ['d??cal??', 'décalé'],
    ['d??cal??e', 'décalée'],
    ['??trier', 'étrier'],
    ['??changeur', 'échangeur'],
    ['??tanch??it??', 'étanchéité'],
    ['surchauff??', 'surchauffé'],
    ['piqu??es', 'piquées'],
    ['stri??e', 'striée'],
    ['calibr??', 'calibré'],
    ['calibr??e', 'calibrée'],
    ['calibr??s', 'calibrés'],
    ['surintensit??', 'surintensité'],
    ['r??p??t??es', 'répétées'],
    ['r??sistance', 'résistance'],
    ['R??sistance', 'Résistance'],
    ['for??ant', 'forçant'],
    ['r??siduelle', 'résiduelle'],
    ['sulfat??es', 'sulfatées'],
    ['al??atoire', 'aléatoire'],
    ['g??n??ratrice', 'génératrice'],
    ['g??n??re', 'génère'],
    ['n??cessaires', 'nécessaires'],
    ['n??cessaire', 'nécessaire'],
    ['allum??e', 'allumée'],
    ['allum??s', 'allumés'],
    ['allum??', 'allumé'],
    ['vid??e', 'vidée'],
    ['prolong??', 'prolongé'],
    ['verrouill??es', 'verrouillées'],
    ['prot??ger', 'protéger'],
    ['intensit??', 'intensité'],
    ['imm??diat', 'immédiat'],
    ['imm??diate', 'immédiate'],
    ['imm??diatement', 'immédiatement'],
    ['??conomique', 'économique'],
    ['rep??rer', 'repérer'],
    ['Rep??rage', 'Repérage'],
    ['rep??re', 'repère'],
    ['probl??me', 'problème'],
    ['Probl??me', 'Problème'],
    ['s\'??crasent', 's\'écrasent'],
    ['re??oit', 'reçoit'],
    ['m??lange', 'mélange'],
    ['d??gage', 'dégage'],
    ['pr??matur??e', 'prématurée'],
    ['??nergie', 'énergie'],
    ['??ge', 'âge'],
    ['oxyd??e', 'oxydée'],
    ['desserr??e', 'desserrée'],
    ['d??p??t', 'dépôt'],
    ['blanch??tre', 'blanchâtre'],
    ['verd??tre', 'verdâtre'],
    ['beige??tre', 'beigeâtre'],
    ['cr??e', 'crée'],
    ['cr??ant', 'créant'],
    ['cr??er', 'créer'],
    ['cr??meuse', 'crémeuse'],
    ['propret??', 'propreté'],
    ['fermet??', 'fermeté'],
    ['entra??ne', 'entraîne'],
    ['??couter', 'Écouter'],
    ['??coute', 'écoute'],
    ['cl??', 'clé'],
    ['Cl??', 'Clé'],
    ['cl??s', 'clés'],
    ['Cl??s', 'Clés'],
    ['arriv??e', 'arrivée'],
    ['l??ger', 'léger'],
    ['l??gers', 'légers'],
    ['??tincelle', 'étincelle'],
    ['rat??s', 'ratés'],
    ['Rat??s', 'Ratés'],
    ['rat??', 'raté'],
    ['acc??l??ration', 'accélération'],
    ['acc??l??rations', 'accélérations'],
    ['acc??l??rez', 'accélérez'],
    ['contr??le', 'contrôle'],
    ['recal??', 'recalé'],
    ['tr??s', 'très'],
    ['h??site', 'hésite'],
    ['v??hicule', 'véhicule'],
    ['V??hicule', 'Véhicule'],
    ['p??riph??rique', 'périphérique'],
    ['P??riph??riques', 'Périphériques'],
    ['arr??t', 'arrêt'],
    ['apr??s', 'après'],
    ['Apr??s', 'Après'],
    ['z??ro', 'zéro'],
    ['m??tallique', 'métallique'],
    ['m??talliques', 'métalliques'],
    ['routi??re', 'routière'],
    ['appara??t', 'apparaît'],
    ['absorb??', 'absorbé'],
    ['ch??ssis', 'châssis'],
    ['Ch??ssis', 'Châssis'],
    ['c??t??', 'côté'],
    ['r??tro', 'rétro'],
    ['r??troviseur', 'rétroviseur'],
    ['??paisse', 'épaisse'],
    ['??paisseur', 'épaisseur'],
    ['m??me', 'même'],
    ['temp??rature', 'température'],
    ['Temp??rature', 'Température'],
    ['int??rieur', 'intérieur'],
    ['allong??e', 'allongée'],
    ['??il', 'œil'],
    ['imp??rative', 'impérative'],
    ['imp??rativement', 'impérativement'],
    ['grav??e', 'gravée'],
    ['coup??', 'coupé'],
    ['coup??es', 'coupées'],
    ['coup??s', 'coupés'],
    ['s\'??teignent', 's\'éteignent'],
    ['N??GATIVE', 'NÉGATIVE'],
    ['n??gative', 'négative'],
    ['D??branchement', 'Débranchement'],
    ['d??branchez', 'débranchez'],
    ['D??branchez', 'Débranchez'],
    ['D??connectez', 'Déconnectez'],
    ['D??montage', 'Démontage'],
    ['D??vissez', 'Dévissez'],
    ['d??vissez', 'dévissez'],
    ['D??pose', 'Dépose'],
    ['D??montez', 'Démontez'],
    ['D??clipsez', 'Déclipsez'],
    ['??viter', 'éviter'],
    ['amp??rage', 'ampérage'],
    ['dilu??', 'dilué'],
    ['jusqu\'??', 'jusqu\'à'],
    ['m??tal', 'métal'],
    ['humidit??', 'humidité'],
    ['??l??vateur', 'élévateur'],
    ['dynamom??trique', 'dynamométrique'],
    ['r??servoir', 'réservoir'],
    ['D??grippant', 'Dégrippant'],
    ['efficacit??', 'efficacité'],
    ['Voltm??tre', 'Voltmètre'],
    ['A??rosol', 'Aérosol'],
    ['compl??te', 'complète'],
    ['compl??tement', 'complètement'],
    ['surfa??age', 'surfaçage'],
    ['thermor??tractable', 'thermorétractable'],
    ['num??ro', 'numéro'],
    ['sch??ma', 'schéma'],
    ['adapt??', 'adapté'],
    ['pas-??-pas', 'pas-à-pas'],
    ['kilom??tres', 'kilomètres'],
    ['vivacit??', 'vivacité'],
    ['??chauffement', 'échauffement'],
    ['??clatement', 'éclatement'],
    ['rythm??es', 'rythmées'],
    ['combin??', 'combiné'],
    ['3??me', '3ème'],
    ['d??gag??e', 'dégagée'],
    ['gripp??e', 'grippée'],
    ['braqu??es', 'braquées'],
    ['??clairez', 'éclairez'],
    ['rel??cher', 'relâcher'],
    ['??mulsion', 'émulsion'],
    ['m??lange', 'mélange'],
    ['sup??rieure', 'supérieure'],
    ['inf??rieure', 'inférieure'],
    ['ti??de', 'tiède'],
    ['br??lant', 'brûlant'],
    ['forc??', 'forcé'],
    ['l??galement', 'également'],
    ['s\'att??nue', 's\'atténue'],
    ['charg??', 'chargé'],
    ['??mettant', 'émettant'],
    ['bri??vement', 'brièvement'],
    ['accord??on', 'accordéon'],
    ['manom??tre', 'manomètre'],
    ['Manom??tre', 'Manomètre'],
    ['??tiquette', 'étiquette'],
    ['mesur??e', 'mesurée'],
    ['r??sistent', 'résistent'],
    [' ??? ', ' — '],
    [' ?? ', ' · ']
  ];

  let out = text;
  for (const [bad, good] of wordFixes) {
    out = out.split(bad).join(good);
  }
  // Si "??" isolé entre espaces (souvent "à" ou "·")
  out = out.replace(/ \?\? /g, ' à ');
  out = out.replace(/^\?\? /g, 'À ');
  out = out.replace(/\?\?/g, 'é');
  return out;
}

async function runTranslation() {
  console.log('[TRANSLATE-FR] Connexion à la base de données MySQL...');
  const pool = await initDatabase();

  // 1. Exécuter d'abord la réparation complète des 9 symptômes de base et 19 pannes via les scripts de référence
  console.log('[TRANSLATE-FR] 1/8 Restauration UTF-8 des symptômes (1-9), pannes (1-19), questions (1-15), options (1-40)...');

  // Symptômes 1-9 propres
  const coreSymptoms = [
    [1, 'no_start', 'Ne démarre pas', 'ne_demarre_pas', 'Démarrage', 'key', 'Le moteur refuse de se lancer ou tourne dans le vide au coup de clé.', 1],
    [2, 'warning_light', 'Voyant moteur allumé', 'voyant_moteur_allume', 'Moteur', 'alert', 'Témoin orange fixe ou clignotant allumé sur le tableau de bord.', 0],
    [3, 'unusual_noise', 'Bruit anormal', 'bruit_anormal', 'Mécanique', 'sound', 'Claquement, sifflement, couinement ou grondement en roulant ou à l\'arrêt.', 0],
    [4, 'exhaust_smoke', 'Fumée à l\'échappement', 'fumee_echappement', 'Échappement', 'smoke', 'Fumée blanche épaisse, noire ou bleutée sortant du pot d\'échappement.', 0],
    [5, 'overheating', 'Surchauffe moteur', 'surchauffe_moteur', 'Refroidissement', 'thermometer', 'Aiguille de température dans le rouge, voyant d\'eau ou vapeur sous le capot.', 1],
    [6, 'braking_issue', 'Problème de freinage', 'probleme_freinage', 'Sécurité', 'brakes', 'Pédale molle, dure, vibration au freinage ou distance d\'arrêt allongée.', 1],
    [7, 'battery_drain', 'Batterie qui se vide', 'batterie_se_vide', 'Électrique', 'battery', 'Batterie à plat après stationnement ou voyant batterie rouge en roulant.', 0],
    [8, 'electrical_glitch', 'Panne électrique', 'panne_electrique', 'Électrique', 'zap', 'Équipement HS (vitres, phares, fermeture, ventilation) ou fusible qui saute.', 0],
    [9, 'excess_fuel', 'Surconsommation', 'surconsommation_carburant', 'Moteur', 'fuel', 'Consommation de carburant anormalement élevée et baisse d\'autonomie.', 0]
  ];
  for (const s of coreSymptoms) {
    await pool.query(
      `UPDATE symptoms SET code=?, label=?, normalized_name=?, category=?, icon=?, description=?, is_critical=? WHERE id=?`,
      [s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[0]]
    );
  }

  // Symptômes 10-64 traduits en français
  console.log('[TRANSLATE-FR] 2/8 Traduction française des symptômes 10 à 64...');
  for (const [idStr, data] of Object.entries(SYMPTOMS_FR)) {
    const id = parseInt(idStr, 10);
    const norm = data.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    await pool.query(
      `UPDATE symptoms SET label=?, normalized_name=?, category=?, description=? WHERE id=?`,
      [data.label, norm, data.category, data.description, id]
    );
  }

  // Questions 1-15 : réparation d'encodage UTF-8
  console.log('[TRANSLATE-FR] 3/8 Traduction française des questions (1-125) et options (1-260)...');
  const [q1to15] = await pool.query(`SELECT id, category, title, description, warning_text, why_ask, reformulation, test_action FROM diagnostic_questions WHERE id <= 15`);
  for (const q of q1to15) {
    await pool.query(
      `UPDATE diagnostic_questions SET category=?, title=?, description=?, warning_text=?, why_ask=?, reformulation=?, test_action=? WHERE id=?`,
      [
        fixCorruptedFrench(q.category),
        fixCorruptedFrench(q.title),
        fixCorruptedFrench(q.description),
        fixCorruptedFrench(q.warning_text),
        fixCorruptedFrench(q.why_ask),
        fixCorruptedFrench(q.reformulation),
        fixCorruptedFrench(q.test_action),
        q.id
      ]
    );
  }

  // Questions 16-125 : traduction en français
  const [q16to125] = await pool.query(`SELECT id, symptom_id, category, title, description, warning_text FROM diagnostic_questions WHERE id >= 16`);
  for (const q of q16to125) {
    const tr = QUESTIONS_FR[q.id];
    const catFr = CATEGORY_FR[q.category] || SYMPTOMS_FR[q.symptom_id]?.category || fixCorruptedFrench(q.category);
    const titleFr = tr ? tr.title : translateAutoEnToFr(fixCorruptedFrench(q.title));
    const descFr = tr ? tr.description : translateAutoEnToFr(fixCorruptedFrench(q.description));
    const warnFr = tr ? tr.warning_text : translateAutoEnToFr(fixCorruptedFrench(q.warning_text));
    const whyAskFr = `Ce contrôle permet d'isoler l'état de l'organe concerné (${SYMPTOMS_FR[q.symptom_id]?.subcategory || catFr}) et d'écarter les fausses pistes.`;
    const reformulationFr = `Pas besoin d'outil complexe : observez simplement l'élément décrit ci-dessus et choisissez l'état qui correspond le mieux à votre véhicule.`;
    await pool.query(
      `UPDATE diagnostic_questions SET category=?, title=?, description=?, warning_text=?, why_ask=?, reformulation=?, test_action=? WHERE id=?`,
      [catFr, titleFr, descFr, warnFr, whyAskFr, reformulationFr, descFr, q.id]
    );
  }

  // Options 1-40 : réparation d'encodage UTF-8
  const [opt1to40] = await pool.query(`SELECT id, label FROM answer_options WHERE id <= 40`);
  for (const o of opt1to40) {
    await pool.query(`UPDATE answer_options SET label=? WHERE id=?`, [fixCorruptedFrench(o.label), o.id]);
  }

  // Options 41-260 : traduction en français
  for (const [idStr, tr] of Object.entries(OPTIONS_FR)) {
    const id = parseInt(idStr, 10);
    await pool.query(`UPDATE answer_options SET label=? WHERE id=?`, [tr.label, id]);
  }

  // Faults (1-19 et 302-329)
  console.log('[TRANSLATE-FR] 4/8 Traduction et nettoyage UTF-8 des pannes (faults)...');
  const [allFaults] = await pool.query(`SELECT id, name, system, category, description, gravity_label FROM faults`);
  for (const f of allFaults) {
    let nameFr = fixCorruptedFrench(f.name);
    let sysFr = fixCorruptedFrench(f.system);
    let catFr = CATEGORY_FR[f.category] || fixCorruptedFrench(f.category);
    let descFr = fixCorruptedFrench(f.description);
    let gravFr = GRAVITY_FR[f.gravity_label] || fixCorruptedFrench(f.gravity_label);

    if (descFr && descFr.startsWith('Failure in ')) {
      descFr = `Une défaillance sur « ${nameFr} » explique directement le symptôme constaté sur le véhicule et nécessite une vérification ciblée.`;
    }
    gravFr = translateAutoEnToFr(gravFr);

    await pool.query(
      `UPDATE faults SET name=?, system=?, category=?, description=?, gravity_label=? WHERE id=?`,
      [nameFr, sysFr, catFr, descFr, gravFr, f.id]
    );
  }

  // Diagnostic tests (1-47)
  console.log('[TRANSLATE-FR] 5/8 Traduction et nettoyage UTF-8 des tests de diagnostic (diagnostic_tests)...');
  const [allTests] = await pool.query(`
    SELECT dt.id, dt.fault_id, dt.title, dt.test_type, dt.instruction, dt.expected_result, dt.tools_needed, dt.safety_warning, f.name as fault_name
    FROM diagnostic_tests dt
    LEFT JOIN faults f ON f.id = dt.fault_id
  `);
  // Table de correspondance fault_id (306..329) -> symptom_id (34..64)
  const faultToSym = {
    306: 34, 307: 35, 308: 36, 309: 37, 310: 38, 311: 40, 312: 42, 313: 43,
    314: 44, 315: 45, 316: 46, 317: 47, 318: 48, 319: 49, 320: 50, 321: 55,
    322: 56, 323: 57, 324: 58, 325: 59, 326: 60, 327: 61, 328: 62, 329: 64
  };
  for (const t of allTests) {
    let titleFr = fixCorruptedFrench(t.title);
    let typeFr = CHECK_TYPE_FR[t.test_type] || fixCorruptedFrench(t.test_type);
    let instrFr = fixCorruptedFrench(t.instruction);
    let expFr = fixCorruptedFrench(t.expected_result);
    let toolsFr = fixCorruptedFrench(t.tools_needed);
    let warnFr = fixCorruptedFrench(t.safety_warning);

    if (t.fault_id >= 306 && t.fault_name) {
      titleFr = `Test de confirmation : ${fixCorruptedFrench(t.fault_name)}`;
      const symId = faultToSym[t.fault_id];
      if (symId && SYMPTOMS_FR[symId]) {
        instrFr = SYMPTOMS_FR[symId].description;
      } else {
        instrFr = translateAutoEnToFr(instrFr);
      }
    }

    await pool.query(
      `UPDATE diagnostic_tests SET title=?, test_type=?, instruction=?, expected_result=?, tools_needed=?, safety_warning=? WHERE id=?`,
      [titleFr, typeFr, instrFr, expFr, toolsFr, warnFr, t.id]
    );
  }

  // Solutions (1-47)
  console.log('[TRANSLATE-FR] 6/8 Traduction et nettoyage UTF-8 des solutions et guides (solutions)...');
  const [allSolutions] = await pool.query(`SELECT * FROM solutions`);
  for (const sol of allSolutions) {
    if (SOLUTIONS_FR[sol.id]) {
      const tr = SOLUTIONS_FR[sol.id];
      await pool.query(
        `UPDATE solutions SET title=?, subtitle=?, est_time=?, safety_warning=?, tools_needed=?, steps=?, garage_memo_tip=? WHERE id=?`,
        [
          tr.title,
          tr.subtitle,
          tr.est_time,
          tr.safety_warning,
          JSON.stringify(tr.tools_needed),
          JSON.stringify(tr.steps),
          fixCorruptedFrench(sol.garage_memo_tip) || 'Vérifiez toujours le bon serrage au couple recommandé par le constructeur.',
          sol.id
        ]
      );
    } else {
      await pool.query(
        `UPDATE solutions SET title=?, subtitle=?, est_time=?, safety_warning=?, tools_needed=?, steps=?, garage_memo_tip=? WHERE id=?`,
        [
          fixCorruptedFrench(sol.title),
          fixCorruptedFrench(sol.subtitle),
          fixCorruptedFrench(sol.est_time),
          fixCorruptedFrench(sol.safety_warning),
          fixCorruptedFrench(sol.tools_needed),
          fixCorruptedFrench(sol.steps),
          fixCorruptedFrench(sol.garage_memo_tip) || 'Demandez un devis détaillé avant toute intervention en atelier.',
          sol.id
        ]
      );
    }
  }

  // Tables legacy + diagnostic_kb
  console.log('[TRANSLATE-FR] 7/8 Mise à jour des tables legacy et diagnostic_kb...');
  try {
    const [lhRows] = await pool.query(`SELECT * FROM legacy_hypotheses`);
    for (const lh of lhRows) {
      const symTr = SYMPTOMS_FR[lh.symptom_id];
      const nameFr = symTr && lh.id >= 28 ? symTr.subcategory : translateAutoEnToFr(fixCorruptedFrench(lh.name));
      const badgeFr = translateAutoEnToFr(fixCorruptedFrench(lh.priority_badge));
      const labelFr = translateAutoEnToFr(fixCorruptedFrench(lh.priority_label));
      let descFr = fixCorruptedFrench(lh.description);
      if (descFr && descFr.startsWith('Failure in ')) {
        descFr = `Une défaillance sur « ${nameFr} » correspond aux symptômes observés (${symTr ? symTr.label : ''}).`;
      }
      const gravFr = GRAVITY_FR[lh.gravity] || translateAutoEnToFr(fixCorruptedFrench(lh.gravity));
      const checkActFr = symTr && lh.id >= 28 ? symTr.description : translateAutoEnToFr(fixCorruptedFrench(lh.check_action));
      const checkTypeFr = CHECK_TYPE_FR[lh.check_type] || translateAutoEnToFr(fixCorruptedFrench(lh.check_type));
      await pool.query(
        `UPDATE legacy_hypotheses SET name=?, priority_badge=?, priority_label=?, description=?, gravity=?, check_action=?, check_type=?, cost_currency='€' WHERE id=?`,
        [nameFr, badgeFr, labelFr, descFr, gravFr, checkActFr, checkTypeFr, lh.id]
      );
    }
  } catch (_) {}

  try {
    const [lqRows] = await pool.query(`SELECT id, category, title, description, warning_text FROM legacy_questions`);
    for (const lq of lqRows) {
      await pool.query(
        `UPDATE legacy_questions SET category=?, title=?, description=?, warning_text=? WHERE id=?`,
        [
          CATEGORY_FR[lq.category] || fixCorruptedFrench(lq.category),
          translateAutoEnToFr(fixCorruptedFrench(lq.title)),
          translateAutoEnToFr(fixCorruptedFrench(lq.description)),
          translateAutoEnToFr(fixCorruptedFrench(lq.warning_text)),
          lq.id
        ]
      );
    }
    const [lqoRows] = await pool.query(`SELECT id, title, subtitle FROM legacy_question_options`);
    for (const lqo of lqoRows) {
      await pool.query(
        `UPDATE legacy_question_options SET title=?, subtitle=? WHERE id=?`,
        [
          translateAutoEnToFr(fixCorruptedFrench(lqo.title)),
          translateAutoEnToFr(fixCorruptedFrench(lqo.subtitle)),
          lqo.id
        ]
      );
    }
  } catch (_) {}

  try {
    const [lrgRows] = await pool.query(`SELECT * FROM legacy_repair_guides`);
    for (const g of lrgRows) {
      let toolsArr = [];
      try { toolsArr = JSON.parse(g.tools_needed || '[]'); } catch (_) {}
      const toolsFr = JSON.stringify(toolsArr.map(t => translateAutoEnToFr(fixCorruptedFrench(t))));
      await pool.query(
        `UPDATE legacy_repair_guides SET title=?, subtitle=?, difficulty=?, est_time=?, safety_warning=?, tools_needed=? WHERE id=?`,
        [
          translateAutoEnToFr(fixCorruptedFrench(g.title)),
          translateAutoEnToFr(fixCorruptedFrench(g.subtitle)),
          CHECK_TYPE_FR[g.difficulty] || translateAutoEnToFr(fixCorruptedFrench(g.difficulty)),
          translateAutoEnToFr(fixCorruptedFrench(g.est_time)),
          translateAutoEnToFr(fixCorruptedFrench(g.safety_warning)),
          toolsFr,
          g.id
        ]
      );
    }
    const [lrsRows] = await pool.query(`SELECT * FROM legacy_repair_steps`);
    for (const s of lrsRows) {
      await pool.query(
        `UPDATE legacy_repair_steps SET title=?, time_est=?, description=?, subtext=?, caution_warning=? WHERE id=?`,
        [
          translateAutoEnToFr(fixCorruptedFrench(s.title)),
          translateAutoEnToFr(fixCorruptedFrench(s.time_est)),
          translateAutoEnToFr(fixCorruptedFrench(s.description)),
          translateAutoEnToFr(fixCorruptedFrench(s.subtext)),
          translateAutoEnToFr(fixCorruptedFrench(s.caution_warning)),
          s.id
        ]
      );
    }
  } catch (_) {}

  // Mise à jour de diagnostic_kb en base et dans diagnostic_kb.json
  try {
    const kbPath = path.join(__dirname, 'diagnostic_kb.json');
    if (fs.existsSync(kbPath)) {
      const kbItems = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
      let qCursor = 16;
      let optCursor = 41;
      for (let i = 0; i < kbItems.length; i++) {
        const item = kbItems[i];
        const symId = i + 10;
        const symFr = SYMPTOMS_FR[symId];
        if (symFr) {
          item.category = symFr.category;
          item.subcategory = symFr.subcategory;
          item.symptoms = [symFr.label, ...(item.symptoms || []).slice(1).map(s => translateAutoEnToFr(s))];
          item.check_action = symFr.description;
        }
        item.gravity = GRAVITY_FR[item.gravity] || translateAutoEnToFr(item.gravity);
        item.priority_badge = 'PRIORITÉ 1';
        item.priority_label = 'Piste principale';
        item.cost_currency = '€';
        item.check_type = CHECK_TYPE_FR[item.check_type] || translateAutoEnToFr(item.check_type);
        if ( QUESTIONS_FR[qCursor] && QUESTIONS_FR[qCursor].warning_text ) {
          item.safety_warning = QUESTIONS_FR[qCursor].warning_text;
        } else {
          item.safety_warning = translateAutoEnToFr(item.safety_warning);
        }

        if (Array.isArray(item.diagnosis_steps)) {
          for (const step of item.diagnosis_steps) {
            const qTr = QUESTIONS_FR[qCursor];
            if (qTr) {
              step.step = qTr.title;
              step.title = qTr.title;
              step.description = qTr.description;
              step.warning = qTr.warning_text;
            }
            qCursor++;
            if (Array.isArray(step.results)) {
              for (const resOpt of step.results) {
                const oTr = OPTIONS_FR[optCursor];
                if (oTr) {
                  resOpt.label = oTr.label;
                  resOpt.explanation = oTr.subtitle;
                  resOpt.recommended_action = oTr.subtitle;
                }
                optCursor++;
              }
            }
          }
        }

        if (item.repair_guide) {
          item.repair_guide.title = translateAutoEnToFr(item.repair_guide.title);
          item.repair_guide.difficulty = CHECK_TYPE_FR[item.repair_guide.difficulty] || translateAutoEnToFr(item.repair_guide.difficulty);
          item.repair_guide.est_time = translateAutoEnToFr(item.repair_guide.est_time);
          item.repair_guide.safety_warning = translateAutoEnToFr(item.repair_guide.safety_warning);
          if (Array.isArray(item.repair_guide.tools_needed)) {
            item.repair_guide.tools_needed = item.repair_guide.tools_needed.map(t => translateAutoEnToFr(t));
          }
        }

        await pool.query(
          `UPDATE diagnostic_kb SET category=?, subcategory=?, symptoms=?, gravity=?, priority_badge=?, priority_label=?, cost_currency='€', check_type=?, check_action=?, safety_warning=?, diagnosis_steps=?, repair_guide=? WHERE id=?`,
          [
            item.category,
            item.subcategory,
            JSON.stringify(item.symptoms),
            item.gravity,
            item.priority_badge,
            item.priority_label,
            item.check_type,
            item.check_action,
            item.safety_warning,
            JSON.stringify(item.diagnosis_steps),
            JSON.stringify(item.repair_guide),
            item.id
          ]
        );
      }
      fs.writeFileSync(kbPath, JSON.stringify(kbItems, null, 2), 'utf8');
      console.log('[TRANSLATE-FR] Fichier diagnostic_kb.json et table diagnostic_kb mis à jour en français.');
    }
  } catch (e) {
    console.warn('[TRANSLATE-FR] Avertissement diagnostic_kb:', e.message);
  }

  // 8. Mise à jour de dtc_codes (systèmes, urgences, conseils garage, titres bilingues FR, et 6 codes phares)
  console.log('[TRANSLATE-FR] 8/8 Francisation de la table dtc_codes (12 412 codes OBD2)...');

  // Mise à jour SQL groupée rapide pour system, urgency, subsystem et garage_advice
  await pool.query(`
    UPDATE dtc_codes
    SET
      system = CASE system
        WHEN 'Powertrain (Engine & Transmission)' THEN 'Groupe motopropulseur (Moteur & Boîte)'
        WHEN 'Body (Safety, Airbags, Comfort)' THEN 'Habitacle & Carrosserie (Sécurité, Airbags, Confort)'
        WHEN 'Chassis (Braking, ABS, Suspension)' THEN 'Châssis (Freinage, ABS, Suspension)'
        WHEN 'Network (CAN Bus, ECU Communication)' THEN 'Réseau multiplexé (Bus CAN, Communication calculateurs)'
        ELSE system
      END,
      urgency = CASE urgency
        WHEN 'Urgent / Danger' THEN 'Urgent / Danger immédiat'
        WHEN 'High' THEN 'Élevée'
        WHEN 'Moderate' THEN 'Modérée'
        WHEN 'Low' THEN 'Faible'
        ELSE urgency
      END,
      garage_advice = REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(garage_advice, '???', '€'),
            'Estimated repair:', 'Coût estimé :'
          ),
          'DIY feasible with standard tools.', 'Réalisable soi-même avec un outillage standard.'
        ),
        'Professional workshop recommended.', 'Intervention en atelier professionnel recommandée.'
      ),
      garage_advice = REPLACE(garage_advice, 'labor)', 'de main-d''œuvre)')
  `);

  // Enrichir bilingual_title avec la clé "fr" sur tous les codes DTC par lots
  const [dtcRows] = await pool.query(`SELECT id, code, title, bilingual_title, symptoms FROM dtc_codes`);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < dtcRows.length; i++) {
      const r = dtcRows[i];
      let bt = {};
      try { bt = typeof r.bilingual_title === 'string' ? JSON.parse(r.bilingual_title) : (r.bilingual_title || {}); } catch (_) {}
      const enTitle = bt.en || r.title || r.code;
      if (!bt.fr) {
        bt.fr = translateAutoEnToFr(fixCorruptedFrench(enTitle));
      } else {
        bt.fr = fixCorruptedFrench(bt.fr);
      }

      let symArr = [];
      try { symArr = typeof r.symptoms === 'string' ? JSON.parse(r.symptoms) : (r.symptoms || []); } catch (_) {}
      const symFr = symArr.map(s => translateAutoEnToFr(fixCorruptedFrench(s)));

      await conn.query(
        `UPDATE dtc_codes SET title=?, bilingual_title=?, symptoms=? WHERE id=?`,
        [bt.fr, JSON.stringify(bt), JSON.stringify(symFr), r.id]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  // Mettre à jour en français complet les codes DTC les plus recherchés (P0300, P0420, P0171, P0562, P0100, P0401, B0001, B0002)
  const popularDtcFr = [
    {
      code: 'P0300',
      title: 'Ratés d\'allumage aléatoires ou sur plusieurs cylindres détectés',
      system: 'Groupe motopropulseur (Moteur & Boîte)',
      description: 'Le calculateur moteur détecte que des ratés de combustion se produisent de manière aléatoire sur plusieurs cylindres via les variations de vitesse du vilebrequin. Si le voyant moteur clignote, du carburant imbrûlé risque de détruire le catalyseur.',
      possible_causes: JSON.stringify([
        'Bougies d\'allumage usées ou bobines d\'allumage défaillantes [PRIORITÉ HAUTE]',
        'Prise d\'air à l\'admission (durite de dépression, joint de collecteur) [PRIORITÉ HAUTE]',
        'Pression de carburant insuffisante ou injecteurs encrassés [PRIORITÉ MOYENNE]',
        'Perte de compression mécanique ou décalage de distribution [PRIORITÉ FAIBLE]'
      ]),
      symptoms: JSON.stringify([
        'Voyant moteur allumé ou clignotant',
        'Ralenti instable, secousses et vibrations',
        'Perte de puissance et trous à l\'accélération',
        'Odeur d\'essence à l\'échappement et surconsommation'
      ]),
      urgency: 'Urgent / Danger immédiat',
      garage_advice: 'Coût estimé : 60 € - 450 € (0.5h - 2.5h de main-d\'œuvre). Évitez les fortes accélérations si le voyant clignote.',
      bilingual_title: JSON.stringify({ fr: 'Ratés d\'allumage aléatoires ou sur plusieurs cylindres détectés', en: 'Random/Multiple Cylinder Misfire Detected' })
    },
    {
      code: 'P0420',
      title: 'Efficacité du système catalytique inférieure au seuil (Banc 1)',
      system: 'Groupe motopropulseur (Moteur & Boîte)',
      description: 'La sonde lambda aval (après catalyseur) mesure une teneur en oxygène trop proche de la sonde amont, indiquant que le pot catalytique ne stocke plus suffisamment l\'oxygène pour dépolluer les gaz d\'échappement.',
      possible_causes: JSON.stringify([
        'Pot catalytique saturé, vieilli ou endommagé par des ratés d\'allumage [PRIORITÉ HAUTE]',
        'Sonde lambda aval (Capteur 2) lente ou défectueuse [PRIORITÉ MOYENNE]',
        'Fuite sur la ligne d\'échappement avant ou autour du catalyseur [PRIORITÉ MOYENNE]',
        'Consommation d\'huile ou de liquide de refroidissement empoisonnant le catalyseur [PRIORITÉ FAIBLE]'
      ]),
      symptoms: JSON.stringify([
        'Voyant moteur (MIL) allumé fixe',
        'Odeur de soufre (œuf pourri) à l\'échappement',
        'Refus au contrôle technique antipollution',
        'Perte de puissance à haut régime si le catalyseur est bouché'
      ]),
      urgency: 'Élevée',
      garage_advice: 'Coût estimé : 120 € - 950 € (1h - 3h de main-d\'œuvre). Vérifiez d\'abord l\'étanchéité de l\'échappement et la sonde lambda aval avant de remplacer le catalyseur.',
      bilingual_title: JSON.stringify({ fr: 'Efficacité du système catalytique inférieure au seuil (Banc 1)', en: 'Catalyst System Efficiency Below Threshold Bank 1' })
    },
    {
      code: 'P0171',
      title: 'Système d\'injection trop pauvre (Banc 1)',
      system: 'Groupe motopropulseur (Moteur & Boîte)',
      description: 'Le mélange air/carburant contient trop d\'air ou pas assez de carburant. Le calculateur a atteint sa limite maximale d\'enrichissement (+25%) sans parvenir à rétablir la richesse idéale.',
      possible_causes: JSON.stringify([
        'Prise d\'air après le débitmètre (durite d\'admission fendue, reniflard PCV) [PRIORITÉ HAUTE]',
        'Débitmètre d\'air massique (MAF) encrassé [PRIORITÉ HAUTE]',
        'Pression de carburant faible (pompe de gavage ou filtre à carburant colmaté) [PRIORITÉ MOYENNE]',
        'Sonde lambda amont défaillante ou fuite au collecteur d\'échappement [PRIORITÉ FAIBLE]'
      ]),
      symptoms: JSON.stringify([
        'Voyant moteur allumé',
        'Ralenti irrégulier ou trop élevé',
        'Hésitations à l\'accélération',
        'Démarrage parfois difficile'
      ]),
      urgency: 'Modérée',
      garage_advice: 'Coût estimé : 30 € - 350 € (0.5h - 2h de main-d\'œuvre). Commencez par inspecter les durites d\'air et nettoyer le débitmètre MAF.',
      bilingual_title: JSON.stringify({ fr: 'Système d\'injection trop pauvre (Banc 1)', en: 'System Too Lean Bank 1' })
    },
    {
      code: 'P0562',
      title: 'Tension du système électrique trop basse',
      system: 'Groupe motopropulseur (Moteur & Boîte)',
      description: 'Le calculateur détecte une tension d\'alimentation inférieure à 11V (souvent sous 10V) moteur tournant, signe que l\'alternateur ou la batterie ne maintient plus la tension nominale de 14V.',
      possible_causes: JSON.stringify([
        'Alternateur ou régulateur de tension hors service [PRIORITÉ HAUTE]',
        'Batterie 12V en fin de vie ou élément en court-circuit [PRIORITÉ HAUTE]',
        'Cosses de batterie oxydées ou tresse de masse desserrée [PRIORITÉ MOYENNE]',
        'Courroie d\'accessoires détendue ou rompue [PRIORITÉ MOYENNE]'
      ]),
      symptoms: JSON.stringify([
        'Voyant batterie rouge allumé au tableau de bord',
        'Démarrage lent et éclairage des phares qui faiblit',
        'Apparition de voyants multiples (ABS, ESP, Direction)'
      ]),
      urgency: 'Modérée',
      garage_advice: 'Coût estimé : 20 € - 580 € (0.3h - 2h de main-d\'œuvre). Testez immédiatement la tension aux bornes de la batterie au multimètre.',
      bilingual_title: JSON.stringify({ fr: 'Tension du système électrique trop basse', en: 'System Voltage Low' })
    },
    {
      code: 'P0100',
      title: 'Dysfonctionnement du circuit de débitmètre d\'air massique (MAF)',
      system: 'Groupe motopropulseur (Moteur & Boîte)',
      description: 'Le signal électrique provenant du capteur de débit d\'air (MAF) est absent ou hors tolérance, obligeant le calculateur à fonctionner en mode dégradé.',
      possible_causes: JSON.stringify([
        'Fil chaud du débitmètre MAF encrassé par la poussière ou les vapeurs d\'huile [PRIORITÉ HAUTE]',
        'Connecteur du débitmètre débranché ou fil coupé [PRIORITÉ MOYENNE]',
        'Prise d\'air importante sur le conduit d\'admission [PRIORITÉ MOYENNE]'
      ]),
      symptoms: JSON.stringify([
        'Voyant moteur allumé',
        'Perte de puissance et mode dégradé',
        'Fumée noire et surconsommation de carburant'
      ]),
      urgency: 'Modérée',
      garage_advice: 'Coût estimé : 25 € - 280 € (0.5h - 1h de main-d\'œuvre). Réalisable soi-même avec un nettoyant spécifique pour débitmètre.',
      bilingual_title: JSON.stringify({ fr: 'Dysfonctionnement du circuit de débitmètre d\'air massique (MAF)', en: 'Mass or Volume Air Flow Circuit Malfunction' })
    },
    {
      code: 'P0401',
      title: 'Débit de recirculation des gaz d\'échappement (EGR) insuffisant',
      system: 'Groupe motopropulseur (Moteur & Boîte)',
      description: 'Le calculateur constate que la quantité de gaz d\'échappement recyclés vers l\'admission est trop faible lorsque la vanne EGR est commandée à l\'ouverture.',
      possible_causes: JSON.stringify([
        'Vanne EGR ou conduits bouchés par la suie et la calamine [PRIORITÉ HAUTE]',
        'Électrovanne de commande ou capteur de recopie EGR défaillant [PRIORITÉ MOYENNE]',
        'Durite de dépression de commande EGR percée ou débranchée [PRIORITÉ MOYENNE]'
      ]),
      symptoms: JSON.stringify([
        'Voyant moteur / antipollution allumé',
        'Perte de puissance et à-coups entre 1500 et 2200 tr/min',
        'Fumée noire à l\'accélération'
      ]),
      urgency: 'Modérée',
      garage_advice: 'Coût estimé : 80 € - 420 € (1h - 2.5h de main-d\'œuvre). Un démontage et nettoyage de la vanne EGR suffit souvent à résoudre le défaut.',
      bilingual_title: JSON.stringify({ fr: 'Débit de recirculation des gaz d\'échappement (EGR) insuffisant', en: 'Exhaust Gas Recirculation Flow Insufficient Detected' })
    }
  ];

  for (const d of popularDtcFr) {
    await pool.query(
      `UPDATE dtc_codes SET title=?, system=?, description=?, possible_causes=?, symptoms=?, urgency=?, garage_advice=?, bilingual_title=? WHERE code=?`,
      [d.title, d.system, d.description, d.possible_causes, d.symptoms, d.urgency, d.garage_advice, d.bilingual_title, d.code]
    );
  }

  console.log('[TRANSLATE-FR] Toutes les tables ont été traduites et nettoyées avec succès !');
  process.exit(0);
}

runTranslation().catch(err => {
  console.error('[TRANSLATE-FR ERROR]', err);
  process.exit(1);
});
