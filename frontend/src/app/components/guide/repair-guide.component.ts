import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagnosticService, RepairGuide } from '../../services/diagnostic.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-repair-guide',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './repair-guide.component.html',
  styleUrls: ['./repair-guide.component.css']
})
export class RepairGuideComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private diagnosticService = inject(DiagnosticService);

  guideId = 1;
  guide: RepairGuide | null = null;
  currentStepIndex = 0;
  loading = true;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('guideId');
      if (id) {
        this.guideId = parseInt(id, 10);
        this.loadGuide();
      }
    });
  }

  loadGuide(): void {
    this.loading = true;
    this.diagnosticService.getRepairGuide(this.guideId).subscribe({
      next: (data) => {
        this.guide = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching guide:', err);
        this.loading = false;
        this.setupFallbackGuide();
      }
    });
  }

  setupFallbackGuide(): void {
    this.guide = {
      id: 1,
      hypothesis_id: 1,
      hypothesis_name: 'Batterie faible ou déchargée',
      vehicle_brand: 'Peugeot',
      vehicle_model: '208',
      title: 'Contrôler sans démonter',
      subtitle: 'Un contrôle visuel pour savoir quoi signaler au professionnel, pas pour confirmer une panne.',
      difficulty: 'Facile',
      est_time: '5 min environ',
      total_steps: 3,
      safety_warning: 'Garez-vous hors circulation, frein de stationnement serré, moteur froid et contact coupé. Retirez la clé. Ne touchez ni les bornes ni les câbles.',
      tools_needed: ['Lampe de poche', 'Notice du véhicule'],
      steps: [
        {
          id: 1,
          guide_id: 1,
          step_num: 1,
          title: 'Repérez la batterie, sans la toucher',
          time_est: '2 min',
          description: 'Consultez la notice pour ouvrir et maintenir le capot. Repérez le boîtier de batterie. Si un cache gêne la vue, laissez-le en place et passez au professionnel.',
          subtext: 'Illustration indicative : l’emplacement et les caches peuvent varier selon la version.',
          caution_warning: 'Fuite, batterie gonflée, chaleur, fumée ou odeur : éloignez-vous et contactez un professionnel. Aucun démarrage avec câbles ni remplacement n’est guidé ici.',
          image_url: 'assets/battery_check.jpg'
        },
        {
          id: 2,
          guide_id: 1,
          step_num: 2,
          title: 'Observez à distance',
          time_est: '1 min',
          description: 'Cherchez une fuite, une déformation ou un dépôt blanchâtre. Ne nettoyez pas et ne manipulez rien.',
          subtext: 'Vérifiez si les cosses positive (+) et négative (-) présentent une trace d’oxydation ou de sulfate.',
          caution_warning: 'Ne pas toucher les dépôts de sulfate à mains nues (matière acide corrosive).',
          image_url: 'assets/battery_check.jpg'
        },
        {
          id: 3,
          guide_id: 1,
          step_num: 3,
          title: 'Faites contrôler la batterie',
          time_est: '2 min',
          description: 'Notez vos observations et demandez un test de charge à un garage ou à votre assistance.',
          subtext: 'Le technicien utilisera un testeur de conductance pour vérifier l’état de santé (SOH) et la puissance au démarrage.',
          caution_warning: 'Si la batterie a plus de 4 ans, son remplacement complet est recommandé avant l’hiver.',
          image_url: 'assets/battery_check.jpg'
        }
      ]
    };
  }

  nextStep(): void {
    if (!this.guide) return;
    if (this.currentStepIndex < this.guide.steps.length - 1) {
      this.currentStepIndex++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Completed guide, return home or garage
      this.router.navigate(['/garage']);
    }
  }

  prevStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
    } else {
      this.router.navigate(['/results', 1]);
    }
  }

  goBack(): void {
    this.router.navigate(['/results', 1]);
  }
}
