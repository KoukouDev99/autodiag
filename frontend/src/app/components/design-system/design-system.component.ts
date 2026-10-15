import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-design-system',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './design-system.component.html',
  styleUrls: ['./design-system.component.css']
})
export class DesignSystemComponent {
  private router = inject(Router);

  colors = [
    { name: 'Bleu nuit', hex: '#101828', role: 'Texte principal / Titres' },
    { name: 'Action', hex: '#2563EB', role: 'Boutons / Liens / Accent' },
    { name: 'Fond', hex: '#F3F5F9', role: 'Arrière-plan application' },
    { name: 'Surface', hex: '#FFFFFF', role: 'Cartes et conteneurs' },
    { name: 'Texte secondaire', hex: '#667085', role: 'Sous-titres & libellés' },
    { name: 'Bordure', hex: '#E4E8F0', role: 'Séparateurs & contours' }
  ];

  selectedCard = 1;

  goBack(): void {
    this.router.navigate(['/']);
  }
}
