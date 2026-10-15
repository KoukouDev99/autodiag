const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autodiag'
};

const SYMPTOMS_DATA = [
  // 1. Démarrage impossible
  {
    symptom_id: 1,
    hypotheses: [
      {
        id: 1,
        name: 'Batterie faible ou déchargée',
        priority_badge: 'PRIORITÉ 1',
        priority_label: 'Piste principale',
        order_index: 1,
        description: 'La batterie ne stocke plus assez d\'énergie électrique pour entraîner le démarreur et alimenter les calculateurs.',
        gravity: 'Immobilisation temporaire · Risque mécanique nul',
        check_action: 'Observer l\'intensité des phares au coup de clé et vérifier l\'âge de la batterie (> 4 ans).',
        check_type: 'Observation visuelle sans outil',
        cost_min: 80,
        cost_max: 200
      },
      {
        id: 2,
        name: 'Connexion de batterie oxydée ou desserrée',
        priority_badge: 'PRIORITÉ 2',
        priority_label: 'À envisager',
        order_index: 2,
        description: 'Un dépôt blanchâtre ou une cosse mal serrée empêche le passage du fort courant de démarrage, même si la batterie est bonne.',
        gravity: 'Faux contact · Risque de coupure subite',
        check_action: 'Vérifier visuellement la propreté et la fermeté des cosses sur les bornes de batterie.',
        check_type: 'Contrôle visuel',
        cost_min: 20,
        cost_max: 60
      },
      {
        id: 3,
        name: 'Démarreur ou solénoïde en défaut',
        priority_badge: 'PRIORITÉ 3',
        priority_label: 'Autre possibilité',
        order_index: 3,
        description: 'Le moteur électrique qui lance le moteur thermique est bloqué, usé (charbons) ou son relais interne ne commute plus.',
        gravity: 'Panne mécanique / électrique · Remplacement requis',
        check_action: 'Écouter si un claquement sec se produit sous le capot avec des phares qui restent bien vifs.',
        check_type: 'Contrôle auditif',
        cost_min: 250,
        cost_max: 550
      },
      {
        id: 4,
        name: 'Pompe à carburant ou alimentation essence/diesel',
        priority_badge: 'PRIORITÉ 4',
        priority_label: 'Si rotation normale',
        order_index: 4,
        description: 'Le moteur est entraîné à bonne vitesse par le démarreur mais ne s\'enflamme pas par manque d\'arrivée de carburant.',
        gravity: 'Absence d\'injection · Remorquage nécessaire',
        check_action: 'Mettre le contact : écouter si le léger sifflement (bzz) de gavage s\'active à l\'arrière.',
        check_type: 'Test d\'écoute',
        cost_min: 180,
        cost_max: 420
      }
    ],
    questions: [
      {
        step_num: 1,
        total_steps: 4,
        category: 'Bruit au démarrage',
        title: 'Que se passe-t-il exactement quand vous tournez la clé ?',
        description: 'Concentrez-vous sur le bruit sous le capot au moment précis de l\'actionnement.',
        warning_text: 'Inutile de forcer le démarreur plus de 5 secondes pour ne pas le griller.',
        why_ask: 'Cette question isole immédiatement si le démarreur tourne, claque ou reste totalement muet.',
        image_url: 'assets/icons/ignition-key.svg',
        reformulation: 'Entendez-vous le moteur tourner rapidement dans le vide, ou entendez-vous un simple clic / silence total ?',
        test_action: 'Tournez la clé une seule fois en tendant l\'oreille.',
        test_type: 'observation',
        options: [
          { title: 'Des clics rapides, mais rien ne tourne', subtitle: 'Bruit de mitraillette ou simple clac.', icon: 'speaker', is_default: 1, weights: { "1": 25, "2": 15, "3": 10, "4": -20 } },
          { title: 'Le moteur tourne normalement mais ne part pas', subtitle: 'Bruit de vroum-vroum habituel sans allumage.', icon: 'rotate', is_default: 0, weights: { "1": -25, "2": -20, "3": -30, "4": 30 } },
          { title: 'Silence absolu, rien ne bouge', subtitle: 'Aucun son, pas même un clic mécanique.', icon: 'power', is_default: 0, weights: { "1": 20, "2": 25, "3": 15, "4": -10 } },
          { title: 'Je ne sais pas', subtitle: 'Pas certain du son entendu.', icon: 'help', is_default: 0, weights: { "1": 5 } }
        ]
      },
      {
        step_num: 2,
        total_steps: 4,
        category: 'Test des lumières',
        title: 'Les phares ou le tableau de bord faiblissent-ils au coup de clé ?',
        description: 'C\'est le test révélateur le plus fiable pour distinguer la batterie du démarreur sans multimètre.',
        warning_text: 'Ne touchez pas aux câbles de batterie pendant cette observation.',
        why_ask: 'Si les feux s\'éteignent, la batterie s\'effondre sous la charge. S\'ils restent vifs, la batterie est bonne et le démarreur est suspect.',
        image_url: 'assets/icons/headlights.svg',
        reformulation: 'Allumez vos phares ou le plafonnier : la lumière devient-elle toute jaune ou s\'éteint-elle quand vous essayez de démarrer ?',
        test_action: 'Allumez les phares ou le plafonnier avant de tourner la clé.',
        test_type: 'action',
        options: [
          { title: 'Oui, les lumières s\'éteignent presque', subtitle: 'Effondrement brutal de la tension.', icon: 'power', is_default: 1, weights: { "1": 35, "2": 10, "3": -20, "4": -25 } },
          { title: 'Non, les lumières restent fortes et vives', subtitle: 'L\'alimentation électrique principale semble vaillante.', icon: 'zap', is_default: 0, weights: { "1": -30, "2": -15, "3": 35, "4": 20 } },
          { title: 'Je ne sais pas', subtitle: 'Pas pu regarder les phares.', icon: 'help', is_default: 0, weights: { "1": 5 } }
        ]
      },
      {
        step_num: 3,
        total_steps: 4,
        category: 'Historique récent',
        title: 'Quand la voiture a-t-elle roulé pour la dernière fois ?',
        description: 'Le délai d\'arrêt permet de comprendre si la batterie a pu se décharger d\'elle-même.',
        warning_text: 'Une batterie déchargée en moins de 12 heures trahit souvent un consommateur oublié ou un alternateur HS.',
        why_ask: 'Une immobilisation de plus d\'une semaine vide naturellement les batteries vieillissantes.',
        image_url: 'assets/icons/calendar-clock.svg',
        reformulation: 'Le véhicule roulait-il encore hier normalement, ou était-il stationné depuis plusieurs jours / semaines ?',
        test_action: 'Rappelez-vous du dernier trajet effectué.',
        test_type: 'historique',
        options: [
          { title: 'Elle roulait hier ou il y a moins de 24h', subtitle: 'Panne subite après un arrêt normal.', icon: 'calendar', is_default: 0, weights: { "1": 5, "2": 15, "3": 25, "4": 15 } },
          { title: 'Garée depuis plusieurs jours ou semaines', subtitle: 'Décharge lente au stationnement.', icon: 'clock', is_default: 1, weights: { "1": 30, "2": 10, "3": -10, "4": -5 } },
          { title: 'Période de grand froid ou gelée récente', subtitle: 'Le froid réduit de 40% la puissance batterie.', icon: 'snowflake', is_default: 0, weights: { "1": 35, "2": 5, "3": -5, "4": -10 } },
          { title: 'Je ne sais pas', subtitle: 'Date de dernier roulage incertaine.', icon: 'help', is_default: 0, weights: { "1": 5 } }
        ]
      }
    ]
  },

  // 2. Voyant moteur (Check Engine)
  {
    symptom_id: 2,
    hypotheses: [
      {
        id: 5,
        name: 'Sonde lambda ou capteur de dépollution en dérive',
        priority_badge: 'PRIORITÉ 1',
        priority_label: 'Piste principale',
        order_index: 1,
        description: 'La sonde mesure mal l\'oxygène dans l\'échappement. Le moteur passe en mélange de sécurité sans panne mécanique grave immédiate.',
        gravity: 'Pollution accrue · Surconsommation · Contrôle technique recalé',
        check_action: 'Vérifier si le voyant est fixe sans perte brutale de puissance.',
        check_type: 'Contrôle visuel du voyant',
        cost_min: 110,
        cost_max: 260
      },
      {
        id: 6,
        name: 'Vanne EGR encrassée par la suie (Diesel / Injection directe)',
        priority_badge: 'PRIORITÉ 2',
        priority_label: 'À envisager',
        order_index: 2,
        description: 'La suie d\'échappement bloque la soupape de recyclage des gaz, provoquant des à-coups à l\'accélération et de la fumée.',
        gravity: 'Encrassement progressif · Perte de puissance',
        check_action: 'Ressentir si la voiture hésite ou broute entre 1 500 et 2 200 tr/min.',
        check_type: 'Ressenti à la conduite',
        cost_min: 160,
        cost_max: 420
      },
      {
        id: 7,
        name: 'Bougies d\'allumage ou bobines défaillantes (Ratés)',
        priority_badge: 'PRIORITÉ 3',
        priority_label: 'Si tremblements',
        order_index: 3,
        description: 'Un cylindre n\'enflamme pas le carburant. Le voyant moteur clignote souvent lors des accélérations franches.',
        gravity: 'Risque pour le catalyseur si le voyant clignote',
        check_action: 'Noter si le moteur tremble au ralenti comme s\'il tournait sur 3 cylindres.',
        check_type: 'Observation des vibrations',
        cost_min: 70,
        cost_max: 220
      }
    ],
    questions: [
      {
        step_num: 1,
        total_steps: 3,
        category: 'Comportement du voyant',
        title: 'Le voyant moteur est-il allumé en continu ou clignote-t-il ?',
        description: 'Un voyant qui clignote signale des ratés de combustion dangereux pour le pot catalytique.',
        warning_text: 'Si le voyant clignote, évitez d\'accélérer fort et ne roulez pas longtemps.',
        why_ask: 'Le clignotement distingue immédiatement une anomalie d\'allumage urgente d\'un simple défaut de capteur de pollution.',
        image_url: 'assets/icons/check-engine.svg',
        reformulation: 'Regardez le témoin orange en forme de moteur : reste-t-il allumé fixement ou pulse-t-il par intermittence ?',
        test_action: 'Regardez fixement le symbole moteur orange au tableau de bord.',
        test_type: 'observation',
        options: [
          { title: 'Il est allumé en FIXE', subtitle: 'Lumière continue sans clignotement.', icon: 'zap', is_default: 1, weights: { "5": 25, "6": 20, "7": -15 } },
          { title: 'Il CLIGNOTE en roulant ou à l\'accélération', subtitle: 'Indique des ratés d\'allumage en cours.', icon: 'power', is_default: 0, weights: { "5": -20, "6": -15, "7": 40 } },
          { title: 'Je ne sais pas', subtitle: 'Pas fait attention au mode d\'allumage.', icon: 'help', is_default: 0, weights: { "5": 5 } }
        ]
      },
      {
        step_num: 2,
        total_steps: 3,
        category: 'Ressenti à la conduite',
        title: 'Ressentez-vous une perte de puissance ou des à-coups ?',
        description: 'Un moteur qui broute ou plafonne à 80 km/h est souvent bridé en mode dégradé par sécurité.',
        warning_text: 'Ne tentez pas de dépassement difficile si la voiture manque de reprise.',
        why_ask: 'Si la voiture roule parfaitement malgré le voyant, la panne est quasi toujours un capteur de pollution ou sonde lambda.',
        image_url: 'assets/icons/car-dashboard.svg',
        reformulation: 'La voiture roule-t-elle comme d\'habitude, ou manque-t-elle de reprise avec des trous à l\'accélération ?',
        test_action: 'Accélérez modérément sur le plat et notez la fluidité.',
        test_type: 'action',
        options: [
          { title: 'Elle roule tout à fait normalement', subtitle: 'Aucun changement sensible au volant.', icon: 'rotate', is_default: 1, weights: { "5": 30, "6": -15, "7": -25 } },
          { title: 'Perte de puissance et trous à l\'accélération', subtitle: 'La voiture a du mal à monter dans les tours.', icon: 'speaker', is_default: 0, weights: { "5": -15, "6": 30, "7": 25 } },
          { title: 'Le moteur vibre fortement au ralenti', subtitle: 'Tremblements anormaux ressentis dans le siège.', icon: 'power', is_default: 0, weights: { "5": -20, "6": 10, "7": 35 } }
        ]
      }
    ]
  },

  // 3. Bruit inhabituel
  {
    symptom_id: 3,
    hypotheses: [
      {
        id: 8,
        name: 'Courroie d\'accessoires détendue ou usée (Sifflement aigu)',
        priority_badge: 'PRIORITÉ 1',
        priority_label: 'Piste principale',
        order_index: 1,
        description: 'La courroie qui entraîne l\'alternateur patine sur ses poulies, produisant un couinement strident typique au démarrage ou par temps humide.',
        gravity: 'Usure périphérique · Risque d\'arrêt de charge alternateur',
        check_action: 'Noter si le cri strident cesse après 30 secondes ou lors d\'un coup de gaz.',
        check_type: 'Test d\'écoute au démarrage',
        cost_min: 50,
        cost_max: 140
      },
      {
        id: 9,
        name: 'Plaquettes de frein en fin de vie (Grincement au freinage)',
        priority_badge: 'PRIORITÉ 2',
        priority_label: 'Si bruit au freinage',
        order_index: 2,
        description: 'La garniture est consommée. Le témoin d\'usure métallique frotte directement sur le disque de frein.',
        gravity: 'Sécurité routière · Risque de rayer le disque métallique',
        check_action: 'Vérifier si le bruit apparaît uniquement lorsque vous posez le pied sur le frein.',
        check_type: 'Action sur la pédale',
        cost_min: 90,
        cost_max: 220
      },
      {
        id: 10,
        name: 'Roulement de roue usé (Gronderie sourde / bourdonnement)',
        priority_badge: 'PRIORITÉ 3',
        priority_label: 'Si bruit avec la vitesse',
        order_index: 3,
        description: 'Les billes du roulement sont piquées par l\'usure. Le bruit ressemble à un bruit d\'avion à réaction qui s\'intensifie avec la vitesse.',
        gravity: 'Usure châssis · Jeu mécanique dans le moyeu',
        check_action: 'Écouter si le grondement varie en virage (s\'amplifie en appui d\'un côté).',
        check_type: 'Test en virage léger',
        cost_min: 130,
        cost_max: 280
      }
    ],
    questions: [
      {
        step_num: 1,
        total_steps: 2,
        category: 'Nature du son',
        title: 'À quoi ressemble le bruit inhabituel ?',
        description: 'La tonalité du bruit est la signature exacte de la pièce défaillante.',
        warning_text: 'Si le bruit s\'accompagne d\'une vibration dans la direction, réduisez votre vitesse.',
        why_ask: 'Un sifflement aigu pointe vers une courroie, un grincement métallique vers les freins, un ronronnement sourd vers un roulement.',
        image_url: 'assets/icons/noise-ear.svg',
        reformulation: 'Entendez-vous un couinement très aigu, un frottement métallique ou un bourdonnement sourd ?',
        test_action: 'Baissez la vitre côté bruit pour bien identifier sa fréquence.',
        test_type: 'observation',
        options: [
          { title: 'Couinement très aigu / sifflement strident', subtitle: 'Typique au démarrage à froid ou quand il pleut.', icon: 'speaker', is_default: 1, weights: { "8": 40, "9": -20, "10": -30 } },
          { title: 'Grincement métallique quand je freine', subtitle: 'Frottement fer contre fer au ralentissement.', icon: 'rotate', is_default: 0, weights: { "8": -25, "9": 45, "10": -15 } },
          { title: 'Gronderie sourde qui augmente avec la vitesse', subtitle: 'Comme un bruit de roulement de train ou d\'avion.', icon: 'zap', is_default: 0, weights: { "8": -30, "9": -10, "10": 45 } },
          { title: 'Je ne sais pas', subtitle: 'Bruit difficile à décrire.', icon: 'help', is_default: 0, weights: { "8": 5 } }
        ]
      },
      {
        step_num: 2,
        total_steps: 2,
        category: 'Circonstance d\'apparition',
        title: 'À quel moment précis entendez-vous ce bruit ?',
        description: 'Identifier les conditions d\'apparition isole la pièce mécanique en contrainte.',
        warning_text: 'Effectuez ce test sur une route dégagée et sans danger.',
        why_ask: 'Une courroie couine au ralenti à froid, les plaquettes grincent à la pression du frein, un roulement gronde en appui dans les virages.',
        image_url: 'assets/icons/steering-wheel.svg',
        reformulation: 'Entendez-vous le bruit en posant le pied sur le frein, en tournant le volant, ou dès le démarrage au point mort ?',
        test_action: 'Faites un court freinage puis un virage léger à vitesse modérée.',
        test_type: 'action',
        options: [
          { title: 'Uniquement en appuyant sur la pédale de frein', subtitle: 'Le bruit cesse dès qu\'on relâche la pédale.', icon: 'rotate', is_default: 0, weights: { "8": -30, "9": 50, "10": -20 } },
          { title: 'En roulant vite, et s\'amplifie dans les virages', subtitle: 'Le son change de tonalité selon l\'appui de la roue.', icon: 'zap', is_default: 0, weights: { "8": -30, "9": -20, "10": 50 } },
          { title: 'Au démarrage à froid ou au ralenti sans rouler', subtitle: 'Le bruit s\'entend même avec le véhicule à l\'arrêt complet.', icon: 'power', is_default: 1, weights: { "8": 45, "9": -30, "10": -30 } },
          { title: 'Je ne sais pas', subtitle: 'Pas certain des conditions d\'apparition.', icon: 'help', is_default: 0, weights: { "8": 5 } }
        ]
      }
    ]
  },

  // 4. Fumée à l'échappement
  {
    symptom_id: 4,
    hypotheses: [
      {
        id: 11,
        name: 'Vanne EGR ou injection calaminée (Fumée noire)',
        priority_badge: 'PRIORITÉ 1',
        priority_label: 'Si fumée noire',
        order_index: 1,
        description: 'Trop de carburant pour pas assez d\'air (manque d\'oxygène). Les imbrûlés forment de la suie noire dense à l\'accélération.',
        gravity: 'Encrassement du filtre à particules (FAP) · Surconsommation',
        check_action: 'Observer si la fumée noire sort principalement lors d\'une franche accélération.',
        check_type: 'Observation rétro',
        cost_min: 150,
        cost_max: 380
      },
      {
        id: 12,
        name: 'Fuite de liquide de refroidissement / Joint de culasse (Fumée blanche)',
        priority_badge: 'PRIORITÉ 2',
        priority_label: 'Si fumée blanche épaisse',
        order_index: 2,
        description: 'De l\'eau s\'infiltre dans les cylindres et ressort en vapeur blanche persistante, avec une odeur sucrée caractéristique.',
        gravity: 'Urgence moteur majeure · Risque de surchauffe et casse',
        check_action: 'Contrôler le niveau de liquide de refroidissement moteur froid.',
        check_type: 'Contrôle visuel du bocal',
        cost_min: 500,
        cost_max: 1400
      },
      {
        id: 13,
        name: 'Usure interne moteur / Segments ou turbo (Fumée bleue)',
        priority_badge: 'PRIORITÉ 3',
        priority_label: 'Si fumée bleue / odeur huile',
        order_index: 3,
        description: 'L\'huile moteur pénètre dans la chambre de combustion et brûle avec le carburant, générant une fumée bleutée et une odeur d\'huile brûlée.',
        gravity: 'Baisse rapide du niveau d\'huile · Surveillance requise',
        check_action: 'Vérifier la jauge d\'huile moteur sur sol plat.',
        check_type: 'Contrôle de jauge',
        cost_min: 350,
        cost_max: 1100
      }
    ],
    questions: [
      {
        step_num: 1,
        total_steps: 2,
        category: 'Couleur de fumée',
        title: 'De quelle couleur est la fumée qui sort de l\'échappement ?',
        description: 'La couleur est le diagnostic absolu en mécanique thermique.',
        warning_text: 'Si la fumée blanche sent le brûlé avec une surchauffe, arrêtez immédiatement le moteur.',
        why_ask: 'Le noir = problème d\'air/carburant. Le blanc épais = eau ou liquide. Le bleu = huile moteur qui brûle.',
        image_url: 'assets/icons/exhaust-smoke.svg',
        reformulation: 'Regardez dans le rétroviseur : la fumée est-elle noire comme de la suie, blanche comme un nuage de vapeur, ou bleutée ?',
        test_action: 'Faites tourner le moteur au ralenti et observez la sortie du pot.',
        test_type: 'observation',
        options: [
          { title: 'Fumée NOIRE épaisse à l\'accélération', subtitle: 'Particules de suie de carburant imbrûlé.', icon: 'smoke', is_default: 1, weights: { "11": 45, "12": -30, "13": -20 } },
          { title: 'Fumée BLANCHE dense et persistante même à chaud', subtitle: 'Vapeur épaisse avec niveau d\'eau qui baisse.', icon: 'smoke', is_default: 0, weights: { "11": -25, "12": 50, "13": -20 } },
          { title: 'Fumée BLEUTÉE avec odeur d\'huile brûlée', subtitle: 'Indique une consommation anormale d\'huile moteur.', icon: 'smoke', is_default: 0, weights: { "11": -20, "12": -20, "13": 50 } },
          { title: 'Je ne sais pas', subtitle: 'Couleur incertaine.', icon: 'help', is_default: 0, weights: { "11": 5 } }
        ]
      },
      {
        step_num: 2,
        total_steps: 2,
        category: 'Contrôle des fluides',
        title: 'Avez-vous remarqué une baisse anormale d\'un niveau sous le capot ?',
        description: 'La fumée est la conséquence directe de la combustion d\'un fluide qui s\'infiltre dans le moteur.',
        warning_text: 'Ne dévissez jamais un bocal de liquide sur un moteur chaud.',
        why_ask: 'Si le liquide de refroidissement baisse, c\'est un joint de culasse. Si l\'huile baisse, c\'est le turbo ou la segmentation.',
        image_url: 'assets/icons/fluid-level.svg',
        reformulation: 'Avez-vous dû rajouter récemment de l\'huile moteur ou du liquide de refroidissement ?',
        test_action: 'Moteur froid sur sol plat, jetez un œil au bocal transparent et à la jauge d\'huile.',
        test_type: 'observation',
        options: [
          { title: 'Le niveau de liquide de refroidissement baisse anormalement', subtitle: 'Obligé d\'en rajouter dans le vase d\'expansion.', icon: 'fluid', is_default: 0, weights: { "11": -25, "12": 50, "13": -20 } },
          { title: 'Le niveau d\'huile moteur baisse et nécessite des appoints fréquents', subtitle: 'La jauge descend rapidement sous le repère MAX.', icon: 'oil', is_default: 0, weights: { "11": -15, "12": -20, "13": 50 } },
          { title: 'Aucun niveau ne baisse, mais grosse perte de puissance', subtitle: 'Les niveaux sont stables, moteur étouffé.', icon: 'power', is_default: 1, weights: { "11": 45, "12": -25, "13": -15 } },
          { title: 'Je ne sais pas', subtitle: 'Pas vérifié les niveaux récemment.', icon: 'help', is_default: 0, weights: { "11": 5 } }
        ]
      }
    ]
  },

  // 5. Surchauffe moteur
  {
    symptom_id: 5,
    hypotheses: [
      {
        id: 14,
        name: 'Niveau de liquide de refroidissement bas ou fuite durite',
        priority_badge: 'PRIORITÉ 1',
        priority_label: 'Piste principale',
        order_index: 1,
        description: 'Le circuit manque de fluide caloporteur pour évacuer les calories du bloc moteur vers le radiateur.',
        gravity: 'Urgence critique · Ne pas rouler avec l\'aiguille dans le rouge',
        check_action: 'Moteur froid uniquement, vérifier si le bocal transparent est sous le repère MINI.',
        check_type: 'Observation visuelle moteur FROID',
        cost_min: 40,
        cost_max: 130
      },
      {
        id: 15,
        name: 'Thermostat (Calorstat) bloqué en position fermée',
        priority_badge: 'PRIORITÉ 2',
        priority_label: 'À envisager',
        order_index: 2,
        description: 'La vanne thermostatique reste fermée : le liquide tourne en boucle dans le moteur sans jamais passer par le radiateur de refroidissement.',
        gravity: 'Surchauffe rapide en quelques minutes',
        check_action: 'Constater si la surchauffe intervient même en roulant sur voie rapide.',
        check_type: 'Observation de température',
        cost_min: 90,
        cost_max: 220
      },
      {
        id: 16,
        name: 'Motoventilateur de radiateur en panne (Surchauffe en ville)',
        priority_badge: 'PRIORITÉ 3',
        priority_label: 'Si surchauffe dans les bouchons',
        order_index: 3,
        description: 'Le ventilateur ne se déclenche pas à l\'arrêt ou à basse vitesse quand il n\'y a pas d\'air naturel pour traverser la calandre.',
        gravity: 'Surchauffe à l\'arrêt · Température normale sur autoroute',
        check_action: 'Écouter si le ventilateur tourne à grand bruit quand l\'aiguille monte.',
        check_type: 'Test d\'écoute à l\'arrêt',
        cost_min: 120,
        cost_max: 290
      }
    ],
    questions: [
      {
        step_num: 1,
        total_steps: 2,
        category: 'Contexte de surchauffe',
        title: 'Quand la température monte-t-elle anormalement ?',
        description: 'La vitesse du véhicule permet d\'identifier si le ventilateur ou le thermostat est en cause.',
        warning_text: '⚠️ Ne touchez JAMAIS au bouchon de liquide de refroidissement si le moteur est chaud (risque de brûlure grave par projection).',
        why_ask: 'Si la voiture surchauffe en ville mais refroidit sur autoroute, le motoventilateur est la cause n°1.',
        image_url: 'assets/icons/engine-temp.svg',
        reformulation: 'Le moteur chauffe-t-il dans les bouchons et aux feux rouges, ou chauffe-t-il même en roulant vite sur l\'autoroute ?',
        test_action: 'Notez le comportement de l\'aiguille de température selon votre vitesse.',
        test_type: 'contexte',
        options: [
          { title: 'Surtout au ralenti, en ville ou dans les bouchons', subtitle: 'La température redescend dès qu\'on roule vite.', icon: 'clock', is_default: 1, weights: { "14": 15, "15": -10, "16": 45 } },
          { title: 'Tout le temps, même en roulant sur voie rapide', subtitle: 'Le radiateur ne reçoit plus de liquide chaud.', icon: 'rotate', is_default: 0, weights: { "14": 25, "15": 40, "16": -20 } },
          { title: 'Je ne sais pas', subtitle: 'Pas observé la corrélation.', icon: 'help', is_default: 0, weights: { "14": 5 } }
        ]
      },
      {
        step_num: 2,
        total_steps: 2,
        category: 'Ventilation & Chauffage',
        title: 'Le motoventilateur s\'enclenche-t-il et le chauffage souffle-t-il du chaud ?',
        description: 'Le chauffage habitacle et le ventilateur électrique sont les deux témoins directs de la circulation du liquide.',
        warning_text: 'Si de la fumée blanche sort de la calandre, coupez le moteur.',
        why_ask: 'Si le chauffage souffle du froid malgré un moteur brûlant, il n\'y a plus assez de liquide ou le calorstat bloque le circuit.',
        image_url: 'assets/icons/ac-fan.svg',
        reformulation: 'Allumez le chauffage dans l\'habitacle : l\'air sort-il très chaud, et entendez-vous le ventilateur tourner sous le capot ?',
        test_action: 'Mettez le chauffage sur chaud à fond au ralenti et observez.',
        test_type: 'action',
        options: [
          { title: 'Le ventilateur ne tourne pas du tout sous le capot', subtitle: 'Silence total devant la calandre malgré la chaleur.', icon: 'fan', is_default: 0, weights: { "14": 15, "15": -15, "16": 50 } },
          { title: 'Le chauffage souffle tiède/froid et l\'aiguille reste dans le rouge', subtitle: 'Le fluide ne circule plus dans le radiateur de chauffage.', icon: 'temp', is_default: 1, weights: { "14": 35, "15": 45, "16": -20 } },
          { title: 'Le ventilateur tourne à fond mais la température ne baisse pas', subtitle: 'Ventilateur fonctionnel, mais manque d\'eau ou bouchon.', icon: 'power', is_default: 0, weights: { "14": 45, "15": 30, "16": -25 } },
          { title: 'Je ne sais pas', subtitle: 'Pas testé le ventilateur ni le chauffage.', icon: 'help', is_default: 0, weights: { "14": 5 } }
        ]
      }
    ]
  },

  // 6. Freinage
  {
    symptom_id: 6,
    hypotheses: [
      {
        id: 17,
        name: 'Plaquettes de frein usées au témoin',
        priority_badge: 'PRIORITÉ 1',
        priority_label: 'Piste principale',
        order_index: 1,
        description: 'La garniture de friction est presque à zéro. Risque imminent de détériorer les disques en acier.',
        gravity: 'Sécurité primaire · Distance de freinage allongée',
        check_action: 'Vérifier l\'épaisseur visible à travers les ouvertures de la jante.',
        check_type: 'Coup d\'œil jante',
        cost_min: 90,
        cost_max: 180
      },
      {
        id: 18,
        name: 'Air ou humidité dans le liquide de frein (Pédale molle)',
        priority_badge: 'PRIORITÉ 2',
        priority_label: 'Si pédale spongieuse',
        order_index: 2,
        description: 'Le liquide de frein a bouilli ou s\'est chargé d\'eau avec les années. La bulle de gaz est compressible et la pédale s\'enfonce anormalement.',
        gravity: 'Danger critique · Purge impérative',
        check_action: 'Pomper 3 fois sur la pédale à l\'arrêt : durcit-elle ?',
        check_type: 'Test au pied',
        cost_min: 60,
        cost_max: 130
      },
      {
        id: 19,
        name: 'Capteur de vitesse de roue ABS encrassé ou défaillant',
        priority_badge: 'PRIORITÉ 3',
        priority_label: 'Si voyant ABS allumé',
        order_index: 3,
        description: 'Le calculateur ne lit plus la vitesse d\'une roue et désactive l\'antiblocage d\'urgence par sécurité.',
        gravity: 'Freinage classique conservé · Antiblocage inactif',
        check_action: 'Vérifier si le témoin ABS reste allumé au tableau de bord.',
        check_type: 'Contrôle voyant',
        cost_min: 80,
        cost_max: 190
      }
    ],
    questions: [
      {
        step_num: 1,
        total_steps: 2,
        category: 'Ressenti à la pédale',
        title: 'Que ressentez-vous sous le pied quand vous appuyez sur le frein ?',
        description: 'Le toucher de pédale révèle immédiatement l\'état hydraulique du système.',
        warning_text: '⚠️ Si la pédale descend jusqu\'au plancher sans freiner, ne prenez en aucun cas la route.',
        why_ask: 'Une pédale spongieuse indique un problème de liquide/air. Un grincement avec pédale dure indique une usure mécanique des plaquettes.',
        image_url: 'assets/icons/brake-pedal.svg',
        reformulation: 'La pédale est-elle normale et ferme, ou est-elle molle comme une éponge qui s\'enfonce trop bas ?',
        test_action: 'Appuyez fermement sur la pédale à l\'arrêt moteur tournant.',
        test_type: 'action',
        options: [
          { title: 'La pédale est ferme, mais ça grince ou vibre', subtitle: 'Comportement hydraulique normal, usure mécanique.', icon: 'rotate', is_default: 1, weights: { "17": 35, "18": -30, "19": 10 } },
          { title: 'La pédale est molle et s\'enfonce très bas', subtitle: 'Sensation spongieuse anormale.', icon: 'power', is_default: 0, weights: { "17": -15, "18": 45, "19": -10 } },
          { title: 'Le voyant ABS est allumé en permanence', subtitle: 'Le voyant orange reste actif en roulant.', icon: 'zap', is_default: 0, weights: { "17": 5, "18": -10, "19": 40 } },
          { title: 'Je ne sais pas', subtitle: 'Ressenti incertain.', icon: 'help', is_default: 0, weights: { "17": 5 } }
        ]
      },
      {
        step_num: 2,
        total_steps: 2,
        category: 'Comportement dynamique',
        title: 'La voiture freine-t-elle bien droit ou tire-t-elle de côté ?',
        description: 'Un déséquilibre de freinage trahit un étrier grippé ou une usure asymétrique.',
        warning_text: 'Ne lâchez jamais complètement le volant lors d\'un freinage.',
        why_ask: 'Si la voiture tire de côté avec grincement, les plaquettes sont à la ferraille. Si la pédale s\'enfonce, c\'est une fuite de liquide.',
        image_url: 'assets/icons/road-lane.svg',
        reformulation: 'Sur route plate et dégagée, le volant veut-il tourner tout seul vers la gauche ou la droite quand vous ralentissez ?',
        test_action: 'Freinez en ligne droite à 50 km/h en tenant légèrement le volant.',
        test_type: 'action',
        options: [
          { title: 'Elle freine droit avec un bruit métallique aigu', subtitle: 'Frottement fer contre fer clairement audible.', icon: 'speaker', is_default: 1, weights: { "17": 45, "18": -25, "19": -10 } },
          { title: 'Elle freine droit mais la pédale s\'enfonce lentement', subtitle: 'Obligé d\'appuyer plus loin pour ralentir.', icon: 'pedal', is_default: 0, weights: { "17": -10, "18": 45, "19": -10 } },
          { title: 'Des à-coups dans la pédale sans bruit métallique', subtitle: 'Pulsations sous le pied, voyant ABS actif.', icon: 'zap', is_default: 0, weights: { "17": -15, "18": -10, "19": 45 } },
          { title: 'Je ne sais pas', subtitle: 'Pas fait attention à la trajectoire.', icon: 'help', is_default: 0, weights: { "17": 5 } }
        ]
      }
    ]
  },

  // 7. Batterie & Électrique
  {
    symptom_id: 7,
    hypotheses: [
      {
        id: 20,
        name: 'Batterie en fin de vie chimique (> 4 ans)',
        priority_badge: 'PRIORITÉ 1',
        priority_label: 'Piste principale',
        order_index: 1,
        description: 'Les plaques de plomb sont sulfatées et ne retiennent plus la charge résiduelle.',
        gravity: 'Panne aléatoire au premier coup de froid',
        check_action: 'Vérifier la date de fabrication gravée sur le boîtier.',
        check_type: 'Lecture de date',
        cost_min: 90,
        cost_max: 220
      },
      {
        id: 21,
        name: 'Alternateur hors service (Régulateur ou charbons)',
        priority_badge: 'PRIORITÉ 2',
        priority_label: 'Si voyant batterie en roulant',
        order_index: 2,
        description: 'La génératrice ne fournit plus les 14 Volts nécessaires pour recharger la batterie et alimenter les phares et calculateurs.',
        gravity: 'Panne d\'électricité totale en moins de 30 minutes de route',
        check_action: 'Noter si le témoin rouge de batterie s\'allume pendant que le moteur tourne.',
        check_type: 'Observation du voyant batterie',
        cost_min: 280,
        cost_max: 580
      },
      {
        id: 22,
        name: 'Consommateur parasite à l\'arrêt (Fuite de courant)',
        priority_badge: 'PRIORITÉ 3',
        priority_label: 'Si décharge rapide à l\'arrêt',
        order_index: 3,
        description: 'Une ampoule de coffre ou de boîte à gants reste allumée, ou un boîtier électronique ne se met pas en veille.',
        gravity: 'Batterie vidée à chaque stationnement prolongé',
        check_action: 'Vérifier que rien ne reste allumé dans l\'habitacle une fois les portes verrouillées.',
        check_type: 'Vérification visuelle de nuit',
        cost_min: 50,
        cost_max: 150
      }
    ],
    questions: [
      {
        step_num: 1,
        total_steps: 2,
        category: 'Témoin batterie',
        title: 'Le voyant rouge de batterie s\'est-il allumé pendant que vous rouliez ?',
        description: 'Le voyant batterie allumé moteur tournant signifie que l\'alternateur ne charge plus.',
        warning_text: 'Si le voyant batterie s\'allume en roulant, coupez immédiatement la clim et la radio pour économiser l\'électricité restante.',
        why_ask: 'Ce voyant permet de trancher avec 95% de certitude entre une batterie morte et un alternateur HS.',
        image_url: 'assets/icons/battery-red.svg',
        reformulation: 'Avez-vous vu le symbole de batterie rouge s\'allumer sur le tableau de bord alors que vous étiez en train de rouler ?',
        test_action: 'Observez si un symbole de batterie rouge s\'affiche avec le moteur en marche.',
        test_type: 'observation',
        options: [
          { title: 'Oui, le voyant rouge s\'est allumé en roulant', subtitle: 'L\'alternateur ne recharge plus la voiture.', icon: 'zap', is_default: 0, weights: { "20": -15, "21": 45, "22": -10 } },
          { title: 'Non, le voyant ne s\'est jamais allumé en roulant', subtitle: 'La panne survient uniquement au repos.', icon: 'rotate', is_default: 1, weights: { "20": 30, "21": -30, "22": 25 } },
          { title: 'Je ne sais pas', subtitle: 'Pas prêté attention au voyant.', icon: 'help', is_default: 0, weights: { "20": 5 } }
        ]
      },
      {
        step_num: 2,
        total_steps: 2,
        category: 'Âge & Décharge',
        title: 'Quel est l\'âge de la batterie et comment la panne est-elle arrivée ?',
        description: 'La durée de vie moyenne d\'une batterie de démarrage est de 4 à 5 ans.',
        warning_text: 'Ne mettez pas d\'objets métalliques en contact avec les bornes.',
        why_ask: 'Une batterie de plus de 4 ans qui lâche au froid est usée chimiquement. Si elle a 1 an et se vide à l\'arrêt, c\'est un consommateur parasite.',
        image_url: 'assets/icons/battery-age.svg',
        reformulation: 'Votre batterie a-t-elle plus de 4 ans, ou s\'est-elle vidée subitement après avoir laissé la voiture garée quelques jours ?',
        test_action: 'Consultez la date gravée sur la borne ou la facture de remplacement.',
        test_type: 'historique',
        options: [
          { title: 'Batterie âgée de plus de 4 ans (ou d\'origine)', subtitle: 'Elle a fait son temps et ne tient plus la charge.', icon: 'clock', is_default: 1, weights: { "20": 45, "21": -10, "22": 10 } },
          { title: 'Batterie récente (< 2 ans) vidée après 2 à 4 jours de repos', subtitle: 'Un équipement électrique a pompé l\'énergie à l\'arrêt.', icon: 'calendar', is_default: 0, weights: { "20": -20, "21": 10, "22": 45 } },
          { title: 'La panne est survenue subitement en roulant', subtitle: 'Tous les voyants se sont affolés d\'un coup.', icon: 'zap', is_default: 0, weights: { "20": -15, "21": 50, "22": -20 } },
          { title: 'Je ne sais pas', subtitle: 'Âge de la batterie inconnu.', icon: 'help', is_default: 0, weights: { "20": 5 } }
        ]
      }
    ]
  },

  // 8. Électrique divers (vitres, phares, verrouillage)
  {
    symptom_id: 8,
    hypotheses: [
      {
        id: 23,
        name: 'Fusible de protection grillé sur le circuit',
        priority_badge: 'PRIORITÉ 1',
        priority_label: 'Piste principale',
        order_index: 1,
        description: 'La languette calibrée a fondu pour protéger le faisceau d\'un pic d\'intensité.',
        gravity: 'Panne simple · Remplacement immédiat et économique',
        check_action: 'Consulter le manuel de bord pour repérer le fusible et inspecter son filament.',
        check_type: 'Contrôle de fusible',
        cost_min: 5,
        cost_max: 25
      },
      {
        id: 24,
        name: 'Faisceau coupé dans le soufflet de portière / hayon',
        priority_badge: 'PRIORITÉ 2',
        priority_label: 'Si problème de vitre ou coffre',
        order_index: 2,
        description: 'À force d\'ouvrir et fermer les portières, les fils de cuivre s\'écrasent et finissent par se sectionner.',
        gravity: 'Faux contact intermittent · Réparation de faisceau',
        check_action: 'Remuer doucement le caoutchouc noir entre la portière et la carrosserie.',
        check_type: 'Test de manipulation',
        cost_min: 60,
        cost_max: 180
      }
    ],
    questions: [
      {
        step_num: 1,
        total_steps: 2,
        category: 'Étendue de la panne',
        title: 'Est-ce un seul équipement qui ne fonctionne plus, ou plusieurs à la fois ?',
        description: 'Un seul équipement = moteur ou ampoule. Plusieurs d\'un coup = fusible ou relais commun.',
        warning_text: 'Ne remplacez jamais un fusible par un modèle d\'ampérage supérieur (risque d\'incendie).',
        why_ask: 'Isole le point de défaillance entre le consommateur terminal et la boîte à fusibles.',
        image_url: 'assets/icons/fuse-box.svg',
        reformulation: 'Est-ce par exemple une seule vitre qui est bloquée, ou toutes les vitres et la fermeture ensemble ?',
        test_action: 'Testez les boutons voisins pour voir ce qui réagit.',
        test_type: 'observation',
        options: [
          { title: 'Plusieurs équipements se sont arrêtés ensemble', subtitle: 'Ex: lève-vitre + rétroviseurs + fermeture d\'un coup.', icon: 'power', is_default: 1, weights: { "23": 45, "24": 15 } },
          { title: 'Un seul équipement précis est en panne', subtitle: 'Ex: uniquement la vitre conducteur.', icon: 'rotate', is_default: 0, weights: { "23": 10, "24": 40 } },
          { title: 'Je ne sais pas', subtitle: 'Pas testé les autres équipements.', icon: 'help', is_default: 0, weights: { "23": 5 } }
        ]
      },
      {
        step_num: 2,
        total_steps: 2,
        category: 'Comportement mécanique',
        title: 'Le problème change-t-il quand vous ouvrez ou bougez la portière ?',
        description: 'Les fils dans le soufflet en caoutchouc noir se rompent avec le temps.',
        warning_text: 'Ne tirez pas violemment sur le soufflet.',
        why_ask: 'Si bouger la portière rétablit brièvement le contact, le faisceau est coupé. Sinon c\'est le fusible.',
        image_url: 'assets/icons/car-door.svg',
        reformulation: 'L\'équipement refonctionne-t-il par intermittence quand vous claquez ou bougez la portière ?',
        test_action: 'Actionnez le bouton tout en ouvrant et fermant doucement la porte.',
        test_type: 'action',
        options: [
          { title: 'Oui, ça refonctionne parfois selon la position de la porte', subtitle: 'Faux contact intermittent caractéristique.', icon: 'rotate', is_default: 0, weights: { "23": -25, "24": 50 } },
          { title: 'Non, c\'est mort en continu dans toutes les positions', subtitle: 'Alimentation coupée net, aucun signe de vie.', icon: 'power', is_default: 1, weights: { "23": 45, "24": -10 } },
          { title: 'Je ne sais pas', subtitle: 'Pas testé en bougeant la portière.', icon: 'help', is_default: 0, weights: { "23": 5 } }
        ]
      }
    ]
  },

  // 9. Consommation excessive / Manque de reprise
  {
    symptom_id: 9,
    hypotheses: [
      {
        id: 25,
        name: 'Filtre à air très encrassé ou étouffé',
        priority_badge: 'PRIORITÉ 1',
        priority_label: 'Piste principale',
        order_index: 1,
        description: 'Le moteur étouffe par manque d\'air pur et compense en injectant plus de carburant pour maintenir la vitesse.',
        gravity: 'Perte de rendement progressif · Surconsommation de 10 à 20%',
        check_action: 'Ouvrir la boîte à air pour vérifier la noirceur du filtre en papier.',
        check_type: 'Contrôle visuel facile',
        cost_min: 20,
        cost_max: 50
      },
      {
        id: 26,
        name: 'Sonde lambda ou débitmètre d\'air décalé',
        priority_badge: 'PRIORITÉ 2',
        priority_label: 'À envisager',
        order_index: 2,
        description: 'Le calculateur reçoit une fausse mesure de masse d\'air et enrichit excessivement le mélange en permanence.',
        gravity: 'Encrassement de la chambre de combustion · Pollution',
        check_action: 'Observer si la sortie du pot est très noire de suie et si une odeur d\'essence se dégage à l\'arrêt.',
        check_type: 'Observation olfactive',
        cost_min: 120,
        cost_max: 280
      },
      {
        id: 27,
        name: 'Sous-gonflage des pneus ou étrier de frein qui frotte',
        priority_badge: 'PRIORITÉ 3',
        priority_label: 'Cause mécanique externe',
        order_index: 3,
        description: 'Une résistance anormale au roulement force le moteur à fournir un effort continu bien plus important.',
        gravity: 'Usure prématurée des gommes · Chauffement de la jante',
        check_action: 'Vérifier la pression des 4 pneus et toucher les jantes après un trajet pour repérer une chaleur anormale.',
        check_type: 'Contrôle thermique des jantes',
        cost_min: 0,
        cost_max: 120
      }
    ],
    questions: [
      {
        step_num: 1,
        total_steps: 2,
        category: 'Dernier entretien',
        title: 'À quand remonte le dernier changement du filtre à air ou la révision ?',
        description: 'Un filtre à air non remplacé depuis plus de 2 ans s\'obstrue irrémédiablement de poussières et feuilles.',
        warning_text: 'Vérifiez toujours la pression des pneus une fois par mois.',
        why_ask: 'Un filtre à air vieux de plus de 30 000 km est la cause n°1 de surconsommation sans panne électronique.',
        image_url: 'assets/icons/air-filter.svg',
        reformulation: 'Savez-vous si la dernière révision date de moins d\'un an ou de beaucoup plus longtemps ?',
        test_action: 'Consultez la facture de la dernière vidange.',
        test_type: 'historique',
        options: [
          { title: 'Plus de 2 ans ou plus de 30 000 km (ou inconnu)', subtitle: 'L\'entretien des filtres est ancien.', icon: 'clock', is_default: 1, weights: { "25": 45, "26": 10, "27": 10 } },
          { title: 'Récent (moins d\'un an, révision à jour)', subtitle: 'Les filtres sont neufs ou propres.', icon: 'calendar', is_default: 0, weights: { "25": -30, "26": 35, "27": 25 } },
          { title: 'Je ne sais pas', subtitle: 'Pas d\'historique précis sous la main.', icon: 'help', is_default: 0, weights: { "25": 10 } }
        ]
      },
      {
        step_num: 2,
        total_steps: 2,
        category: 'Comportement routier',
        title: 'Ressentez-vous une résistance au roulement ou des à-coups moteur ?',
        description: 'Distinguer une cause mécanique extérieure (pneus sous-gonflés, étrier) d\'une cause de régulation moteur (sonde lambda, filtre).',
        warning_text: 'Faites l\'appoint de pression à froid dans une station de gonflage.',
        why_ask: 'Si la voiture semble freinée toute seule sur le plat, ce sont les pneus ou freins. Si le moteur a des trous d\'accélération, c\'est la sonde.',
        image_url: 'assets/icons/car-tire.svg',
        reformulation: 'La voiture avance-t-elle librement au point mort, ou semble-t-elle freinée et lourde à emmener ?',
        test_action: 'Après avoir roulé, touchez prudemment le centre des jantes pour repérer une chaleur anormale.',
        test_type: 'action',
        options: [
          { title: 'La voiture semble lourde à avancer, pression des pneus non faite', subtitle: 'Résistance anormale au roulement sur le plat.', icon: 'tire', is_default: 0, weights: { "25": -15, "26": -20, "27": 50 } },
          { title: 'Le moteur a des à-coups ou une odeur d\'essence à l\'arrêt', subtitle: 'Mélange air/carburant trop riche, imbrûlés.', icon: 'engine', is_default: 0, weights: { "25": 10, "26": 50, "27": -25 } },
          { title: 'Elle roule bien mais consomme 1 à 2 litres de trop aux 100 km', subtitle: 'Surconsommation sans voyant ni perte flagrante.', icon: 'fuel', is_default: 1, weights: { "25": 45, "26": 20, "27": 10 } },
          { title: 'Je ne sais pas', subtitle: 'Pas de ressenti particulier.', icon: 'help', is_default: 0, weights: { "25": 5 } }
        ]
      }
    ]
  }
];

