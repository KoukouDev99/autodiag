import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    title: 'AutoDiag · Diagnostic Automobile Intelligent en Ligne',
    data: {
      seo: {
        title: 'AutoDiag · Diagnostic Automobile Intelligent en Ligne',
        description: 'Diagnostiquez gratuitement les pannes de votre voiture : moteur, démarrage, bruits suspects, fumées et voyants. Arbre décisionnel expert et assistant IA.',
        robots: 'index, follow'
      }
    }
  },
  {
    path: 'assistant',
    loadComponent: () => import('./components/assistant/assistant.component').then(m => m.AssistantComponent),
    title: 'AutoDiag IA · Assistant Mécanique Virtuel et Conseils d\'Experts',
    data: {
      seo: {
        title: 'AutoDiag IA · Assistant Mécanique Virtuel et Conseils d\'Experts',
        description: 'Posez vos questions à notre assistant mécanique intelligent : analyse des codes défauts OBD, symptômes et préconisations de sécurité.',
        robots: 'index, follow'
      }
    }
  },
  { path: 'chat', redirectTo: 'assistant' },
  {
    path: 'vehicle',
    loadComponent: () => import('./components/vehicle/vehicle.component').then(m => m.VehicleComponent),
    title: 'AutoDiag · Sélection et Fiche Technique de votre Véhicule',
    data: {
      seo: {
        title: 'AutoDiag · Sélection et Fiche Technique de votre Véhicule',
        description: 'Configurez la marque, le modèle et la motorisation de votre voiture pour un diagnostic mécanique ultra-précis.',
        robots: 'index, follow'
      }
    }
  },
  {
    path: 'diagnostic/:sessionId',
    loadComponent: () => import('./components/quiz/diagnostic-quiz.component').then(m => m.DiagnosticQuizComponent),
    title: 'AutoDiag · Diagnostic Guidé Interactif',
    data: {
      seo: {
        title: 'AutoDiag · Diagnostic Guidé Interactif',
        description: 'Questionnaire guidé d\'analyse technique automobile étape par étape.',
        robots: 'noindex, follow'
      }
    }
  },
  {
    path: 'results/:sessionId',
    loadComponent: () => import('./components/results/diagnostic-results.component').then(m => m.DiagnosticResultsComponent),
    title: 'AutoDiag · Vos Pistes de Diagnostic et Recommandations',
    data: {
      seo: {
        title: 'AutoDiag · Vos Pistes de Diagnostic et Recommandations',
        description: 'Résultats et probabilités des pannes identifiées avec pièces à contrôler et préconisations de sécurité.',
        robots: 'noindex, follow'
      }
    }
  },
  {
    path: 'guide/:guideId',
    loadComponent: () => import('./components/guide/repair-guide.component').then(m => m.RepairGuideComponent),
    title: 'AutoDiag · Guide de Réparation Technique',
    data: {
      seo: {
        title: 'AutoDiag · Guide de Réparation Technique',
        description: 'Guide pas à pas pour inspecter et réparer les composants de votre véhicule.',
        robots: 'index, follow'
      }
    }
  },
  {
    path: 'garage',
    loadComponent: () => import('./components/garage/garage-history.component').then(m => m.GarageHistoryComponent),
    title: 'AutoDiag · Mon Garage & Historique des Diagnostics',
    data: {
      seo: {
        title: 'AutoDiag · Mon Garage & Historique des Diagnostics',
        description: 'Consultez l\'historique de vos sessions de diagnostic auto et le suivi de vos véhicules enregistrés.',
        robots: 'noindex, follow'
      }
    }
  },
  {
    path: 'profil',
    loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent),
    title: 'AutoDiag · Mon Profil & Préférences',
    data: {
      seo: {
        title: 'AutoDiag · Mon Profil & Préférences',
        description: 'Gérez votre compte AutoDiag, vos coordonnées et vos préférences d\'application.',
        robots: 'noindex, follow'
      }
    }
  },
  { path: 'profile', redirectTo: 'profil' },
  {
    path: 'design-system',
    loadComponent: () => import('./components/design-system/design-system.component').then(m => m.DesignSystemComponent),
    title: 'AutoDiag · Design System',
    data: {
      seo: {
        title: 'AutoDiag · Design System',
        description: 'Spécifications graphiques et composants de l\'interface AutoDiag.',
        robots: 'noindex, nofollow'
      }
    }
  },
  {
    path: 'mentions-legales',
    loadComponent: () => import('./components/legal/legal-notice.component').then(m => m.LegalNoticeComponent),
    title: 'AutoDiag · Mentions Légales',
    data: {
      seo: {
        title: 'AutoDiag · Mentions Légales',
        description: 'Mentions légales, identification de l\'éditeur et de l\'hébergeur du service AutoDiag.',
        robots: 'index, follow'
      }
    }
  },
  {
    path: 'confidentialite',
    loadComponent: () => import('./components/legal/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
    title: 'AutoDiag · Politique de Confidentialité & RGPD',
    data: {
      seo: {
        title: 'AutoDiag · Politique de Confidentialité & RGPD',
        description: 'Politique de protection des données personnelles, sous-traitants IA (Groq), cookies et droits RGPD.',
        robots: 'index, follow'
      }
    }
  },
  {
    path: 'cgu',
    loadComponent: () => import('./components/legal/terms.component').then(m => m.TermsComponent),
    title: 'AutoDiag · Conditions Générales d\'Utilisation',
    data: {
      seo: {
        title: 'AutoDiag · Conditions Générales d\'Utilisation (CGU)',
        description: 'Conditions générales d\'utilisation d\'AutoDiag et décharge de responsabilité technique automobile.',
        robots: 'index, follow'
      }
    }
  },
  {
    path: '404',
    loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: 'AutoDiag · 404 Page non trouvée',
    data: {
      seo: {
        title: 'AutoDiag · 404 Page non trouvée',
        description: 'La page demandée est introuvable ou a été déplacée.',
        robots: 'noindex, nofollow'
      }
    }
  },
  { path: '**', redirectTo: '404' }
];
