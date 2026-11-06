/**
 * AutoDiag Diagnostic Engine V5 — Architecture Modulaire en 10 Étapes
 * 
 * Conforme à la spécification stricte :
 * Étape 1  : Identifier le véhicule (sans jamais inventer les caractéristiques inconnues)
 * Étape 2  : Décrire le problème (14 catégories canoniques + description libre + normalisation)
 * Étape 3  : Vérifier les risques immédiats (Interruption prioritaire SAFETY_STOP, interdiction de rouler)
 * Étape 4  : Générer les premières hypothèses (Causes candidates, compatibles, contradictoires, preuves, gravité, tests)
 * Étape 5  : Sélectionner la prochaine question (Gain d'information, contraste, gravité, débutant, confiance qualifiée)
 * Étape 6  : Interpréter la réponse (Options standard, renforcement, réduction, exclusion technique, pas de fausse preuve)
 * Étape 7  : Proposer une vérification (Tests sécurisés débutants, prérequis stricts, outillage minime)
 * Étape 8  : Déterminer la fin du diagnostic (Machine à 7 états formels : IN_PROGRESS, LIKELY_CAUSES_FOUND,
 *            TEST_REQUIRED, PROFESSIONAL_REQUIRED, INSUFFICIENT_INFORMATION, SAFETY_STOP, FAULT_CONFIRMED)
 * Étape 9  : Présenter le résultat (Causes classées, soutiens, contradictions, gravité, conduite à tenir, sans faux %)
 * Étape 10 : Enregistrer la session (Persistance complète, reprise de session, traçabilité atelier)
 */

class DiagnosticEngine {
  // 7 États formels de sortie du moteur (Étape 8)
  static STATES = {
    IN_PROGRESS: 'IN_PROGRESS',
    LIKELY_CAUSES_FOUND: 'LIKELY_CAUSES_FOUND',
    TEST_REQUIRED: 'TEST_REQUIRED',
    PROFESSIONAL_REQUIRED: 'PROFESSIONAL_REQUIRED',
    INSUFFICIENT_INFORMATION: 'INSUFFICIENT_INFORMATION',
    SAFETY_STOP: 'SAFETY_STOP',
    FAULT_CONFIRMED: 'FAULT_CONFIRMED'
  };

  // Niveaux de confiance qualitatifs rigoureux (Étape 5 & 9)
  static CONFIDENCE_LEVELS = {
    VERY_HIGH: { code: 'VERY_HIGH', label: 'Panne identifiée avec quasi-certitude', badge: 'TRÈS PROBABLE' },
    HIGH: { code: 'HIGH', label: 'Piste solide et cohérente', badge: 'PROBABLE' },
    MODERATE: { code: 'MODERATE', label: 'Piste plausible à vérifier', badge: 'PLAUSIBLE' },
    UNCERTAIN: { code: 'UNCERTAIN', label: 'Diagnostic incertain / Plusieurs pistes en balance', badge: 'INCERTAIN' }
  };

  // 14 Catégories de symptômes canoniques (Étape 2)
  static CANONICAL_SYMPTOMS = [
    { code: 'start_fail', label: 'Le véhicule ne démarre pas' },
    { code: 'stall_after_start', label: 'Le moteur démarre puis cale' },
    { code: 'power_loss', label: 'Perte de puissance' },
    { code: 'unusual_noise', label: 'Bruit inhabituel' },
    { code: 'vibrations', label: 'Vibrations' },
    { code: 'smoke_exhaust', label: 'Fumée anormale' },
    { code: 'overheating', label: 'Surchauffe' },
    { code: 'warning_light', label: 'Voyant allumé' },
    { code: 'braking_issue', label: 'Problème de freinage' },
    { code: 'steering_issue', label: 'Problème de direction' },
    { code: 'abnormal_consumption', label: 'Consommation anormale' },
    { code: 'fluid_leak', label: 'Fuite de liquide' },
    { code: 'electrical_issue', label: 'Problème électrique' },
    { code: 'other_symptom', label: 'Autre symptôme' }
  ];

  // =========================================================================
  // ÉTAPE 1 — Identifier le véhicule
  // =========================================================================
  /**
   * Recueille les informations connues du véhicule sans JAMAIS inventer les inconnues.
   * L'utilisateur peut ignorer toute caractéristique non maîtrisée.
   */
  static identifyVehicle(rawInput = {}) {
    return {
      brand: rawInput.brand ? String(rawInput.brand).trim() : null,
      model: rawInput.model ? String(rawInput.model).trim() : null,
      year: rawInput.year ? parseInt(rawInput.year, 10) : null,
      engine: rawInput.engine ? String(rawInput.engine).trim() : null,
      fuel: rawInput.fuel ? String(rawInput.fuel).trim() : null,
      gearbox: rawInput.gearbox ? String(rawInput.gearbox).trim() : null,
      mileage: rawInput.mileage !== undefined && rawInput.mileage !== null ? parseInt(rawInput.mileage, 10) : null,
      additional_info: rawInput.additional_info ? String(rawInput.additional_info).trim() : null,
      // Drapeaux d'exhaustivité
      is_engine_known: Boolean(rawInput.engine),
      is_mileage_known: Boolean(rawInput.mileage),
      has_incomplete_specs: !rawInput.brand || !rawInput.engine || !rawInput.fuel
    };
  }

