const fs = require('fs');
const path = require('path');
const { appCache } = require('../utils/cache');

const GOR3A_LOCAL_DIR = path.join(__dirname, '..', '..', 'data', 'gor3a');
const GOR3A_INDEX_PATH = path.join(GOR3A_LOCAL_DIR, 'index.json');

let meterAppDb = null;
try {
  meterAppDb = require('@meterapp/vehicle-db');
} catch (e) {
  console.warn('[Catalog Sources] @meterapp/vehicle-db could not be loaded:', e.message);
}

// -----------------------------------------------------------------------------
// 1. NHTSA vPIC Provider (Free live US Govt API - No API key needed)
// -----------------------------------------------------------------------------
const nhtsaProvider = {
  id: 'nhtsa',
  name: 'NHTSA vPIC API',
  badge: 'API US Gratuite (En direct)',
  type: 'live_api',
  requiresKey: false,
  license: 'U.S. Government Public Data (Domaine public)',
  url: 'https://vpic.nhtsa.dot.gov/api/',
  description: 'National Highway Traffic Safety Administration - Catalogue officiel du Département des Transports des États-Unis et décodage VIN instantané.',

  async getAllMakes() {
    const cacheKey = 'nhtsa:makes';
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json', {
      headers: { 'User-Agent': 'AutoDiag-Diagnostic-App/1.0' },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) throw new Error(`NHTSA API error: HTTP ${res.status}`);
    const data = await res.json();
    const raw = (data.Results || [])
      .map(r => r.Make_Name ? r.Make_Name.trim() : '')
      .filter(Boolean);
    const unique = Array.from(new Set(raw)).sort((a, b) => a.localeCompare(b));
    appCache.set(cacheKey, unique, 86400); // 24 hours
    return unique;
  },

  async getModelsForMake(make) {
    if (!make) return [];
    const cleanMake = make.trim();
    const cacheKey = `nhtsa:models:${cleanMake.toLowerCase()}`;
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(cleanMake)}?format=json`, {
      headers: { 'User-Agent': 'AutoDiag-Diagnostic-App/1.0' },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) throw new Error(`NHTSA API error: HTTP ${res.status}`);
    const data = await res.json();
    const models = (data.Results || [])
      .map(r => ({
        id: r.Model_ID,
        model: r.Model_Name ? r.Model_Name.trim() : '',
        make: r.Make_Name ? r.Make_Name.trim() : cleanMake,
        year_start: null,
        year_end: null
      }))
      .filter(m => m.model);

    // Deduplicate models by name
    const uniqueMap = new Map();
    for (const m of models) {
      if (!uniqueMap.has(m.model.toLowerCase())) {
        uniqueMap.set(m.model.toLowerCase(), m);
      }
    }
    const result = Array.from(uniqueMap.values()).sort((a, b) => a.model.localeCompare(b.model));
    appCache.set(cacheKey, result, 86400);
    return result;
  },

  async decodeVin(vin) {
    if (!vin || typeof vin !== 'string' || vin.trim().length < 8) {
      throw new Error('Numéro VIN invalide (minimum 8 caractères requis)');
    }
    const cleanVin = vin.trim().toUpperCase();
    const cacheKey = `nhtsa:vin:${cleanVin}`;
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(cleanVin)}?format=json`, {
      headers: { 'User-Agent': 'AutoDiag-Diagnostic-App/1.0' },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) throw new Error(`NHTSA VIN API error: HTTP ${res.status}`);
    const data = await res.json();
    const r = (data.Results && data.Results[0]) || null;
    if (!r) throw new Error('Aucun véhicule trouvé pour ce numéro VIN');

    // Normalize fuel name to French AutoDiag standard
    let fuelNormalized = 'Essence';
    const rawFuel = (r.FuelTypePrimary || '').toLowerCase();
    if (rawFuel.includes('gasoline') || rawFuel.includes('petrol') || rawFuel === 'gas') {
      fuelNormalized = 'Essence';
    } else if (rawFuel.includes('diesel')) {
      fuelNormalized = 'Diesel';
    } else if (rawFuel.includes('electric') || rawFuel.includes('bev')) {
      fuelNormalized = 'Électrique';
    } else if (rawFuel.includes('hybrid') || rawFuel.includes('phev')) {
      fuelNormalized = 'Hybride';
    } else if (rawFuel.includes('lpg') || rawFuel.includes('cng') || rawFuel.includes('liquefied') || rawFuel.includes('propane')) {
      fuelNormalized = 'GPL';
    }

    const decoded = {
      vin: cleanVin,
      brand: r.Make || '',
      model: r.Model || '',
      year: r.ModelYear ? parseInt(r.ModelYear, 10) : null,
      fuel: fuelNormalized,
      fuel_raw: r.FuelTypePrimary || '',
      engine: r.DisplacementL && r.EngineCylinders
        ? `${r.DisplacementL}L ${r.EngineCylinders} cyl${r.EngineHP ? ' (' + r.EngineHP + ' ch)' : ''}`
        : (r.EngineModel || r.DisplacementL ? `${r.DisplacementL}L` : ''),
      displacement_l: r.DisplacementL ? parseFloat(r.DisplacementL) : null,
      cylinders: r.EngineCylinders ? parseInt(r.EngineCylinders, 10) : null,
      power_hp: r.EngineHP ? parseInt(r.EngineHP, 10) : null,
      vehicle_type: r.VehicleType || '',
      body_class: r.BodyClass || '',
      drive_type: r.DriveType || '',
      plant_country: r.PlantCountry || '',
      manufacturer: r.Manufacturer || '',
      error_code: r.ErrorCode || '0',
      error_text: r.ErrorText || ''
    };

    appCache.set(cacheKey, decoded, 86400);
    return decoded;
  }
};

