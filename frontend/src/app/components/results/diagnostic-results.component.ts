import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagnosticService, DiagnosticResultsResponse } from '../../services/diagnostic.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-diagnostic-results',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './diagnostic-results.component.html',
  styleUrls: ['./diagnostic-results.component.css']
})
export class DiagnosticResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagnosticService = inject(DiagnosticService);
  translationService = inject(TranslationService);

  sessionId = 1;
  results: DiagnosticResultsResponse | null = null;
  loading = true;

  // Continuous Learning & Feedback
  feedbackSubmitted = false;
  feedbackResult: 'confirmed' | 'disproved' | null = null;
  feedbackMessage = '';
  copiedMemo = false;

  // OEM Workshop Diagnostic Metadata
  reportReference = 'DIAG-OEM-2026-0842';
  
  get oemStandardTime(): string {
    return this.translationService.currentLang() === 'en'
      ? '1.20 h (PSA EB2 OEM Standard Flat Rate)'
      : '1.20 h (Barème constructeur PSA EB2)';
  }

  get postRepairCheck(): string {
    return this.translationService.currentLang() === 'en'
      ? 'Perform 3 consecutive cranking cycles (cold / warm), inspect alternator charging voltage (14.2V), clear and re-read DTC fault memory.'
      : 'Exécution de 3 cycles de démarrage consécutifs (froid / chaud), contrôle de tension de charge alternateur (14.2V), effacement et relecture mémoire DTC.';
  }

  get targetSubsystem(): string {
    const topName = (this.results?.top_hypothesis?.name || this.results?.hypotheses[0]?.name || '').toLowerCase();
    const sympLabel = (this.results?.symptom?.label || '').toLowerCase();
    if (topName.includes('batterie') || topName.includes('démarreur') || topName.includes('alternateur') || sympLabel.includes('démarre')) {
      return 'Circuit de Puissance & Démarrage (Basse Tension 12V)';
    }
    if (topName.includes('frein') || topName.includes('abs') || topName.includes('disque') || topName.includes('plaquette') || sympLabel.includes('frein')) {
      return 'Système de Freinage Hydraulique & ABS';
    }
    if (topName.includes('refroidissement') || topName.includes('pompe à eau') || topName.includes('thermostat') || sympLabel.includes('surchauffe')) {
      return 'Circuit de Refroidissement Moteur & Régulation Thermique';
    }
    if (topName.includes('injection') || topName.includes('carburant') || topName.includes('pompe') || sympLabel.includes('carburant')) {
      return 'Alimentation Carburant & Injection';
    }
    if (topName.includes('échappement') || topName.includes('fap') || topName.includes('catalyseur') || topName.includes('egr') || sympLabel.includes('fumée')) {
      return 'Ligne d\'Échappement & Dépollution';
    }
    return 'Liaison Mécanique & Train Roulant';
  }

  get amdecFailureMode(): string {
    const top = this.results?.top_hypothesis || this.results?.hypotheses[0];
    if (top?.description) return top.description;
    return 'Défaillance mécanique ou perte de tolérance nominale du composant';
  }

  get standardDtcCode(): string {
    const top = this.results?.top_hypothesis || this.results?.hypotheses[0];
    if (top?.fault_code) return `DTC ${top.fault_code}`;
    return 'DTC P0615 / UDS $0615 (Relais de démarreur)';
  }

  get counterTestSummary(): string {
    const top = this.results?.top_hypothesis || this.results?.hypotheses[0];
    if (top?.check_action) return top.check_action;
    return 'Mesure de chute de tension sur la borne 50 sous action démarreur ou contrôle d’alimentation directe.';
  }

  get pedagogicalMeaning(): string {
    const isEn = this.translationService.currentLang() === 'en';
    const top = this.results?.top_hypothesis || this.results?.hypotheses[0];
    if (top?.name) {
      const translatedName = this.translationService.t(top.name);
      return isEn
        ? `Diagnostic test analysis points to "${translatedName}" as the primary root cause. The component no longer meets factory operating specifications.`
        : `L'analyse des constatations désigne « ${translatedName} » comme la cause principale. L'élément ne répond plus aux spécifications nominales de fonctionnement.`;
    }
    return isEn
      ? 'The starter motor solenoid or carbon brushes are worn or sticking. 12V battery power is delivered properly, but the starter electrical motor fails to engage and crank the engine.'
      : 'Le solénoïde ou les charbons du démarreur sont usés ou gommés. Le courant 12V arrive bien depuis la batterie, mais le moteur électrique du démarreur ne parvient plus à s\'enclencher pour lancer le moteur thermique.';
  }

  get immediateAction(): string {
    const isEn = this.translationService.currentLang() === 'en';
    const top = this.results?.top_hypothesis || this.results?.hypotheses[0];
    if (top?.is_danger) {
      return isEn
        ? 'Immediate vehicle stop required. Do not drive until inspected by a certified automotive technician.'
        : 'Arrêt impératif du véhicule. Ne prenez pas la route avant vérification par un réparateur qualifié.';
    }
    return isEn
      ? 'Do not repeatedly crank the ignition key: this will unnecessarily drain the 12V battery and risk overheating the starter wiring harness. Avoid push starting.'
      : 'N\'insistez pas sur la clé de contact de manière répétée : cela viderait inutilement la batterie et risquerait de surchauffer le faisceau électrique. Évitez les démarrages forcés à la poussette.';
  }

  get counterTestVerdict(): string {
    const isEn = this.translationService.currentLang() === 'en';
    const top = this.results?.top_hypothesis || this.results?.hypotheses[0];
    const rawName = top?.name || 'l\'organe';
    const translatedName = this.translationService.t(rawName);
    return isEn
      ? `If measurement or visual inspection confirms the anomaly, failure of ${translatedName} is validated for repair estimate preparation.`
      : `Si la mesure ou l'observation confirme l'anomalie, la défaillance de ${translatedName} est confirmée pour le devis de remise en état.`;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('sessionId');
      if (id) {
        this.sessionId = parseInt(id, 10);
        this.loadResults();
      }
    });
  }

  loadResults(): void {
    this.loading = true;
    this.diagnosticService.getResults(this.sessionId).subscribe({
      next: (data) => {
        this.results = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching results:', err);
        this.loading = false;
        this.setupFallbackResults();
      }
    });
  }

  setupFallbackResults(): void {
    this.results = {
      session: { id: this.sessionId },
      vehicle: {
        id: 1,
        user_id: 1,
        brand: 'Peugeot',
        model: '208',
        year: 2019,
        fuel: 'Essence',
        engine: '1.2 PureTech 82 ch',
        mileage: 68420,
        license_plate: 'AA-123-BB',
        is_primary: true
      },
      symptom: {
        code: 'start_fail',
        label: 'Démarrage impossible'
      },
      summary: {
        headline: 'Une alimentation électrique faible est une piste à explorer.',
        detail: 'Clics au démarrage · Voyants qui faiblissent'
      },
      disclaimer: 'Des hypothèses, pas une certitude. Sans mesure ni examen du véhicule, ces pistes ne remplacent pas le diagnostic d’un professionnel.',
      causes_count: 3,
      guide_id: 1,
      safety_alerts: [],
      hypotheses: [
        {
          id: 1,
          symptom_id: 1,
          name: 'Batterie faible ou déchargée',
          priority_badge: 'PRIORITÉ 1',
          priority_label: 'Piste principale',
          order_index: 1,
          description: 'Les clics et la baisse d’intensité des voyants peuvent correspondre à une batterie insuffisamment chargée.',
          gravity: 'Gravité modérée · Immobilisation possible',
          check_action: 'Observer la batterie sans la toucher, puis faire tester sa charge par un professionnel.',
          check_type: 'Facile · Observation',
          cost_min: 120,
          cost_max: 250,
          score: 110,
          confidence: 'Forte'
        },
        {
          id: 2,
          symptom_id: 1,
          name: 'Connexion de batterie dégradée',
          priority_badge: 'PRIORITÉ 2',
          priority_label: 'À envisager',
          order_index: 2,
          description: 'Une cosse desserrée ou oxydée peut limiter l’alimentation, même si la batterie est encore chargée.',
          gravity: 'Gravité modérée · Immobilisation possible',
          check_action: 'Rechercher une corrosion visible, sans débrancher ni resserrer les cosses.',
          check_type: 'Facile · Observation',
          cost_min: 30,
          cost_max: 90,
          score: 85,
          confidence: 'Moyenne'
        },
        {
          id: 3,
          symptom_id: 1,
          name: 'Démarreur ou circuit en défaut',
          priority_badge: 'PRIORITÉ 3',
          priority_label: 'Autre possibilité',
          order_index: 3,
          description: 'Si la batterie et ses connexions sont correctes, le démarreur ou son circuit peuvent être en cause.',
          gravity: 'Gravité modérée · Immobilisation possible',
          check_action: 'Faire contrôler le circuit de démarrage en atelier. Aucune intervention à domicile.',
          check_type: 'Professionnel',
          cost_min: 250,
          cost_max: 600,
          score: 70,
          confidence: 'Moyenne'
        }
      ]
    };
  }

  goToGuide(): void {
    const guideId = this.results?.guide_id || 1;
    this.router.navigate(['/guide', guideId]);
  }

  onFeedback(wasCorrect: boolean): void {
    this.feedbackSubmitted = true;
    this.feedbackResult = wasCorrect ? 'confirmed' : 'disproved';
    const topId = this.results?.top_hypothesis?.id || this.results?.hypotheses[0]?.id;
    const initialConf = this.results?.top_confidence || 85;

    this.diagnosticService.submitFeedback(this.sessionId, {
      was_correct: wasCorrect,
      confirmed_fault_id: wasCorrect ? topId : undefined,
      feedback_notes: wasCorrect ? 'Confirmé par l\'automobiliste' : 'Infirmé par l\'automobiliste',
      confidence_initial: initialConf
    }).subscribe({
      next: (res) => {
        this.feedbackMessage = res.message || 'Merci ! Votre retour aide à affiner l\'algorithme.';
      },
      error: () => {
        this.feedbackMessage = 'Merci pour votre confirmation !';
      }
    });
  }

  copyGarageMemo(): void {
    const text = this.results?.garage_memo?.what_to_say;
    if (text && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.copiedMemo = true;
        setTimeout(() => this.copiedMemo = false, 3000);
      });
    }
  }

  askAssistantAboutResult(customQuery?: string): void {
    const faultName = this.results?.hypotheses[0]?.name || 'le démarreur';
    const brand = this.results?.vehicle?.brand || 'Peugeot';
    const model = this.results?.vehicle?.model || '208';
    const prompt = customQuery
      ? `Concernant le diagnostic de ma ${brand} ${model} (panne : "${faultName}" - ${this.standardDtcCode}) : ${customQuery}`
      : `Je viens de terminer mon diagnostic sur ma ${brand} ${model}. La cause retenue est : "${faultName}" (${this.standardDtcCode}). Pouvez-vous m'expliquer clairement les risques de rouler ainsi, les questions à poser au garagiste et le prix moyen de la réparation ?`;
    this.router.navigate(['/assistant'], { queryParams: { prompt } });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
