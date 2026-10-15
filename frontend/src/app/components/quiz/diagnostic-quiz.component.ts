import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagnosticService, Question, QuestionOption } from '../../services/diagnostic.service';

@Component({
  selector: 'app-diagnostic-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnostic-quiz.component.html',
  styleUrls: ['./diagnostic-quiz.component.css']
})
export class DiagnosticQuizComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagnosticService = inject(DiagnosticService);

  sessionId = 1;
  sessionData: any = null;
  currentQuestion: Question | null = null;
  selectedOptionId: number | null = null;
  loading = true;
  submitting = false;

  // Step indicator
  stepNum = 2;
  totalSteps = 5;
  stepCategory = 'Le démarrage';
  progressPercentage = 40;
  showWhyAsk = true;
  isUnknownSelected = false;

  defaultReformulation = 'Quand vous tournez la clé, observez simplement si les voyants ou les phares s\'allument, ou si le tableau de bord reste complètement éteint.';
  defaultWhyAsk = 'Cette question permet d\'isoler immédiatement si le problème provient de la batterie ou du démarreur pour éviter tout démontage inutile.';

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

  loadQuestion(): void {
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
        this.stepCategory = res.question.category || 'Le démarrage';

        // Pre-select default or first option
        if (this.currentQuestion?.options && this.currentQuestion.options.length > 0) {
          const defaultOpt = this.currentQuestion.options.find(o => o.is_default);
          this.selectedOptionId = defaultOpt ? defaultOpt.id : this.currentQuestion.options[0].id;
        }
      },
      error: (err) => {
        console.error('Error fetching question:', err);
        this.loading = false;
        // Fallback default mock for Peugeot 208 if session was mock
        this.setupFallbackQuestion();
      }
    });
  }

  setupFallbackQuestion(): void {
    this.sessionData = {
      vehicle_brand: 'Peugeot',
      vehicle_model: '208',
      vehicle_year: 2019,
      vehicle_fuel: 'Essence',
      symptom_label: 'la voiture ne démarre pas'
    };
    this.stepNum = 2;
    this.totalSteps = 5;
    this.stepCategory = 'Le démarrage';
    this.currentQuestion = {
      id: 1,
      symptom_id: 1,
      step_num: 2,
      total_steps: 5,
      category: 'Le démarrage',
      title: 'Que se passe-t-il quand vous essayez de démarrer ?',
      description: 'Choisissez la réponse qui ressemble le plus à ce que vous avez déjà observé.',
      warning_text: 'Inutile de réessayer plusieurs fois. Ne forcez pas le démarrage. En cas d’odeur de brûlé ou de fumée, arrêtez immédiatement.',
      why_ask: 'Cette question permet de savoir immédiatement si le problème vient de l\'alimentation électrique (batterie) ou de la mécanique du moteur.',
      reformulation: 'Quand vous tournez la clé, entendez-vous le moteur tourner rapidement dans le vide sans démarrer, ou est-ce le silence complet / un simple clic ?',
      test_action: 'Mettez le contact sans forcer et écoutez le bruit sous le capot.',
      test_type: 'observation',
      options: [
        { id: 1, question_id: 1, title: 'Des clics, mais rien ne démarre', subtitle: 'Les voyants faiblissent en même temps.', icon: 'speaker', is_default: true },
        { id: 2, question_id: 1, title: 'Le moteur tourne sans démarrer', subtitle: 'Vous entendez un bruit régulier.', icon: 'rotate', is_default: false },
        { id: 3, question_id: 1, title: 'Aucun bruit, aucun voyant', subtitle: 'Le tableau de bord reste éteint.', icon: 'power', is_default: false },
        { id: 4, question_id: 1, title: 'Je ne sais pas', subtitle: 'Pas de souci, on vous accompagne.', icon: 'help', is_default: false }
      ]
    };
    this.selectedOptionId = 1;
    this.isUnknownSelected = false;
  }

  selectOption(option: QuestionOption): void {
    this.selectedOptionId = option.id;
    const isUnknown = option.title.toLowerCase().includes('ne sais pas') || option.icon === 'help';
    this.isUnknownSelected = isUnknown;
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
        // Load next question or transition to results
        this.loadQuestion();
      },
      error: (err) => {
        console.error('Error submitting answer:', err);
        this.submitting = false;
        // Navigate to results
        this.router.navigate(['/results', this.sessionId]);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