// -----------------------------------------------------------------------------
// 2. gor3a/vehicle-makes-models Provider (Open Dataset, 164 makes, 30,390 engines)
// -----------------------------------------------------------------------------
const gor3aProvider = {
  id: 'gor3a',
  name: 'gor3a/vehicle-makes-models',
  badge: 'Dataset Open Data ODbL (30 000+ moteurs)',
  type: 'open_dataset',
  requiresKey: false,
  license: 'Open Database License (ODbL) v1.0',
  url: 'https://github.com/gor3a/vehicle-makes-models',
  description: 'Dataset libre et ouvert hebdomadaire : 164 marques, 2 621 modèles, 7 169 générations et plus de 30 000 fiches moteurs avec cylindrée, puissance ch, couple Nm et transmission.',

  async getAllMakes() {
    const cacheKey = 'gor3a:makes';
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    // 1. Try local downloaded dataset first (100% offline & instant)
    try {
      if (fs.existsSync(GOR3A_INDEX_PATH)) {
        const raw = fs.readFileSync(GOR3A_INDEX_PATH, 'utf8');
        const manifest = JSON.parse(raw);
        if (manifest && Array.isArray(manifest.makes) && manifest.makes.length > 0) {
          const makes = manifest.makes.map(m => m.name).sort((a, b) => a.localeCompare(b));
          appCache.set(cacheKey, makes, 86400);
          return makes;
        }
      }
    } catch (err) {
      console.warn('[Catalog Sources] gor3a local index read error:', err.message);
    }

    // 2. Fallback to online GitHub API
    try {
      const res = await fetch('https://api.github.com/repos/gor3a/vehicle-makes-models/contents/data/json', {
        headers: { 'User-Agent': 'AutoDiag-Diagnostic-App/1.0' },
        signal: AbortSignal.timeout(12000)
      });
      if (res.ok) {
        const files = await res.json();
        const makes = files
          .filter(f => f.name && f.name.endsWith('.json') && f.name !== 'all.json')
          .map(f => {
            const raw = f.name.replace('.json', '');
            return raw.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          })
          .sort((a, b) => a.localeCompare(b));
        appCache.set(cacheKey, makes, 86400);
        return makes;
      }
    } catch (e) {
      console.warn('[Catalog Sources] gor3a makes fetch error:', e.message);
    }

    // Fallback list of top 60 makes if GitHub rate limit triggers
    return [
      'Abarth', 'Alfa Romeo', 'Alpine', 'Aston Martin', 'Audi', 'Bentley', 'BMW', 'Bugatti', 'BYD',
      'Cadillac', 'Chevrolet', 'Chrysler', 'Citroen', 'Cupra', 'Dacia', 'Daewoo', 'Daihatsu', 'Dodge',
      'DS', 'Ferrari', 'Fiat', 'Ford', 'Genesis', 'GMC', 'Honda', 'Hyundai', 'Infiniti', 'Isuzu',
      'Iveco', 'Jaguar', 'Jeep', 'Kia', 'Lada', 'Lamborghini', 'Lancia', 'Land Rover', 'Lexus',
      'Lotus', 'Maserati', 'Mazda', 'McLaren', 'Mercedes-Benz', 'MG', 'Mini', 'Mitsubishi',
      'Nissan', 'Opel', 'Peugeot', 'Polestar', 'Porsche', 'Renault', 'Rolls-Royce', 'Saab',
      'Seat', 'Skoda', 'Smart', 'Subaru', 'Suzuki', 'Tesla', 'Toyota', 'Volkswagen', 'Volvo'
    ];
  },

  async getMakeData(make) {
    if (!make) return null;
    const slug = make.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    const cacheKey = `gor3a:data:${slug}`;
    const cached = appCache.get(cacheKey);
    if (cached) return cached;

    // 1. Try local downloaded JSON file first (100% offline & instant)
    try {
      const localFilePath = path.join(GOR3A_LOCAL_DIR, `${slug}.json`);
      if (fs.existsSync(localFilePath)) {
        const raw = fs.readFileSync(localFilePath, 'utf8');
        const data = JSON.parse(raw);
        appCache.set(cacheKey, data, 86400);
        return data;
      }
    } catch (err) {
      console.warn(`[Catalog Sources] gor3a local file read error (${slug}):`, err.message);
    }

    // 2. Fallback to online GitHub raw fetch
    const res = await fetch(`https://raw.githubusercontent.com/gor3a/vehicle-makes-models/main/data/json/${slug}.json`, {
      headers: { 'User-Agent': 'AutoDiag-Diagnostic-App/1.0' },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    appCache.set(cacheKey, data, 86400);
    return data;
  },

  async getModelsForMake(make) {
    const data = await this.getMakeData(make);
    if (!data || !data.makes || data.makes.length === 0) return [];
    const models = [];
    for (const m of data.makes) {
      if (m.models) {
        for (const mod of m.models) {
          models.push({
            id: mod.id || 0,
            model: mod.name,
            year_start: mod.yearStart || null,
            year_end: mod.yearEnd || null,
            generations_count: (mod.generations || []).length,
            engines_count: (mod.generations || []).reduce((acc, g) => acc + (g.engines ? g.engines.length : 0), 0)
          });
        }
      }
    }
    return models.sort((a, b) => a.model.localeCompare(b.model));
  },

  async getEnginesForModel(make, modelName) {
    const data = await this.getMakeData(make);
    if (!data || !data.makes) return [];
    const engines = [];
    const cleanModel = (modelName || '').toLowerCase().trim();
    const cleanModelNoBrand = cleanModel.replace(new RegExp(`^${(make || '').toLowerCase()}\\s+`, 'i'), '').trim();

    for (const m of data.makes) {
      if (m.models) {
        const found = m.models.find(mod => {
          const modName = mod.name.toLowerCase().trim();
          const modNameNoBrand = modName.replace(new RegExp(`^${(make || '').toLowerCase()}\\s+`, 'i'), '').trim();
          return (
            modName === cleanModel ||
            modNameNoBrand === cleanModel ||
            modNameNoBrand === cleanModelNoBrand ||
            modName.includes(cleanModel) ||
            cleanModel.includes(modNameNoBrand)
          );
        });

        if (found && found.generations) {
          for (const g of found.generations) {
            if (g.engines) {
              for (const e of g.engines) {
                let fuelNorm = 'Essence';
                const rawF = (e.fuelType || '').toLowerCase();
                if (rawF.includes('electric') || rawF.includes('bev') || rawF.includes('électrique')) fuelNorm = 'Électrique';
                else if (rawF.includes('diesel')) fuelNorm = 'Diesel';
                else if (rawF.includes('hybrid') || rawF.includes('mhev') || rawF.includes('phev')) fuelNorm = 'Hybride';
                else if (rawF.includes('gas') || rawF.includes('lpg') || rawF.includes('cng') || rawF.includes('gpl')) fuelNorm = 'GPL';
                else fuelNorm = 'Essence';

                engines.push({
                  generation: g.name,
                  generation_years: `${g.yearStart || ''}-${g.yearEnd || ''}`,
                  name: e.label || e.name || `${e.displacementCc || ''}cc ${e.powerHp ? e.powerHp + ' ch' : ''}`,
                  fuel: fuelNorm,
                  power_hp: e.powerHp ? `${e.powerHp} ch` : null,
                  power_kw: e.powerKw ? `${e.powerKw} kW` : null,
                  torque_nm: e.torqueNm ? `${e.torqueNm} Nm` : null,
                  displacement: e.displacementCc ? `${(e.displacementCc / 1000).toFixed(1)} L (${e.displacementCc} cm³)` : null,
                  cylinders: e.cylinders || null,
                  transmission: e.transmission || null,
                  drivetrain: e.drivetrain || null
                });
              }
            }
          }
        }
      }
    }
    return engines;
  }
};

// -----------------------------------------------------------------------------
// 3. MeterApp vehicle-db Provider (Embedded Offline Node.js Library)
// -----------------------------------------------------------------------------
const meterAppProvider = {
  id: 'meterapp',
  name: 'MeterApp vehicle-db (@meterapp)',
  badge: 'Base Hors-Ligne 100% Locale (1 600+ marques)',
  type: 'offline_library',
  requiresKey: false,
  isAvailable: !!meterAppDb,
  license: 'ISC License (Open source international)',
  url: 'https://github.com/MeterApp/vehicle-db',
  description: 'Base de données hors-ligne internationale pour Node.js sans aucun appel réseau. 1 608 marques et 42 334 modèles (1990–2027) construits depuis les registres officiels mondiaux (NHTSA, DVLA, EEA, RDW).',

  getAllMakes() {
    if (!meterAppDb) return [];
    const raw = meterAppDb.getMakes();
    const names = Array.from(new Set(raw.map(m => m.makeName.trim()))).sort((a, b) => a.localeCompare(b));
    return names;
  },

  getModelsForMake(make) {
    if (!meterAppDb || !make) return [];
    const cleanMake = make.trim().toLowerCase();
    const makes = meterAppDb.getMakes();
    const matched = makes.filter(m => m.makeName.toLowerCase() === cleanMake);
    if (matched.length === 0) {
      const sub = makes.find(m => m.makeName.toLowerCase().includes(cleanMake) || cleanMake.includes(m.makeName.toLowerCase()));
      if (sub) matched.push(sub);
    }
    if (matched.length === 0) return [];

    const allModels = [];
    for (const m of matched) {
      const rawModels = meterAppDb.getModels({ makeId: m.makeId });
      for (const rm of rawModels) {
        allModels.push(rm);
      }
    }

    const uniqueMap = new Map();
    for (const rm of allModels) {
      const key = rm.modelName.trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, {
          id: rm.modelId,
          model: rm.modelName,
          make: rm.makeName,
          vehicle_type: rm.vehicleTypeName || 'Passenger Car',
          year_start: null,
          year_end: null
        });
      }
    }
    return Array.from(uniqueMap.values()).sort((a, b) => a.model.localeCompare(b.model));
  },

  getAvailableYears(make, model) {
    if (!meterAppDb || !make || !model) return [];
    return meterAppDb.getAvailableYears(make, model) || [];
  }
};

