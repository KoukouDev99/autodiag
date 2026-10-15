import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { VehicleComponent } from './components/vehicle/vehicle.component';
import { DiagnosticQuizComponent } from './components/quiz/diagnostic-quiz.component';
import { DiagnosticResultsComponent } from './components/results/diagnostic-results.component';
import { RepairGuideComponent } from './components/guide/repair-guide.component';
import { GarageHistoryComponent } from './components/garage/garage-history.component';
import { DesignSystemComponent } from './components/design-system/design-system.component';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'AutoDiag · Accueil' },
  { path: 'vehicle', component: VehicleComponent, title: 'AutoDiag · Mon Véhicule' },
  { path: 'diagnostic/:sessionId', component: DiagnosticQuizComponent, title: 'AutoDiag · Diagnostic Guidé' },
  { path: 'results/:sessionId', component: DiagnosticResultsComponent, title: 'AutoDiag · Vos Pistes de Diagnostic' },
  { path: 'guide/:guideId', component: RepairGuideComponent, title: 'AutoDiag · Guide de Réparation' },
  { path: 'garage', component: GarageHistoryComponent, title: 'AutoDiag · Mon Garage & Historique' },
  { path: 'profil', component: ProfileComponent, title: 'AutoDiag · Mon Profil & Connexion' },
  { path: 'profile', redirectTo: 'profil' },
  { path: 'design-system', component: DesignSystemComponent, title: 'AutoDiag · Design System 1.0' },
  { path: '**', redirectTo: '' }
];

