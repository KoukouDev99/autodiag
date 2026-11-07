import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DiagnosticService, Vehicle, EngineSpecItem } from '../../services/diagnostic.service';
import { VehicleLogoService } from '../../services/vehicle-logo.service';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface CatalogModelItem {
  id: number;
  model: string;
  year_start: number | null;
  year_end: number | null;
}

export interface PlateCountryConfig {
  code: string;
  name: string;
  flag: string;
  placeholder: string;
  example: string;
  description: string;
  isEuro: boolean;
  flagColor?: string;
}

@Component({
  selector: 'app-vehicle',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './vehicle.component.html',
  styleUrls: ['./vehicle.component.css']
})
export class VehicleComponent implements OnInit {
  private diagnosticService = inject(DiagnosticService);
  private vehicleLogoService = inject(VehicleLogoService);
  translationService = inject(TranslationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  vehicles: Vehicle[] = [];
  isNewMode = false;
  feedbackMessage = '';
  feedbackType: 'success' | 'error' = 'success';

  getBrandLogoUrl(brand: string | undefined): string {
    return this.vehicleLogoService.getLogoUrl(brand);
  }

  onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/simple-car.svg';
  }

  vehicle: Vehicle = {
    id: 1,
    user_id: 1,
    brand: 'Peugeot',
    model: '208',
    year: 2019,
    fuel: 'Essence',
    engine: '1.2 PureTech 82 ch',
    mileage: 68420,
    mileage_unit: 'km',
    license_plate: 'AA-123-BB',
    plate_country: 'F',
    is_primary: true
  };

  isSaved = false;
  saving = false;

  // Configuration des pays d'immatriculation (23 pays majeurs & internationaux)
  plateCountries: PlateCountryConfig[] = [
    {
      code: 'F',
      name: 'France',
      flag: '🇫🇷',
      placeholder: 'AA-123-BB',
      example: 'AA-123-BB',
      description: 'Format SIV (AA-123-BB) ou FNI (1234 AB 75)',
      isEuro: true
    },
    {
      code: 'D',
      name: 'Allemagne',
      flag: '🇩🇪',
      placeholder: 'B-MW 1234',
      example: 'B-MW 1234',
      description: 'Format allemand : Ville (1-3 let.) + 1-2 let. + 1-4 chiffres (ex: B-MW 1234)',
      isEuro: true
    },
    {
      code: 'B',
      name: 'Belgique',
      flag: '🇧🇪',
      placeholder: '1-ABC-123',
      example: '1-ABC-123',
      description: 'Format belge : Chiffre index + 3 let. + 3 chiffres (ex: 1-ABC-123)',
      isEuro: true
    },
    {
      code: 'CH',
      name: 'Suisse',
      flag: '🇨🇭',
      placeholder: 'GE 123456',
      example: 'GE 123456',
      description: 'Format suisse : Canton (GE, VD, ZH...) + 1-6 chiffres (ex: GE 123456)',
      isEuro: false,
      flagColor: '#dc2626'
    },
    {
      code: 'I',
      name: 'Italie',
      flag: '🇮🇹',
      placeholder: 'AB-123-CD',
      example: 'AB-123-CD',
      description: 'Format italien : 2 let., 3 chiffres, 2 let. (ex: AB-123-CD)',
      isEuro: true
    },
    {
      code: 'E',
      name: 'Espagne',
      flag: '🇪🇸',
      placeholder: '1234-BCD',
      example: '1234-BCD',
      description: 'Format espagnol : 4 chiffres + 3 consonnes (ex: 1234-BCD)',
      isEuro: true
    },
    {
      code: 'P',
      name: 'Portugal',
      flag: '🇵🇹',
      placeholder: 'AA-12-BB',
      example: 'AA-12-BB',
      description: 'Format portugais : 2 let. + 2 chif. + 2 let. (ex: AA-12-BB)',
      isEuro: true
    },
    {
      code: 'NL',
      name: 'Pays-Bas',
      flag: '🇳🇱',
      placeholder: '12-ABC-3',
      example: '12-ABC-3',
      description: 'Format néerlandais : 6 caractères en 3 blocs (ex: 12-ABC-3)',
      isEuro: true
    },
    {
      code: 'L',
      name: 'Luxembourg',
      flag: '🇱🇺',
      placeholder: 'AB 1234',
      example: 'AB 1234',
      description: 'Format luxembourgeois : 2 let. + 4 chiffres (ex: AB 1234)',
      isEuro: true
    },
    {
      code: 'A',
      name: 'Autriche',
      flag: '🇦🇹',
      placeholder: 'W-12345X',
      example: 'W-12345X',
      description: 'Format autrichien : District (1-2 let.) + numéros (ex: W-12345X)',
      isEuro: true
    },
    {
      code: 'PL',
      name: 'Pologne',
      flag: '🇵🇱',
      placeholder: 'WA 12345',
      example: 'WA 12345',
      description: 'Format polonais : Voïvodie (2-3 let.) + 4-5 caractères (ex: WA 12345)',
      isEuro: true
    },
    {
      code: 'RO',
      name: 'Roumanie',
      flag: '🇷🇴',
      placeholder: 'B 123 ABC',
      example: 'B 123 ABC',
      description: 'Format roumain : Comté (1-2 let.) + 2-3 chif. + 3 let. (ex: B 123 ABC)',
      isEuro: true
    },
    {
      code: 'S',
      name: 'Suède',
      flag: '🇸🇪',
      placeholder: 'ABC 123',
      example: 'ABC 123',
      description: 'Format suédois : 3 let. + 3 chiffres ou 2 chif.+1 let. (ex: ABC 123)',
      isEuro: true
    },
    {
      code: 'N',
      name: 'Norvège',
      flag: '🇳🇴',
      placeholder: 'AB 12345',
      example: 'AB 12345',
      description: 'Format norvégien : 2 lettres + 5 chiffres (ex: AB 12345)',
      isEuro: true
    },
    {
      code: 'DK',
      name: 'Danemark',
      flag: '🇩🇰',
      placeholder: 'AB 12 345',
      example: 'AB 12 345',
      description: 'Format danois : 2 lettres + 5 chiffres (ex: AB 12 345)',
      isEuro: true
    },
    {
      code: 'IRL',
      name: 'Irlande',
      flag: '🇮🇪',
      placeholder: '181-D-12345',
      example: '181-D-12345',
      description: 'Format irlandais : Année - Comté - Numéro (ex: 181-D-12345)',
      isEuro: true
    },
    {
      code: 'UK',
      name: 'Royaume-Uni',
      flag: '🇬🇧',
      placeholder: 'AB12 CDE',
      example: 'AB12 CDE',
      description: 'Format britannique : 2 let., 2 chiffres, 3 let. (ex: AB12 CDE)',
      isEuro: true
    },
    {
      code: 'DZ',
      name: 'Algérie',
      flag: '🇩🇿',
      placeholder: '12345-119-16',
      example: '12345-119-16',
      description: 'Format algérien : Numéro - Année - Wilaya (ex: 12345-119-16)',
      isEuro: false,
      flagColor: '#006233'
    },
    {
      code: 'MA',
      name: 'Maroc',
      flag: '🇲🇦',
      placeholder: '12345-A-26',
      example: '12345-A-26',
      description: 'Format marocain : Numéro - Série - Wilaya (ex: 12345-A-26)',
      isEuro: false,
      flagColor: '#c1272d'
    },
    {
      code: 'TN',
      name: 'Tunisie',
      flag: '🇹🇳',
      placeholder: '123 TU 4567',
      example: '123 TU 4567',
      description: 'Format tunisien : Série TU Numéro (ex: 123 TU 4567)',
      isEuro: false,
      flagColor: '#e70013'
    },
    {
      code: 'TR',
      name: 'Turquie',
      flag: '🇹🇷',
      placeholder: '34 ABC 123',
      example: '34 ABC 123',
      description: 'Format turc : Province (2 chif.) + lettres + chiffres (ex: 34 ABC 123)',
      isEuro: false,
      flagColor: '#e30a17'
    },
    {
      code: 'US',
      name: 'USA / Canada',
      flag: '🇺🇸',
      placeholder: '7XYZ123',
      example: '7XYZ123',
      description: 'Format nord-américain : 3 à 8 caractères alphanumériques (ex: 7XYZ123)',
      isEuro: false,
      flagColor: '#0a3161'
    },
    {
      code: 'INT',
      name: 'Autre / International',
      flag: '🌐',
      placeholder: 'ABC-1234',
      example: 'ABC-1234',
      description: 'Format international libre : min 3 caractères alphanumériques',
      isEuro: false,
      flagColor: '#334155'
    }
  ];

