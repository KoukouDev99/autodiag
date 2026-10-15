const fs = require('fs');
const path = require('path');
const { initDatabase, getPool } = require('../backend/src/db/db');

async function exportSymptoms() {
  await initDatabase();
  const pool = getPool();
  const [rows] = await pool.query('SELECT id, code, label, category, icon, description, normalized_name FROM symptoms ORDER BY id ASC');
  
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(dataDir, 'canonical_symptoms.json'), JSON.stringify(rows, null, 2), 'utf8');
  console.log(`Exported ${rows.length} canonical symptoms to data/canonical_symptoms.json`);
  process.exit(0);
}

exportSymptoms().catch(err => {
  console.error(err);
  process.exit(1);
});
