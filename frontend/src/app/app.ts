import { Component, signal, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DiagnosticService } from './services/diagnostic.service';
import { TranslationService, SupportedLang } from './services/translation.service';
import { TranslatePipe } from './pipes/translate.pipe';
import { SeoService } from './services/seo.service';
import { IconComponent } from './components/ui/icon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, IconComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  private router = inject(Router);
  diagService = inject(DiagnosticService);
  translationService = inject(TranslationService);
  private seoService = inject(SeoService);
  currentUser = this.diagService.currentUser;

  // Language management
  languages = this.translationService.languages;
  currentLang = this.translationService.currentLang;
  currentLangInfo = this.translationService.currentLangInfo;
  showLangDropdown = signal(false);

  // Theme state: follows prefers-color-scheme by default, or manual stored preference
  isDarkMode = signal(false);
  showSosModal = signal(false);
  showNotificationsModal = signal(false);
  activeUrl = signal('/');

  notifications = [
    { id: 1, title: 'Rappel révision', text: 'Vidange moteur recommandée dans 1 500 km.', time: 'Il y a 2h' },
    { id: 2, title: 'Diagnostic archivé', text: 'Code P0300 enregistré dans l’historique.', time: 'Hier' }
  ];

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.activeUrl.set(event.urlAfterRedirects || event.url);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  ngOnInit(): void {
    this.seoService.init();
    const savedTheme = localStorage.getItem('autodiag-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      this.isDarkMode.set(savedTheme === 'dark');
    } else if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkMode.set(mediaQuery.matches);
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('autodiag-theme')) {
          this.isDarkMode.set(e.matches);
          this.applyTheme();
        }
      });
    }
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkMode.set(!this.isDarkMode());
    localStorage.setItem('autodiag-theme', this.isDarkMode() ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    if (typeof document !== 'undefined') {
      const dark = this.isDarkMode();
      document.body.classList.toggle('dark-theme', dark);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', dark ? '#0F141C' : '#F4F6F8');
      }
    }
  }

  toggleSosModal(): void {
    this.showSosModal.set(!this.showSosModal());
  }

  toggleNotifications(): void {
    this.showNotificationsModal.set(!this.showNotificationsModal());
  }

  toggleLangDropdown(event: Event): void {
    event.stopPropagation();
    this.showLangDropdown.set(!this.showLangDropdown());
  }

  selectLanguage(lang: SupportedLang): void {
    this.translationService.setLanguage(lang);
    this.showLangDropdown.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showLangDropdown()) {
      this.showLangDropdown.set(false);
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  onDiagnosticNavClick(event?: Event): void {
    if (this.router.url === '/' || this.router.url.startsWith('/#') || this.router.url.startsWith('/?')) {
      if (event) event.preventDefault();
      const el = document.getElementById('symptoms-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      this.router.navigate(['/'], { fragment: 'symptoms-section' });
    }
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user || !user.name) return 'AD';
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  }
}