  selectedCountry: PlateCountryConfig = this.plateCountries[0];
  isCountryOpen = false;

  getRightBandBgColor(): string {
    if (!this.selectedCountry.isEuro && this.selectedCountry.flagColor) {
      return this.selectedCountry.flagColor;
    }
    return '#003399';
  }

  // Immatriculation validation
  plateError: string | null = null;
  isPlateValid = true;

  setMileageUnit(unit: 'km' | 'mi'): void {
    const oldUnit = this.vehicle.mileage_unit || 'km';
    if (oldUnit === unit) return;

    this.vehicle.mileage_unit = unit;

    // Conversion fluide du kilométrage
    if (this.vehicle.mileage && this.vehicle.mileage > 0) {
      if (unit === 'mi' && oldUnit === 'km') {
        this.vehicle.mileage = Math.round(this.vehicle.mileage * 0.621371);
      } else if (unit === 'km' && oldUnit === 'mi') {
        this.vehicle.mileage = Math.round(this.vehicle.mileage * 1.60934);
      }
    }
  }

  selectCountry(country: PlateCountryConfig): void {
    this.selectedCountry = country;
    this.vehicle.plate_country = country.code;
    this.isCountryOpen = false;
    if (this.vehicle.license_plate) {
      this.validatePlate(this.vehicle.license_plate);
    }
  }

  toggleCountryDropdown(event: Event): void {
    event.stopPropagation();
    const willOpen = !this.isCountryOpen;
    this.closeAllDropdowns();
    this.isCountryOpen = willOpen;
  }

