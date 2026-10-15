import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DiagnosticService } from './services/diagnostic.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  private router = inject(Router);
  diagService = inject(DiagnosticService);
  currentUser = this.diagService.currentUser;

  // Dark Mode state: default to true (Dark mode) or stored preference
  isDarkMode = signal(true);
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
    const savedTheme = localStorage.getItem('autodiag-theme');
    if (savedTheme) {
      this.isDarkMode.set(savedTheme === 'dark');
    } else {
      // Default to Dark Mode as requested
      this.isDarkMode.set(true);
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
      if (this.isDarkMode()) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  }

  toggleSosModal(): void {
    this.showSosModal.set(!this.showSosModal());
  }

  toggleNotifications(): void {
    this.showNotificationsModal.set(!this.showNotificationsModal());
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
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