async function seedDiagnosticStructure() {
  const pool = mysql.createPool(dbConfig);
  console.log('[Seed] Connected to database to structure diagnostic knowledge...');

  // Clean existing questions and hypotheses for symptoms 1 to 9 to rebuild cleanly
  console.log('[Seed] Cleaning old records for symptoms 1..9...');
  await pool.query('DELETE FROM session_answers WHERE session_id IN (SELECT id FROM diagnostic_sessions WHERE symptom_id <= 9)');
  await pool.query('DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE symptom_id <= 9)');
  await pool.query('DELETE FROM questions WHERE symptom_id <= 9');
  await pool.query('DELETE FROM hypotheses WHERE symptom_id <= 9');

  for (const symp of SYMPTOMS_DATA) {
    console.log(`[Seed] Processing Symptom ${symp.symptom_id}...`);

    // 1. Insert Hypotheses
    for (const hyp of symp.hypotheses) {
      await pool.query(`
        INSERT INTO hypotheses (id, symptom_id, name, priority_badge, priority_label, order_index, description, gravity, check_action, check_type, cost_min, cost_max)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          name = VALUES(name),
          priority_badge = VALUES(priority_badge),
          priority_label = VALUES(priority_label),
          order_index = VALUES(order_index),
          description = VALUES(description),
          gravity = VALUES(gravity),
          check_action = VALUES(check_action),
          check_type = VALUES(check_type),
          cost_min = VALUES(cost_min),
          cost_max = VALUES(cost_max)
      `, [
        hyp.id,
        symp.symptom_id,
        hyp.name,
        hyp.priority_badge,
        hyp.priority_label,
        hyp.order_index,
        hyp.description,
        hyp.gravity,
        hyp.check_action,
        hyp.check_type,
        hyp.cost_min,
        hyp.cost_max
      ]);

      // Ensure a repair guide exists for this hypothesis
      const [existingGuide] = await pool.query('SELECT id FROM repair_guides WHERE hypothesis_id = ?', [hyp.id]);
      if (existingGuide.length === 0) {
        const [gRes] = await pool.query(`
          INSERT INTO repair_guides (hypothesis_id, title, subtitle, difficulty, est_time, total_steps, safety_warning, tools_needed)
          VALUES (?, ?, ?, 'Facile', '20-45 min', 3, 'Ne travaillez jamais sur un moteur chaud ou en marche. Débranchez la clé de contact.', '["Lampe torche", "Gants de protection"]')
        `, [
          hyp.id,
          `Guide de vérification : ${hyp.name}`,
          `Contrôle pas-à-pas accessible sans connaissances pointues en mécanique.`
        ]);
        const guideId = gRes.insertId;

        // Add 3 practical steps
        await pool.query(`
          INSERT INTO repair_steps (guide_id, step_num, title, time_est, description, subtext, caution_warning, image_url) VALUES
          (?, 1, 'Mise en sécurité & inspection visuelle', '5 min', 'Stationnez sur sol plat, coupez le contact et serrez le frein à main. Ouvrez le capot et inspectez visuellement la zone concernée.', 'Recherchez tout câble débranché, trace d''oxydation ou fuite visible.', 'Ne touchez à aucun élément brûlant.', 'assets/icons/safety-first.svg'),
          (?, 2, 'Test d''observation sensorielle', '10 min', ?, 'Notez précisément le comportement constaté.', 'Si une odeur de brûlé apparaît, arrêtez immédiatement.', 'assets/icons/test-action.svg'),
          (?, 3, 'Décision & validation', '5 min', 'Comparez vos constatations avec les critères du guide. Si le défaut est confirmé, vous pouvez agir ou commander la pièce en toute sérénité.', 'Présentez la fiche mémo à votre garagiste si l''intervention requiert un outillage d''atelier.', 'Ne forcez aucun remontage.', 'assets/icons/valid-check.svg')
        `, [guideId, guideId, hyp.check_action, guideId]);
      }
    }

    // 2. Insert Questions & Options
    for (const q of symp.questions) {
      const [qRes] = await pool.query(`
        INSERT INTO questions (symptom_id, step_num, total_steps, category, title, description, warning_text, why_ask, image_url, reformulation, test_action, test_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        symp.symptom_id,
        q.step_num,
        q.total_steps,
        q.category,
        q.title,
        q.description,
        q.warning_text,
        q.why_ask,
        q.image_url,
        q.reformulation,
        q.test_action,
        q.test_type
      ]);
      const questionId = qRes.insertId;

      for (const opt of q.options) {
        await pool.query(`
          INSERT INTO question_options (question_id, title, subtitle, icon, is_default, hypothesis_weights)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          questionId,
          opt.title,
          opt.subtitle,
          opt.icon,
          opt.is_default ? 1 : 0,
          JSON.stringify(opt.weights)
        ]);
      }
    }
  }

  console.log('[Seed] Diagnostic knowledge structure successfully created for all 9 symptoms!');
  await pool.end();
}

seedDiagnosticStructure().catch(err => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