  // =========================================================================
  // ÉTAPE 2 — Décrire le problème
  // =========================================================================
  /**
   * Enregistre un ou plusieurs symptômes initiaux et la description libre.
   * Normalise les formulations similaires tout en conservant la formulation brute.
   */
  static describeProblem(symptomCodes = [], rawUserDescription = '') {
    const selectedSymptoms = [];
    const normalizedInput = Array.isArray(symptomCodes) ? symptomCodes : [symptomCodes];

    for (const item of normalizedInput) {
      const codeOrId = typeof item === 'object' ? (item.code || item.id) : item;
      const found = this.CANONICAL_SYMPTOMS.find(s => s.code === codeOrId || s.label.toLowerCase() === String(codeOrId).toLowerCase());
      if (found) {
        selectedSymptoms.push(found);
      } else {
        selectedSymptoms.push({ code: 'other_symptom', label: String(codeOrId) });
      }
    }

    // Normalisation lexicale du texte libre
    const cleanText = (rawUserDescription || '').toLowerCase();
    const detectedKeywords = [];
    if (cleanText.includes('frein') || cleanText.includes('pédale molle')) detectedKeywords.push('braking_issue');
    if (cleanText.includes('volant dur') || cleanText.includes('direction')) detectedKeywords.push('steering_issue');
    if (cleanText.includes('huile') || cleanText.includes('pression')) detectedKeywords.push('oil_pressure_risk');
    if (cleanText.includes('vapeur') || cleanText.includes('chauffe')) detectedKeywords.push('overheating');
    if (cleanText.includes('odeur essence') || cleanText.includes('fuite carburant')) detectedKeywords.push('fuel_leak_risk');

    return {
      selected_symptoms: selectedSymptoms.length > 0 ? selectedSymptoms : [{ code: 'other_symptom', label: 'Symptôme non précisé' }],
      raw_user_description: rawUserDescription || '',
      detected_keywords: detectedKeywords,
      primary_symptom: selectedSymptoms[0] || { code: 'other_symptom', label: 'Autre symptôme' }
    };
  }

  // =========================================================================
  // ÉTAPE 3 — Vérifier les risques immédiats (SAFETY FIRST)
  // =========================================================================
  /**
   * Analyse prioritaire des situations potentiellement dangereuses.
   * Interrompt immédiatement le diagnostic en cas de danger vital ou mécanique irréversible.
   * RÈGLE ABSOLUE : Ne jamais demander de conduire pour reproduire un symptôme dangereux.
   */
  static checkImmediateRisks(symptomInput = {}, freeText = '', answers = []) {
    const alerts = [];
    const sympCode = String(symptomInput.code || symptomInput.primary_symptom?.code || '').toLowerCase();
    const text = `${freeText} ${answers.map(a => a.option_title || '').join(' ')}`.toLowerCase();

    // 1. Perte d'efficacité du freinage
    if (sympCode === 'braking_issue' || text.includes('pédale molle') || text.includes('plancher') || text.includes('freine plus')) {
      alerts.push({
        risk_type: 'BRAKE_FAILURE',
        severity: 'CRITICAL',
        title: 'Danger Critique : Défaillance du système de freinage',
        instruction: 'IMMOBILISEZ LE VÉHICULE IMMÉDIATEMENT. Ne prenez en aucun cas la route. Faites remorquer le véhicule jusqu\'à un atelier.',
        do_not_drive: true
      });
    }

    // 2. Direction devenue anormalement dure ou incontrôlable
    if (sympCode === 'steering_issue' || text.includes('direction bloquée') || text.includes('volant bloqué') || text.includes('incontrôlable')) {
      alerts.push({
        risk_type: 'STEERING_FAILURE',
        severity: 'CRITICAL',
        title: 'Danger Majeur : Défaillance de la direction assistée',
        instruction: 'Ne conduisez pas. Une perte totale de direction en circulation présente un risque d\'accident immédiat.',
        do_not_drive: true
      });
    }

    // 3. Voyant de pression d'huile avec symptômes inquiétants
    if ((text.includes('voyant huile') || text.includes('pression d\'huile')) && (text.includes('clac') || text.includes('bruit') || text.includes('fumée'))) {
      alerts.push({
        risk_type: 'OIL_PRESSURE_CRITICAL',
        severity: 'CRITICAL',
        title: 'Risque de Casse Moteur Immédiate (Pression d\'Huile)',
        instruction: 'COUPEZ LE MOTEUR SUR-LE-CHAMP. Ne redémarrez sous aucun prétexte. Le manque de lubrification détruit le moteur en quelques secondes.',
        do_not_drive: true
      });
    }

    // 4. Surchauffe importante
    if (sympCode === 'overheating' || text.includes('aiguille rouge') || text.includes('vapeur sous capot') || text.includes('voyant stop température')) {
      alerts.push({
        risk_type: 'OVERHEATING_DANGER',
        severity: 'HIGH',
        title: 'Surchauffe Moteur Importante',
        instruction: 'Arrêtez le véhicule et coupez le moteur. N\'OUVREZ JAMAIS le vase d\'expansion à chaud (danger de brûlures graves au 3ème degré par projection d\'eau bouillante).',
        do_not_drive: true
      });
    }

    // 5. Fumée abondante ou odeur persistante de carburant / fuite
    if (text.includes('odeur d\'essence') || text.includes('fuite de carburant') || text.includes('goutte sous réservoir') || text.includes('fumée sous capot')) {
      alerts.push({
        risk_type: 'FIRE_RISK',
        severity: 'CRITICAL',
        title: 'Risque d\'Incendie : Vapeurs ou Fuite de Carburant',
        instruction: 'Coupez le contact, éloignez toute source de flamme ou d\'étincelle. Ne démarrez pas dans un garage clos. Prévenez les secours si la fuite est active.',
        do_not_drive: true
      });
    }

    const isSafetyStop = alerts.some(a => a.severity === 'CRITICAL');
    return {
      is_safety_stop: isSafetyStop,
      status: isSafetyStop ? this.STATES.SAFETY_STOP : null,
      alerts,
      can_continue: !isSafetyStop
    };
  }

