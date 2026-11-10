import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DiagnosticService, UserProfile, Vehicle } from '../../services/diagnostic.service';
import { VehicleLogoService } from '../../services/vehicle-logo.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { IconComponent } from '../ui/icon.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe, IconComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private diagService = inject(DiagnosticService);
  private vehicleLogoService = inject(VehicleLogoService);
  private router = inject(Router);

  getBrandLogoUrl(brand: string | undefined): string {
    return this.vehicleLogoService.getLogoUrl(brand);
  }

  get primaryVehicle(): Vehicle | null {
    const list = this.vehicles();
    return list.find(v => v.is_primary) || (list.length > 0 ? list[0] : null);
  }

  // Auth & View state
  currentUser = this.diagService.currentUser;
  activeAuthTab = signal<'login' | 'register'>('login');
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Login form fields
  loginEmail = 'thomas@autodiag.fr';
  loginPassword = 'password123';
  rememberMe = true;

  // Register form fields
  regName = '';
  regEmail = '';
  regPassword = '';
  regPhone = '';
  regCity = '';

  // Edit profile form fields
  editName = '';
  editEmail = '';
  editPhone = '';
  editCity = '';
  editNewPassword = '';
  isEditing = signal(false);

  // Linked vehicles
  vehicles = signal<Vehicle[]>([]);

  // Preferences toggles
  prefNotifications = signal(true);
  prefCloudSync = signal(true);
  prefMaintenanceAlerts = signal(true);

  ngOnInit(): void {
    this.refreshUserData();
  }

  refreshUserData(): void {
    const user = this.currentUser();
    if (user && user.id) {
      this.editName = user.name || '';
      this.editEmail = user.email || '';
      this.editPhone = user.phone || '06 12 34 56 78';
      this.editCity = user.city || 'Paris';

      // Load full profile with counts from backend
      this.diagService.getProfile(user.id).subscribe({
        next: (profile) => {
          this.editName = profile.name;
          this.editEmail = profile.email;
          this.editPhone = profile.phone || '';
          this.editCity = profile.city || '';
        },
        error: (err) => console.warn('Could not refresh full profile:', err)
      });

      // Load user's vehicles
      this.diagService.getVehicles().subscribe({
        next: (vehicles) => this.vehicles.set(vehicles),
        error: (err) => console.warn('Could not load vehicles:', err)
      });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  setAuthTab(tab: 'login' | 'register'): void {
    this.activeAuthTab.set(tab);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  onLogin(): void {
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMessage.set('Veuillez renseigner votre email et mot de passe.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.diagService.login({
      email: this.loginEmail,
      password: this.loginPassword
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('Connexion réussie ! Bienvenue sur votre espace AutoDiag.');
        this.refreshUserData();
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.error || 'Échec de connexion. Vérifiez vos identifiants.';
        this.errorMessage.set(errorMsg);
      }
    });
  }

  quickDemoLogin(): void {
    this.loginEmail = 'thomas@autodiag.fr';
    this.loginPassword = 'password123';
    this.onLogin();
  }

  onRegister(): void {
    if (!this.regName || !this.regEmail || !this.regPassword) {
      this.errorMessage.set('Veuillez renseigner votre nom, email et mot de passe.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.diagService.register({
      name: this.regName,
      email: this.regEmail,
      password: this.regPassword,
      phone: this.regPhone || '06 12 34 56 78',
      city: this.regCity || 'Paris'
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('Compte créé avec succès ! Véhicule par défaut configuré.');
        this.refreshUserData();
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err.error?.error || 'Erreur lors de la création du compte.';
        this.errorMessage.set(errorMsg);
      }
    });
  }

  onSaveProfile(): void {
    const user = this.currentUser();
    if (!user || !user.id) return;

    if (!this.editName || !this.editEmail) {
      this.errorMessage.set('Le nom et l\'email sont requis.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const updatePayload: any = {
      name: this.editName,
      email: this.editEmail,
      phone: this.editPhone,
      city: this.editCity
    };

    if (this.editNewPassword && this.editNewPassword.trim().length > 0) {
      updatePayload.password = this.editNewPassword.trim();
    }

    this.diagService.updateProfile(user.id, updatePayload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set('Vos informations personnelles ont été mises à jour !');
        this.editNewPassword = '';
        this.isEditing.set(false);
        this.refreshUserData();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'Impossible d\'enregistrer les modifications.');
      }
    });
  }

  onLogout(): void {
    this.diagService.logout();
    this.successMessage.set('Vous avez été déconnecté avec succès.');
    this.errorMessage.set(null);
    this.activeAuthTab.set('login');
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

  togglePreference(pref: 'notifications' | 'cloud' | 'maintenance'): void {
    if (pref === 'notifications') this.prefNotifications.set(!this.prefNotifications());
    if (pref === 'cloud') this.prefCloudSync.set(!this.prefCloudSync());
    if (pref === 'maintenance') this.prefMaintenanceAlerts.set(!this.prefMaintenanceAlerts());
  }
}
