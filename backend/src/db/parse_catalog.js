const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'vehicles_raw.csv');
const raw = fs.readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);

const records = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  const parts = line.split(',');
  if (parts.length < 3) continue;

  const make_group = parts[0].trim();
  const make = parts[1].trim();

  let model = '';
  let year_start_raw = '';
  let year_end_raw = '';

  if (parts.length === 5) {
    model = parts[2].trim();
    year_start_raw = parts[3].trim();
    year_end_raw = parts[4].trim();
  } else if (parts.length > 5) {
    // Model might contain comma
    model = parts.slice(2, parts.length - 2).join(',').trim();
    year_start_raw = parts[parts.length - 2].trim();
    year_end_raw = parts[parts.length - 1].trim();
  }

  // Clean redundant quotes
  model = model.replace(/^"+|"+$/g, '').trim();

  // Clean redundant prefixes
  let cleanModel = model;
  if (cleanModel.startsWith('CITROEN ')) cleanModel = cleanModel.replace('CITROEN ', '');
  if (cleanModel.startsWith('MERCEDES BENZ ')) cleanModel = cleanModel.replace('MERCEDES BENZ ', '');
  if (cleanModel.startsWith('SKODA ')) cleanModel = cleanModel.replace('SKODA ', '');
  if (cleanModel.startsWith('MOTORS ')) cleanModel = cleanModel.replace('MOTORS ', '');
  if (cleanModel.startsWith('dr ')) cleanModel = cleanModel.replace('dr ', '');
  if (cleanModel.startsWith('Trucks ')) cleanModel = cleanModel.replace('Trucks ', '');
  if (cleanModel.startsWith('AUTOMOBILES ')) cleanModel = cleanModel.replace('AUTOMOBILES ', '');

  const year_start = year_start_raw ? parseInt(year_start_raw, 10) : null;
  const year_end = year_end_raw ? parseInt(year_end_raw, 10) : null;

  records.push({
    make_group,
    make,
    model: cleanModel,
    year_start: isNaN(year_start) ? null : year_start,
    year_end: isNaN(year_end) ? null : year_end
  });
}

console.log('Total parsed vehicles:', records.length);
const distinctMakes = [...new Set(records.map(r => r.make))];
console.log('Distinct makes count:', distinctMakes.length);

const outPath = path.join(__dirname, 'car_catalog_data.json');
fs.writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8');
console.log('Successfully written to', outPath);