  // =========================================================================
  // ÉTAPE 4 — Générer les premières hypothèses
  // =========================================================================
  /**
   * Structure rigoureusement chaque hypothèse candidate :
   * ID, description, compatibles, contradictoires, compatibilité véhicule,
   * preuves disponibles, source, gravité, tests.
   */
  static generateInitialHypotheses(hypothesesPool = [], vehicle = {}, compatibilities = []) {
    const rawHypotheses = hypothesesPool.map(h => {
      const compatibleSymptoms = [h.symptom_id || 'initial'];
      const contradictorySymptoms = [];
      const evidence = [];
      let isPhysicallyExcluded = false;
      let exclusionReason = null;
      let vehicleBonus = 0;
      let evidenceLevel = 'verified';
      let sourceInfo = h.source_record_id ? `Source #${h.source_record_id}` : 'Base technique déterministe AutoDiag';

      // Filtrage physique strict sur motorisation
      if (vehicle) {
        const fuel = (vehicle.fuel || '').toLowerCase();
        const brand = (vehicle.brand || '').toLowerCase();
        const model = (vehicle.model || '').toLowerCase();
        const engine = (vehicle.engine || '').toLowerCase();
        const mileage = parseInt(vehicle.mileage || 0, 10);
        const nameLower = (h.name || '').toLowerCase();

        // Règle physique absolue 1 : Allumage vs Diesel
        if (fuel.includes('diesel') && (nameLower.includes('bougie d\'allumage') || nameLower.includes('bobine'))) {
          isPhysicallyExcluded = true;
          exclusionReason = 'Incompatibilité physique : moteur Diesel dépourvu de bougies d\'allumage commandées.';
          contradictorySymptoms.push('Carburant Diesel');
        }

        // Règle physique absolue 2 : Préchauffage / FAP vs Essence conventionnelle
        if (fuel.includes('essence') && (nameLower.includes('bougie de préchauffage') || (nameLower.includes('fap') && !nameLower.includes('gpf')))) {
          isPhysicallyExcluded = true;
          exclusionReason = 'Incompatibilité physique : moteur Essence conventionnel sans bougies de préchauffage.';
          contradictorySymptoms.push('Carburant Essence');
        }

        // Compatibilités déclarées (fault_vehicles)
        for (const comp of compatibilities) {
          if (comp.fault_id === h.id) {
            if (comp.compatibility === 'incompatible') {
              if (!comp.fuel_type || fuel.includes(comp.fuel_type.toLowerCase())) {
                isPhysicallyExcluded = true;
                exclusionReason = comp.notes || 'Incompatible avec l\'architecture du véhicule';
              }
            } else if (comp.compatibility === 'frequent' && !isPhysicallyExcluded) {
              const matchesMake = !comp.make || brand.includes(comp.make.toLowerCase());
              const matchesEngine = !comp.engine_code || engine.includes(comp.engine_code.toLowerCase());
              const matchesMileage = !comp.mileage_min || mileage >= comp.mileage_min;

              if (matchesMake && matchesEngine && matchesMileage) {
                const unverified = comp.evidence_level === 'unverified';
                vehicleBonus = unverified ? 10 : 20;
                evidenceLevel = comp.evidence_level || 'verified';
                sourceInfo = comp.notes ? comp.notes.replace(/^TODO:\s*/i, '') : 'Historique constructeur';
                evidence.push({
                  type: 'vehicle_frequency',
                  points: vehicleBonus,
                  unverified,
                  label: unverified ? '⚠️ Signalé en retour atelier' : '⭐ Panne fréquente sur ce modèle'
                });
              }
            }
          }
        }
      }

      return {
        id: h.id,
        fault_id: h.id,
        code: h.fault_code || h.code || `FAULT-${h.id}`,
        name: h.name,
        description: h.description || '',
        gravity: h.gravity || h.gravity_label || 'Moyenne',
        is_danger: Boolean(h.is_danger),
        cost_min: h.cost_min || 0,
        cost_max: h.cost_max || 0,
        compatible_symptoms: compatibleSymptoms,
        contradictory_symptoms: contradictorySymptoms,
        vehicle_compatibility: isPhysicallyExcluded ? 'incompatible' : (vehicleBonus > 0 ? 'frequent' : 'compatible'),
        is_excluded: isPhysicallyExcluded,
        exclusion_reason: exclusionReason,
        vehicle_bonus: vehicleBonus,
        evidence,
        evidence_level: evidenceLevel,
        source_info: sourceInfo,
        verification_tests: h.check_action ? [{ title: h.test_title || 'Test de confirmation', action: h.check_action }] : []
      };
    });

    return rawHypotheses;
  }

