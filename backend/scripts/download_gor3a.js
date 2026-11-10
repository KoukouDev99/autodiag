const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, '..', 'data', 'gor3a');
const GITHUB_API_URL = 'https://api.github.com/repos/gor3a/vehicle-makes-models/contents/data/json';
const RAW_BASE_URL = 'https://raw.githubusercontent.com/gor3a/vehicle-makes-models/main/data/json';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'AutoDiag-Dataset-Downloader/1.0', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

async function run() {
  console.log('=== Téléchargement du dataset gor3a/vehicle-makes-models ===');
  console.log(`Dossier cible : ${TARGET_DIR}`);

  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  console.log('1. Récupération de la liste des marques...');
  const files = await fetchJson(GITHUB_API_URL);
  const jsonFiles = files
    .filter(f => f.name && f.name.endsWith('.json') && f.name !== 'all.json')
    .map(f => f.name);

  console.log(`Trouvé ${jsonFiles.length} fichiers de marques (hors all.json).`);

  const indexData = [];
  const CONCURRENCY = 8;
  let completed = 0;
  let totalBytes = 0;

  for (let i = 0; i < jsonFiles.length; i += CONCURRENCY) {
    const chunk = jsonFiles.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (fileName) => {
      const filePath = path.join(TARGET_DIR, fileName);
      const rawUrl = `${RAW_BASE_URL}/${fileName}`;

      try {
        const res = await fetch(rawUrl, {
          headers: { 'User-Agent': 'AutoDiag-Dataset-Downloader/1.0' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const content = await res.text();
        fs.writeFileSync(filePath, content, 'utf8');

        totalBytes += Buffer.byteLength(content, 'utf8');
        completed++;

        // Parse summary for index
        try {
          const parsed = JSON.parse(content);
          const makeObj = parsed.makes && parsed.makes[0];
          const makeName = makeObj ? makeObj.name : fileName.replace('.json', '');
          const modelsCount = (makeObj && makeObj.models) ? makeObj.models.length : 0;
          indexData.push({
            name: makeName,
            slug: fileName.replace('.json', ''),
            file: fileName,
            modelsCount
          });
        } catch (_) {}

        process.stdout.write(`\r[${completed}/${jsonFiles.length}] Téléchargé : ${fileName.padEnd(25)}`);
      } catch (err) {
        console.error(`\nErreur sur ${fileName}:`, err.message);
      }
    }));
  }

  indexData.sort((a, b) => a.name.localeCompare(b.name));

  const manifest = {
    dataset: 'gor3a/vehicle-makes-models',
    license: 'ODbL v1.0',
    totalMakes: indexData.length,
    totalSizeBytes: totalBytes,
    totalSizeMB: (totalBytes / (1024 * 1024)).toFixed(2),
    downloadedAt: new Date().toISOString(),
    makes: indexData
  };

  const indexPath = path.join(TARGET_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\n\n=== Téléchargement terminé avec succès ! ===`);
  console.log(`- Marques téléchargées : ${indexData.length}`);
  console.log(`- Poids total disque   : ${(totalBytes / (1024 * 1024)).toFixed(2)} Mo`);
  console.log(`- Index généré         : ${indexPath}`);
}

run().catch(err => {
  console.error('\nÉchec du téléchargement :', err);
  process.exit(1);
});

