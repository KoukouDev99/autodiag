import { Injectable } from '@angular/core';
import { findMake, VehicleMakes, VehicleMake } from 'node-vehicle-logos';

@Injectable({
  providedIn: 'root'
})
export class VehicleLogoService {
  private readonly logoBasePath = 'assets/vehicle-logos';
  private readonly defaultCarIcon = 'assets/simple-car.svg';
  private readonly logoUrlCache = new Map<string, string>();
  private readonly makeInfoCache = new Map<string, Readonly<VehicleMake> | undefined>();

  // Manual fallback map for brand variations, accents or regional names
  private readonly customBrandMap: Record<string, string> = {
    'opel': 'opel',
    'vauxhall': 'vauxhall',
    'citroen': 'citroen',
    'citroën': 'citroen',
    'skoda': 'skoda',
    'škoda': 'skoda',
    'mercedes': 'mercedes-benz',
    'mercedes-benz': 'mercedes-benz',
    'mercedes benz': 'mercedes-benz',
    'ds': 'ds',
    'ds automobiles': 'ds',
    'cupra': 'cupra',
    'alfa': 'alfa-romeo',
    'alfa-romeo': 'alfa-romeo',
    'alfa romeo': 'alfa-romeo',
    'land-rover': 'land-rover',
    'land rover': 'land-rover',
    'range rover': 'land-rover',
    'rolls royce': 'rolls-royce',
    'rolls-royce': 'rolls-royce',
    'aston martin': 'aston-martin',
    'aston-martin': 'aston-martin'
  };

  /**
   * Resolves the SVG logo asset path for a vehicle brand name using node-vehicle-logos.
   * Returns a path such as 'assets/vehicle-logos/peugeot.svg'.
   */
  getLogoUrl(brandName: string | undefined | null): string {
    if (!brandName || !brandName.trim()) {
      return this.defaultCarIcon;
    }

    const clean = brandName.trim();
    const cleanLower = clean.toLowerCase();

    const cached = this.logoUrlCache.get(cleanLower);
    if (cached !== undefined) {
      return cached;
    }

    let resolvedUrl = this.defaultCarIcon;

    // 1. Direct check in custom alias map
    if (this.customBrandMap[cleanLower]) {
      resolvedUrl = `${this.logoBasePath}/${this.customBrandMap[cleanLower]}.svg`;
      this.logoUrlCache.set(cleanLower, resolvedUrl);
      return resolvedUrl;
    }

    // 2. Try findMake full match
    let match = findMake(clean, VehicleMakes);
    if (match) {
      resolvedUrl = `${this.logoBasePath}/${match.logo}.svg`;
      this.logoUrlCache.set(cleanLower, resolvedUrl);
      return resolvedUrl;
    }

    // 3. Try findMake contains match
    match = findMake(clean, VehicleMakes, 'contains');
    if (match) {
      resolvedUrl = `${this.logoBasePath}/${match.logo}.svg`;
      this.logoUrlCache.set(cleanLower, resolvedUrl);
      return resolvedUrl;
    }

    // 4. Try normalized without accents / special chars
    const unaccented = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (unaccented !== clean) {
      const unaccentedLower = unaccented.toLowerCase();
      if (this.customBrandMap[unaccentedLower]) {
        resolvedUrl = `${this.logoBasePath}/${this.customBrandMap[unaccentedLower]}.svg`;
        this.logoUrlCache.set(cleanLower, resolvedUrl);
        return resolvedUrl;
      }
      match = findMake(unaccented, VehicleMakes) || findMake(unaccented, VehicleMakes, 'contains');
      if (match) {
        resolvedUrl = `${this.logoBasePath}/${match.logo}.svg`;
        this.logoUrlCache.set(cleanLower, resolvedUrl);
        return resolvedUrl;
      }
    }

    // 5. Try slugify (e.g. "Alfa Romeo" -> "alfa-romeo")
    const slug = cleanLower.replace(/\s+/g, '-');
    if (this.customBrandMap[slug]) {
      resolvedUrl = `${this.logoBasePath}/${this.customBrandMap[slug]}.svg`;
      this.logoUrlCache.set(cleanLower, resolvedUrl);
      return resolvedUrl;
    }

    // Fallback: return default vehicle icon
    this.logoUrlCache.set(cleanLower, resolvedUrl);
    return resolvedUrl;
  }

  /**
   * Returns the VehicleMake object from node-vehicle-logos if found
   */
  getMakeInfo(brandName: string): Readonly<VehicleMake> | undefined {
    if (!brandName) return undefined;
    const key = brandName.trim().toLowerCase();
    if (this.makeInfoCache.has(key)) {
      return this.makeInfoCache.get(key);
    }
    const found = findMake(brandName, VehicleMakes) || findMake(brandName, VehicleMakes, 'contains');
    this.makeInfoCache.set(key, found);
    return found;
  }
}
