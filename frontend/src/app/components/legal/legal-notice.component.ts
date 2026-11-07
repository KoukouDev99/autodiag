import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './legal-notice.component.html',
  styleUrls: ['./legal.css']
})
export class LegalNoticeComponent implements OnInit {
  private seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'AutoDiag · Mentions Légales',
      description: 'Mentions légales, identification de l\'éditeur et de l\'hébergeur du service AutoDiag.',
      robots: 'index, follow'
    });
  }
}
