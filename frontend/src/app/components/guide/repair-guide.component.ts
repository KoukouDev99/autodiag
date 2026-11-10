import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DiagnosticService, RepairGuide, RepairStep } from '../../services/diagnostic.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-repair-guide',
  standalone: true,
  imports: [CommonModule, TranslatePipe, IconComponent],
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
          image_url: 'assets/guides/battery_check.svg'
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
          image_url: 'assets/guides/battery_check.svg'
        },
        {
          id: 3,
          guide_id: 1,
          step_num: 3,
          title: 'Faites contrôler la batterie au multimètre',
          time_est: '2 min',
          description: 'Notez vos observations et demandez un test de charge à un garage ou à votre assistance.',
          subtext: 'Le technicien utilisera un testeur de conductance pour vérifier l’état de santé (SOH) et la puissance au démarrage.',
          caution_warning: 'Si la batterie a plus de 4 ans, son remplacement complet est recommandé avant l’hiver.',
          image_url: 'assets/guides/multimeter_check.svg'
        }
      ]
    };
  }

  /**
   * Sélectionne dynamiquement l'image technique d'illustration selon la panne et le test en cours
   */
  getStepImageUrl(step: RepairStep | undefined): string {
    if (!step) return 'assets/guides/battery_check.svg';

    // Si une image spécifique non générique est déjà fournie, on la respecte
    if (step.image_url && !step.image_url.includes('battery_check.jpg') && !step.image_url.includes('icons/') && step.image_url.trim().length > 0) {
      return step.image_url;
    }

    const titleAndHypo = `${step.title || ''} ${this.guide?.hypothesis_name || ''} ${this.guide?.title || ''} ${this.guide?.subtitle || ''}`.toLowerCase();
    // Filtre les formules génériques de sécurité (ex: "serrez le frein à main")
    const cleanDesc = (step.description || '')
      .toLowerCase()
      .replace(/frein [aà] main/g, '')
      .replace(/frein de stationnement/g, '');
    const fullText = `${titleAndHypo} ${cleanDesc}`;

    // 1. Allumage, bougies et bobines
    if (
      fullText.includes('bougie') ||
      fullText.includes('allumage') ||
      fullText.includes('bobine') ||
      fullText.includes('spark') ||
      fullText.includes('préchauffage') ||
      fullText.includes('raté')
    ) {
      return 'assets/guides/spark_plugs_check.svg';
    }

    // 2. Démarreur & Solénoïde
    if (
      fullText.includes('démarreur') ||
      fullText.includes('demarreur') ||
      fullText.includes('starter') ||
      fullText.includes('solénoïde') ||
      fullText.includes('solenoide') ||
      fullText.includes('neiman') ||
      fullText.includes('bendix')
    ) {
      return 'assets/guides/starter_check.svg';
    }

    // 3. Alternateur & Circuit de charge
    if (
      fullText.includes('alternateur') ||
      fullText.includes('alternator') ||
      fullText.includes('régulateur de tension') ||
      fullText.includes('charge batterie') ||
      fullText.includes('dynamo')
    ) {
      return 'assets/guides/alternator_check.svg';
    }

    // 4. Alimentation Carburant & Pompe de gavage
    if (
      fullText.includes('carburant') ||
      fullText.includes('gavage') ||
      fullText.includes('essence') ||
      fullText.includes('diesel') ||
      fullText.includes('gazole') ||
      fullText.includes('réservoir') ||
      fullText.includes('injecteur') ||
      fullText.includes('rampe commune') ||
      fullText.includes('filtre à carburant') ||
      (fullText.includes('pompe') && !fullText.includes('pompe à eau'))
    ) {
      return 'assets/guides/fuel_pump_check.svg';
    }

    // 5. Freinage & Plaquettes / Disques
    if (
      fullText.includes('plaquette') ||
      fullText.includes('disque') ||
      fullText.includes('étrier') ||
      fullText.includes('etrier') ||
      fullText.includes('brake') ||
      fullText.includes('mastervac') ||
      fullText.includes('liquide de frein') ||
      fullText.includes('purge de frein') ||
      fullText.includes('garniture') ||
      titleAndHypo.includes('frein')
    ) {
      return 'assets/guides/brakes_check.svg';
    }

    // 6. Refroidissement & Thermostat / Surchauffe
    if (
      fullText.includes('refroidissement') ||
      fullText.includes('radiateur') ||
      fullText.includes('calorstat') ||
      fullText.includes('thermostat') ||
      fullText.includes('vase d\'expansion') ||
      fullText.includes('pompe à eau') ||
      fullText.includes('surchauffe') ||
      fullText.includes('durite') ||
      fullText.includes('motoventilateur') ||
      fullText.includes('liquide de refroidissement')
    ) {
      return 'assets/guides/coolant_check.svg';
    }

    // 7. ABS & Capteurs de roue
    if (
      fullText.includes('abs') ||
      fullText.includes('capteur de roue') ||
      fullText.includes('capteur de vitesse') ||
      fullText.includes('esp') ||
      fullText.includes('porte-fusée') ||
      fullText.includes('cible dentée')
    ) {
      return 'assets/guides/abs_sensor_check.svg';
    }

    // 8. Boîte à fusibles & Relais
    if (
      fullText.includes('fusible') ||
      fullText.includes('fuse') ||
      fullText.includes('relais') ||
      fullText.includes('court-circuit') ||
      fullText.includes('boîtier bsi')
    ) {
      return 'assets/guides/fuse_box_check.svg';
    }

    // 9. Filtre à air & Admission / Débitmètre
    if (
      fullText.includes('filtre à air') ||
      fullText.includes('filtre a air') ||
      fullText.includes('débitmètre') ||
      fullText.includes('debitmetre') ||
      fullText.includes('admission') ||
      fullText.includes('boîtier papillon') ||
      fullText.includes('boitier papillon')
    ) {
      return 'assets/guides/air_filter_check.svg';
    }

    // 10. Huile moteur & Lubrification
    if (
      fullText.includes('huile') ||
      fullText.includes('jauge') ||
      fullText.includes('lubrification') ||
      fullText.includes('viscosité') ||
      fullText.includes('filtre à huile')
    ) {
      return 'assets/guides/engine_oil_check.svg';
    }

    // 11. Pneumatiques & Géométrie / TPMS
    if (
      fullText.includes('pneu') ||
      fullText.includes('pneumatique') ||
      fullText.includes('gonflage') ||
      fullText.includes('tpms') ||
      fullText.includes('roulement') ||
      fullText.includes('parallélisme') ||
      fullText.includes('twi')
    ) {
      return 'assets/guides/tires_check.svg';
    }

    // 12. Échappement & Sonde Lambda / FAP
    if (
      fullText.includes('échappement') ||
      fullText.includes('echappement') ||
      fullText.includes('lambda') ||
      fullText.includes('catalyseur') ||
      fullText.includes('fap') ||
      fullText.includes('filtre à particules') ||
      fullText.includes('fumée') ||
      fullText.includes('fumee') ||
      fullText.includes('egr')
    ) {
      return 'assets/guides/exhaust_check.svg';
    }

    // 13. Courroies (Distribution / Accessoires)
    if (
      fullText.includes('courroie') ||
      fullText.includes('serpentine') ||
      fullText.includes('galet tendeur') ||
      fullText.includes('distribution') ||
      fullText.includes('poulie damper')
    ) {
      return 'assets/guides/belt_check.svg';
    }

    // 14. Multimètre & Continuité électrique
    if (
      fullText.includes('multimètre') ||
      fullText.includes('multimetre') ||
      fullText.includes('voltmètre') ||
      fullText.includes('voltmetre') ||
      fullText.includes('continuité') ||
      fullText.includes('ohmmètre') ||
      fullText.includes('mesure électrique')
    ) {
      return 'assets/guides/multimeter_check.svg';
    }

    // 15. Batterie & Cosses
    if (
      fullText.includes('batterie') ||
      fullText.includes('cosse') ||
      fullText.includes('12v')
    ) {
      return 'assets/guides/battery_check.svg';
    }

    // Repli selon le numéro d'étape : test électrique au multimètre ou inspection générale
    return step.step_num === 3 ? 'assets/guides/multimeter_check.svg' : 'assets/guides/battery_check.svg';
  }

  /**
   * Icône contextuelle pour les étapes à venir
   */
  getStepIcon(s: RepairStep | undefined): string {
    const img = this.getStepImageUrl(s);
    if (img.includes('spark') || img.includes('starter') || img.includes('fuse') || img.includes('multimeter')) {
      return 'zap';
    }
    if (img.includes('coolant')) {
      return 'thermometer';
    }
    if (img.includes('fuel')) {
      return 'fuel';
    }
    if (img.includes('tires')) {
      return 'tire';
    }
    if (img.includes('exhaust')) {
      return 'wind';
    }
    return (s?.step_num === 2) ? 'eye' : 'wrench';
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
