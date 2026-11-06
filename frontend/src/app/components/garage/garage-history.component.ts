import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DiagnosticService, RecentDiagnostic, DtcCode, Vehicle } from '../../services/diagnostic.service';
import { VehicleLogoService } from '../../services/vehicle-logo.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-garage-history',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './garage-history.component.html',
  styleUrls: ['./garage-history.component.css']
})
export class GarageHistoryComponent implements OnInit {
  private diagnosticService = inject(DiagnosticService);
  private vehicleLogoService = inject(VehicleLogoService);
  private router = inject(Router);

  activeTab: 'history' | 'maintenance' | 'dtc' = 'history';

  diagnostics: RecentDiagnostic[] = [];
  maintenanceRecords: any[] = [];
  vehicle: Vehicle | null = null;

  getBrandLogoUrl(brand: string | undefined): string {
    return this.vehicleLogoService.getLogoUrl(brand);
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/vehicle-logos/vehicles.svg';
  }

  // DTC Lookup
  dtcInput = 'P0300';
  searchedDtc: DtcCode | null = null;
  dtcError = '';
  dtcLoading = false;

  ngOnInit(): void {
    this.diagnosticService.getRecentDiagnostics().subscribe({
      next: (data) => this.diagnostics = data,
      error: (err) => console.error(err)
    });

    this.diagnosticService.getVehicles().subscribe({
      next: (vehicles) => {
        if (vehicles.length > 0) {
          this.vehicle = vehicles[0];
          this.loadMaintenance(this.vehicle.id);
        }
      },
      error: (err) => console.error(err)
    });

    this.searchDtc('P0300');
  }

  loadMaintenance(vehicleId: number): void {
    this.diagnosticService.getMaintenance(vehicleId).subscribe({
      next: (records) => this.maintenanceRecords = records,
      error: (err) => console.error(err)
    });
  }

  searchDtc(codeToSearch?: string): void {
    const code = codeToSearch || this.dtcInput.trim();
    if (!code) return;

    this.dtcLoading = true;
    this.dtcError = '';
    this.searchedDtc = null;

    this.diagnosticService.lookupDtc(code).subscribe({
      next: (dtc) => {
        this.searchedDtc = dtc;
        this.dtcLoading = false;
      },
      error: (err) => {
        this.dtcError = `Aucun code défaut standard trouvé pour "${code}".`;
        this.dtcLoading = false;
      }
    });
  }

  setTab(tab: 'history' | 'maintenance' | 'dtc'): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
