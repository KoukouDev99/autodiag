/**
 * Traductions françaises des pannes (306-329), tests (24-47), solutions (20-47)
 * et guides de réparation (legacy_repair_guides 2-56).
 */

const SOLUTIONS_FR = {
  20: {
    title: 'Appoint de liquide de refroidissement et contrôle du vase d\'expansion',
    subtitle: 'Guide d\'inspection et d\'entretien du vase d\'expansion',
    est_time: '15 min',
    safety_warning: 'Attendez au moins 45 minutes après l\'arrêt du moteur avant d\'ouvrir le bouchon du vase d\'expansion.',
    tools_needed: ['Entonnoir propre', 'Chiffon épais', 'Liquide de refroidissement préconisé'],
    steps: [
      { step: 1, title: 'Vérifier que le moteur est froid', description: 'Pressez la durite supérieure du radiateur : si elle est chaude ou dure sous pression, attendez le refroidissement complet.', time_est: '5 min', caution: null },
      { step: 2, title: 'Dévisser lentement le bouchon avec un chiffon', description: 'Posez un chiffon épais sur le bouchon et tournez d\'un quart de tour pour libérer la pression résiduelle avant de l\'ouvrir.', time_est: '5 min', caution: null },
      { step: 3, title: 'Compléter jusqu\'au repère MAX', description: 'Versez le liquide de refroidissement jusqu\'au repère MAX sans dépasser, afin de laisser un volume d\'expansion à chaud.', time_est: '5 min', caution: null }
    ]
  },
  21: {
    title: 'Recherche de fuite de refroidissement et mise sous pression',
    subtitle: 'Guide de localisation des fuites sur le circuit d\'eau',
    est_time: '25 min',
    safety_warning: 'Le liquide de refroidissement est toxique. Nettoyez immédiatement toute flaque au sol.',
    tools_needed: ['Carton propre', 'Lampe torche', 'Pompe de mise sous pression'],
    steps: [
      { step: 1, title: 'Placer un carton sous le compartiment moteur', description: 'Stationnez sur sol plat, glissez un carton propre sous le moteur à l\'arrêt pour localiser l\'aplomb exact des gouttes.', time_est: '10 min', caution: null },
      { step: 2, title: 'Identifier le fluide et l\'origine du suintement', description: 'Inspectez à la lampe torche les raccords de durites, la pompe à eau et les boîtes à eau du radiateur pour repérer les traces colorées.', time_est: '15 min', caution: null }
    ]
  },
  22: {
    title: 'Remplacement du thermostat (Calorstat) et purge d\'air',
    subtitle: 'Guide de remplacement du thermostat moteur et purge du circuit',
    est_time: '1h00',
    safety_warning: 'Une poche d\'air dans la culasse provoque une surchauffe immédiate. Purgez toujours soigneusement le circuit.',
    tools_needed: ['Clé à cliquet + douille 10 mm', 'Pince à colliers', 'Bac de vidange', 'Thermostat neuf avec joint'],
    steps: [
      { step: 1, title: 'Vidanger partiellement le liquide (2 litres)', description: 'Moteur froid, ouvrez le robinet bas du radiateur pour abaisser le niveau sous le boîtier de thermostat.', time_est: '15 min', caution: null },
      { step: 2, title: 'Déposer le boîtier de thermostat', description: 'Retirez les 2 ou 3 vis du couvercle d\'eau, extrayez l\'ancien thermostat en notant le sens de la soupape de purge.', time_est: '20 min', caution: null },
      { step: 3, title: 'Poser le thermostat neuf et purger l\'air', description: 'Installez le joint neuf, serrez au couple (10 Nm), remplissez le circuit et ouvrez les vis de purge jusqu\'à obtenir un jet continu sans bulles.', time_est: '25 min', caution: null }
    ]
  },
  23: {
    title: 'Contrôle de la pompe à eau et vérification de la circulation',
    subtitle: 'Guide de vérification du débit et du roulement de pompe à eau',
    est_time: '20 min',
    safety_warning: 'Remplacez systématiquement la pompe à eau lors du changement de la courroie de distribution.',
    tools_needed: ['Lampe torche', 'Miroir d\'inspection', 'Gants de protection'],
    steps: [
      { step: 1, title: 'Observer le jet de retour au vase d\'expansion', description: 'Moteur froid bouchon ouvert, démarrez et faites accélérer à 2500 tr/min : un filet régulier doit couler par la petite durite de retour.', time_est: '10 min', caution: null },
      { step: 2, title: 'Contrôler le jeu axial de la poulie', description: 'Moteur éteint, saisissez fermement la poulie de pompe à eau à deux mains : tout jeu ou claquement indique un roulement en fin de vie.', time_est: '10 min', caution: null }
    ]
  },
  24: {
    title: 'Contrôle du régulateur de pression de carburant et test de maintien',
    subtitle: 'Guide de vérification du régulateur de pression d\'injection',
    est_time: '15 min',
    safety_warning: 'Entourez le raccord de rampe d\'un chiffon épais lors du branchement du manomètre pour éviter toute projection d\'essence.',
    tools_needed: ['Pince', 'Chiffon absorbant', 'Manomètre de pression de carburant'],
    steps: [
      { step: 1, title: 'Inspecter la durite de dépression', description: 'Débranchez la petite durite de vide sur le régulateur : toute trace d\'essence liquide prouve que la membrane interne est percée.', time_est: '5 min', caution: null },
      { step: 2, title: 'Contrôler la pression résiduelle après arrêt moteur', description: 'Coupez le moteur : la pression dans la rampe doit rester supérieure à 2,0 bars pendant 15 minutes sans chuter brutalement.', time_est: '10 min', caution: null }
    ]
  },
  25: {
    title: 'Vérification de l\'amorçage et de l\'alimentation de la pompe à carburant',
    subtitle: 'Guide de diagnostic de la pompe de gavage immergée',
    est_time: '15 min',
    safety_warning: 'Ne fumez jamais et n\'approchez aucune flamme de la trappe de visite du réservoir.',
    tools_needed: ['Multimètre', 'Tournevis'],
    steps: [
      { step: 1, title: 'Écouter le cycle d\'amorçage de 2 secondes', description: 'Soulevez la banquette arrière et mettez le contact sans démarrer : vous devez entendre un bourdonnement électrique net pendant 2 secondes.', time_est: '5 min', caution: null },
      { step: 2, title: 'Contrôler le relais et le fusible de pompe', description: 'En cas de silence total, vérifiez le fusible 15A/20A de pompe à carburant et l\'enclenchement du relais dans la boîte à fusibles.', time_est: '10 min', caution: null }
    ]
  },
  26: {
    title: 'Contrôle du joint de bouchon de réservoir et de la goulotte',
    subtitle: 'Guide d\'inspection de l\'étanchéité du réservoir et du circuit EVAP',
    est_time: '15 min',
    safety_warning: 'Effectuez l\'inspection dans un endroit ventilé à l\'écart de toute source d\'étincelles.',
    tools_needed: ['Lampe torche', 'Chiffon propre'],
    steps: [
      { step: 1, title: 'Examiner le joint caoutchouc du bouchon', description: 'Dévissez le bouchon de remplissage et vérifiez que la bague en caoutchouc noir n\'est ni fendue, ni écrasée.', time_est: '5 min', caution: null },
      { step: 2, title: 'Inspecter le tube de goulotte dans le passage de roue', description: 'Éclairez derrière la roue arrière pour vérifier l\'absence de corrosion perforante ou de suintement sur le conduit de remplissage.', time_est: '10 min', caution: null }
    ]
  },
  27: {
    title: 'Remplacement du filtre à carburant en ligne',
    subtitle: 'Guide de remplacement périodique du filtre à carburant',
    est_time: '30 min',
    safety_warning: 'Portez des lunettes de protection : la pression résiduelle dans la conduite peut projeter du carburant au déclipsage.',
    tools_needed: ['Pince pour raccords rapides', 'Bac de récupération', 'Lunettes et gants nitrile'],
    steps: [
      { step: 1, title: 'Faire chuter la pression du circuit', description: 'Retirez le fusible de la pompe à carburant et lancez le moteur quelques secondes jusqu\'à ce qu\'il cale.', time_est: '10 min', caution: null },
      { step: 2, title: 'Déclipser les raccords rapides', description: 'Pressez les languettes des raccords d\'entrée et de sortie au-dessus d\'un bac et déposez l\'ancien filtre.', time_est: '10 min', caution: null },
      { step: 3, title: 'Poser le filtre neuf dans le sens du flux', description: 'Orientez la flèche gravée sur le filtre vers le moteur, clipsez fermement les raccords jusqu\'au clic et vérifiez l\'absence de fuite.', time_est: '10 min', caution: null }
    ]
  },
  28: {
    title: 'Inspection visuelle et contrôle de tension de la courroie de distribution',
    subtitle: 'Guide d\'inspection préventive de la courroie de distribution',
    est_time: '20 min',
    safety_warning: 'Ne faites JAMAIS tourner le moteur par la vis d\'arbre à cames : tournez uniquement par la poulie de vilebrequin dans le sens horaire.',
    tools_needed: ['Douille de 10 mm', 'Lampe torche', 'Miroir d\'inspection'],
    steps: [
      { step: 1, title: 'Déclipser le carter supérieur de distribution', description: 'Retirez les vis ou agrafes du cache plastique supérieur et écartez-le pour dégager la vue sur la courroie crantée.', time_est: '10 min', caution: null },
      { step: 2, title: 'Vérifier l\'état des dents et la tension', description: 'Inspectez le dos et les dents de la courroie (aucune craquelure ni trace d\'huile) et vérifiez qu\'elle ne vrille pas à plus de 90° entre deux poulies.', time_est: '10 min', caution: null }
    ]
  },
  29: {
    title: 'Contrôle d\'étanchéité des durites de turbo et du jeu de turbine',
    subtitle: 'Guide d\'inspection du turbocompresseur et du circuit de suralimentation',
    est_time: '35 min',
    safety_warning: 'Ne touchez jamais le corps du turbocompresseur juste après avoir roulé : sa température dépasse 600°C.',
    tools_needed: ['Tournevis plat / douille 7 mm', 'Lampe torche', 'Miroir'],
    steps: [
      { step: 1, title: 'Inspecter les durites de suralimentation et l\'intercooler', description: 'Palpez toutes les grosses durites entre le turbo, l\'échangeur et l\'admission pour repérer une fente ou une trace grasse d\'huile.', time_est: '15 min', caution: null },
      { step: 2, title: 'Contrôler le jeu de l\'axe de turbine', description: 'Déposez la manche d\'arrivée d\'air frais et bougez délicatement l\'axe du compresseur du bout des doigts : aucun jeu longitudinal (axial) ne doit exister.', time_est: '20 min', caution: null }
    ]
  },
  30: {
    title: 'Test de basculement moteur et inspection des silentblocs',
    subtitle: 'Guide de contrôle des supports moteur et boîte de vitesses',
    est_time: '15 min',
    safety_warning: 'Ne placez jamais un cric directement sous le carter d\'huile en aluminium sans intercaler une cale en bois épaisse.',
    tools_needed: ['Lampe torche', 'Cric + cale en bois'],
    steps: [
      { step: 1, title: 'Observer le cabrage du moteur sous couple', description: 'Frein à main serré à fond, demandez à un assistant de donner une brève impulsion sur l\'embrayage en 1ère : si le moteur se soulève de plus de 3 cm, le support est rompu.', time_est: '10 min', caution: null },
      { step: 2, title: 'Inspecter le caoutchouc de la biellette anti-couple', description: 'Sous le véhicule, vérifiez que le silentbloc inférieur reliant la boîte au berceau n\'est pas déchiré.', time_est: '5 min', caution: null }
    ]
  },
  31: {
    title: 'Remplacement du joint de couvre-culasse et nettoyage du plan de joint',
    subtitle: 'Guide de réparation des fuites d\'huile du couvre-culasse',
    est_time: '1h00',
    safety_warning: 'Nettoyez soigneusement le plan de joint sans laisser tomber de débris dans la distribution ou les arbres à cames.',
    tools_needed: ['Clé à cliquet + douille 10 mm', 'Nettoyant freins', 'Pâte à joint silicone HT', 'Clé dynamométrique'],
    steps: [
      { step: 1, title: 'Débrancher le reniflard et les bobines', description: 'Déclipsez les bobines d\'allumage et les durites de vapeurs d\'huile (PCV) fixées sur le couvre-culasse.', time_est: '15 min', caution: null },
      { step: 2, title: 'Déposer le couvre-culasse et dégraisser', description: 'Dévissez les vis périphériques, retirez le cache et dégraissez parfaitement la gorge et le plan de joint sur la culasse.', time_est: '25 min', caution: null },
      { step: 3, title: 'Poser le joint neuf et serrer en croix', description: 'Mettez une goutte de silicone aux angles de paliers d\'arbre à cames, posez le joint neuf et serrez progressivement en escargot à 9-10 Nm.', time_est: '20 min', caution: null }
    ]
  },
  32: {
    title: 'Mesure de la pression d\'huile moteur au manomètre d\'atelier',
    subtitle: 'Guide de contrôle de la pompe à huile et du circuit de lubrification',
    est_time: '30 min',
    safety_warning: 'Coupez impérativement le moteur en moins de 5 secondes si le manomètre reste à 0 bar.',
    tools_needed: ['Coffret manomètre de pression d\'huile', 'Douille longue pour manocontact', 'Bac de propreté'],
    steps: [
      { step: 1, title: 'Déposer le manocontact de pression d\'huile', description: 'Moteur coupé, débranchez la prise à 1 fil du capteur de pression d\'huile près du filtre à huile et dévissez-le.', time_est: '15 min', caution: null },
      { step: 2, title: 'Visser l\'adaptateur et relever la pression', description: 'Vissez le flexible du manomètre, démarrez le moteur et vérifiez que la pression dépasse 1,0 bar au ralenti et 3,5 bars à 3000 tr/min.', time_est: '15 min', caution: null }
    ]
  },
  33: {
    title: 'Test de souffle au bouchon d\'huile et prise des compressions moteur',
    subtitle: 'Guide de diagnostic de la segmentation et de l\'étanchéité des cylindres',
    est_time: '30 min',
    safety_warning: 'Désactivez toujours l\'allumage et l\'injection de carburant avant de prendre les compressions au démarreur.',
    tools_needed: ['Compressiomètre', 'Clé à bougie', 'Burette d\'huile moteur'],
    steps: [
      { step: 1, title: 'Test du bouchon d\'huile posé librement', description: 'Moteur chaud au ralenti, dévissez le bouchon d\'huile : s\'il est éjecté avec d\'épais jets de fumée, les segments laissent passer la compression.', time_est: '10 min', caution: null },
      { step: 2, title: 'Test de compression à sec puis avec 5 ml d\'huile', description: 'Relevez la compression de chaque cylindre. Si un cylindre faible remonte nettement après ajout d\'une cuillère d\'huile, les segments sont usés.', time_est: '20 min', caution: null }
    ]
  },
  34: {
    title: 'Test d\'efficacité thermique du catalyseur au thermomètre infrarouge',
    subtitle: 'Guide de contrôle du pot catalytique',
    est_time: '15 min',
    safety_warning: 'La ligne d\'échappement dépasse 400°C. Ne touchez jamais le métal à mains nues.',
    tools_needed: ['Thermomètre laser infrarouge'],
    steps: [
      { step: 1, title: 'Amener le moteur à sa température normale (90°C)', description: 'Faites tourner le moteur 10 minutes pour que le catalyseur atteigne son seuil d\'amorçage thermique.', time_est: '10 min', caution: null },
      { step: 2, title: 'Comparer la température d\'entrée et de sortie', description: 'Visez le tube juste avant l\'entrée du catalyseur puis juste après sa sortie : la sortie doit être 30°C à 60°C plus chaude si le catalyseur fonctionne.', time_est: '5 min', caution: null }
    ]
  },
  35: {
    title: 'Remplacement de la sonde Lambda (O2) avec graisse haute température',
    subtitle: 'Guide de contrôle et remplacement de la sonde à oxygène',
    est_time: '35 min',
    safety_warning: 'Appliquez du dégrippant sur échappement tiède (non brûlant) pour débloquer le filetage sans l\'arracher.',
    tools_needed: ['Douille fendue 22 mm pour sonde lambda', 'Dégrippant', 'Graisse cuivre/nickel haute température'],
    steps: [
      { step: 1, title: 'Débrancher le connecteur électrique', description: 'Déclipsez la prise de la sonde avant de la dévisser afin de ne pas vriller les fils.', time_est: '10 min', caution: null },
      { step: 2, title: 'Dévisser la sonde avec la douille fendue de 22 mm', description: 'Engagez la douille spéciale de 22 mm en faisant passer le câble dans la fente et débloquez la sonde.', time_est: '15 min', caution: null },
      { step: 3, title: 'Visser la sonde neuve et serrer au couple (45 Nm)', description: 'Enduisez uniquement le filetage de pâte anti-grippage (sans toucher l\'embout de mesure !) et serrez à 40-45 Nm.', time_est: '10 min', caution: null }
    ]
  },
  36: {
    title: 'Test d\'étanchéité et remplacement de l\'électrovanne de purge Canister (EVAP)',
    subtitle: 'Guide de vérification de l\'électrovanne de recyclage des vapeurs de carburant',
    est_time: '15 min',
    safety_warning: 'Débranchez la prise électrique avant de retirer les durites de vapeurs d\'essence.',
    tools_needed: ['Pince', 'Tournevis'],
    steps: [
      { step: 1, title: 'Repérer l\'électrovanne sur le collecteur d\'admission', description: 'Identifiez la petite vanne cylindrique noire reliée à 2 durites et un connecteur électrique à 2 broches.', time_est: '5 min', caution: null },
      { step: 2, title: 'Tester l\'étanchéité hors tension', description: 'Débranchez la vanne et soufflez dedans : si l\'air passe alors qu\'elle est débranchée, elle est bloquée ouverte et doit être remplacée.', time_est: '10 min', caution: null }
    ]
  },
  37: {
    title: 'Détection de fuite au collecteur d\'échappement à froid',
    subtitle: 'Guide d\'inspection du collecteur d\'échappement et de son joint',
    est_time: '20 min',
    safety_warning: 'Effectuez ce test uniquement sur moteur TOTALEMENT FROID.',
    tools_needed: ['Vaporisateur d\'eau savonneuse', 'Lampe torche', 'Miroir d\'inspection'],
    steps: [
      { step: 1, title: 'Pulvériser de l\'eau savonneuse sur le plan de joint froid', description: 'Moteur froid, vaporisez de l\'eau savonneuse le long de la bride du collecteur contre la culasse.', time_est: '10 min', caution: null },
      { step: 2, title: 'Démarrer et observer la formation de bulles', description: 'Démarrez le moteur froid : toute fuite de gaz d\'échappement formera immédiatement des bulles de mousse et des traces de suie noire.', time_est: '10 min', caution: null }
    ]
  },
  38: {
    title: 'Nettoyage du capteur de pression d\'admission (MAP) et contrôle du joint',
    subtitle: 'Guide d\'entretien du capteur MAP',
    est_time: '15 min',
    safety_warning: 'N\'introduisez jamais d\'objet pointu ou d\'air comprimé dans l\'orifice du capteur : la membrane interne se déchirerait.',
    tools_needed: ['Clé Torx T20 ou douille 7 mm', 'Spray nettoyant capteur / contacts électriques'],
    steps: [
      { step: 1, title: 'Déposer la vis de maintien du capteur MAP', description: 'Débranchez le connecteur à 3 ou 4 broches, retirez la vis de fixation et extrayez délicatement le capteur de la tubulure d\'admission.', time_est: '5 min', caution: null },
      { step: 2, title: 'Pulvériser du nettoyant spécifique et laisser sécher', description: 'Rincez les vapeurs d\'huile avec un nettoyant pour débitmètre/capteur, laissez sécher 5 minutes à l\'air libre et vérifiez le joint torique avant remontage.', time_est: '10 min', caution: null }
    ]
  },
  39: {
    title: 'Dégarnissage du panneau de porte et remplacement du lève-vitre',
    subtitle: 'Guide de réparation du mécanisme et moteur de lève-vitre électrique',
    est_time: '1h00',
    safety_warning: 'Scotchez solidement la vitre en position haute sur l\'encadrement de portière avant de dévisser le mécanisme.',
    tools_needed: ['Tournevis Torx T20/T25', 'Outils de dégarnissage en plastique', 'Ruban adhésif de peintre', 'Douille de 10 mm'],
    steps: [
      { step: 1, title: 'Maintenir la vitre en position haute avec de l\'adhésif', description: 'Remontez la vitre à la main et bloquez-la à cheval sur le haut de la porte avec plusieurs bandes de ruban adhésif.', time_est: '10 min', caution: null },
      { step: 2, title: 'Déposer la garniture de portière', description: 'Retirez les vis cachées dans la poignée et l\'accoudoir, Puis déclipsez le panneau avec un levier en plastique.', time_est: '20 min', caution: null },
      { step: 3, title: 'Remplacer le mécanisme de lève-vitre', description: 'Désolidarisez les pinces de la vitre, dévissez les rails du lève-vitre, installez le mécanisme neuf et testez la montée/descente.', time_est: '30 min', caution: null }
    ]
  },
  40: {
    title: 'Remplacement d\'une ampoule de phare sans toucher le verre',
    subtitle: 'Guide de remplacement d\'ampoule de croisement / route (H7 / H4)',
    est_time: '15 min',
    safety_warning: 'Tenez toujours l\'ampoule neuve par son culot métallique uniquement. Si vous touchez le verre, dégraissez-le à l\'alcool.',
    tools_needed: ['Gants propres ou essuie-tout', 'Ampoule neuve H7 ou H4'],
    steps: [
      { step: 1, title: 'Retirer le cabochon d\'étanchéité arrière du phare', description: 'Contact et phares éteints, retirez le cache rond en caoutchouc ou plastique à l\'arrière de l\'optique.', time_est: '5 min', caution: null },
      { step: 2, title: 'Débrancher la prise et déclipser l\'agrafe ressort', description: 'Tirez le connecteur électrique, puis pincez et basculez l\'épingle métallique qui maintient l\'ampoule.', time_est: '5 min', caution: null },
      { step: 3, title: 'Insérer l\'ampoule neuve dans son détrompeur', description: 'Positionnez l\'ergot du culot dans son encoche, verrouillez l\'agrafe ressort, rebranchez la prise et remettez le cache étanche.', time_est: '5 min', caution: null }
    ]
  },
  41: {
    title: 'Réparation de la tringlerie et remplacement du moteur d\'essuie-glace',
    subtitle: 'Guide de dépannage du mécanisme d\'essuie-glace',
    est_time: '45 min',
    safety_warning: 'Repérez la position de repos des balais sur le pare-brise avec un ruban adhésif avant de démonter les bras.',
    tools_needed: ['Clé à douille de 13 mm / extracteur de bras', 'Tournevis plat', 'Graisse au lithium'],
    steps: [
      { step: 1, title: 'Repérer l\'alignement des balais sur le pare-brise', description: 'Collez un morceau de scotch le long des balais pour retrouver l\'angle exact au remontage.', time_est: '5 min', caution: null },
      { step: 2, title: 'Déposer les bras d\'essuie-glace et la grille d\'auvent', description: 'Retirez les caches-écrous, dévissez les écrous de 13 mm, déposez les bras et retirez la grille plastique sous le pare-brise.', time_est: '20 min', caution: null },
      { step: 3, title: 'Remplacer la tringlerie ou le moteur électrique', description: 'Dévissez les 3 boulons du support de tringlerie, remplacez l\'ensemble et faites faire un cycle à vide au moteur avant de refixer les bras.', time_est: '20 min', caution: null }
    ]
  },
  42: {
    title: 'Purge hydraulique de la commande d\'embrayage et contrôle d\'étanchéité',
    subtitle: 'Guide de purge de l\'émetteur et du récepteur d\'embrayage',
    est_time: '30 min',
    safety_warning: 'L\'alimentation du circuit d\'embrayage est située haut dans le bocal de frein : maintenez le bocal rempli à ras bord pendant toute la purge.',
    tools_needed: ['Clé à tuyauter de 8 ou 10 mm', 'Tuyau transparent', 'Flacon de purge', 'Liquide de frein DOT 4 neuf'],
    steps: [
      { step: 1, title: 'Remplir le bocal de liquide DOT 4 au maximum', description: 'Versez du liquide DOT 4 neuf jusqu\'en haut du réservoir partagé frein/embrayage.', time_est: '5 min', caution: null },
      { step: 2, title: 'Pomper et maintenir la pédale au plancher', description: 'Un assistant pompe 5 fois sur la pédale d\'embrayage et la maintient au fond pendant que vous ouvrez la vis de purge du récepteur d\'un demi-tour.', time_est: '15 min', caution: null },
      { step: 3, title: 'Répéter jusqu\'à disparition complète des bulles', description: 'Refermez la vis avant que l\'assistant ne relève la pédale. Répétez 5 fois jusqu\'à obtenir une pédale ferme et réactive.', time_est: '10 min', caution: null }
    ]
  },
  43: {
    title: 'Contrôle du niveau d\'huile de boîte automatique (ATF) et entretien crépine',
    subtitle: 'Guide de vérification du niveau et de la qualité d\'huile ATF',
    est_time: '45 min',
    safety_warning: 'Le véhicule doit être parfaitement horizontal et la température d\'huile comprise entre 35°C et 45°C moteur tournant lors de la mise à niveau.',
    tools_needed: ['Chiffon blanc non pelucheux', 'Seringue de remplissage d\'huile', 'Outil OBD (lecture température ATF)'],
    steps: [
      { step: 1, title: 'Amener la boîte à 40°C', description: 'Démarrez le moteur et surveillez la température de l\'huile de transmission à la valise OBD jusqu\'à atteindre 35°C-45°C.', time_est: '15 min', caution: null },
      { step: 2, title: 'Passer tous les rapports à l\'arrêt', description: 'Pied sur le frein, engagez successivement P -> R -> N -> D en restant 3 secondes sur chaque position, puis revenez sur P.', time_est: '10 min', caution: null },
      { step: 3, title: 'Contrôler le niveau par débordement ou à la jauge', description: 'Moteur tournant au ralenti, ouvrez le bouchon de niveau : un mince filet d\'huile rouge claire doit s\'écouler. Sinon, faites l\'appoint d\'huile ATF homologuée.', time_est: '20 min', caution: null }
    ]
  },
  44: {
    title: 'Contrôle du jeu des croisillons d\'arbre et des soufflets de cardan',
    subtitle: 'Guide d\'inspection de la transmission et des joints homocinétiques',
    est_time: '20 min',
    safety_warning: 'Sécurisez le véhicule sur chandelles et mettez la boîte au point mort (roues calées) pour libérer la contrainte de l\'arbre.',
    tools_needed: ['Lampe torche', 'Gants de travail'],
    steps: [
      { step: 1, title: 'Inspecter les soufflets en caoutchouc des cardans', description: 'Braquez les roues et vérifiez qu\'aucun soufflet de cardan n\'est percé ou ne projette de graisse noire dans le passage de roue.', time_est: '10 min', caution: null },
      { step: 2, title: 'Tester le jeu en torsion des croisillons', description: 'Saisissez fermement chaque côté du croisillon ou du cardan et tournez en sens opposé : aucun jeu ni claquement ne doit être perceptible.', time_est: '10 min', caution: null }
    ]
  },
  45: {
    title: 'Contrôle du niveau d\'huile de différentiel et de l\'étanchéité du pont',
    subtitle: 'Guide de vérification du pont arrière et du couple conique',
    est_time: '25 min',
    safety_warning: 'Débloquez TOUJOURS le bouchon de remplissage supérieur avant d\'ouvrir le bouchon de vidange inférieur.',
    tools_needed: ['Clé carrée 3/8" ou douille 24 mm', 'Bac de vidange', 'Seringue à huile de boîte/pont 75W90'],
    steps: [
      { step: 1, title: 'Ouvrir le bouchon de remplissage supérieur en premier', description: 'Dévissez le bouchon haut du carter de pont et vérifiez que l\'huile arrive juste au ras du filetage.', time_est: '10 min', caution: null },
      { step: 2, title: 'Inspecter l\'aimant du bouchon', description: 'Essuyez l\'aimant : une fine pâte grise est normale, mais des copeaux métalliques indiquent une usure des pignons.', time_est: '15 min', caution: null }
    ]
  },
  46: {
    title: 'Purge d\'air et mise à niveau du circuit de direction assistée',
    subtitle: 'Guide d\'entretien de la pompe et du circuit de direction assistée',
    est_time: '15 min',
    safety_warning: 'Ne maintenez jamais le volant braqué en butée maximale plus de 5 secondes : cela fait surchauffer la pompe.',
    tools_needed: ['Chiffon propre non pelucheux', 'Bidon d\'huile de direction assistée (ATF / CHF)'],
    steps: [
      { step: 1, title: 'Soulever les deux roues avant du sol', description: 'Placez l\'avant du véhicule sur chandelles pour que les roues puissent braquer sans frottement au sol.', time_est: '5 min', caution: null },
      { step: 2, title: 'Purger l\'air en braquant de butée à butée moteur coupé', description: 'Moteur éteint et bocal ouvert, tournez lentement le volant à fond de gauche à droite 15 fois pour faire remonter les bulles d\'air.', time_est: '5 min', caution: null },
      { step: 3, title: 'Ajuster le niveau sur le repère MAX', description: 'Complétez le niveau d\'huile jusqu\'au repère, démarrez le moteur et vérifiez la disparition du bruit hydraulique.', time_est: '5 min', caution: null }
    ]
  },
  47: {
    title: 'Mise à pression à froid des 4 pneus et réinitialisation TPMS',
    subtitle: 'Guide d\'ajustement des pressions pneumatiques et calibrage TPMS',
    est_time: '10 min',
    safety_warning: 'Contrôlez toujours la pression sur des pneus froids (arrêtés depuis au moins 2 heures) ou ajoutez +0,3 bar à chaud.',
    tools_needed: ['Manomètre de pression précis', 'Gonfleur / Compresseur'],
    steps: [
      { step: 1, title: 'Lire les pressions recommandées sur l\'étiquette de portière', description: 'Ouvrez la portière conducteur et relevez les pressions AVANT et ARRIÈRE en bars indiquées par le constructeur.', time_est: '2 min', caution: null },
      { step: 2, title: 'Gonfler les 4 pneumatiques à la valeur exacte', description: 'Ajustez la pression des 4 roues (et de la roue de secours) au manomètre.', time_est: '5 min', caution: null },
      { step: 3, title: 'Enregistrer la nouvelle pression dans l\'ordinateur de bord', description: 'Dans le menu du véhicule ("Réglages" -> "Pression des pneus" -> "SET / Réinitialiser"), validez le calibrage puis roulez 10 minutes.', time_est: '3 min', caution: null }
    ]
  }
};

module.exports = { SOLUTIONS_FR };

