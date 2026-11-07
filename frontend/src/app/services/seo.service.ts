import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface RouteSeoData {
  title?: string;
  description?: string;
  robots?: string;
  canonicalPath?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  // Domaine configurable via placeholder pour la production
  private readonly baseUrl = 'https://[TON-DOMAINE.fr]';

  init(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      let route = this.activatedRoute;
      while (route.firstChild) {
        route = route.firstChild;
      }

      const seoData: RouteSeoData = route.snapshot.data['seo'] || {};
      const pageTitle = route.snapshot.title || seoData.title || 'AutoDiag · Diagnostic Automobile Intelligent';
      const description = seoData.description || 'Diagnostic auto en ligne sans jargon. Analysez les voyants, bruits et pannes de votre voiture avec notre arbre décisionnel et notre conseiller IA.';
      const robots = seoData.robots || 'index, follow';
      const canonicalUrl = `${this.baseUrl}${this.router.url.split('?')[0]}`;

      this.updateTags({
        title: pageTitle,
        description,
        robots,
        canonicalPath: canonicalUrl
      });
    });
  }

  updateTags(data: { title: string; description: string; robots?: string; canonicalPath?: string }): void {
    // 1. Title
    this.titleService.setTitle(data.title);

    // 2. Meta Description & Robots
    this.metaService.updateTag({ name: 'description', content: data.description });
    this.metaService.updateTag({ name: 'robots', content: data.robots || 'index, follow' });

    // 3. Open Graph Tags
    this.metaService.updateTag({ property: 'og:title', content: data.title });
    this.metaService.updateTag({ property: 'og:description', content: data.description });
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:url', content: data.canonicalPath || this.baseUrl });
    this.metaService.updateTag({ property: 'og:image', content: `${this.baseUrl}/assets/logo-robot.png` });
    this.metaService.updateTag({ property: 'og:site_name', content: 'AutoDiag' });

    // 4. Twitter Cards
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: data.title });
    this.metaService.updateTag({ name: 'twitter:description', content: data.description });
    this.metaService.updateTag({ name: 'twitter:image', content: `${this.baseUrl}/assets/logo-robot.png` });

    // 5. Canonical Link
    this.updateCanonicalLink(data.canonicalPath || `${this.baseUrl}${this.router.url.split('?')[0]}`);
  }

  private updateCanonicalLink(url: string): void {
    let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
