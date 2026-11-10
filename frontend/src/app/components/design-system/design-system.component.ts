import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IconComponent, IconName } from '../ui/icon.component';

interface IconSpecimen {
  name: IconName;
  title: string;
  usage: string;
}

@Component({
  selector: 'app-design-system',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './design-system.component.html',
  styleUrls: ['./design-system.component.css']
})
export class DesignSystemComponent {
  private router = inject(Router);

  customAutomotiveIcons: IconSpecimen[] = [
    { name: 'engine', title: 'Bloc moteur', usage: 'Moteur, allumage, injection, distribution' },
    { name: 'starter', title: 'Démarreur / Contact', usage: 'Action démarreur, neiman, lancement' },
    { name: 'battery-auto', title: 'Batterie 12V', usage: 'Accumulateur 12V, circuit de charge' },
    { name: 'disc-brake', title: 'Disque & Étrier', usage: 'Freinage, plaquettes, disques, ABS' },
    { name: 'exhaust', title: 'Échappement & FAP', usage: 'Fumées, antipollution, catalyseur' },
    { name: 'suspension', title: 'Amortisseur & Châssis', usage: 'Suspension, tenue de route, vibrations' },
    { name: 'gearbox', title: 'Boîte & Embrayage', usage: 'Transmission manuelle/auto, rapports' },
    { name: 'steering', title: 'Direction assistée', usage: 'Volant, crémaillère, colonne' },
    { name: 'tire', title: 'Pneumatique', usage: 'Roues, usure, parallélisme, pression' },
    { name: 'obd-port', title: 'Prise OBD-II (J1962)', usage: 'Lecture codes défauts DTC, valise' },
    { name: 'multimeter', title: 'Multimètre atelier', usage: 'Contrôle de tension et continuité' },
    { name: 'oil-can', title: 'Lubrification / Huile', usage: 'Pression d’huile, vidange, niveau' }
  ];

  lucideBaseIcons: IconSpecimen[] = [
    { name: 'thermometer', title: 'Température', usage: 'Refroidissement, surchauffe, thermostat' },
    { name: 'fuel', title: 'Carburant', usage: 'Alimentation, pompe, consommation' },
    { name: 'zap', title: 'Circuit électrique', usage: 'Alternateur, fusibles, faisceau' },
    { name: 'sound', title: 'Acoustique', usage: 'Bruits anormaux, claquements, sifflements' },
    { name: 'snowflake', title: 'Climatisation', usage: 'Compresseur, soufflerie, habitacle' },
    { name: 'wrench', title: 'Outillage', usage: 'Guide de réparation, intervention' },
    { name: 'gauge', title: 'Kilométrage', usage: 'Compteur, mesures, tableau de bord' },
    { name: 'car', title: 'Véhicule', usage: 'Mon garage, fiche technique' },
    { name: 'scan', title: 'Diagnostic', usage: 'Arbre de décision, parcours guidé' },
    { name: 'clipboard-list', title: 'Protocole', usage: 'Étapes de vérification sur véhicule' },
    { name: 'file-text', title: 'Rapport bilan', usage: 'Synthèse PDF, note pour le garagiste' },
    { name: 'bot', title: 'AutoDiag IA', usage: 'Conseiller mécanique et chatbot' },
    { name: 'shield-check', title: 'Sécurité validée', usage: 'Précautions atelier, contrôle OK' },
    { name: 'alert-triangle', title: 'Attention', usage: 'Gravité modérée, vigilance requise' },
    { name: 'alert-octagon', title: 'Urgence critique', usage: 'Arrêt immédiat, danger mécanique' },
    { name: 'printer', title: 'Impression', usage: 'Export du rapport de diagnostic' },
    { name: 'scale', title: 'Masse à vide', usage: 'Caractéristiques poids du véhicule' },
    { name: 'ruler', title: 'Gabarit', usage: 'Dimensions & empattement' }
  ];

  colors = [
    { name: 'Acier Atelier (Option A)', hex: '#0F5288', role: 'Couleur d’accent primaire (8.13:1 AAA)' },
    { name: 'Ardoise Principale', hex: '#0F172A', role: 'Texte principal & titres (17.4:1 AAA)' },
    { name: 'Fond Atelier Clair', hex: '#F4F6F8', role: 'Arrière-plan haute lisibilité' },
    { name: 'Surface Carte', hex: '#FFFFFF', role: 'Conteneurs & cartes' },
    { name: 'Texte Secondaire', hex: '#475569', role: 'Sous-titres & métadonnées (7.58:1 AAA)' },
    { name: 'Bordure Structurelle', hex: '#CBD5E1', role: 'Séparateurs & contours nets 1px' }
  ];

  selectedCard = 1;

  goBack(): void {
    this.router.navigate(['/']);
  }
}
