import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagnosticService, Question, QuestionOption } from '../../services/diagnostic.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-diagnostic-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, IconComponent],
  templateUrl: './diagnostic-quiz.component.html',
  styleUrls: ['./diagnostic-quiz.component.css']
})
export class DiagnosticQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagnosticService = inject(DiagnosticService);
  translationService = inject(TranslationService);

  sessionId = 1;
  sessionData: any = null;
  currentQuestion: Question | null = null;
  selectedOptionId: number | null = null;
  loading = true;
  submitting = false;

  @ViewChild('observationsSection') observationsSection?: ElementRef<HTMLElement>;

  // Step indicator
  stepNum = 2;
  totalSteps = 5;
  stepCategory = 'Le démarrage';
  progressPercentage = 40;
  showWhyAsk = true;
  isUnknownSelected = false;

  // AI Advisor on Step
  showAiAdvisor = false;
  aiAdvisorQuestion = '';
  aiAdvisorThinking = false;
  aiAdvisorMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  toggleAiAdvisor(): void {
    this.showAiAdvisor = !this.showAiAdvisor;
    if (this.showAiAdvisor && this.aiAdvisorMessages.length === 0) {
      this.initAiAdvisorTip();
    }
  }

  initAiAdvisorTip(): void {
    const isEn = this.translationService.currentLang() === 'en';
    const qTitle = this.translationService.t(this.currentQuestion?.title || 'ce test');
    this.aiAdvisorMessages = [
      {
        role: 'assistant',
        content: isEn
          ? `**AutoDiag AI Tip:** For this test ("${qTitle}"), prioritize gentle observation without forcing. If you hesitate between two observations, describe what you hear or feel below.`
          : `**Conseil AutoDiag IA :** Pour ce test (« ${qTitle} »), privilégiez une observation douce sans forcer. Si vous hésitez entre deux constatations, décrivez-moi ce que vous entendez ou ressentez ci-dessous.`
      }
    ];
  }

  askAiAdvisor(presetQuery?: string): void {
    const query = presetQuery || this.aiAdvisorQuestion;
    if (!query || !query.trim() || this.aiAdvisorThinking) return;

    this.aiAdvisorMessages.push({ role: 'user', content: query.trim() });
    this.aiAdvisorQuestion = '';
    this.aiAdvisorThinking = true;

    const isEn = this.translationService.currentLang() === 'en';
    const qTitle = this.translationService.t(this.currentQuestion?.title || '');

    const payload = {
      message: isEn
        ? `On my vehicle (${this.sessionData?.vehicle_brand || 'Peugeot'} ${this.sessionData?.vehicle_model || '208'}), during the test "${qTitle}", here is my question: ${query.trim()}`
        : `Sur mon véhicule (${this.sessionData?.vehicle_brand || 'Peugeot'} ${this.sessionData?.vehicle_model || '208'}), lors du test "${qTitle}", voici mon interrogation : ${query.trim()}`,
      vehicle: {
        id: 1,
        user_id: 1,
        brand: this.sessionData?.vehicle_brand || 'Peugeot',
        model: this.sessionData?.vehicle_model || '208',
        year: this.sessionData?.vehicle_year || 2019,
        fuel: this.sessionData?.vehicle_fuel || 'Essence',
        engine: '1.2 PureTech',
        mileage: 68420,
        license_plate: '',
        is_primary: true
      },
      language: this.translationService.currentLang()
    };

    this.diagnosticService.chatWithAssistant(payload).subscribe({
      next: (res) => {
        this.aiAdvisorThinking = false;
        const defaultReply = isEn
          ? 'Practical advice: Take no mechanical risks. If you are unsure, select "Inspection not possible without tools".'
          : 'Conseil pratique : Ne prenez aucun risque mécanique. Si vous n’êtes pas certain(e), sélectionnez « Contrôle impossible sans outillage ».';
        this.aiAdvisorMessages.push({
          role: 'assistant',
          content: res.reply || defaultReply
        });
      },
      error: () => {
        this.aiAdvisorThinking = false;
        const errReply = isEn
          ? 'Practical advice: Take no mechanical risks. If the test is ambiguous, choose "Inspection not possible / Insufficient data" to preserve diagnostic integrity.'
          : 'Conseil pratique : Ne prenez aucun risque mécanique. Si le test est ambigu, choisissez « Contrôle impossible / Données insuffisantes » pour préserver l’intégrité du diagnostic.';
        this.aiAdvisorMessages.push({
          role: 'assistant',
          content: errReply
        });
      }
    });
  }

  openFullAssistantWithQuestion(q?: string): void {
    const isEn = this.translationService.currentLang() === 'en';
    const qTitle = this.translationService.t(this.currentQuestion?.title || '');
    const text = q || (isEn ? `I am on diagnostic step: ${qTitle}` : `Je suis sur l'étape de diagnostic : ${qTitle}`);
    this.router.navigate(['/assistant'], { queryParams: { prompt: text } });
  }

  // OEM Guided Troubleshooting Phases
  readonly OEM_PHASES = [
    { id: 1, code: 'context', label: '1. Contexte & Freeze Frame', icon: 'snowflake' },
    { id: 2, code: 'precheck', label: '2. Pré-contrôles sensoriels', icon: 'eye' },
    { id: 3, code: 'targeted', label: '3. Tests différentiels', icon: 'zap' },
    { id: 4, code: 'counter', label: '4. Contre-épreuve', icon: 'multimeter' }
  ];

  get currentPhase(): number {
    if (this.stepNum <= 1) return 1;
    if (this.stepNum === 2) return 2;
    if (this.stepNum === 3) return 3;
    return 4;
  }

  get currentPhaseInfo() {
    return this.OEM_PHASES[this.currentPhase - 1] || this.OEM_PHASES[1];
  }

  get targetSubsystem(): string {
    const title = (this.currentQuestion?.title || '').toLowerCase();
    const desc = (this.currentQuestion?.description || '').toLowerCase();
    if (title.includes('démarre') || title.includes('clic') || desc.includes('batterie') || desc.includes('phare')) {
      return 'Circuit de Puissance & Démarrage (Basse Tension 12V)';
    }
    if (title.includes('bruit') || title.includes('tourne') || title.includes('claquement')) {
      return 'Liaison Mécanique & Train Roulant';
    }
    if (title.includes('fumée') || title.includes('carburant') || title.includes('cale')) {
      return 'Alimentation Carburant & Injection';
    }
    return this.stepCategory || 'Groupe Motopropulseur';
  }

  get targetSpecification(): string {
    if (this.currentPhase === 1) {
      return 'Consigne nominale : Déterminer la plage de régime et température où le défaut est reproductible.';
    }
    if (this.currentPhase === 2) {
      return 'Critère conforme : Tension repos > 12.4V, intégrité des cosses, absence de fuite visible ou sifflement anormal.';
    }
    if (this.currentPhase === 3) {
      return 'Critère conforme : Démarreur entraîné à >200 tr/min sans effondrement de tension sous 10.0V.';
    }
    return 'Validation de contre-épreuve : La commande directe de l’organe doit confirmer la panne sans équivoque.';
  }

  get stepCode(): string {
    return `OEM-STEP 0${this.currentPhase}.${this.stepNum}`;
  }

  defaultReformulation = 'Observez attentivement le comportement des voyants et le bruit sous capot lors de l\'action sur la clé de contact.';
  defaultWhyAsk = 'Cette étape de diagnostic différentiel permet d\'écarter immédiatement l\'hypothèse de batterie pour cibler le démarreur ou le relais de commande.';

  get progressPct(): number {
    return Math.min(100, Math.round((this.stepNum / Math.max(this.totalSteps, 1)) * 100));
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('sessionId');
      if (id) {
        this.sessionId = parseInt(id, 10);
        this.loadQuestion();
      }
    });
  }

  loadQuestion(scrollToObservations = false): void {
    this.loading = true;
    this.diagnosticService.getCurrentQuestion(this.sessionId).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.completed) {
          this.router.navigate(['/results', this.sessionId]);
          return;
        }

        this.sessionData = res.session;
        this.currentQuestion = res.question;
        this.stepNum = res.question.step_num || 2;
        this.totalSteps = res.question.total_steps || 5;
        this.stepCategory = res.question.category || 'Circuit de démarrage';

        if (scrollToObservations) {
          // Sur passage à une nouvelle étape, réinitialise la sélection pour laisser l'utilisateur choisir son observation
          this.selectedOptionId = null;
          this.isUnknownSelected = false;
          this.scrollToObservationsSection();
        } else {
          // Pré-sélection par défaut uniquement au premier chargement
          if (this.currentQuestion?.options && this.currentQuestion.options.length > 0) {
            const defaultOpt = this.currentQuestion.options.find(o => o.is_default);
            this.selectedOptionId = defaultOpt ? defaultOpt.id : this.currentQuestion.options[0].id;
          }
        }
      },
      error: (err) => {
        console.error('Error fetching question:', err);
        this.loading = false;
        this.setupFallbackQuestion(scrollToObservations);
      }
    });
  }

  setupFallbackQuestion(scrollToObservations = false): void {
    this.sessionData = {
      vehicle_brand: 'Peugeot',
      vehicle_model: '208',
      vehicle_year: 2019,
      vehicle_fuel: 'Essence',
      symptom_label: 'Démarrage impossible'
    };
    this.stepNum = 2;
    this.totalSteps = 4;
    this.stepCategory = 'Circuit de charge & démarrage';
    this.currentQuestion = {
      id: 1,
      symptom_id: 1,
      step_num: 2,
      total_steps: 4,
      category: 'Circuit de charge & démarrage',
      title: 'Contrôle sous action démarreur : Réaction du combiné et acoustique capot',
      description: 'Observez la ligne de bordure électrique et le compartiment moteur lors de la tentative de mise en rotation.',
      warning_text: 'Ne tentez pas d’action prolongée (> 5 secondes). En cas d’odeur de surchauffe électrique ou de fumée, coupez immédiatement le contact.',
      why_ask: 'Ce test différentiel permet de dissocier une décharge d\'accumulateur (chute de tension) d\'un blocage de solénoïde ou de charbons de démarreur.',
      reformulation: 'À la mise sous contact et en position démarrage, écoutez si un claquement sec métallique survient ou si les feux s\'effondrent complètement.',
      test_action: 'Placez la clé en position démarrage pendant 2 secondes et observez les témoins du combiné.',
      test_type: 'observation',
      options: [
        { id: 1, question_id: 1, title: 'Clic sec unique, démarreur inerte', subtitle: 'Témoins allumés mais chute d\'intensité minime. Démarreur non entraîné.', icon: 'speaker', is_default: true },
        { id: 2, question_id: 1, title: 'Entraînement démarreur nominal sans allumage', subtitle: 'Le moteur tourne à vitesse normale (~250 tr/min) mais sans amorce.', icon: 'rotate', is_default: false },
        { id: 3, question_id: 1, title: 'Effondrement électrique complet (black-out)', subtitle: 'Extinction immédiate des voyants et claquements en rafale du relais.', icon: 'zap', is_default: false },
        { id: 4, question_id: 1, title: 'Contrôle impossible / Données insuffisantes', subtitle: 'Nécessite une mesure au voltmètre ou assistance d’atelier.', icon: 'help', is_default: false }
      ]
    };
    if (scrollToObservations) {
      this.selectedOptionId = null;
      this.isUnknownSelected = false;
      this.scrollToObservationsSection();
    } else {
      this.selectedOptionId = 1;
      this.isUnknownSelected = false;
    }
  }

  selectOption(option: QuestionOption): void {
    this.selectedOptionId = option.id;
    const isUnknown = this.isIndeterminateOption(option);
    this.isUnknownSelected = isUnknown;
  }

  isIndeterminateOption(opt: QuestionOption): boolean {
    const t = (opt.title || '').toLowerCase();
    return opt.icon === 'help' || t.includes('impossible') || t.includes('inconnu') || t.includes('unknown') || t.includes('je ne sais pas') || t.includes('don\'t know') || t.includes('données insuffisantes') || t.includes('insufficient');
  }

  isPassOption(opt: QuestionOption): boolean {
    const t = (opt.title || '').toLowerCase();
    return !this.isIndeterminateOption(opt) && (t.includes('conforme') || t.includes('compliant') || t.includes('pass') || t.includes('normal') || t.includes('vifs et stables') || t.includes('bright and steady') || t.includes('aucun bruit') || t.includes('no sound') || t.includes('intact') || t.includes('fonctionne') || t.includes('properly'));
  }

  isFailOption(opt: QuestionOption): boolean {
    const t = (opt.title || '').toLowerCase();
    return !this.isIndeterminateOption(opt) && !this.isPassOption(opt) && (t.includes('non conforme') || t.includes('non-compliant') || t.includes('fail') || t.includes('clic') || t.includes('click') || t.includes('éteignent') || t.includes('dim') || t.includes('faibl') || t.includes('bruit') || t.includes('grillé') || t.includes('blown') || t.includes('fumée') || t.includes('smoke') || t.includes('fuite') || t.includes('leak') || t.includes('défaut') || opt.id === 1);
  }

  toggleWhyAsk(): void {
    this.showWhyAsk = !this.showWhyAsk;
  }

  continue(): void {
    if (!this.selectedOptionId || !this.currentQuestion) return;

    this.submitting = true;
    this.diagnosticService.submitAnswer(this.sessionId, this.currentQuestion.id, this.selectedOptionId).subscribe({
      next: () => {
        this.submitting = false;
        // Passe scrollToObservations=true pour positionner automatiquement l'écran au niveau des choix d'observation
        this.loadQuestion(true);
      },
      error: (err) => {
        console.error('Error submitting answer:', err);
        this.submitting = false;
        this.router.navigate(['/results', this.sessionId]);
      }
    });
  }

  /**
   * Positionne en douceur la vue au niveau du bloc des résultats d'observation (titre et cartes de sélection)
   * Respecte prefers-reduced-motion pour l'accessibilité
   */
  scrollToObservationsSection(): void {
    const doScroll = () => {
      const targetEl = this.observationsSection?.nativeElement || document.getElementById('observationsSection');
      if (targetEl) {
        const prefersReducedMotion = typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        targetEl.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'start'
        });

        try {
          targetEl.focus({ preventScroll: true });
        } catch (_) {}
      }
    };

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        setTimeout(doScroll, 40);
        setTimeout(doScroll, 180);
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
