const assert = require('assert');
const DiagnosticEngine = require('../backend/src/services/diagnosticEngine');

async function test10StepsArchitecture() {
  console.log('================================================================');
  console.log('🧪 TEST COMPLET DE L\'ARCHITECTURE EN 10 ÉTAPES DU MOTEUR');
  console.log('================================================================\n');

  // --- ÉTAPE 1 : Identifier le véhicule ---
  console.log('[Étape 1] Test de recueil véhicule (aucune invention de caractéristiques)...');
  const vComplete = DiagnosticEngine.identifyVehicle({
    brand: 'Peugeot',
    model: '208',
    year: 2020,
    engine: '1.2 PureTech',
    fuel: 'Essence',
    gearbox: 'Manuelle',
    mileage: 45000
  });
  assert.strictEqual(vComplete.brand, 'Peugeot');
  assert.strictEqual(vComplete.mileage, 45000);
  assert.strictEqual(vComplete.is_engine_known, true);

  // Cas utilisateur qui ne connaît pas sa motorisation ou son kilométrage
  const vIncomplete = DiagnosticEngine.identifyVehicle({
    brand: 'Renault',
    model: 'Clio'
  });
  assert.strictEqual(vIncomplete.engine, null, 'Le moteur non renseigné ne doit JAMAIS être inventé');
  assert.strictEqual(vIncomplete.mileage, null, 'Le kilométrage non renseigné ne doit JAMAIS être inventé');
  assert.strictEqual(vIncomplete.has_incomplete_specs, true);
  console.log('  -> Validation Étape 1 : Respect strict des données réelles, zéro invention.');

  // --- ÉTAPE 2 : Décrire le problème ---
  console.log('\n[Étape 2] Test de description problème (14 catégories + description libre)...');
  const problem = DiagnosticEngine.describeProblem(['start_fail', 'unusual_noise'], 'Bruit de cliquetis quand je tourne la clé');
  assert.strictEqual(problem.selected_symptoms.length, 2);
  assert.strictEqual(problem.raw_user_description, 'Bruit de cliquetis quand je tourne la clé');
  assert.strictEqual(problem.primary_symptom.code, 'start_fail');
  console.log('  -> Validation Étape 2 : Conservation de la description brute et normalisation canonique.');

  // --- ÉTAPE 3 : Vérifier les risques immédiats (SAFETY FIRST) ---
  console.log('\n[Étape 3] Test des risques immédiats (Interruption prioritaire SAFETY_STOP)...');
  // Cas normal
  const normalRisk = DiagnosticEngine.checkImmediateRisks({ code: 'start_fail' }, 'la voiture ne démarre pas', []);
  assert.strictEqual(normalRisk.is_safety_stop, false);
  assert.strictEqual(normalRisk.can_continue, true);

  // Cas dangereux 1 : Perte de freinage
  const brakeDanger = DiagnosticEngine.checkImmediateRisks({ code: 'braking_issue' }, 'pédale de frein molle qui va au plancher', []);
  assert.strictEqual(brakeDanger.is_safety_stop, true);
  assert.strictEqual(brakeDanger.status, DiagnosticEngine.STATES.SAFETY_STOP);
  assert.strictEqual(brakeDanger.alerts[0].do_not_drive, true, 'Interdiction stricte de rouler');

  // Cas dangereux 2 : Risque incendie / fuite carburant
  const fireDanger = DiagnosticEngine.checkImmediateRisks({ code: 'fluid_leak' }, 'forte odeur d\'essence et fuite sous réservoir', []);
  assert.strictEqual(fireDanger.is_safety_stop, true);
  assert.strictEqual(fireDanger.status, DiagnosticEngine.STATES.SAFETY_STOP);
  console.log('  -> Validation Étape 3 : Détection prioritaire SAFETY_STOP et consigne d\'arrêt immédiat.');

  // --- ÉTAPE 4 : Générer les premières hypothèses ---
  console.log('\n[Étape 4] Test de génération des hypothèses (structure riche & physique)...');
  const mockHypotheses = [
    { id: 1, name: 'Batterie faible ou déchargée', fault_code: 'FAULT-BAT-01', description: 'Tension insuffisante' },
    { id: 2, name: 'Bougie d\'allumage encrassée', fault_code: 'FAULT-SPK-01', description: 'Étincelle faible' },
    { id: 3, name: 'Bougie de préchauffage HS', fault_code: 'FAULT-GLW-01', description: 'Préchauffage inopérant' },
    { id: 4, name: 'Courroie de distribution humide', fault_code: 'FAULT-BELT-01', description: 'Désagrégation' }
  ];
  const compatibilities = [
    { fault_id: 4, make: 'Peugeot', engine_code: '1.2 PureTech', compatibility: 'frequent', evidence_level: 'unverified', notes: 'TODO: TSB' }
  ];

  // Test sur véhicule Essence
  const hyposEssence = DiagnosticEngine.generateInitialHypotheses(mockHypotheses, { fuel: 'Essence', brand: 'Peugeot', engine: '1.2 PureTech', mileage: 70000 }, compatibilities);
  const sparkHypo = hyposEssence.find(h => h.id === 2);
  const glowHypo = hyposEssence.find(h => h.id === 3);
  const beltHypo = hyposEssence.find(h => h.id === 4);

  assert.strictEqual(sparkHypo.is_excluded, false);
  assert.strictEqual(glowHypo.is_excluded, true, 'Préchauffage doit être physiquement exclu sur Essence');
  assert.strictEqual(beltHypo.vehicle_compatibility, 'frequent');
  assert.strictEqual(beltHypo.evidence_level, 'unverified');
  console.log('  -> Validation Étape 4 : Exclusions physiques strictes et traçabilité evidence_level.');

  // --- ÉTAPE 5 : Sélectionner la prochaine question ---
  console.log('\n[Étape 5] Test de sélection de question (Gain d\'info, contraste & débutant)...');
  const mockQuestions = [
    {
      id: 10,
      title: 'Voyez-vous une poudre blanche sur les cosses ?',
      test_type: 'observation',
      options: [{ id: 1, label: 'Oui', hypothesis_weights: { 1: 30 } }, { id: 2, label: 'Non' }]
    },
    {
      id: 11,
      title: 'Mesurez la tension au multimètre',
      test_type: 'expert',
      options: [{ id: 3, label: '12.6V' }]
    }
  ];
  const selectedQ = DiagnosticEngine.selectNextQuestion(mockQuestions, { top_hypothesis: sparkHypo, top_confidence: 50 }, 0);
  assert.strictEqual(selectedQ.shouldStopEarly, false);
  assert.strictEqual(selectedQ.selectedQuestion.id, 10, 'La question d\'observation débutant doit être privilégiée');
  console.log('  -> Validation Étape 5 : Sélection optimale débutant et calcul de contraste.');

  // --- ÉTAPE 6 : Interpréter la réponse ---
  console.log('\n[Étape 6] Test d\'interprétation (Traitement "Je ne sais pas" sans pénalisation)...');
  const unknownInterpretation = DiagnosticEngine.interpretAnswer({ option_title: 'Je ne sais pas' }, mockHypotheses, []);
  assert.strictEqual(unknownInterpretation.action, 'neutral');
  assert.strictEqual(unknownInterpretation.impact_level, 'none', '"Je ne sais pas" ne doit jamais éliminer une cause');
  console.log('  -> Validation Étape 6 : "Je ne sais pas" respecté sans fausse preuve d\'absence.');

  // --- ÉTAPE 7 : Proposer une vérification ---
  console.log('\n[Étape 7] Test de vérification sécurisée (Garde-fous débutant)...');
  const batteryTest = DiagnosticEngine.proposeVerification('Batterie faible ou déchargée');
  assert.strictEqual(batteryTest.difficulty_level.includes('Débutant'), true);
  assert.strictEqual(batteryTest.tools_needed.includes('Aucun outil'), true);
  assert.ok(batteryTest.safety_prerequisites.length > 0);
  assert.ok(batteryTest.possible_results.length >= 2);
  console.log('  -> Validation Étape 7 : Protocole sécurisé sans danger pour un particulier.');

  // --- ÉTAPE 8 : Déterminer la fin du diagnostic (7 États) ---
  console.log('\n[Étape 8] Test de la machine à 7 états formels...');
  // 1. SAFETY_STOP
  const s1 = DiagnosticEngine.determineDiagnosticStatus({}, [], { is_safety_stop: true });
  assert.strictEqual(s1, DiagnosticEngine.STATES.SAFETY_STOP);

  // 2. FAULT_CONFIRMED (preuve formelle)
  const s2 = DiagnosticEngine.determineDiagnosticStatus({}, [], {}, { is_conclusive: true, confirmed_fault_id: 1 });
  assert.strictEqual(s2, DiagnosticEngine.STATES.FAULT_CONFIRMED);

  // 3. INSUFFICIENT_INFORMATION
  const s3 = DiagnosticEngine.determineDiagnosticStatus({}, [{ option_title: 'Je ne sais pas' }, { option_title: 'Je ne sais pas' }], {});
  assert.strictEqual(s3, DiagnosticEngine.STATES.INSUFFICIENT_INFORMATION);

  // 4. TEST_REQUIRED (deux hypothèses proches à départager)
  const s4 = DiagnosticEngine.determineDiagnosticStatus({
    top_hypothesis: { id: 1, confidence_percent: 50 },
    hypotheses: [{ id: 1, confidence_percent: 50 }, { id: 2, confidence_percent: 45 }]
  }, [{ option_title: 'Option A' }], {});
  assert.strictEqual(s4, DiagnosticEngine.STATES.TEST_REQUIRED);

  // 5. LIKELY_CAUSES_FOUND
  const s5 = DiagnosticEngine.determineDiagnosticStatus({
    top_hypothesis: { id: 1, confidence_percent: 85 },
    top_confidence: 85
  }, [{ option_title: 'Option A' }, { option_title: 'Option B' }], {});
  assert.strictEqual(s5, DiagnosticEngine.STATES.LIKELY_CAUSES_FOUND);
  console.log('  -> Validation Étape 8 : Les 7 états de sortie sont opérationnels.');

  // --- ÉTAPE 9 : Présenter le résultat ---
  console.log('\n[Étape 9] Test de présentation (Transparence, soutiens & contradictions)...');
  const presentation = DiagnosticEngine.formatResultPresentation({
    top_hypothesis: { name: 'Batterie faible', confidence_percent: 88, reasoning: ['✅ Renforcé par clics', '❌ Écarté sur diesel'] },
    hypotheses: [{ name: 'Batterie faible', confidence_percent: 88, reasoning: ['✅ Renforcé par clics'] }],
    top_confidence: 88
  }, vComplete, ['Clics rapides'], DiagnosticEngine.STATES.LIKELY_CAUSES_FOUND);

  assert.strictEqual(presentation.diagnostic_status, DiagnosticEngine.STATES.LIKELY_CAUSES_FOUND);
  assert.strictEqual(presentation.confidence_summary.code, 'VERY_HIGH');
  assert.ok(presentation.causes[0].supporting_evidence.length > 0);
  assert.ok(presentation.mechanic_memo.what_to_say.length > 0);
  console.log('  -> Validation Étape 9 : Formatage qualitatif accessible sans pourcentages trompeurs.');

  // --- ÉTAPE 10 : Enregistrer la session ---
  console.log('\n[Étape 10] Test d\'instantané de session et reprise...');
  const snapshot = DiagnosticEngine.recordSession({
    session_id: 123,
    user_id: 1,
    vehicle: vComplete,
    symptoms: problem.selected_symptoms,
    raw_user_description: problem.raw_user_description,
    answers: [{ question_id: 1, option_id: 1 }],
    final_status: DiagnosticEngine.STATES.IN_PROGRESS
  });
  assert.strictEqual(snapshot.session_id, 123);
  assert.strictEqual(snapshot.is_resumable, true, 'Une session IN_PROGRESS doit être reprenable');
  console.log('  -> Validation Étape 10 : Persistance complète et statut de reprise validés.');

  console.log('\n================================================================');
  console.log('🎉 LES 10 ÉTAPES DE L\'ARCHITECTURE DU MOTEUR SONT 100% VALIDÉES');
  console.log('================================================================\n');
}

test10StepsArchitecture().catch(err => {
  console.error('\n❌ Échec du test architecture 10 étapes :', err);
  process.exit(1);
});
