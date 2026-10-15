import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DiagnosticService, Symptom, Vehicle, RecentDiagnostic, DtcCode } from '../../services/diagnostic.service';
import { VehicleLogoService } from '../../services/vehicle-logo.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private diagnosticService = inject(DiagnosticService);
  private vehicleLogoService = inject(VehicleLogoService);
  private router = inject(Router);

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

  // --- DTC OBD-II Search & Inspection ---
  onDtcSearchInput(): void {
    const q = this.dtcSearchQuery.trim();
    if (q.length < 2) {
      this.dtcSearchResults = [];
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
}
