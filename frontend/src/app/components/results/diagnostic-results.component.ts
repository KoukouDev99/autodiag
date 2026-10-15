import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagnosticService, DiagnosticResultsResponse } from '../../services/diagnostic.service';

@Component({
  selector: 'app-diagnostic-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnostic-results.component.html',
  styleUrls: ['./diagnostic-results.component.css']
})
export class DiagnosticResultsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagnosticService = inject(DiagnosticService);

  sessionId = 1;
  results: DiagnosticResultsResponse | null = null;
  loading = true;

  // Continuous Learning & Feedback
  feedbackSubmitted = false;
  feedbackResult: 'confirmed' | 'disproved' | null = null;
  feedbackMessage = '';
  copiedMemo = false;

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

  goBack(): void {
    this.router.navigate(['/']);
  }
}