// Summary of all available providers
function getAllProvidersInfo() {
  return [
    {
      id: 'internal',
      name: 'AutoDiag Référence (MySQL)',
      badge: 'Base Locale Certifiée',
      type: 'internal_db',
      description: 'Catalogue certifié atelier AutoDiag avec spécifications moteur, dimensions, pneumatiques et arbres de diagnostic.',
      isOnline: true,
      requiresNetwork: false
    },
    {
      id: nhtsaProvider.id,
      name: nhtsaProvider.name,
      badge: nhtsaProvider.badge,
      type: nhtsaProvider.type,
      description: nhtsaProvider.description,
      license: nhtsaProvider.license,
      url: nhtsaProvider.url,
      isOnline: true,
      requiresNetwork: true,
      features: ['Toutes les marques mondiales', 'Modèles officiels NHTSA', 'Décodage VIN gratuit en direct']
    },
    {
      id: gor3aProvider.id,
      name: gor3aProvider.name,
      badge: gor3aProvider.badge,
      type: gor3aProvider.type,
      description: gor3aProvider.description,
      license: gor3aProvider.license,
      url: gor3aProvider.url,
      isOnline: true,
      requiresNetwork: true,
      features: ['164 marques', '2 621 modèles', '7 169 générations', '30 390 fiches moteurs (ch, Nm, cm³)']
    },
    {
      id: meterAppProvider.id,
      name: meterAppProvider.name,
      badge: meterAppProvider.badge,
      type: meterAppProvider.type,
      description: meterAppProvider.description,
      license: meterAppProvider.license,
      url: meterAppProvider.url,
      isOnline: meterAppProvider.isAvailable,
      requiresNetwork: false,
      features: ['1 608 marques', '42 334 modèles', 'Millésimes 1990–2027', '100% hors-ligne (0 appel réseau)']
    }
  ];
}

module.exports = {
  nhtsaProvider,
  gor3aProvider,
  meterAppProvider,
  getAllProvidersInfo
};
