import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit(): void {
    // Directive noindex, nofollow pour ne pas indexer les erreurs 404
    this.seoService.updateTags({
      title: 'AutoDiag · 404 Page non trouvée',
      description: 'La page demandée est introuvable ou a été déplacée.',
      robots: 'noindex, nofollow'
    });
  }
}
