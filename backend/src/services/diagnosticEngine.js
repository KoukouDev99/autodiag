/**
 * AutoDiag Diagnostic Engine V4 - Optimized
 * Implements:
 * 1. Adaptive Information-Gain / Maximum-Contrast question selection
 * 2. Early stopping criteria (>= 85% calibrated confidence & decisive margin)
 * 3. Contextual priors (Vehicle age, mileage, fuel type Diesel/Essence/Hybrid)
 * 4. Graceful handling of "Je ne sais pas" options
 * 5. Comprehensive non-technical confirmation tests across all 9 symptoms
 * 6. Tailored mechanic liaison memo ("Quoi dire au garagiste")
 */

class DiagnosticEngine {
  /**
   * Calculate scores for hypotheses based on the session and answers
  /**
   * Calculate scores for hypotheses based on the session, answers, deterministic rules, and vehicle specs
   * @param {Array} hypotheses List of base hypotheses/faults for the symptom
   * @param {Array} answers User selected answers with hypothesis_weights or option IDs
   * @param {Object} vehicle Vehicle specifications (year, fuel, mileage, etc.)
   * @param {Array} rules Deterministic diagnostic rules triggered by user answers (effect: reinforce, reduce, exclude)
   * @param {Array} compatibilities Vehicle-fault compatibility overrides
   */
  static evaluate(hypotheses, answers = [], vehicle = {}, rules = [], compatibilities = []) {
    const rawScores = {};
    const details = {};
    const excluded = {};
    const observations = [];

    // 1. Initialize base scores from order_index (prior baseline)
    for (const h of hypotheses) {
      rawScores[h.id] = 50 - ((h.order_index || 1) * 8);
      details[h.id] = [];
      excluded[h.id] = false;
    }

    // 2. Apply vehicle powertrain compatibilities (fault_vehicles)
    if (vehicle) {
      const fuel = (vehicle.fuel || '').toLowerCase();
      for (const comp of compatibilities) {
        if (comp.fault_id && rawScores[comp.fault_id] !== undefined) {
          if (comp.compatibility === 'incompatible') {
            // Only apply if the rule matches this vehicle's fuel type
            if (comp.fuel_type && !fuel.includes(comp.fuel_type.toLowerCase())) {
              continue;
            }
            excluded[comp.fault_id] = true;
            rawScores[comp.fault_id] = -999;
            details[comp.fault_id].push(`❌ Incompatible avec motorisation ${comp.fuel_type || 'du véhicule'}`);
          }
        }
      }

      // Hard vehicle physics constraints (Diesel vs Essence)
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

    // 3. Apply Deterministic Diagnostic Rules (diagnostic_rules: reinforce, reduce, exclude)
    if (rules && rules.length > 0) {
      for (const r of rules) {
        const fId = r.fault_id;
        if (rawScores[fId] === undefined) continue;

        if (r.effect === 'exclude') {
          // Progressive Elimination: Fault is discarded
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

    // 4. Apply weights from user answers (backward compatibility / options weights)
    for (const ans of answers) {
      if (ans.option_title) {
        observations.push(ans.option_title);
      }

      let weights = {};
      try {
        weights = typeof ans.hypothesis_weights === 'string' 
          ? JSON.parse(ans.hypothesis_weights) 
          : (ans.hypothesis_weights || {});
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

    // 5. Vehicle context modifier (Priors: Kilométrage, Âge)
    if (vehicle) {
      const mileage = parseInt(vehicle.mileage || 0, 10);
      const vehicleYear = parseInt(vehicle.year || 2019, 10);
      const vehicleAge = Math.max(0, new Date().getFullYear() - vehicleYear);

      // Mileage wear factors
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

      // Age factors
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

    // 6. Separate Active vs Eliminated Hypotheses
    const activeHypotheses = hypotheses.filter(h => !excluded[h.id]);
    const eliminatedHypotheses = hypotheses
      .filter(h => excluded[h.id])
      .map(h => {
        const reas = details[h.id] || ['Écarté par vos réponses'];
        const sortedReasons = [...reas].sort((a, b) => {
          if (a.startsWith('❌') && !b.startsWith('❌')) return -1;
          if (!a.startsWith('❌') && b.startsWith('❌')) return 1;
          return 0;
        });
        return {
          ...h,
          excluded: true,
          reasoning: sortedReasons
        };
      });

    const sortedActive = [...activeHypotheses].sort((a, b) => (rawScores[b.id] || 0) - (rawScores[a.id] || 0));

    // Shift minimum scores to positive for sensible probability distribution
    const minScore = Math.min(...sortedActive.map(h => rawScores[h.id] || 0), 0);
    const offset = minScore < 1 ? Math.abs(minScore) + 5 : 5;
    const positiveScores = sortedActive.map(h => (rawScores[h.id] || 0) + offset);
    const sumPositive = positiveScores.reduce((acc, v) => acc + v, 0) || 1;

    const ranked = sortedActive.map((h, idx) => {
      let percent = Math.round((positiveScores[idx] / sumPositive) * 100);

      // Calibration rules:
      if (idx === 0) {
        const runnerUpScore = positiveScores[1] || 1;
        const diff = positiveScores[0] - runnerUpScore;
        const answersCount = answers.length;

        if (answersCount >= 2 && diff >= 30) {
          percent = Math.min(95, Math.max(88, percent));
        } else if (answersCount >= 1 && diff >= 15) {
          percent = Math.min(84, Math.max(70, percent));
        } else {
          percent = Math.min(65, Math.max(40, percent));
        }
      } else if (idx === 1) {
        const topP = positiveScores[0] || 1;
        const diff = topP - positiveScores[1];
        if (diff >= 30) {
          percent = Math.min(10, percent);
        } else {
          percent = Math.min(35, percent);
        }
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

    // 7. Determine Output Level (Principe 8)
    const topHypothesis = ranked[0] || null;
    const topConfidence = topHypothesis ? topHypothesis.confidence_percent : 45;

    let outputLevel = 2; // Default Probable (60-84%)
    let levelTitle = 'Panne probable';
    let levelBadge = 'PROBABLE';

    if (topConfidence >= 85) {
      outputLevel = 1; // High Confidence
      levelTitle = 'Panne identifiée avec quasi-certitude';
      levelBadge = 'IDENTIFIÉE';
    } else if (topConfidence < 60) {
      outputLevel = 3; // Uncertain / Multiple possibilities
      levelTitle = 'Diagnostic à confirmer';
      levelBadge = 'INCERTAIN';
    }

    // Attach confirmation test and garage memo
    const confirmationTest = this.getConfirmationTest(topHypothesis?.name, hypotheses[0]?.symptom_id);
    const garageMemo = this.generateGarageMemo(vehicle, observations, ranked.slice(0, 3));

    // Priority badges (Top 3 active)
    const top3 = ranked.slice(0, 3).map((item, index) => {
      let priorityBadge = `PRIORITÉ ${index + 1}`;
      let priorityLabel = 'Autre possibilité';
      if (index === 0) priorityLabel = 'Piste principale';
      else if (index === 1) priorityLabel = 'À envisager';

      return {
        ...item,
        order_index: index + 1,
        priority_badge: priorityBadge,
        priority_label: priorityLabel
      };
    });

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

  /**
   * Adaptive Question Selection Algorithm:
   * 1. Checks if last answer triggered an explicit `next_question_id` (Rule Branching)
   * 2. Checks Early Stopping criteria (>= 85% confidence & decisive margin)
   * 3. Selects the question with maximum Information-Gain / Contrast on ACTIVE (non-excluded) faults
   */
  static selectNextQuestion(unansweredQuestions = [], evalResult = {}, answersCount = 0, lastAnswerRules = []) {
    if (!unansweredQuestions || unansweredQuestions.length === 0) {
      return { shouldStopEarly: true, selectedQuestion: null, reason: 'all_questions_answered' };
    }

    // 1. Check if a rule explicitly specified a targeted next question (Deterministic Branching)
    if (lastAnswerRules && lastAnswerRules.length > 0) {
      const explicitNextRule = lastAnswerRules.find(r => r.next_question_id);
      if (explicitNextRule) {
        const targetedQ = unansweredQuestions.find(q => q.id === explicitNextRule.next_question_id);
        if (targetedQ) {
          return {
            shouldStopEarly: false,
            selectedQuestion: targetedQ,
            reason: 'targeted_rule_branch'
          };
        }
      }
    }

    // 2. Check Early Stopping Criteria:
    // If the top active hypothesis has achieved >= 85% confidence after at least 2 questions
    const topHypothesis = evalResult.top_hypothesis;
    const topConfidence = evalResult.top_confidence || 0;
    const runnerUp = (evalResult.hypotheses && evalResult.hypotheses[1]) ? evalResult.hypotheses[1] : null;

    if (answersCount >= 2 && topConfidence >= 85) {
      const margin = topConfidence - (runnerUp ? runnerUp.confidence_percent : 0);
      if (margin >= 25) {
        return {
          shouldStopEarly: true,
          selectedQuestion: null,
          reason: 'high_confidence_reached'
        };
      }
    }

    // If only 1 question remaining, return it
    if (unansweredQuestions.length === 1) {
      return {
        shouldStopEarly: false,
        selectedQuestion: unansweredQuestions[0],
        reason: 'last_remaining_question'
      };
    }

    // 3. Information-Gain / Contrast Maximization on Active Hypotheses:
    const h1Id = topHypothesis ? topHypothesis.id : null;
    const h2Id = runnerUp ? runnerUp.id : null;

    let bestQuestion = unansweredQuestions[0];
    let maxDiscriminationScore = -Infinity;

    for (const q of unansweredQuestions) {
      const options = q.options || [];
      let maxOptionContrast = 0;
      let totalVariance = 0;

      for (const opt of options) {
        let weights = {};
        try {
          weights = typeof opt.hypothesis_weights === 'string'
            ? JSON.parse(opt.hypothesis_weights)
            : (opt.hypothesis_weights || {});
        } catch (e) {
          weights = {};
        }

        // Contrast between top 2 competing active hypotheses
        if (h1Id && h2Id) {
          const w1 = weights[h1Id] || 0;
          const w2 = weights[h2Id] || 0;
          const contrast = Math.abs(w1 - w2);
          if (contrast > maxOptionContrast) {
            maxOptionContrast = contrast;
          }
        }

        const weightVals = Object.values(weights);
        if (weightVals.length > 0) {
          const maxW = Math.max(...weightVals);
          const minW = Math.min(...weightVals);
          totalVariance += (maxW - minW);
        }
      }

      // Sensory test bonus (observation or action tests prioritized)
      let testBonus = 0;
      if (q.test_type === 'action' || q.test_type === 'observation') {
        testBonus = 5;
      }

      // Order tie breaker
      const orderBonus = Math.max(0, 10 - (q.step_num || 1));
      const discriminationScore = (maxOptionContrast * 2) + totalVariance + testBonus + orderBonus;

      if (discriminationScore > maxDiscriminationScore) {
        maxDiscriminationScore = discriminationScore;
        bestQuestion = q;
      }
    }

    return {
      shouldStopEarly: false,
      selectedQuestion: bestQuestion,
      reason: 'max_contrast_selected'
    };
  }

  /**
   * Sensory confirmation test for non-technical users
   * Covers all 9 cardinal symptoms & top mechanical components
   */
  static getConfirmationTest(faultName = '', symptomId = null) {
    const name = (faultName || '').toLowerCase();

    // 1. Démarrage & Électrique
    if (name.includes('batterie')) {
      return {
        title: 'Test d\'effondrement des phares (sans outil)',
        action: 'Allumez vos feux de croisement ou le plafonnier, puis essayez de tourner la clé de contact.',
        expected: 'Si les phares s\'éteignent net ou faiblissent comme une bougie au coup de clé, la batterie est à plat.',
        tools: 'Aucun outil (observation visuelle immédiate)'
      };
    }

    if (name.includes('démarreur') || name.includes('solénoïde')) {
      return {
        title: 'Test d\'écoute du claquement sec',
        action: 'Baissez la vitre conducteur, tendez l\'oreille et actionnez la clé à fond.',
        expected: 'Si vous entendez un simple "clac" métallique sec sans aucun mouvement moteur et avec des phares bien vifs, le démarreur ou son solénoïde est bloqué.',
        tools: 'Aucun outil (test auditif)'
      };
    }

    if (name.includes('alternateur')) {
      return {
        title: 'Test du voyant batterie moteur tournant',
        action: 'Après avoir démarré (ou avec câbles de secours), laissez tourner le moteur au ralenti.',
        expected: 'Si le voyant batterie rouge reste allumé au combiné, l\'alternateur ne débite plus de courant de charge.',
        tools: 'Observation du tableau de bord'
      };
    }

    if (name.includes('cosse') || name.includes('oxyd')) {
      return {
        title: 'Inspection visuelle et tactile des bornes',
        action: 'Moteur éteint, ouvrez le capot et essayez de faire bouger les cosses de batterie à la main.',
        expected: 'Les cosses doivent être rigides et sans poudre blanchâtre. Si elles tournent ou bougent, resserrez-les simplement.',
        tools: 'Gants de protection'
      };
    }

    // 2. Allumage & Injection
    if (name.includes('bougie') || name.includes('bobine') || name.includes('allumage')) {
      return {
        title: 'Test des vibrations au ralenti et à l\'accélération',
        action: 'Moteur allumé au point mort, posez vos mains sur le volant et donnez un coup d\'accélérateur doux.',
        expected: 'Des secousses rythmées ou un moteur qui "tourne sur 3 pattes" confirment un raté d\'allumage sur un cylindre.',
        tools: 'Ressenti tactile sans outil'
      };
    }

    if (name.includes('pompe') || name.includes('gavage') || name.includes('carburant')) {
      return {
        title: 'Test du sifflement de gavage arrière',
        action: 'Dans un endroit calme, mettez le contact (voyants allumés) sans lancer le démarreur.',
        expected: 'Vous devez entendre un léger "bzzzz" électrique de 2 secondes sous la banquette arrière. Si silence total, la pompe est muette.',
        tools: 'Test auditif au contact'
      };
    }

    // 3. Freinage
    if (name.includes('plaquette') || name.includes('disque')) {
      return {
        title: 'Contrôle visuel à travers la jante & test auditif',
        action: 'Roues braquées à l\'arrêt, éclairez l\'étrier de frein à travers les branches de la jante.',
        expected: 'La garniture doit mesurer au moins 3 mm d\'épaisseur. Si vous entendez un grincement de métal contre métal en freinant, la garniture est à zéro.',
        tools: 'Lampe torche de smartphone'
      };
    }

    if (name.includes('liquide de frein') || name.includes('bulle') || name.includes('maître-cylindre')) {
      return {
        title: 'Test d\'enfoncement de la pédale de frein à l\'arrêt',
        action: 'Moteur tournant à l\'arrêt, appuyez fermement et maintenez le pied sur la pédale de frein.',
        expected: 'La pédale doit rester dure et fixe. Si elle s\'enfonce lentement jusqu\'au plancher, il y a une fuite ou de l\'air dans le circuit.',
        tools: 'Aucun outil (test pédale)'
      };
    }

    // 4. Fumée & Moteur
    if (name.includes('culasse') || name.includes('fumée blanche')) {
      return {
        title: 'Test du bouchon d\'huile (recherche de mayonnaise)',
        action: 'Moteur froid, dévissez le bouchon de remplissage d\'huile moteur et retournez-le.',
        expected: 'La présence d\'une émulsion beigeâtre pâteuse (façon mayonnaise) indique le passage de liquide de refroidissement dans l\'huile.',
        tools: 'Chiffon propre'
      };
    }

    if (name.includes('turbo') || name.includes('fumée bleue') || name.includes('huile')) {
      return {
        title: 'Contrôle de la jauge à huile et de l\'odeur d\'échappement',
        action: 'Tirez la jauge d\'huile sur sol plat moteur froid, puis sentez l\'odeur à l\'arrière du véhicule en marche.',
        expected: 'Une baisse rapide du niveau d\'huile associée à une odeur acre d\'huile brûlée confirme une fuite au niveau du turbo ou des joints de queue de soupape.',
        tools: 'Essuie-tout'
      };
    }

    if (name.includes('egr') || name.includes('fap') || name.includes('fumée noire')) {
      return {
        title: 'Test de réactivité sous accélération franche',
        action: 'En 3ème vitesse sur voie dégagée, accélérez à fond entre 2000 et 3000 tr/min.',
        expected: 'Un trou à l\'accélération accompagné d\'un panache noir dans le rétroviseur indique un encrassement de la vanne EGR ou du filtre à particules.',
        tools: 'Observation en conduite'
      };
    }

    // 5. Refroidissement & Surchauffe
    if (name.includes('calorstat') || name.includes('thermostat') || name.includes('surchauffe')) {
      return {
        title: 'Test tactile de température de la durite de radiateur',
        action: 'Moteur tiède (quelques minutes après démarrage), touchez avec précaution la grosse durite supérieure allant au radiateur.',
        expected: 'Si le moteur est très chaud mais que la durite et le radiateur restent froids, le calorstat est bloqué fermé et empêche la circulation.',
        tools: 'Gants de protection thermique'
      };
    }

    if (name.includes('ventilateur')) {
      return {
        title: 'Test du ventilateur avec la climatisation',
        action: 'Moteur tournant à l\'arrêt, activez la climatisation au maximum.',
        expected: 'Le motoventilateur devant le radiateur doit s\'enclencher dans les 15 secondes. S\'il ne tourne pas, le ventilateur ou son relais est défaillant.',
        tools: 'Observation capot ouvert'
      };
    }

    // 6. Bruits anormaux & Châssis
    if (name.includes('roulement')) {
      return {
        title: 'Test de variation acoustique en appui',
        action: 'En roulant à 70 km/h sur route dégagée, effectuez de légers zigzags gauche/droite.',
        expected: 'Si le bourdonnement sourd s\'accentue quand vous virez d\'un côté et disparaît de l\'autre, le roulement de la roue en appui est fatigué.',
        tools: 'Test auditif dynamique'
      };
    }

    if (name.includes('cardan')) {
      return {
        title: 'Test du braquage complet à basse vitesse',
        action: 'Sur un parking plat, braquez les roues à fond et avancez doucement en première.',
        expected: 'Des claquements réguliers ("clac-clac-clac") en tournant indiquent un soufflet de cardan percé et une articulation à billes usée.',
        tools: 'Essai dynamique'
      };
    }

    if (name.includes('courroie')) {
      return {
        title: 'Test de l\'eau sur la courroie d\'accessoires',
        action: 'Moteur au ralenti froid émettant un couinement aigu, vaporisez quelques gouttes d\'eau claire sur la courroie.',
        expected: 'Si le couinement disparaît instantanément pendant quelques secondes avant de revenir, la courroie est détendue ou glacée.',
        tools: 'Un peu d\'eau'
      };
    }

    // Fallback universel
    return {
      title: 'Contrôle visuel sous le capot',
      action: 'Moteur froid, ouvrez le capot et inspectez les câbles, durites et raccords visibles.',
      expected: 'Vérifiez l\'absence de câbles desserrés, de traces d\'oxydation blanche ou de fuite de liquide anormale.',
      tools: 'Lampe torche de smartphone'
    };
  }

  /**
   * Generates a clear mechanic liaison memo (Principe 7 & 8: "Dis à ton garagiste")
   */
  static generateGarageMemo(vehicle, observations = [], topHypotheses = []) {
    const vDesc = vehicle ? `${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.year || ''})`.trim() : 'Mon véhicule';
    const obsText = observations.length > 0 ? observations.join(', ') : 'Comportement anormal constaté';
    const topCauses = topHypotheses.map(h => `${h.name} (~${h.confidence_percent}%)`).join(', ');

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

  /**
   * Safety guardrails (Principe 6: Alerte danger immédiat)
   */
  static checkSafety(symptom = {}, answers = []) {
    const alerts = [];

    if (symptom.code === 'smoke') {
      alerts.push({
        level: 'danger',
        message: 'Fumée ou odeur anormale : Ne démarrez jamais le véhicule dans un espace clos et n\'insistez pas pour éviter tout départ de feu.'
      });
    }

    if (symptom.code === 'brakes') {
      alerts.push({
        level: 'danger',
        message: 'Sécurité freinage : Ne prenez pas la route si la pédale s\'enfonce anormalement ou si le témoin de frein rouge reste allumé.'
      });
    }

    if (symptom.code === 'overheat') {
      alerts.push({
        level: 'danger',
        message: 'Danger de brûlure : N\'ouvrez JAMAIS le bouchon du vase d\'expansion sur un moteur chaud (risque de projection de liquide bouillant à plus de 100°C).'
      });
    }

    for (const ans of answers) {
      const text = (ans.option_title || '').toLowerCase();
      if (text.includes('brûlé') || text.includes('fumée') || text.includes('pédale molle')) {
        alerts.push({
          level: 'danger',
          message: 'Arrêtez immédiatement : Risque mécanique ou d\'incendie signalé dans vos réponses.'
        });
      }
    }

    return alerts;
  }
}

module.exports = DiagnosticEngine;