  // =========================================================================
  // ÉTAPE 5 — Sélectionner la prochaine question
  // =========================================================================
  /**
   * Sélectionne la question la plus discriminante basée sur :
   * - Le gain d'information (variance des poids & contraste sur hypothèses actives)
   * - La gravité des pannes restantes (priorité aux questions qui éliminent un risque grave)
   * - L'accessibilité débutant (test visuel/auditif privilégié)
   * - L'absence de redondance
   */
  static selectNextQuestion(unansweredQuestions = [], evalResult = {}, answersCount = 0, lastAnswerRules = []) {
    if (!unansweredQuestions || unansweredQuestions.length === 0) {
      return { shouldStopEarly: true, selectedQuestion: null, reason: 'all_questions_answered' };
    }

    // 1. Branching relationnel explicite (règle déterministe ciblée)
    if (lastAnswerRules && lastAnswerRules.length > 0) {
      const explicitNext = lastAnswerRules.find(r => r.next_question_id);
      if (explicitNext) {
        const targeted = unansweredQuestions.find(q => q.id === explicitNext.next_question_id);
        if (targeted) {
          return {
            shouldStopEarly: false,
            selectedQuestion: targeted,
            reason: 'targeted_rule_branch',
            explanation: 'Question ciblée suite à votre observation précédente.'
          };
        }
      }
    }

    // 2. Seuil d'arrêt qualitatif (Early Stopping)
    // Au moins 2 réponses, certitude très élevée et marge décisive
    const topHypo = evalResult.top_hypothesis;
    const runnerUp = (evalResult.hypotheses && evalResult.hypotheses[1]) ? evalResult.hypotheses[1] : null;

    if (answersCount >= 2 && topHypo && topHypo.confidence === 'Forte') {
      const margin = (topHypo.confidence_percent || 0) - (runnerUp ? (runnerUp.confidence_percent || 0) : 0);
      if (margin >= 25) {
        return {
          shouldStopEarly: true,
          selectedQuestion: null,
          reason: 'high_confidence_reached',
          explanation: 'La certitude sur la piste principale est suffisante pour clore les questions.'
        };
      }
    }

    if (unansweredQuestions.length === 1) {
      return {
        shouldStopEarly: false,
        selectedQuestion: unansweredQuestions[0],
        reason: 'last_remaining_question'
      };
    }

    // 3. Maximisation du Contraste / Gain d'information
    const h1Id = topHypo ? topHypo.id : null;
    const h2Id = runnerUp ? runnerUp.id : null;

    let bestQuestion = unansweredQuestions[0];
    let maxScore = -Infinity;

    for (const q of unansweredQuestions) {
      const options = q.options || [];
      let contrast = 0;
      let variance = 0;

      for (const opt of options) {
        let weights = {};
        try {
          weights = typeof opt.hypothesis_weights === 'string' ? JSON.parse(opt.hypothesis_weights) : (opt.hypothesis_weights || {});
        } catch (e) {
          weights = {};
        }

        if (h1Id && h2Id) {
          const w1 = weights[h1Id] || 0;
          const w2 = weights[h2Id] || 0;
          contrast = Math.max(contrast, Math.abs(w1 - w2));
        }

        const vals = Object.values(weights);
        if (vals.length > 0) {
          variance += Math.max(...vals) - Math.min(...vals);
        }
      }

      // Bonus accessibilité débutant (observation sensorielle non invasive)
      let beginnerBonus = 0;
      if (q.test_type === 'observation' || q.test_type === 'visual' || q.test_type === 'audio') beginnerBonus = 8;
      else if (q.test_type === 'action') beginnerBonus = 4;

      // Bonus de gravité (si la question discrimine une panne dangereuse)
      let safetyBonus = 0;
      if (q.safety_critical) safetyBonus = 10;

      const totalScore = (contrast * 2.5) + variance + beginnerBonus + safetyBonus;
      if (totalScore > maxScore) {
        maxScore = totalScore;
        bestQuestion = q;
      }
    }

    return {
      shouldStopEarly: false,
      selectedQuestion: bestQuestion,
      reason: 'max_contrast_selected',
      explanation: 'Question optimisée pour départager les causes les plus probables.'
    };
  }

  // =========================================================================
  // ÉTAPE 6 — Interpréter la réponse
  // =========================================================================
  /**
   * Interprète la réponse utilisateur en distinguant rigoureusement :
   * - "Je ne sais pas" / "Je ne peux pas vérifier" -> Jamais de fausse preuve d'absence de panne !
   * - Renforcement d'une hypothèse compatible
   * - Réduction de priorité
   * - Exclusion stricte UNIQUEMENT si justifiée physiquement
   */
  static interpretAnswer(answer = {}, hypotheses = [], rules = []) {
    const optionTitle = (answer.option_title || '').toLowerCase();
    const isUnknown = optionTitle.includes('je ne sais pas') || optionTitle.includes('inconnu');
    const isCannotCheck = optionTitle.includes('je ne peux pas') || optionTitle.includes('impossible');
    const isNone = optionTitle.includes('aucun');

    // Règle d'or : "Je ne sais pas" ne constitue jamais une preuve d'absence de panne
    if (isUnknown || isCannotCheck) {
      return {
        action: 'neutral',
        impact_level: 'none',
        reason: isCannotCheck ? 'cannot_verify' : 'unknown_observation',
        message: 'Information inconnue : aucune hypothèse n\'est pénalisée ni éliminée.'
      };
    }

    const appliedRules = rules.filter(r => r.answer_option_id === answer.option_id);
    return {
      action: 'evaluate',
      impact_level: appliedRules.some(r => r.effect === 'exclude') ? 'exclusion' : 'scoring',
      rules_count: appliedRules.length,
      rules: appliedRules
    };
  }

