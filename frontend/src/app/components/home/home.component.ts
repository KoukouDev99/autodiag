import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DiagnosticService, Symptom, Vehicle, RecentDiagnostic, DtcCode, AiNormalizeResult, AiSafetyResult } from '../../services/diagnostic.service';
import { VehicleLogoService } from '../../services/vehicle-logo.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface SymptomCategoryGroup {
  id: string;
  name: string;
  icon: string;
  count: number;
  symptoms: Symptom[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly Math = Math;
  private diagnosticService = inject(DiagnosticService);
  private vehicleLogoService = inject(VehicleLogoService);
  translationService = inject(TranslationService);
  private router = inject(Router);

  private dtcSearch$ = new Subject<string>();
  private dtcSub?: Subscription;
  private dtcReqSub?: Subscription;

  // IA Copilote Search
  aiSearchQuery = '';
  isAnalyzingAi = false;
  aiMatchedSymptom: AiNormalizeResult | null = null;
  aiSafetyAlert: AiSafetyResult | null = null;
  private aiSearch$ = new Subject<string>();
  private aiSub?: Subscription;
  private aiSafetyReqSub?: Subscription;
  private aiNormReqSub?: Subscription;

  // Memoization cache for categoryGroups & displayedCategoryGroups
  private _lastSymptomsRef: Symptom[] | null = null;
  private _lastLang = '';
  private _cachedCategoryGroups: SymptomCategoryGroup[] = [];
  private _lastDisplayedSymptomsRef: Symptom[] | null = null;
  private _lastDisplayedLang = '';
  private _lastSelectedCategory = '';
  private _lastSymptomSearchQuery = '';
  private _cachedDisplayedGroups: SymptomCategoryGroup[] = [];

  aiExamplePrompts = [
    'Pédale de frein molle',
    'Fumée blanche à l\'échappement',
    'Moteur broute à l\'accélération',
    'Démarreur tourne mais ne se lance pas',
    'Voyant huile rouge allumé'
  ];

  symptoms: Symptom[] = [];
  selectedCategory = 'TOUTES';
  symptomSearchQuery = '';

  vehicles: Vehicle[] = [];
  vehicle: Vehicle | null = null;
  activeVehicleIndex = 0;
  recentDiagnostics: RecentDiagnostic[] = [];
  loading = true;

  get categoryGroups(): SymptomCategoryGroup[] {
    const lang = this.translationService.currentLang();
    if (this._lastSymptomsRef === this.symptoms && this._lastLang === lang) {
      return this._cachedCategoryGroups;
    }

    const map = new Map<string, SymptomCategoryGroup>();

    for (const symptom of this.symptoms) {
      const meta = this.resolveCategoryMeta(symptom.category);
      if (!map.has(meta.id)) {
        map.set(meta.id, {
          id: meta.id,
          name: meta.name,
          icon: meta.icon,
          count: 0,
          symptoms: []
        });
      }
      const grp = map.get(meta.id)!;
      grp.symptoms.push(symptom);
      grp.count++;
    }

    const priorityOrder = [
      'electrique',
      'moteur',
      'freinage',
      'refroidissement',
      'echappement',
      'carburant',
      'transmission',
      'direction',
      'roues',
      'climatisation',
      'autre'
    ];

    this._lastSymptomsRef = this.symptoms;
    this._lastLang = lang;
    this._cachedCategoryGroups = Array.from(map.values()).sort((a, b) => {
      const ia = priorityOrder.indexOf(a.id);
      const ib = priorityOrder.indexOf(b.id);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return this._cachedCategoryGroups;
  }

  get displayedCategoryGroups(): SymptomCategoryGroup[] {
    const baseGroups = this.categoryGroups;
    const lang = this.translationService.currentLang();
    if (
      this._lastDisplayedSymptomsRef === this.symptoms &&
      this._lastDisplayedLang === lang &&
      this._lastSelectedCategory === this.selectedCategory &&
      this._lastSymptomSearchQuery === this.symptomSearchQuery
    ) {
      return this._cachedDisplayedGroups;
    }

    let groups = baseGroups;

    if (this.selectedCategory !== 'TOUTES') {
      groups = groups.filter(g => g.id === this.selectedCategory);
    }

    if (this.symptomSearchQuery.trim()) {
      const q = this.symptomSearchQuery.trim().toLowerCase();
      groups = groups.map(g => {
        const gNameTranslated = this.translationService.t(g.name).toLowerCase();
        const matches = g.symptoms.filter(s => {
          const lbl = (s.label || '').toLowerCase();
          const lblTr = this.translationService.t(s.label || '').toLowerCase();
          const desc = (s.description || '').toLowerCase();
          const descTr = this.translationService.t(s.description || '').toLowerCase();
          return lbl.includes(q) || lblTr.includes(q) || desc.includes(q) || descTr.includes(q) || g.name.toLowerCase().includes(q) || gNameTranslated.includes(q);
        });
        return {
          ...g,
          count: matches.length,
          symptoms: matches
        };
      }).filter(g => g.symptoms.length > 0);
    }

    this._lastDisplayedSymptomsRef = this.symptoms;
    this._lastDisplayedLang = lang;
    this._lastSelectedCategory = this.selectedCategory;
    this._lastSymptomSearchQuery = this.symptomSearchQuery;
    this._cachedDisplayedGroups = groups;

    return this._cachedDisplayedGroups;
  }

  selectCategory(catId: string): void {
    this.selectedCategory = catId;
  }

  private resolveCategoryMeta(categoryRaw: string | undefined): { id: string; name: string; icon: string } {
    const c = (categoryRaw || '').toLowerCase();
    if (c.includes('start') || c.includes('démarrage') || c.includes('starter') || c.includes('battery') || c.includes('batterie') || c.includes('electr')) {
      return { id: 'electrique', name: 'Démarrage & Électrique', icon: '⚡' };
    }
    if (c.includes('brak') || c.includes('frein') || c.includes('abs') || c.includes('sécurité') || c.includes('security')) {
      return { id: 'freinage', name: 'Freinage & Sécurité', icon: '🛑' };
    }
    if (c.includes('cool') || c.includes('refroidiss') || c.includes('surchauff') || c.includes('overheat') || c.includes('radiator')) {
      return { id: 'refroidissement', name: 'Refroidissement & Température', icon: '🌡️' };
    }
    if (c.includes('exhaust') || c.includes('échapp') || c.includes('emiss') || c.includes('smoke') || c.includes('fumée') || c.includes('pollution')) {
      return { id: 'echappement', name: 'Échappement & Antipollution', icon: '💨' };
    }
    if (c.includes('fuel') || c.includes('carbur') || c.includes('intake') || c.includes('inject') || c.includes('essence') || c.includes('diesel')) {
      return { id: 'carburant', name: 'Carburant & Injection', icon: '⛽' };
    }
    if (c.includes('transm') || c.includes('boite') || c.includes('boîte') || c.includes('clutch') || c.includes('embray') || c.includes('drivetrain')) {
      return { id: 'transmission', name: 'Transmission & Boîte', icon: '🔄' };
    }
    if (c.includes('steer') || c.includes('direct') || c.includes('volant')) {
      return { id: 'direction', name: 'Direction & Tenue de route', icon: '🎯' };
    }
    if (c.includes('wheel') || c.includes('tire') || c.includes('roue') || c.includes('pneu') || c.includes('bearing') || c.includes('roulem')) {
      return { id: 'roues', name: 'Roues, Pneus & Roulements', icon: '🛞' };
    }
    if (c.includes('air cond') || c.includes('climat') || c.includes('heater') || c.includes('chauffage') || c.includes('climate')) {
      return { id: 'climatisation', name: 'Climatisation & Chauffage', icon: '❄️' };
    }
    if (c.includes('moteur') || c.includes('engine') || c.includes('valv') || c.includes('oil') || c.includes('huile')) {
      return { id: 'moteur', name: 'Moteur & Allumage', icon: '⚙️' };
    }
    if (c.includes('sound') || c.includes('bruit') || c.includes('mécaniq') || c.includes('mechanic')) {
      return { id: 'moteur', name: 'Moteur & Mécanique', icon: '🔧' };
    }
    return { id: 'autre', name: categoryRaw ? (categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1)) : 'Autres anomalies', icon: '🔧' };
  }

  // DTC Quick Search & Inspector
  dtcSearchQuery = '';
  dtcSelectedMake = '';
  dtcSearchResults: DtcCode[] = [];
  isSearchingDtc = false;
  selectedDtcDetail: any = null;
  dtcModalOpen = false;
  commonDtcShortcuts = [
    { code: 'P0420', label: 'Catalyseur' },
    { code: 'P0300', label: 'Ratés Allumage' },
    { code: 'P0171', label: 'Mélange Pauvre' },
    { code: 'P0101', label: 'Débitmètre d\'air' },
    { code: 'P0401', label: 'Vanne EGR' },
    { code: 'U0100', label: 'Bus CAN' }
  ];
  makesList: string[] = [
    'TOUTES', 'AUDI', 'BMW', 'CITROEN', 'FORD', 'HONDA', 'HYUNDAI', 
    'MERCEDES', 'NISSAN', 'PEUGEOT', 'RENAULT', 'TOYOTA', 'VOLKSWAGEN'
  ];

  getBrandLogoUrl(brand: string | undefined): string {
    return this.vehicleLogoService.getLogoUrl(brand);
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/simple-car.svg';
  }

  ngOnInit(): void {
    this.loadData();
    this.dtcSub = this.dtcSearch$.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.executeDtcSearch(query);
    });

    this.aiSub = this.aiSearch$.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.executeAiSearch(query);
    });
  }

  ngOnDestroy(): void {
    this.dtcSub?.unsubscribe();
    this.dtcReqSub?.unsubscribe();
    this.aiSub?.unsubscribe();
    this.aiSafetyReqSub?.unsubscribe();
    this.aiNormReqSub?.unsubscribe();
  }

  loadData(): void {
    this.loading = true;
    this.diagnosticService.getSymptoms().subscribe({
      next: (data) => this.symptoms = data,
      error: (err) => console.error(err)
    });

    this.diagnosticService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles || [];
        // Le véhicule principal est TOUJOURS affiché en tête (index 0)
        this.vehicles.sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return 0;
        });
        if (this.vehicles.length > 0) {
          this.vehicle = this.vehicles[0];
          this.activeVehicleIndex = 0;
        } else {
          this.vehicle = null;
          this.activeVehicleIndex = 0;
        }
      },
      error: (err) => console.error(err)
    });

    this.diagnosticService.getRecentDiagnostics().subscribe({
      next: (recent) => {
        this.recentDiagnostics = recent;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  nextVehicle(): void {
    if (this.vehicles.length <= 1) return;
    this.activeVehicleIndex = (this.activeVehicleIndex + 1) % this.vehicles.length;
    this.scrollToVehicle(this.activeVehicleIndex);
  }

  prevVehicle(): void {
    if (this.vehicles.length <= 1) return;
    this.activeVehicleIndex = (this.activeVehicleIndex - 1 + this.vehicles.length) % this.vehicles.length;
    this.scrollToVehicle(this.activeVehicleIndex);
  }

  goToVehicleIndex(index: number): void {
    this.activeVehicleIndex = index;
    this.scrollToVehicle(index);
  }

  private scrollToVehicle(index: number): void {
    const el = document.getElementById('garage-vehicle-card-' + index);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  onCarouselScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;
    const cardWidth = target.clientWidth * 0.88;
    const scrollLeft = target.scrollLeft;
    const newIndex = Math.round(scrollLeft / cardWidth);
    if (newIndex >= 0 && newIndex < this.vehicles.length && newIndex !== this.activeVehicleIndex) {
      this.activeVehicleIndex = newIndex;
    }
  }

  setPrimary(v: Vehicle, event: Event): void {
    event.stopPropagation();
    this.diagnosticService.setPrimaryVehicle(v.id).subscribe({
      next: () => {
        this.loadData();
      },
      error: (err) => console.error('Error setting primary vehicle', err)
    });
  }

  addNewVehicle(): void {
    this.router.navigate(['/vehicle'], { queryParams: { mode: 'new' } });
  }

  startVehicleDiagnostic(v: Vehicle, event: Event): void {
    event.stopPropagation();
    const firstSymptom = this.symptoms[0];
    if (firstSymptom) {
      this.diagnosticService.startDiagnostic(firstSymptom.id, v.id).subscribe({
        next: (res) => this.router.navigate(['/diagnostic', res.session_id]),
        error: () => this.router.navigate(['/diagnostic', 1])
      });
    } else {
      this.router.navigate(['/diagnostic', 1]);
    }
  }

  startSymptomDiagnostic(symptom: Symptom): void {
    this.diagnosticService.startDiagnostic(symptom.id, this.vehicle?.id || 1).subscribe({
      next: (res) => {
        this.router.navigate(['/diagnostic', res.session_id]);
      },
      error: (err) => {
        console.error('Error starting diagnostic:', err);
        // Fallback navigation
        this.router.navigate(['/diagnostic', 1]);
      }
    });
  }

  startGeneralDiagnostic(): void {
    const firstSymptom = this.symptoms.find(s => s.code === 'start_fail') || this.symptoms[0];
    if (firstSymptom) {
      this.startSymptomDiagnostic(firstSymptom);
    } else {
      this.router.navigate(['/diagnostic', 1]);
    }
  }

  goToVehicle(v?: Vehicle): void {
    if (v) {
      this.router.navigate(['/vehicle'], { queryParams: { id: v.id } });
    } else {
      this.router.navigate(['/vehicle']);
    }
  }

  goToHistory(): void {
    this.router.navigate(['/garage']);
  }

  openAssistantWithPrompt(promptText?: string): void {
    if (promptText && promptText.trim()) {
      this.router.navigate(['/assistant'], { queryParams: { prompt: promptText.trim() } });
    } else {
      this.router.navigate(['/assistant']);
    }
  }

  // --- DTC OBD-II Search & Inspection (Optimized with RxJS debounceTime 300ms) ---
  onDtcSearchInput(): void {
    this.dtcSearch$.next(this.dtcSearchQuery.trim());
  }

  private executeDtcSearch(q: string): void {
    this.dtcReqSub?.unsubscribe();
    if (q.length < 2) {
      this.dtcSearchResults = [];
      this.isSearchingDtc = false;
      return;
    }
    this.isSearchingDtc = true;
    const make = (this.dtcSelectedMake && this.dtcSelectedMake !== 'TOUTES') ? this.dtcSelectedMake : undefined;
    this.dtcReqSub = this.diagnosticService.searchDtc(q, undefined, make, 12).subscribe({
      next: (results) => {
        this.dtcSearchResults = results || [];
        this.isSearchingDtc = false;
      },
      error: () => {
        this.dtcSearchResults = [];
        this.isSearchingDtc = false;
      }
    });
  }

  selectDtcShortcut(code: string): void {
    this.dtcSearchQuery = code;
    this.inspectDtc(code);
  }

  inspectDtc(code: string): void {
    this.isSearchingDtc = true;
    const make = (this.dtcSelectedMake && this.dtcSelectedMake !== 'TOUTES') 
      ? this.dtcSelectedMake 
      : (this.vehicle ? this.vehicle.brand.toUpperCase() : undefined);

    this.diagnosticService.lookupDtc(code, make).subscribe({
      next: (details) => {
        this.selectedDtcDetail = details;
        this.dtcModalOpen = true;
        this.isSearchingDtc = false;
      },
      error: (err) => {
        console.error('Error fetching DTC detail', err);
        this.isSearchingDtc = false;
      }
    });
  }

  closeDtcModal(): void {
    this.dtcModalOpen = false;
    this.selectedDtcDetail = null;
  }

  // --- IA Copilote Smart Symptom Search ---
  onAiSearchInput(): void {
    this.aiSearch$.next(this.aiSearchQuery.trim());
  }

  selectAiPrompt(prompt: string): void {
    this.aiSearchQuery = prompt;
    this.onAiSearchInput();
  }

  clearAiSearch(): void {
    this.aiSafetyReqSub?.unsubscribe();
    this.aiNormReqSub?.unsubscribe();
    this.aiSearchQuery = '';
    this.aiMatchedSymptom = null;
    this.aiSafetyAlert = null;
    this.isAnalyzingAi = false;
  }

  private executeAiSearch(q: string): void {
    this.aiSafetyReqSub?.unsubscribe();
    this.aiNormReqSub?.unsubscribe();
    if (q.length < 3) {
      this.aiMatchedSymptom = null;
      this.aiSafetyAlert = null;
      this.isAnalyzingAi = false;
      return;
    }
    this.isAnalyzingAi = true;

    // 1. Garde-fou Sécurité (IA #5)
    this.aiSafetyReqSub = this.diagnosticService.checkSafety(q).subscribe({
      next: (safe) => {
        this.aiSafetyAlert = safe && safe.is_danger ? safe : null;
      },
      error: () => {
        this.aiSafetyAlert = null;
      }
    });

    // 2. Normalisation Sémantique (IA #1)
    this.aiNormReqSub = this.diagnosticService.normalizeSymptom(q).subscribe({
      next: (result) => {
        this.aiMatchedSymptom = result;
        this.isAnalyzingAi = false;
      },
      error: () => {
        this.aiMatchedSymptom = null;
        this.isAnalyzingAi = false;
      }
    });
  }

  launchAiDiagnostic(symptomId?: number | null): void {
    const targetId = symptomId || this.aiMatchedSymptom?.symptom_id;
    if (targetId) {
      this.diagnosticService.startDiagnostic(targetId, this.vehicle?.id || 1).subscribe({
        next: (res) => this.router.navigate(['/diagnostic', res.session_id]),
        error: () => this.router.navigate(['/diagnostic', 1])
      });
    } else {
      this.startGeneralDiagnostic();
    }
  }
}

