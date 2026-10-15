import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DiagnosticService, Symptom, Vehicle, RecentDiagnostic, DtcCode, AiNormalizeResult, AiSafetyResult } from '../../services/diagnostic.service';
import { VehicleLogoService } from '../../services/vehicle-logo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly Math = Math;
  private diagnosticService = inject(DiagnosticService);
  private vehicleLogoService = inject(VehicleLogoService);
  private router = inject(Router);

  private dtcSearch$ = new Subject<string>();
  private dtcSub?: Subscription;

  // IA Copilote Search
  aiSearchQuery = '';
  isAnalyzingAi = false;
  aiMatchedSymptom: AiNormalizeResult | null = null;
  aiSafetyAlert: AiSafetyResult | null = null;
  private aiSearch$ = new Subject<string>();
  private aiSub?: Subscription;

  aiExamplePrompts = [
    'Pédale de frein molle',
    'Fumée blanche à l\'échappement',
    'Moteur broute à l\'accélération',
    'Démarreur tourne mais ne se lance pas',
    'Voyant huile rouge allumé'
  ];

  symptoms: Symptom[] = [];
  vehicles: Vehicle[] = [];
  vehicle: Vehicle | null = null;
  activeVehicleIndex = 0;
  recentDiagnostics: RecentDiagnostic[] = [];
  loading = true;

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
    this.aiSub?.unsubscribe();
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

  // --- DTC OBD-II Search & Inspection (Optimized with RxJS debounceTime 300ms) ---
  onDtcSearchInput(): void {
    this.dtcSearch$.next(this.dtcSearchQuery.trim());
  }

  private executeDtcSearch(q: string): void {
    if (q.length < 2) {
      this.dtcSearchResults = [];
      this.isSearchingDtc = false;
      return;
    }
    this.isSearchingDtc = true;
    const make = (this.dtcSelectedMake && this.dtcSelectedMake !== 'TOUTES') ? this.dtcSelectedMake : undefined;
    this.diagnosticService.searchDtc(q, undefined, make, 12).subscribe({
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
    this.aiSearchQuery = '';
    this.aiMatchedSymptom = null;
    this.aiSafetyAlert = null;
    this.isAnalyzingAi = false;
  }

  private executeAiSearch(q: string): void {
    if (q.length < 3) {
      this.aiMatchedSymptom = null;
      this.aiSafetyAlert = null;
      this.isAnalyzingAi = false;
      return;
    }
    this.isAnalyzingAi = true;

    // 1. Garde-fou Sécurité (IA #5)
    this.diagnosticService.checkSafety(q).subscribe({
      next: (safe) => {
        this.aiSafetyAlert = safe && safe.is_danger ? safe : null;
      },
      error: () => {
        this.aiSafetyAlert = null;
      }
    });

    // 2. Normalisation Sémantique (IA #1)
    this.diagnosticService.normalizeSymptom(q).subscribe({
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