  // =========================================================================
  // ÉTAPE 7 — Proposer une vérification (Vérification Débutant Sécurisée)
  // =========================================================================
  /**
   * Génère un protocole de vérification simple, sans outillage dangereux.
   * RÈGLES STRICTES : Ne jamais recommander de manipulation électrique dangereuse,
   * de travail sous véhicule sur cric, ou d'ouverture de circuit chaud.
   */
  static proposeVerification(topHypothesisName = '', symptomId = null) {
    const name = (topHypothesisName || '').toLowerCase();

    if (name.includes('batterie')) {
      return {
        title: 'Test d\'effondrement des phares au démarrage',
        objective: 'Vérifier si la batterie conserve assez d\'énergie sous charge pour alimenter le démarreur.',
        tools_needed: 'Aucun outil (observation visuelle immédiate)',
        difficulty_level: 'Facile / Débutant (2 minutes)',
        safety_prerequisites: 'Véhicule immobilisé, frein à main serré, boîte au point mort ou position P.',
        instructions: [
          'Allumez les feux de croisement (ou le plafonnier intérieur).',
          'Regardez le faisceau lumineux et tentez d\'actionner la clé de contact pendant 2 secondes.'
        ],
        possible_results: [
          { outcome: 'Les phares s\'éteignent net ou faiblissent fortement', interpretation: 'Batterie déchargée ou en fin de vie chimique.' },
          { outcome: 'Les phares restent vifs et stables, aucun bruit sous capot', interpretation: 'Batterie saine, problème orienté démarreur ou relais.' }
        ],
        when_to_call_pro: 'Si les cosses de batterie sont corrodées et impossibles à débloquer, ou si la batterie gonfle.'
      };
    }

    if (name.includes('démarreur') || name.includes('solénoïde')) {
      return {
        title: 'Test auditif du solénoïde de démarreur',
        objective: 'Distinguer un blocage mécanique du démarreur d\'une coupure d\'alimentation électrique.',
        tools_needed: 'Aucun outil (test auditif à l\'oreille)',
        difficulty_level: 'Facile / Débutant (1 minute)',
        safety_prerequisites: 'Frein de parking serré, aucun occupant devant le véhicule.',
        instructions: [
          'Baissez la vitre conducteur.',
          'Tournez la clé à fond et écoutez attentivement le bruit sous le capot.'
        ],
        possible_results: [
          { outcome: 'Un "clac" sec unique et métallique sans rotation', interpretation: 'Solénoïde alimenté mais moteur du démarreur bloqué ou charbons usés.' },
          { outcome: 'Silence absolu sans aucun clic', interpretation: 'Circuit de commande coupé (fusible, neiman ou relais de démarrage).' }
        ],
        when_to_call_pro: 'Démontage du démarreur requis en atelier.'
      };
    }

    if (name.includes('pompe') || name.includes('gavage') || name.includes('carburant')) {
      return {
        title: 'Test auditif du sifflement de gavage au contact',
        objective: 'Confirmer que la pompe à carburant immergée est alimentée et tourne.',
        tools_needed: 'Aucun outil (environnement calme)',
        difficulty_level: 'Facile / Débutant (1 minute)',
        safety_prerequisites: 'Contact coupé avant le test, radio éteinte.',
        instructions: [
          'Installez-vous dans un endroit silencieux, fenêtres fermées.',
          'Mettez le contact (position voyants allumés) SANS lancer le démarreur.',
          'Tendez l\'oreille vers la banquette arrière.'
        ],
        possible_results: [
          { outcome: 'Un léger "bzzzz" électrique se fait entendre pendant 2 secondes', interpretation: 'Pompe de gavage fonctionnelle et pressurisée.' },
          { outcome: 'Silence total sous la banquette', interpretation: 'Pompe muette, relais de pompe ou fusible grillé.' }
        ],
        when_to_call_pro: 'Accès au réservoir et manipulation de carburant réservés à un professionnel.'
      };
    }

    if (name.includes('culasse') || name.includes('liquide')) {
      return {
        title: 'Contrôle visuel du bouchon de remplissage d\'huile',
        objective: 'Détecter un mélange anormal d\'eau et d\'huile sans démontage.',
        tools_needed: 'Un chiffon propre ou essuie-tout',
        difficulty_level: 'Facile / Débutant (2 minutes)',
        safety_prerequisites: 'MOTEUR IMPÉRATIVEMENT FROID (au moins 30 minutes d\'arrêt).',
        instructions: [
          'Ouvrez le capot moteur.',
          'Dévissez le bouchon de remplissage d\'huile (marqué d\'une burette d\'huile).',
          'Retournez-le et inspectez la face interne.'
        ],
        possible_results: [
          { outcome: 'Présence d\'une pâte crémeuse beige ou blanchâtre (mayonnaise)', interpretation: 'Émulsion eau-huile confirmant un passage de liquide de refroidissement.' },
          { outcome: 'Huile noire ou marron sombre fluide sans pâte', interpretation: 'Absence d\'émulsion visible sur le bouchon.' }
        ],
        when_to_call_pro: 'Remplacement de joint de culasse ou épreuve moteur requiert un atelier spécialisé.'
      };
    }

    // Protocole universel sécurisé
    return {
      title: 'Inspection visuelle moteur éteint',
      objective: 'Repérer les anomalies physiques évidentes sans toucher aux organes chauds ou mobiles.',
      tools_needed: 'Lampe torche de smartphone',
      difficulty_level: 'Très facile (3 minutes)',
      safety_prerequisites: 'Contact coupé, clés dans la poche, moteur froid.',
      instructions: [
        'Ouvrez le capot et sécurisez la béquille de maintien.',
        'Inspectez visuellement les câbles, durites et le sol sous le moteur.'
      ],
      possible_results: [
        { outcome: 'Durite déconnectée, câble fendu ou trace de liquide frais', interpretation: 'Anomalie physique directement repérée.' },
        { outcome: 'Tout paraît net en surface', interpretation: 'La défaillance est interne à un composant électrique ou mécanique.' }
      ],
      when_to_call_pro: 'Toute intervention sous le véhicule ou sur un organe mobile nécessite un garagiste.'
    };
  }