  validatePlate(plate?: string): boolean {
    const p = (plate !== undefined ? plate : this.vehicle.license_plate || '').trim().toUpperCase();
    if (!p) {
      this.plateError = null;
      this.isPlateValid = true;
      return true;
    }

    let isValid = false;

    switch (this.selectedCountry.code) {
      case 'F': {
        const sivRegex = /^[A-Z]{2}[-\s]?[0-9]{3}[-\s]?[A-Z]{2}$/;
        const fniRegex = /^[0-9]{1,4}[-\s]?[A-Z]{2,3}[-\s]?(?:2A|2B|[0-9]{2})$/;
        isValid = sivRegex.test(p) || fniRegex.test(p);
        break;
      }
      case 'D': {
        const deRegex = /^[A-ZÄÖÜ]{1,3}[-\s]?[A-Z]{1,2}[-\s]?[0-9]{1,4}$/;
        isValid = deRegex.test(p);
        break;
      }
      case 'B': {
        const beRegex = /^(?:[1-9][-\s]?)?[A-Z]{3}[-\s]?[0-9]{3}$|^[0-9]{3}[-\s]?[A-Z]{3}$/;
        isValid = beRegex.test(p);
        break;
      }
      case 'CH': {
        const chRegex = /^(?:AG|AI|AR|BE|BL|BS|FR|GE|GL|GR|JU|LU|NE|NW|OW|SG|SH|SO|SZ|TG|TI|UR|VD|VS|ZG|ZH)[-\s]?[0-9]{1,6}$/;
        isValid = chRegex.test(p);
        break;
      }
      case 'I': {
        const itRegex = /^[A-Z]{2}[-\s]?[0-9]{3}[-\s]?[A-Z]{2}$/;
        isValid = itRegex.test(p);
        break;
      }
      case 'E': {
        const esRegex = /^[0-9]{4}[-\s]?[A-Z]{3}$/;
        isValid = esRegex.test(p);
        break;
      }
      case 'P': {
        const ptRegex = /^[0-9A-Z]{2}[-\s]?[0-9A-Z]{2}[-\s]?[0-9A-Z]{2}$/;
        isValid = ptRegex.test(p);
        break;
      }
      case 'NL': {
        const nlRegex = /^[A-Z0-9]{1,3}[-\s]?[A-Z0-9]{1,3}[-\s]?[A-Z0-9]{1,3}$/;
        isValid = nlRegex.test(p);
        break;
      }
      case 'L': {
        const lRegex = /^(?:[A-Z]{1,2}[-\s]?)?[0-9]{4,5}$/;
        isValid = lRegex.test(p);
        break;
      }
      case 'A': {
        const aRegex = /^[A-Z]{1,2}[-\s]?[0-9A-Z]{3,6}$/;
        isValid = aRegex.test(p);
        break;
      }
      case 'PL': {
        const plRegex = /^[A-Z]{2,3}[-\s]?[0-9A-Z]{4,5}$/;
        isValid = plRegex.test(p);
        break;
      }
      case 'RO': {
        const roRegex = /^[A-Z]{1,2}[-\s]?[0-9]{2,3}[-\s]?[A-Z]{3}$/;
        isValid = roRegex.test(p);
        break;
      }
      case 'S': {
        const sRegex = /^[A-Z]{3}[-\s]?[0-9]{2,3}[A-Z]?$/;
        isValid = sRegex.test(p);
        break;
      }
      case 'N': {
        const nRegex = /^[A-Z]{2}[-\s]?[0-9]{5}$/;
        isValid = nRegex.test(p);
        break;
      }
      case 'DK': {
        const dkRegex = /^[A-Z]{2}[-\s]?[0-9]{2,5}[-\s]?[0-9]{0,3}$/;
        isValid = dkRegex.test(p);
        break;
      }
      case 'IRL': {
        const irlRegex = /^[0-9]{2,3}[-\s]?[A-Z]{1,2}[-\s]?[0-9]{1,6}$/;
        isValid = irlRegex.test(p);
        break;
      }
      case 'UK': {
        const ukRegex = /^[A-Z]{2}[0-9]{2}[-\s]?[A-Z]{3}$/;
        isValid = ukRegex.test(p);
        break;
      }
      case 'DZ': {
        const dzRegex = /^[0-9]{4,6}[-\s]?[0-9]{3}[-\s]?[0-9]{2}$/;
        isValid = dzRegex.test(p);
        break;
      }
      case 'MA': {
        const maRegex = /^[0-9]{1,6}[-\s]?[A-Z\u0600-\u06FF|W][-\s]?[0-9]{1,2}$/;
        isValid = maRegex.test(p);
        break;
      }
      case 'TN': {
        const tnRegex = /^[0-9]{1,3}[-\s]?(?:TU|TN)?[-\s]?[0-9]{1,4}$/;
        isValid = tnRegex.test(p);
        break;
      }
      case 'TR': {
        const trRegex = /^[0-9]{2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{2,4}$/;
        isValid = trRegex.test(p);
        break;
      }
      case 'US': {
        const usRegex = /^[A-Z0-9- ]{3,8}$/;
        isValid = usRegex.test(p);
        break;
      }
      case 'INT':
      default: {
        const intRegex = /^[A-Z0-9- ]{3,12}$/;
        isValid = intRegex.test(p);
        break;
      }
    }

    if (isValid) {
      this.plateError = null;
      this.isPlateValid = true;
      return true;
    } else {
      this.plateError = `Format ${this.selectedCountry.name} invalide (ex: ${this.selectedCountry.example})`;
      this.isPlateValid = false;
      return false;
    }
  }

  onPlateInput(event?: Event | string): void {
    let rawStr = this.vehicle.license_plate || '';
    if (typeof event === 'string') {
      rawStr = event;
    } else if (event && (event as any).target) {
      rawStr = ((event as any).target as HTMLInputElement).value;
    }

    let val = rawStr.toUpperCase().replace(/[^A-Z0-9- ]/g, '');

    // Auto-formatting contextuel selon le pays
    const rawClean = val.replace(/[-\s]/g, '');
    if (this.selectedCountry.code === 'F' && /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(rawClean)) {
      val = `${rawClean.slice(0, 2)}-${rawClean.slice(2, 5)}-${rawClean.slice(5, 7)}`;
    } else if (this.selectedCountry.code === 'B' && /^[1-9][A-Z]{3}[0-9]{3}$/.test(rawClean)) {
      val = `${rawClean.slice(0, 1)}-${rawClean.slice(1, 4)}-${rawClean.slice(4, 7)}`;
    } else if (this.selectedCountry.code === 'E' && /^[0-9]{4}[A-Z]{3}$/.test(rawClean)) {
      val = `${rawClean.slice(0, 4)}-${rawClean.slice(4, 7)}`;
    } else if (this.selectedCountry.code === 'I' && /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/.test(rawClean)) {
      val = `${rawClean.slice(0, 2)}-${rawClean.slice(2, 5)}-${rawClean.slice(5, 7)}`;
    } else if (this.selectedCountry.code === 'UK' && /^[A-Z]{2}[0-9]{2}[A-Z]{3}$/.test(rawClean)) {
      val = `${rawClean.slice(0, 4)} ${rawClean.slice(4, 7)}`;
    }

    this.vehicle.license_plate = val;

    if (!val.trim()) {
      this.plateError = null;
      this.isPlateValid = true;
    } else {
      this.validatePlate(val);
    }
  }

  // Catalog data
  brands: string[] = [];
  models: CatalogModelItem[] = [];
  years: number[] = [];
  engines: EngineSpecItem[] = [];
  selectedEngineSpec: EngineSpecItem | null = null;

  loadingBrands = false;
  loadingModels = false;
  loadingYears = false;
  loadingEngines = false;

  fuelTypes = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];

