import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './terms.component.html',
  styleUrls: ['./legal.css']
})
export class TermsComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'AutoDiag · Conditions Générales d\'Utilisation (CGU)',
      description: 'Conditions générales d\'utilisation d\'AutoDiag et décharge de responsabilité technique automobile.',
      robots: 'index, follow'
    });
  }
}