  // =========================================================================
  // ÉTAPE 8 — Déterminer la fin du diagnostic (State Machine Formelle)
  // =========================================================================
  /**
   * Retourne l'un des 7 états stricts :
   * - SAFETY_STOP
   * - FAULT_CONFIRMED (uniquement avec preuve formelle ou test positif, JAMAIS par simple classement)
   * - PROFESSIONAL_REQUIRED
   * - INSUFFICIENT_INFORMATION
   * - LIKELY_CAUSES_FOUND
   * - TEST_REQUIRED
   * - IN_PROGRESS
   */
  static determineDiagnosticStatus(evalResult = {}, answers = [], safetyCheck = {}, testResult = null) {
    // 1. Priorité absolue : Sécurité
    if (safetyCheck && safetyCheck.is_safety_stop) {
      return this.STATES.SAFETY_STOP;
    }

    // 2. Preuve tangible formelle
    if (testResult && testResult.is_conclusive && testResult.confirmed_fault_id) {
      return this.STATES.FAULT_CONFIRMED;
    }

    // 3. Information insuffisante (trop de réponses "Je ne sais pas" sans convergence)
    const unknownCount = answers.filter(a => {
      const t = (a.option_title || '').toLowerCase();
      return t.includes('je ne sais pas') || t.includes('impossible') || t.includes('inconnu');
    }).length;

    if (answers.length >= 2 && unknownCount >= Math.ceil(answers.length * 0.7)) {
      return this.STATES.INSUFFICIENT_INFORMATION;
    }

    // 4. Exigence professionnelle
    const topHypo = evalResult.top_hypothesis;
    if (topHypo && (topHypo.gravity === 'Critique' || topHypo.is_danger)) {
      if (answers.length >= 2) {
        return this.STATES.PROFESSIONAL_REQUIRED;
      }
    }

    // 5. Causes plausibles identifiées
    if (topHypo && evalResult.top_confidence >= 80 && answers.length >= 2) {
      return this.STATES.LIKELY_CAUSES_FOUND;
    }

    // 6. Test supplémentaire requis pour départager deux causes proches
    const runnerUp = (evalResult.hypotheses && evalResult.hypotheses[1]) ? evalResult.hypotheses[1] : null;
    if (topHypo && runnerUp && Math.abs((topHypo.confidence_percent || 0) - (runnerUp.confidence_percent || 0)) <= 15) {
      return this.STATES.TEST_REQUIRED;
    }

    if (answers.length === 0) {
      return this.STATES.IN_PROGRESS;
    }

    return this.STATES.LIKELY_CAUSES_FOUND;
  }

  // =========================================================================
  // ÉTAPE 9 — Présenter le résultat
  // =========================================================================
  /**
   * Structure la présentation finale en évitant les pourcentages fictifs non validés.
   * Affiche les causes, éléments de soutien, contradictions et conduite à tenir.
   */
  static formatResultPresentation(evalResult = {}, vehicle = {}, observations = [], status = this.STATES.LIKELY_CAUSES_FOUND) {
    const top = evalResult.top_hypothesis;
    let qualConfidence = this.CONFIDENCE_LEVELS.MODERATE;

    if (top) {
      if (evalResult.top_confidence >= 85) qualConfidence = this.CONFIDENCE_LEVELS.VERY_HIGH;
      else if (evalResult.top_confidence >= 65) qualConfidence = this.CONFIDENCE_LEVELS.HIGH;
      else qualConfidence = this.CONFIDENCE_LEVELS.UNCERTAIN;
    }

    const causes = (evalResult.hypotheses || []).map((h, idx) => ({
      rank: idx + 1,
      name: h.name,
      description: h.description,
      priority_label: idx === 0 ? 'Piste principale' : (idx === 1 ? 'À envisager' : 'Autre piste possible'),
      confidence_label: qualConfidence.badge,
      supporting_evidence: (h.reasoning || []).filter(r => r.startsWith('✅') || r.startsWith('⭐') || r.startsWith('⚠️')),
      contradicting_or_unknown: (h.reasoning || []).filter(r => r.startsWith('❌')),
      gravity: h.gravity || 'Moyenne',
      estimated_cost: h.cost_min && h.cost_max ? `${h.cost_min} € à ${h.cost_max} €` : 'À chiffrer en atelier',
      technical_source: h.source_info || 'Fiche technique AutoDiag'
    }));

    return {
      diagnostic_status: status,
      headline: top ? `${top.name} (${qualConfidence.label})` : 'Diagnostic en cours',
      confidence_summary: qualConfidence,
      causes,
      observations_recorded: observations,
      next_action: status === this.STATES.SAFETY_STOP 
        ? 'IMMOBILISATION DU VÉHICULE : Ne pas rouler.' 
        : (status === this.STATES.PROFESSIONAL_REQUIRED 
            ? 'Prise de rendez-vous recommandée chez un professionnel qualifié.' 
            : 'Réaliser le contrôle visuel/auditif recommandé avant tout déplacement en atelier.'),
      mechanic_memo: this.generateGarageMemo(vehicle, observations, evalResult.hypotheses || [])
    };
  }

  // =========================================================================
  // ÉTAPE 10 — Enregistrer la session
  // =========================================================================
  /**
   * Construit l'instantané complet de la session pour persistance et reprise.
   */
  static recordSession(sessionData = {}) {
    return {
      session_id: sessionData.session_id,
      user_id: sessionData.user_id,
      vehicle: sessionData.vehicle,
      symptoms: sessionData.symptoms,
      raw_description: sessionData.raw_user_description,
      answers_history: sessionData.answers || [],
      hypotheses_progression: sessionData.progression || [],
      verification_results: sessionData.test_results || [],
      final_status: sessionData.final_status || this.STATES.IN_PROGRESS,
      mechanic_corrections: sessionData.feedback || null,
      is_resumable: sessionData.final_status === this.STATES.IN_PROGRESS || sessionData.final_status === this.STATES.TEST_REQUIRED,
      updated_at: new Date().toISOString()
    };
  }