  // Custom Dropdown Open States
  isBrandOpen = false;
  isModelOpen = false;
  isYearOpen = false;
  isFuelOpen = false;
  isEngineOpen = false;

  // Search Filter Strings
  brandSearch = '';
  modelSearch = '';
  engineSearch = '';

  // Memoization caches for computed dropdown getters
  private _lastBrandsRef: string[] | null = null;
  private _lastBrandSearch = '';
  private _cachedFilteredBrands: string[] = [];

  private _lastModelsRef: CatalogModelItem[] | null = null;
  private _lastModelSearch = '';
  private _cachedFilteredModels: CatalogModelItem[] = [];

  private _lastFuelEnginesRef: EngineSpecItem[] | null = null;
  private _cachedAvailableFuelTypes: string[] = [];

  private _lastEngRef: EngineSpecItem[] | null = null;
  private _lastVehFuel = '';
  private _lastShowAllFuels = false;
  private _cachedAvailableEnginesForFuel: EngineSpecItem[] = [];

  private _lastFilteredEngBaseRef: EngineSpecItem[] | null = null;
  private _lastEngineSearch = '';
  private _cachedFilteredEngines: EngineSpecItem[] = [];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-group') && !target.closest('.plate-country-selector') && !target.closest('.euro-band-left')) {
      this.closeAllDropdowns();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeAllDropdowns();
  }

  closeAllDropdowns(): void {
    this.isBrandOpen = false;
    this.isModelOpen = false;
    this.isYearOpen = false;
    this.isFuelOpen = false;
    this.isEngineOpen = false;
    this.isCountryOpen = false;
  }

  toggleBrandDropdown(event: Event): void {
    event.stopPropagation();
    const willOpen = !this.isBrandOpen;
    this.closeAllDropdowns();
    this.isBrandOpen = willOpen;
    if (willOpen) {
      this.brandSearch = '';
      setTimeout(() => {
        const brandInput = document.querySelector('.dropdown-search-input') as HTMLInputElement;
        if (brandInput) {
          brandInput.focus();
        }
      }, 60);
    }
  }

  toggleModelDropdown(event: Event): void {
    event.stopPropagation();
    if (this.loadingModels || this.models.length === 0) return;
    const willOpen = !this.isModelOpen;
    this.closeAllDropdowns();
    this.isModelOpen = willOpen;
    if (willOpen) {
      this.modelSearch = '';
    }
  }

  get isEngineDisabled(): boolean {
    return !this.vehicle.brand || !this.vehicle.model || !this.vehicle.year || !this.vehicle.fuel;
  }

  toggleYearDropdown(event: Event): void {
    event.stopPropagation();
    if (!this.vehicle.brand || this.loadingYears || this.years.length === 0) return;
    const willOpen = !this.isYearOpen;
    this.closeAllDropdowns();
    this.isYearOpen = willOpen;
  }

  toggleFuelDropdown(event: Event): void {
    event.stopPropagation();
    if (!this.vehicle.model || this.loadingEngines || this.availableFuelTypes.length === 0) {
      return;
    }
    const willOpen = !this.isFuelOpen;
    this.closeAllDropdowns();
    this.isFuelOpen = willOpen;
  }

  toggleEngineDropdown(event: Event): void {
    event.stopPropagation();
    if (this.isEngineDisabled || this.loadingEngines) {
      return;
    }
    const willOpen = !this.isEngineOpen;
    this.closeAllDropdowns();
    this.isEngineOpen = willOpen;
    if (willOpen) {
      this.engineSearch = '';
    }
  }

  get filteredBrands(): string[] {
    if (this._lastBrandsRef === this.brands && this._lastBrandSearch === this.brandSearch) {
      return this._cachedFilteredBrands;
    }
    this._lastBrandsRef = this.brands;
    this._lastBrandSearch = this.brandSearch;
    if (!this.brandSearch.trim()) {
      this._cachedFilteredBrands = this.brands;
      return this._cachedFilteredBrands;
    }
    const q = this.brandSearch.trim().toLowerCase();
    this._cachedFilteredBrands = this.brands.filter(b => b.toLowerCase().includes(q));
    return this._cachedFilteredBrands;
  }

  get filteredModels(): CatalogModelItem[] {
    if (this._lastModelsRef === this.models && this._lastModelSearch === this.modelSearch) {
      return this._cachedFilteredModels;
    }
    this._lastModelsRef = this.models;
    this._lastModelSearch = this.modelSearch;
    if (!this.modelSearch.trim()) {
      this._cachedFilteredModels = this.models;
      return this._cachedFilteredModels;
    }
    const q = this.modelSearch.trim().toLowerCase();
    this._cachedFilteredModels = this.models.filter(m => m.model.toLowerCase().includes(q));
    return this._cachedFilteredModels;
  }

  showAllFuels = false;

  get availableFuelTypes(): string[] {
    if (this._lastFuelEnginesRef === this.engines) {
      return this._cachedAvailableFuelTypes;
    }
    this._lastFuelEnginesRef = this.engines;
    if (!this.engines || this.engines.length === 0) {
      this._cachedAvailableFuelTypes = this.vehicle.model ? [] : this.fuelTypes;
      return this._cachedAvailableFuelTypes;
    }
    // Filter fuels strictly to only those available in the catalog for this specific vehicle model
    const matching = this.fuelTypes.filter(targetFuel => 
      this.engines.some(engine => this.fuelMatches(engine.fuel, targetFuel))
    );

    this._cachedAvailableFuelTypes = matching.length > 0 ? matching : this.fuelTypes;
    return this._cachedAvailableFuelTypes;
  }

  fuelMatches(engineFuel: string | null, targetFuel: string): boolean {
    if (!engineFuel) return false;
    const ef = engineFuel.toLowerCase().trim();
    const tf = targetFuel.toLowerCase().trim();

    if (tf === 'essence') {
      return ef === 'essence' || ef.includes('gasoline') || ef.includes('petrol');
    }
    if (tf === 'diesel') {
      return ef === 'diesel';
    }
    if (tf === 'hybride') {
      return ef === 'hybride' || ef.includes('hybrid') || ef.includes('mhev') || ef.includes('phev');
    }
    if (tf === 'électrique') {
      return ef === 'électrique' || ef.includes('electric') || ef.includes('bev');
    }
    if (tf === 'gpl') {
      return ef === 'gpl' || ef.includes('lpg') || ef.includes('gas');
    }
    return ef.includes(tf);
  }

  normalizeFuel(rawFuel: string): string {
    if (!rawFuel) return this.vehicle.fuel;
    for (const f of this.fuelTypes) {
      if (this.fuelMatches(rawFuel, f)) return f;
    }
    return rawFuel;
  }

  get availableEnginesForFuel(): EngineSpecItem[] {
    if (
      this._lastEngRef === this.engines &&
      this._lastVehFuel === this.vehicle.fuel &&
      this._lastShowAllFuels === this.showAllFuels
    ) {
      return this._cachedAvailableEnginesForFuel;
    }
    this._lastEngRef = this.engines;
    this._lastVehFuel = this.vehicle.fuel;
    this._lastShowAllFuels = this.showAllFuels;
    if (!this.vehicle.fuel || this.showAllFuels) {
      this._cachedAvailableEnginesForFuel = this.engines;
      return this._cachedAvailableEnginesForFuel;
    }
    this._cachedAvailableEnginesForFuel = this.engines.filter(e => this.fuelMatches(e.fuel, this.vehicle.fuel));
    return this._cachedAvailableEnginesForFuel;
  }

  get filteredEngines(): EngineSpecItem[] {
    const list = this.availableEnginesForFuel;
    if (this._lastFilteredEngBaseRef === list && this._lastEngineSearch === this.engineSearch) {
      return this._cachedFilteredEngines;
    }
    this._lastFilteredEngBaseRef = list;
    this._lastEngineSearch = this.engineSearch;
    if (!this.engineSearch.trim()) {
      this._cachedFilteredEngines = list;
      return this._cachedFilteredEngines;
    }
    const q = this.engineSearch.trim().toLowerCase();
    this._cachedFilteredEngines = list.filter(e => 
      e.name.toLowerCase().includes(q) || 
      (e.power_hp && e.power_hp.toLowerCase().includes(q)) ||
      (e.displacement && e.displacement.toLowerCase().includes(q))
    );
    return this._cachedFilteredEngines;
  }

  selectBrand(brand: string): void {
    this.vehicle.brand = brand;
    this.vehicle.model = '';
    this.vehicle.year = null as any;
    this.vehicle.fuel = '';
    this.vehicle.engine = '';
    this.isBrandOpen = false;
    this.brandSearch = '';
    this.selectedEngineSpec = null;
    this.onBrandChange();
  }

  selectModel(model: string): void {
    this.vehicle.model = model;
    this.vehicle.year = null as any;
    this.vehicle.fuel = '';
    this.vehicle.engine = '';
    this.isModelOpen = false;
    this.modelSearch = '';
    this.selectedEngineSpec = null;
    this.onModelChange();
  }

  selectYear(year: number): void {
    this.vehicle.year = year;
    this.vehicle.engine = '';
    this.selectedEngineSpec = null;
    this.isYearOpen = false;
    this.loadEnginesForVehicle(this.vehicle.brand, this.vehicle.model, this.vehicle.year);
  }

  selectFuel(fuel: string): void {
    this.vehicle.fuel = fuel;
    this.isFuelOpen = false;
    this.showAllFuels = false;
    this.onFuelChange();
  }

  toggleAllFuelsFilter(event: Event): void {
    event.stopPropagation();
    this.showAllFuels = !this.showAllFuels;
  }

  onFuelChange(): void {
    if (!this.vehicle.fuel || this.engines.length === 0) return;

    // Check if currently selected engine matches newly selected fuel
    const currentMatches = this.selectedEngineSpec && this.fuelMatches(this.selectedEngineSpec.fuel, this.vehicle.fuel);
    if (!currentMatches) {
      this.vehicle.engine = '';
      this.selectedEngineSpec = null;
    }
  }

  selectEngine(engine: EngineSpecItem): void {
    this.vehicle.engine = engine.name;
    this.selectedEngineSpec = engine;
    if (engine.fuel) {
      this.vehicle.fuel = this.normalizeFuel(engine.fuel);
    }
    this.isEngineOpen = false;
    this.engineSearch = '';
  }

  ngOnInit(): void {
    // 1. Load User Vehicles
    this.diagnosticService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles || [];
        // La voiture principale est TOUJOURS affichée en tête
        this.sortVehiclesWithPrimaryFirst();

        this.route.queryParams.subscribe(params => {
          if (params['mode'] === 'new') {
            this.startNewVehicle(true);
            this.loadCatalogBrands();
          } else if (params['id']) {
            const targetId = Number(params['id']);
            const match = this.vehicles.find(v => v.id === targetId);
            if (match) {
              this.vehicle = { ...match };
              this.isNewMode = false;
            } else if (this.vehicles.length > 0) {
              this.vehicle = { ...this.vehicles[0] };
            }
            this.loadCatalogBrands();
          } else {
            // Le formulaire se réinitialise tout seul à l'état vierge
            this.startNewVehicle(false);
            this.loadCatalogBrands();
          }
        });
      },
      error: (err) => {
        console.error('Error fetching vehicles:', err);
        this.loadCatalogBrands();
      }
    });
  }

  sortVehiclesWithPrimaryFirst(): void {
    if (!this.vehicles || this.vehicles.length <= 1) return;
    this.vehicles.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return 0;
    });
  }

  focusBrandForm(): void {
    setTimeout(() => {
      const formEl = document.getElementById('vehicleFormCard');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      this.isBrandOpen = true;
      setTimeout(() => {
        const brandInput = document.querySelector('.dropdown-search-input') as HTMLInputElement;
        if (brandInput) {
          brandInput.focus();
        } else {
          const trigger = document.getElementById('brandSelectTrigger');
          if (trigger) trigger.focus();
        }
      }, 250);
    }, 150);
  }

  switchToVehicle(v: Vehicle): void {
    this.isNewMode = false;
    this.vehicle = { ...v };
    // Synchroniser le pays d'immatriculation
    const foundCountry = this.plateCountries.find(c => c.code === (v.plate_country || 'F'));
    this.selectedCountry = foundCountry || this.plateCountries[0];
    this.vehicle.plate_country = this.selectedCountry.code;
    this.vehicle.mileage_unit = v.mileage_unit || 'km';
    this.selectedEngineSpec = null;
    this.validatePlate();
    this.loadCatalogBrands();
  }

  resetForm(): void {
    this.selectedCountry = this.plateCountries[0];
    this.vehicle = {
      id: 0,
      user_id: 1,
      brand: '',
      model: '',
      year: null as any,
      fuel: '',
      engine: '',
      mileage: null as any,
      mileage_unit: 'km',
      license_plate: '',
      plate_country: 'F',
      is_primary: this.vehicles.length === 0
    };
    this.models = [];
    this.years = [];
    this.engines = [];
    this.selectedEngineSpec = null;
    this.plateError = null;
    this.isPlateValid = true;
    this.brandSearch = '';
    this.modelSearch = '';
    this.engineSearch = '';
    this.closeAllDropdowns();
  }

  onMileageFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (this.vehicle.mileage === 0 || input.value === '0') {
      this.vehicle.mileage = null as any;
      input.value = '';
    }
  }

  onMileageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = input.value;
    if (val.length > 1 && val.startsWith('0')) {
      val = val.replace(/^0+/, '');
      input.value = val;
      this.vehicle.mileage = Number(val) || (null as any);
    }
  }

  startNewVehicle(autoFocus = true): void {
    this.isNewMode = true;
    this.resetForm();
    this.loadCatalogBrands();
    if (autoFocus) {
      this.focusBrandForm();
    }
  }

  setAsPrimary(v: Vehicle, event?: Event): void {
    if (event) event.stopPropagation();
    this.diagnosticService.setPrimaryVehicle(v.id).subscribe({
      next: () => {
        this.vehicles.forEach(veh => veh.is_primary = (veh.id === v.id));
        if (this.vehicle.id === v.id) {
          this.vehicle.is_primary = true;
        }
        this.sortVehiclesWithPrimaryFirst();
        this.showFeedback('Ce véhicule est désormais le véhicule principal.', 'success');
      },
      error: (err) => {
        console.error(err);
        this.showFeedback('Erreur lors du changement de véhicule principal.', 'error');
      }
    });
  }

  deleteCurrentVehicle(): void {
    if (!this.vehicle.id) {
      this.resetForm();
      return;
    }
    if (!confirm(`Êtes-vous sûr de vouloir retirer votre ${this.vehicle.brand || 'véhicule'} ${this.vehicle.model || ''} du garage ?`)) {
      return;
    }

    this.diagnosticService.deleteVehicle(this.vehicle.id).subscribe({
      next: () => {
        const deletedId = this.vehicle.id;
        this.vehicles = this.vehicles.filter(v => v.id !== deletedId);
        this.sortVehiclesWithPrimaryFirst();
        if (this.vehicles.length > 0) {
          const nextVeh = this.vehicles.find(v => v.is_primary) || this.vehicles[0];
          this.switchToVehicle(nextVeh);
        } else {
          // Le garage reste vide sans voiture
          this.startNewVehicle(false);
        }
        this.showFeedback('Véhicule retiré du garage avec succès.', 'success');
      },
      error: () => {
        const deletedId = this.vehicle.id;
        this.vehicles = this.vehicles.filter(v => v.id !== deletedId);
        this.sortVehiclesWithPrimaryFirst();
        if (this.vehicles.length > 0) {
          const nextVeh = this.vehicles.find(v => v.is_primary) || this.vehicles[0];
          this.switchToVehicle(nextVeh);
        } else {
          this.startNewVehicle(false);
        }
        this.showFeedback('Véhicule retiré du garage.', 'success');
      }
    });
  }

  deleteVehicleFromList(v: Vehicle, event?: Event): void {
    if (event) event.stopPropagation();
    if (!v.id) return;
    if (!confirm(`Supprimer définitivement ${v.brand} ${v.model} de votre garage ?`)) {
      return;
    }

    this.diagnosticService.deleteVehicle(v.id).subscribe({
      next: () => {
        this.vehicles = this.vehicles.filter(x => x.id !== v.id);
        this.sortVehiclesWithPrimaryFirst();
        if (this.vehicle.id === v.id) {
          if (this.vehicles.length > 0) {
            this.switchToVehicle(this.vehicles[0]);
          } else {
            this.startNewVehicle(false);
          }
        }
        this.showFeedback('Véhicule supprimé du garage.', 'success');
      },
      error: () => {
        this.vehicles = this.vehicles.filter(x => x.id !== v.id);
        this.sortVehiclesWithPrimaryFirst();
        if (this.vehicle.id === v.id) {
          if (this.vehicles.length > 0) {
            this.switchToVehicle(this.vehicles[0]);
          } else {
            this.startNewVehicle(false);
          }
        }
        this.showFeedback('Véhicule retiré.', 'success');
      }
    });
  }

  private showFeedback(msg: string, type: 'success' | 'error' = 'success'): void {
    this.feedbackMessage = msg;
    this.feedbackType = type;
    this.isSaved = true;
    setTimeout(() => {
      this.isSaved = false;
      this.feedbackMessage = '';
    }, 3500);
  }

  loadCatalogBrands(): void {
    this.loadingBrands = true;
    this.diagnosticService.getCatalogMakes().subscribe({
      next: (makes) => {
        this.loadingBrands = false;
        this.brands = makes || [];

        // Ensure current vehicle brand is valid or included
        if (this.vehicle.brand && !this.brands.includes(this.vehicle.brand)) {
          this.brands.unshift(this.vehicle.brand);
        }

        // Load models for current vehicle brand
        if (this.vehicle.brand) {
          this.loadModelsForBrand(this.vehicle.brand, false);
        }
      },
      error: (err) => {
        console.warn('Error loading brands:', err);
        this.loadingBrands = false;
        if (this.vehicle.brand) {
          this.loadModelsForBrand(this.vehicle.brand, false);
        }
      }
    });
  }

  onBrandChange(): void {
    if (!this.vehicle.brand) return;
    this.loadModelsForBrand(this.vehicle.brand, true);
  }

  loadModelsForBrand(make: string, resetSelection = false): void {
    this.loadingModels = true;
    this.diagnosticService.getCatalogModels(make).subscribe({
      next: (models) => {
        this.loadingModels = false;
        this.models = models || [];

        if (resetSelection) {
          if (this.isNewMode) {
            this.vehicle.model = '';
            this.vehicle.year = null as any;
            this.vehicle.fuel = '';
            this.vehicle.engine = '';
          } else if (this.models.length > 0) {
            this.vehicle.model = this.models[0].model;
          } else {
            this.vehicle.model = '';
          }
          this.loadYearsForModel(make, this.vehicle.model, true);
        } else {
          // If vehicle model is set, verify or preserve
          const modelExists = this.models.some(m => m.model.toLowerCase() === this.vehicle.model.toLowerCase());
          if (!modelExists && this.vehicle.model) {
            this.models.unshift({
              id: 0,
              model: this.vehicle.model,
              year_start: null,
              year_end: null
            });
          }
          this.loadYearsForModel(make, this.vehicle.model, false);
        }

        // Load engines
        this.loadEnginesForVehicle(make, this.vehicle.model, this.vehicle.year);
      },
      error: (err) => {
        console.warn('Error loading models:', err);
        this.loadingModels = false;
        this.generateFallbackYears();
      }
    });
  }

  onModelChange(): void {
    if (!this.vehicle.brand || !this.vehicle.model) return;
    this.loadYearsForModel(this.vehicle.brand, this.vehicle.model, true);
    this.loadEnginesForVehicle(this.vehicle.brand, this.vehicle.model, this.vehicle.year);
  }

  loadYearsForModel(make: string, model: string, resetYear = false): void {
    if (!make || !model) {
      this.generateFallbackYears();
      return;
    }

    this.loadingYears = true;
    this.diagnosticService.getCatalogYears(make, model).subscribe({
      next: (years) => {
        this.loadingYears = false;
        this.years = (years && years.length > 0) ? years : [];
        if (this.years.length === 0) {
          this.generateFallbackYears();
        }

        if (resetYear) {
          if (this.isNewMode || !this.vehicle.year) {
            this.vehicle.year = null as any;
          } else {
            this.vehicle.year = this.years[0] || new Date().getFullYear();
          }
        } else {
          // Ensure current year is in list
          if (this.vehicle.year && !this.years.includes(this.vehicle.year)) {
            this.years.unshift(this.vehicle.year);
            this.years.sort((a, b) => b - a);
          }
        }
      },
      error: () => {
        this.loadingYears = false;
        this.generateFallbackYears();
      }
    });
  }

  loadEnginesForVehicle(make: string, model: string, year?: number): void {
    if (!make || !model) {
      this.engines = [];
      return;
    }

    this.loadingEngines = true;
    this.diagnosticService.getCatalogEngines(make, model, year).subscribe({
      next: (engines) => {
        this.loadingEngines = false;

        // 1. Déduplication stricte des motorisations par nom normalisé + puissance
        const seenEngines = new Set<string>();
        const uniqueEngines: EngineSpecItem[] = [];
        for (const eng of (engines || [])) {
          const key = `${eng.name.trim().toLowerCase()}_${(eng.power_hp || '').trim().toLowerCase()}`;
          if (!seenEngines.has(key)) {
            seenEngines.add(key);
            uniqueEngines.push(eng);
          }
        }
        this.engines = uniqueEngines;

        // Harmonize vehicle fuel with available engines only if already chosen
        const availableFuels = this.availableFuelTypes;
        if (this.vehicle.fuel && availableFuels.length > 0 && !availableFuels.includes(this.vehicle.fuel)) {
          this.vehicle.fuel = availableFuels[0];
        }

        // 2. Ne rien sélectionner par défaut en bleu ! Uniquement si l'utilisateur a cliqué ou existant
        if (this.vehicle.engine && this.vehicle.engine.trim() && this.engines.length > 0) {
          const cleanCur = this.vehicle.engine.toLowerCase().replace(/[^a-z0-9]/g, '');
          const match = this.engines.find(e => {
            const cleanE = e.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            return (cleanE === cleanCur || cleanE.includes(cleanCur) || cleanCur.includes(cleanE));
          });
          if (match) {
            this.selectedEngineSpec = match;
          } else {
            this.selectedEngineSpec = null;
          }
        } else {
          // Non sélectionné par défaut
          this.selectedEngineSpec = null;
          this.vehicle.engine = '';
        }
      },
      error: () => {
        this.loadingEngines = false;
        this.engines = [];
        this.selectedEngineSpec = null;
      }
    });
  }

  private generateFallbackYears(): void {
    const current = new Date().getFullYear();
    const list: number[] = [];
    for (let y = current; y >= 1990; y--) {
      list.push(y);
    }
    this.years = list;
    if (this.vehicle.year && !this.years.includes(this.vehicle.year)) {
      this.years.unshift(this.vehicle.year);
      this.years.sort((a, b) => b - a);
    }
  }

  saveVehicle(): void {
    if (!this.vehicle.brand || !this.vehicle.model) {
      this.showFeedback('Veuillez sélectionner au moins une marque et un modèle.', 'error');
      return;
    }

    // Synchroniser le pays et l'unité de kilométrage
    this.vehicle.plate_country = this.selectedCountry.code;
    this.vehicle.mileage_unit = this.vehicle.mileage_unit || 'km';
    if (this.vehicle.mileage !== null && this.vehicle.mileage !== undefined && (this.vehicle.mileage as any) !== '') {
      this.vehicle.mileage = Number(this.vehicle.mileage) || 0;
    } else {
      this.vehicle.mileage = null as any;
    }

    // Le remplissage de l'immatriculation est optionnel :
    // si l'utilisateur ne la remplit pas, il peut enregistrer sa voiture
    const trimmedPlate = (this.vehicle.license_plate || '').trim();
    if (trimmedPlate) {
      if (!this.validatePlate(trimmedPlate)) {
        this.plateError = `Format invalide (Exemple : ${this.selectedCountry.example})`;
        this.isPlateValid = false;
        this.showFeedback(`Le format d'immatriculation pour ${this.selectedCountry.name} n'est pas valide !`, 'error');
        return;
      }
    } else {
      this.vehicle.license_plate = '';
      this.plateError = null;
      this.isPlateValid = true;
    }

    this.saving = true;

    if (this.isNewMode) {
      this.diagnosticService.createVehicle(this.vehicle).subscribe({
        next: (created) => {
          this.saving = false;
          const fullCreated: Vehicle = {
            ...this.vehicle,
            ...created,
            plate_country: this.vehicle.plate_country,
            mileage_unit: this.vehicle.mileage_unit
          };
          if (fullCreated.is_primary) {
            this.vehicles.forEach(v => v.is_primary = false);
          }
          this.vehicles.push(fullCreated);
          this.sortVehiclesWithPrimaryFirst();
          this.showFeedback('Nouveau véhicule enregistré avec succès dans votre garage !', 'success');
          // Réinitialiser le formulaire après enregistrement
          this.resetForm();
          this.isNewMode = true;
        },
        error: (err) => {
          console.error(err);
          this.saving = false;
          this.showFeedback("Erreur lors de l'enregistrement du véhicule.", 'error');
        }
      });
    } else {
      this.diagnosticService.updateVehicle(this.vehicle.id, this.vehicle).subscribe({
        next: (updated) => {
          this.saving = false;
          const fullUpdated: Vehicle = {
            ...this.vehicle,
            ...updated,
            plate_country: this.vehicle.plate_country,
            mileage_unit: this.vehicle.mileage_unit
          };
          const idx = this.vehicles.findIndex(v => v.id === fullUpdated.id);
          if (idx >= 0) {
            this.vehicles[idx] = fullUpdated;
          }
          if (fullUpdated.is_primary) {
            this.vehicles.forEach(v => {
              if (v.id !== fullUpdated.id) v.is_primary = false;
            });
          }
          this.sortVehiclesWithPrimaryFirst();
          this.showFeedback('Véhicule mis à jour et enregistré avec succès !', 'success');
          // Réinitialiser le formulaire après enregistrement
          this.resetForm();
          this.isNewMode = true;
        },
        error: (err) => {
          console.error(err);
          this.saving = false;
          this.showFeedback('Erreur lors de la mise à jour du véhicule.', 'error');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
