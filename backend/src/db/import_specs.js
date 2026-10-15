const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  console.log('🚀 Starting Automobile Specs Import...');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'autodiag',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });

  console.log('✅ Connected to MySQL.');

  // 1. Create Tables
  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS car_specs_models (
      id INT PRIMARY KEY,
      brand_name VARCHAR(100) NOT NULL,
      model_title VARCHAR(255) NOT NULL,
      model_family VARCHAR(100) DEFAULT '',
      year_start INT NULL,
      year_end INT NULL,
      photos JSON NULL,
      INDEX idx_brand (brand_name),
      INDEX idx_family (model_family),
      INDEX idx_years (year_start, year_end)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS car_specs_engines (
      id INT PRIMARY KEY,
      automobile_id INT NOT NULL,
      brand_name VARCHAR(100) NOT NULL,
      model_family VARCHAR(100) DEFAULT '',
      name VARCHAR(255) NOT NULL,
      power_hp VARCHAR(50) NULL,
      power_kw VARCHAR(50) NULL,
      torque_nm VARCHAR(50) NULL,
      displacement VARCHAR(50) NULL,
      cylinders VARCHAR(50) NULL,
      fuel VARCHAR(100) NULL,
      gearbox VARCHAR(100) NULL,
      drive_type VARCHAR(100) NULL,
      top_speed VARCHAR(100) NULL,
      acceleration VARCHAR(100) NULL,
      dimensions VARCHAR(150) NULL,
      weight VARCHAR(100) NULL,
      tires VARCHAR(100) NULL,
      raw_specs JSON NULL,
      INDEX idx_auto (automobile_id),
      INDEX idx_brand_model (brand_name, model_family),
      INDEX idx_fuel (fuel)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await connection.query(createTablesSql);
  console.log('✅ Created car_specs_models and car_specs_engines tables.');

  // Check if already seeded
  const [existing] = await connection.query('SELECT COUNT(*) as cnt FROM car_specs_engines');
  if (existing[0].cnt > 1000) {
    console.log(`ℹ️ Already seeded (${existing[0].cnt} engines). Skipping duplicate import.`);
    await connection.end();
    return;
  }

  // Clear before clean insert
  await connection.query('TRUNCATE TABLE car_specs_engines');
  await connection.query('TRUNCATE TABLE car_specs_models');

  // Load JSON Files
  const specsDir = path.join(__dirname, 'specs_data');
  const brands = JSON.parse(fs.readFileSync(path.join(specsDir, 'brands.json'), 'utf8'));
  const autos = JSON.parse(fs.readFileSync(path.join(specsDir, 'automobiles.json'), 'utf8'));
  const engines = JSON.parse(fs.readFileSync(path.join(specsDir, 'engines.json'), 'utf8'));

  const bMap = {};
  brands.forEach(b => {
    // Standardize brand names: e.g. 'PEUGEOT' -> 'Peugeot'
    const clean = b.name.trim();
    const formatted = clean.length > 3 ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : clean;
    bMap[b.id] = formatted;
  });

  // Map automobiles
  const autoMap = {};
  const modelRows = [];

  for (const a of autos) {
    const brandName = bMap[a.brand_id] || 'Unknown';
    let cleanTitle = a.name.replace(/Photos, engines &amp; full specs/gi, '').trim();
    cleanTitle = cleanTitle.replace(new RegExp('^' + brandName + '\\s*', 'i'), '').trim();

    // Extract years: e.g. "208 5 doors 2015-2019" or "2020 Peugeot 208"
    let yStart = null;
    let yEnd = null;
    const yearRangeMatch = cleanTitle.match(/\b(19\d\d|20\d\d)-(19\d\d|20\d\d|Present)\b/i);
    const singleYearMatch = cleanTitle.match(/\b(19\d\d|20\d\d)\b/);

    if (yearRangeMatch) {
      yStart = parseInt(yearRangeMatch[1], 10);
      yEnd = yearRangeMatch[2].toLowerCase() === 'present' ? new Date().getFullYear() : parseInt(yearRangeMatch[2], 10);
    } else if (singleYearMatch) {
      yStart = parseInt(singleYearMatch[1], 10);
      yEnd = yStart;
    }

    // Model family (e.g. "208", "Clio", "MDX", "A3")
    const words = cleanTitle.split(/\s+/);
    let family = words[0] || cleanTitle;
    if (family.match(/^\d{4}$/) && words[1]) {
      family = words[1];
    }

    autoMap[a.id] = {
      brandName,
      modelTitle: cleanTitle,
      modelFamily: family,
      yStart,
      yEnd
    };

    modelRows.push([
      a.id,
      brandName,
      cleanTitle,
      family,
      yStart,
      yEnd,
      JSON.stringify((a.photos || []).slice(0, 2))
    ]);
  }

  console.log(`📦 Inserting ${modelRows.length} models into car_specs_models...`);
  // Batch insert models
  const batchSize = 100;
  for (let i = 0; i < modelRows.length; i += batchSize) {
    const chunk = modelRows.slice(i, i + batchSize);
    await connection.query(
      'INSERT INTO car_specs_models (id, brand_name, model_title, model_family, year_start, year_end, photos) VALUES ?',
      [chunk]
    );
  }
  console.log('✅ Models inserted successfully.');

  // Helper parse specs
  function parseSpecs(engine) {
    const s = engine.specs || {};
    const eng = s['Engine Specs'] || {};
    const perf = s['Performance Specs'] || {};
    const trans = s['Transmission Specs'] || {};
    const dim = s['Dimensions'] || {};
    const wt = s['Weight Specs'] || {};
    const tires = s['Tires Specs'] || {};

    const powerStr = eng['Power:'] || '';
    const hpMatch = powerStr.match(/(\d+(?:\.\d+)?)\s*Hp/i) || engine.name.match(/\((\d+)\s*HP\)/i);
    const kwMatch = powerStr.match(/(\d+(?:\.\d+)?)\s*Kw/i);
    const torqueStr = eng['Torque:'] || '';
    const nmMatch = torqueStr.match(/(\d+(?:\.\d+)?)\s*Nm/i);

    const topSpeedStr = perf['Top Speed:'] || '';
    const kmhMatch = topSpeedStr.match(/(\d+(?:\.\d+)?)\s*Km\/H/i);
    const accStr = perf['Acceleration 0-62 Mph (0-100 Kph):'] || '';

    const lenStr = dim['Length:'] || '';
    const lenMatch = lenStr.match(/(\d+(?:,\d+)?)\s*Mm/i);
    const widStr = dim['Width:'] || '';
    const widMatch = widStr.match(/(\d+(?:,\d+)?)\s*Mm/i);
    const hgtStr = dim['Height:'] || '';
    const hgtMatch = hgtStr.match(/(\d+(?:,\d+)?)\s*Mm/i);

    const wtStr = wt['Unladen Weight:'] || '';
    const kgMatch = wtStr.match(/(\d+(?:,\d+)?)\s*Kg/i);

    let fuel = eng['Fuel:'] || 'Essence';
    if (/gasoline/i.test(fuel)) fuel = 'Essence';
    else if (/diesel/i.test(fuel)) fuel = 'Diesel';
    else if (/electric/i.test(fuel)) fuel = 'Électrique';
    else if (/hybrid/i.test(fuel)) fuel = 'Hybride';
    else if (/lpg|gpl/i.test(fuel)) fuel = 'GPL';

    return {
      powerHp: hpMatch ? hpMatch[1] + ' ch' : null,
      powerKw: kwMatch ? kwMatch[1] + ' kW' : null,
      torqueNm: nmMatch ? nmMatch[1] + ' Nm' : null,
      displacement: eng['Displacement:'] ? eng['Displacement:'].replace(/Cm3/i, 'cm³') : null,
      cylinders: eng['Cylinders:'] || null,
      fuel: fuel,
      gearbox: trans['Gearbox:'] || null,
      driveType: trans['Drive Type:'] || null,
      topSpeed: kmhMatch ? kmhMatch[1] + ' km/h' : null,
      acceleration: accStr ? accStr.trim() : null,
      dimensions: (lenMatch && widMatch && hgtMatch) ? (lenMatch[1] + ' × ' + widMatch[1] + ' × ' + hgtMatch[1] + ' mm') : null,
      weight: kgMatch ? kgMatch[1] + ' kg' : null,
      tires: tires['Tire Size:'] || null
    };
  }

  console.log(`📦 Parsing & inserting ${engines.length} engine options...`);
  const engineRows = [];

  for (const e of engines) {
    const parent = autoMap[e.automobile_id] || { brandName: 'Unknown', modelFamily: '' };
    const p = parseSpecs(e);

    engineRows.push([
      e.id,
      e.automobile_id,
      parent.brandName,
      parent.modelFamily,
      e.name,
      p.powerHp,
      p.powerKw,
      p.torqueNm,
      p.displacement,
      p.cylinders,
      p.fuel,
      p.gearbox,
      p.driveType,
      p.topSpeed,
      p.acceleration,
      p.dimensions,
      p.weight,
      p.tires,
      JSON.stringify(e.specs || {})
    ]);
  }

  for (let i = 0; i < engineRows.length; i += batchSize) {
    const chunk = engineRows.slice(i, i + batchSize);
    await connection.query(
      `INSERT INTO car_specs_engines (
        id, automobile_id, brand_name, model_family, name,
        power_hp, power_kw, torque_nm, displacement, cylinders,
        fuel, gearbox, drive_type, top_speed, acceleration,
        dimensions, weight, tires, raw_specs
      ) VALUES ?`,
      [chunk]
    );
  }

  console.log(`🎉 Successfully imported ${engineRows.length} engine specs into MySQL!`);
  await connection.end();
}

run().catch(err => {
  console.error('❌ Import error:', err.sqlMessage || err.message || err);
  if (err.sql) console.error('SQL query snippet:', err.sql.slice(0, 200));
  process.exit(1);
});