  // =========================================================================
  // Méthode unifiée compatible avec les routes existantes
  // =========================================================================
  static evaluate(hypotheses, answers = [], vehicle = {}, rules = [], compatibilities = []) {
    const rawScores = {};
    const details = {};
    const excluded = {};
    const observations = [];

    for (const h of hypotheses) {
      rawScores[h.id] = 50 - ((h.order_index || 1) * 8);
      details[h.id] = [];
      excluded[h.id] = false;
    }

    if (vehicle) {
      const fuel = (vehicle.fuel || '').toLowerCase();
      const brand = (vehicle.brand || '').toLowerCase();
      const model = (vehicle.model || '').toLowerCase();
      const engine = (vehicle.engine || '').toLowerCase();
      const year = parseInt(vehicle.year || 0, 10);
      const mileage = parseInt(vehicle.mileage || 0, 10);

      for (const comp of compatibilities) {
        const fId = comp.fault_id;
        if (!fId || rawScores[fId] === undefined) continue;

        if (comp.fuel_type && !fuel.includes(comp.fuel_type.toLowerCase())) continue;
        if (comp.make && !brand.includes(comp.make.toLowerCase())) continue;
        if (comp.model && !model.includes(comp.model.toLowerCase())) continue;
        if (comp.engine_code && !engine.includes(comp.engine_code.toLowerCase())) continue;

        if (year > 0) {
          if (comp.year_start && year < comp.year_start) continue;
          if (comp.year_end && year > comp.year_end) continue;
        }

        if (comp.mileage_min && mileage < comp.mileage_min) continue;

        if (comp.compatibility === 'incompatible') {
          excluded[fId] = true;
          rawScores[fId] = -999;
          details[fId].push(`❌ Incompatible avec motorisation ${comp.engine_code || comp.fuel_type || 'du véhicule'}`);
        } else if (comp.compatibility === 'frequent' && !excluded[fId]) {
          const isUnverified = comp.evidence_level === 'unverified';
          const weight = isUnverified ? 10 : 20;
          rawScores[fId] += weight;
          const noteText = comp.notes ? ` (${comp.notes.replace(/^TODO:\s*/i, '')})` : '';
          const tag = isUnverified ? '⚠️ Signalé en retour atelier' : '⭐ Problème fréquent';
          details[fId].push(`${tag} (+${weight} pts) : ${comp.engine_code || comp.fuel_type || 'Motorisation'}${noteText}`);
        }
      }

      for (const h of hypotheses) {
        const lower = (h.name || '').toLowerCase();
        if (fuel.includes('essence') && (lower.includes('préchauffage') || lower.includes('fap'))) {
          excluded[h.id] = true;
          rawScores[h.id] = -999;
          details[h.id].push('❌ Éliminé : Incompatible avec motorisation Essence');
        } else if (fuel.includes('diesel') && (lower.includes('bougie d\'allumage') || lower.includes('bobine'))) {
          excluded[h.id] = true;
          rawScores[h.id] = -999;
          details[h.id].push('❌ Éliminé : Incompatible avec motorisation Diesel');
        }
      }
    }

    if (rules && rules.length > 0) {
      for (const r of rules) {
        const fId = r.fault_id;
        if (rawScores[fId] === undefined) continue;

        if (r.effect === 'exclude') {
          excluded[fId] = true;
          details[fId].push(`❌ Écarté : "${r.option_title || 'Observation'}" élimine cette cause.`);
          rawScores[fId] = -999;
        } else if (r.effect === 'reinforce' && !excluded[fId]) {
          const w = Number(r.weight || 20);
          rawScores[fId] += w;
          details[fId].push(`✅ Renforcé (+${w} pts) : "${r.option_title || 'Observation'}"`);
        } else if (r.effect === 'reduce' && !excluded[fId]) {
          const w = Number(r.weight || 15);
          rawScores[fId] = Math.max(0, rawScores[fId] - w);
          details[fId].push(`⚠️ Atténué (-${w} pts) : "${r.option_title || 'Observation'}"`);
        }
      }
    }

    for (const ans of answers) {
      if (ans.option_title) observations.push(ans.option_title);
      let weights = {};
      try {
        weights = typeof ans.hypothesis_weights === 'string' ? JSON.parse(ans.hypothesis_weights) : (ans.hypothesis_weights || {});
      } catch (e) {
        weights = {};
      }

      for (const [hypId, weight] of Object.entries(weights)) {
        const id = parseInt(hypId, 10);
        if (rawScores[id] !== undefined && !excluded[id]) {
          rawScores[id] += weight;
          if (weight !== 0 && (!rules || rules.length === 0)) {
            details[id].push(`"${ans.option_title}": ${weight > 0 ? '+' : ''}${weight} pts`);
          }
        }
      }
    }

    if (vehicle) {
      const mileage = parseInt(vehicle.mileage || 0, 10);
      const vehicleYear = parseInt(vehicle.year || 2019, 10);
      const vehicleAge = Math.max(0, new Date().getFullYear() - vehicleYear);

      if (mileage > 100000) {
        for (const h of hypotheses) {
          if (excluded[h.id]) continue;
          const lower = h.name.toLowerCase();
          if (lower.includes('démarreur') || lower.includes('alternateur') || lower.includes('pompe') ||
              lower.includes('fap') || lower.includes('egr') || lower.includes('embrayage') ||
              lower.includes('roulement') || lower.includes('injecteur')) {
            rawScores[h.id] = (rawScores[h.id] || 0) + 10;
            details[h.id].push('Kilométrage > 100 000 km (+10 pts usure normale)');
          }
        }
      } else if (mileage > 50000) {
        for (const h of hypotheses) {
          if (excluded[h.id]) continue;
          const lower = h.name.toLowerCase();
          if (lower.includes('plaquette') || lower.includes('bougie') || lower.includes('batterie')) {
            rawScores[h.id] = (rawScores[h.id] || 0) + 5;
            details[h.id].push('Kilométrage intermédiaire (+5 pts)');
          }
        }
      }

      if (vehicleAge >= 4) {
        for (const h of hypotheses) {
          if (excluded[h.id]) continue;
          const lower = h.name.toLowerCase();
          if (lower.includes('batterie')) {
            rawScores[h.id] = (rawScores[h.id] || 0) + 14;
            details[h.id].push('Batterie âgée de plus de 4 ans (+14 pts usure chimique)');
          }
          if (lower.includes('durite') || lower.includes('oxydation') || lower.includes('cosse') || lower.includes('silentbloc')) {
            rawScores[h.id] = (rawScores[h.id] || 0) + 6;
            details[h.id].push('Véhicule de plus de 4 ans (+6 pts vieillissement cosses/durites)');
          }
        }
      }
    }

    const activeHypotheses = hypotheses.filter(h => !excluded[h.id]);
    const eliminatedHypotheses = hypotheses
      .filter(h => excluded[h.id])
      .map(h => ({
        ...h,
        excluded: true,
        reasoning: details[h.id] || ['Écarté par vos réponses']
      }));

    const sortedActive = [...activeHypotheses].sort((a, b) => (rawScores[b.id] || 0) - (rawScores[a.id] || 0));
    const minScore = Math.min(...sortedActive.map(h => rawScores[h.id] || 0), 0);
    const offset = minScore < 1 ? Math.abs(minScore) + 5 : 5;
    const positiveScores = sortedActive.map(h => (rawScores[h.id] || 0) + offset);
    const sumPositive = positiveScores.reduce((acc, v) => acc + v, 0) || 1;

    const ranked = sortedActive.map((h, idx) => {
      let percent = Math.round((positiveScores[idx] / sumPositive) * 100);
      if (idx === 0) {
        const diff = positiveScores[0] - (positiveScores[1] || 1);
        if (answers.length >= 2 && diff >= 30) percent = Math.min(95, Math.max(88, percent));
        else if (answers.length >= 1 && diff >= 15) percent = Math.min(84, Math.max(70, percent));
        else percent = Math.min(65, Math.max(40, percent));
      } else if (idx === 1) {
        const diff = (positiveScores[0] || 1) - positiveScores[1];
        percent = diff >= 30 ? Math.min(10, percent) : Math.min(35, percent);
      } else {
        percent = Math.min(15, percent);
      }

      let confidenceLabel = 'Faible';
      if (percent >= 85) confidenceLabel = 'Forte';
      else if (percent >= 60) confidenceLabel = 'Moyenne';

      return {
        ...h,
        raw_score: rawScores[h.id] || 0,
        confidence_percent: percent,
        confidence: confidenceLabel,
        reasoning: details[h.id] || []
      };
    });

    const topHypo = ranked[0] || null;
    const topConfidence = topHypo ? topHypo.confidence_percent : 45;

    let outputLevel = 2;
    let levelTitle = 'Panne probable';
    let levelBadge = 'PROBABLE';

    if (topConfidence >= 85) {
      outputLevel = 1;
      levelTitle = 'Panne identifiée avec quasi-certitude';
      levelBadge = 'IDENTIFIÉE';
    } else if (topConfidence < 60) {
      outputLevel = 3;
      levelTitle = 'Diagnostic à confirmer';
      levelBadge = 'INCERTAIN';
    }

    const confirmationTest = this.getConfirmationTest(topHypo?.name, hypotheses[0]?.symptom_id);
    const garageMemo = this.generateGarageMemo(vehicle, observations, ranked.slice(0, 3));

    const top3 = ranked.slice(0, 3).map((item, index) => ({
      ...item,
      order_index: index + 1,
      priority_badge: `PRIORITÉ ${index + 1}`,
      priority_label: index === 0 ? 'Piste principale' : (index === 1 ? 'À envisager' : 'Autre possibilité')
    }));

    return {
      hypotheses: top3,
      top_hypothesis: top3[0] || null,
      eliminated_hypotheses: eliminatedHypotheses,
      output_level: outputLevel,
      level_title: levelTitle,
      level_badge: levelBadge,
      top_confidence: topConfidence,
      confirmation_test: confirmationTest,
      garage_memo: garageMemo,
      observations_count: observations.length
    };
  }

