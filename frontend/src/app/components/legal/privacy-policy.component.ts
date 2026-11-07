import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./legal.css']
})
export class PrivacyPolicyComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'AutoDiag · Politique de Confidentialité & RGPD',
      description: 'Politique de protection des données personnelles, sous-traitants IA (Groq), cookies et droits RGPD.',
      robots: 'index, follow'
    });
  }
}
