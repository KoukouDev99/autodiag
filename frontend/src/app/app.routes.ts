import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    title: 'AutoDiag · Accueil'
  },
  {
    path: 'assistant',
    loadComponent: () => import('./components/assistant/assistant.component').then(m => m.AssistantComponent),
    title: 'AutoDiag · AutoDiag IA & Assistant Mécanique'
  },
  { path: 'chat', redirectTo: 'assistant' },
  {
    path: 'vehicle',
    loadComponent: () => import('./components/vehicle/vehicle.component').then(m => m.VehicleComponent),
    title: 'AutoDiag · Mon Véhicule'
  },
  {
    path: 'diagnostic/:sessionId',
    loadComponent: () => import('./components/quiz/diagnostic-quiz.component').then(m => m.DiagnosticQuizComponent),
    title: 'AutoDiag · Diagnostic Guidé'
  },
  {
    path: 'results/:sessionId',
    loadComponent: () => import('./components/results/diagnostic-results.component').then(m => m.DiagnosticResultsComponent),
    title: 'AutoDiag · Vos Pistes de Diagnostic'
  },
  {
    path: 'guide/:guideId',
    loadComponent: () => import('./components/guide/repair-guide.component').then(m => m.RepairGuideComponent),
    title: 'AutoDiag · Guide de Réparation'
  },
  {
    path: 'garage',
    loadComponent: () => import('./components/garage/garage-history.component').then(m => m.GarageHistoryComponent),
    title: 'AutoDiag · Mon Garage & Historique'
  },
  {
    path: 'profil',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    title: 'AutoDiag · Mon Profil & Connexion'
  },
  { path: 'profile', redirectTo: 'profil' },
  {
    path: 'design-system',
    loadComponent: () => import('./components/design-system/design-system.component').then(m => m.DesignSystemComponent),
    title: 'AutoDiag · Design System 1.0'
  },
  { path: '**', redirectTo: '' }
];