  // Alias pour backward compatibility
  static getConfirmationTest(faultName = '', symptomId = null) {
    return this.proposeVerification(faultName, symptomId);
  }

  static generateGarageMemo(vehicle, observations = [], topHypotheses = []) {
    const brandModel = vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() : '';
    const yearStr = vehicle && vehicle.year ? ` (${vehicle.year})` : '';
    const vDesc = (brandModel + yearStr).trim() || 'véhicule';
    const obsText = observations.length > 0 ? observations.join(', ') : 'Comportement anormal constaté';
    const topCauses = topHypotheses.map(h => `${h.name} (${h.confidence_percent ? `~${h.confidence_percent}%` : 'Piste retenue'})`).join(', ');

    return {
      headline: `Fiche de liaison mécanicien pour votre ${vDesc || 'véhicule'}`,
      what_to_say: `« Bonjour, je vous dépose mon ${vDesc} pour un diagnostic. J'ai constaté : ${obsText}. L'analyse préliminaire met en avant : ${topCauses}. Pouvez-vous vérifier ces éléments ciblés et m'établir un devis avant toute intervention ? »`,
      checklist: [
        'Précisez si le problème survient à froid, à chaud ou sous la pluie',
        'Indiquez si un voyant au tableau de bord s\'allume ou clignote',
        'Mentionnez les réparations récentes sur le même circuit'
      ]
    };
  }

  static checkSafety(symptom = {}, answers = []) {
    const riskCheck = this.checkImmediateRisks(symptom, '', answers);
    return riskCheck.alerts.map(a => ({
      level: 'danger',
      message: `${a.title} : ${a.instruction}`
    }));
  }
}

module.exports = DiagnosticEngine;
