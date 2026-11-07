const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.resolve('frontend/public/assets/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

console.log('Downloading Inter & Outfit woff2 files to:', fontsDir);

function fetchUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, headers));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, data: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

async function downloadFonts() {
  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  // 1. Fetch Google Fonts CSS for Inter
  console.log('Fetching CSS for Inter...');
  const interCssUrl = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  const interCssRes = await fetchUrl(interCssUrl, { 'User-Agent': userAgent });
  const interCss = interCssRes.data.toString('utf8');

  // Parse font URLs for latin subset
  const blocks = interCss.split('@font-face');
  let interFaces = [];
  for (const block of blocks) {
    if (!block.trim()) continue;
    if (block.includes('unicode-range') && (block.includes('U+0000-00FF') || block.includes('latin'))) {
      const weightMatch = block.match(/font-weight:\s*(\d+);/);
      const urlMatch = block.match(/src:\s*url\((https:\/\/[^)]+\.woff2)\)/);
      if (weightMatch && urlMatch) {
        interFaces.push({ family: 'Inter', weight: weightMatch[1], url: urlMatch[1] });
      }
    }
  }

  // 2. Fetch Google Fonts CSS for Outfit
  console.log('Fetching CSS for Outfit...');
  const outfitCssUrl = 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&display=swap';
  const outfitCssRes = await fetchUrl(outfitCssUrl, { 'User-Agent': userAgent });
  const outfitCss = outfitCssRes.data.toString('utf8');

  const outfitBlocks = outfitCss.split('@font-face');
  let outfitFaces = [];
  for (const block of outfitBlocks) {
    if (!block.trim()) continue;
    if (block.includes('unicode-range') && (block.includes('U+0000-00FF') || block.includes('latin'))) {
      const weightMatch = block.match(/font-weight:\s*(\d+);/);
      const urlMatch = block.match(/src:\s*url\((https:\/\/[^)]+\.woff2)\)/);
      if (weightMatch && urlMatch) {
        outfitFaces.push({ family: 'Outfit', weight: weightMatch[1], url: urlMatch[1] });
      }
    }
  }

  const allFaces = [...interFaces, ...outfitFaces];
  console.log(`Found ${allFaces.length} font files to download.`);

  let fontFaceCss = '/* AutoDiag - Self-Hosted Local Fonts (Inter & Outfit) */\n\n';

  for (const f of allFaces) {
    const filename = `${f.family.toLowerCase()}-latin-${f.weight}.woff2`;
    const targetPath = path.join(fontsDir, filename);
    console.log(`Downloading ${f.family} ${f.weight} -> ${filename}...`);
    const fontData = await fetchUrl(f.url);
    fs.writeFileSync(targetPath, fontData.data);
    console.log(`Saved ${filename} (${fontData.data.length} bytes)`);

    fontFaceCss += `@font-face {\n  font-family: '${f.family}';\n  font-style: normal;\n  font-weight: ${f.weight};\n  font-display: swap;\n  src: url('/assets/fonts/${filename}') format('woff2');\n  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n}\n\n`;
  }

  const cssPath = path.resolve('frontend/public/assets/fonts/fonts.css');
  fs.writeFileSync(cssPath, fontFaceCss, 'utf8');
  console.log('Generated fonts.css at:', cssPath);
}

downloadFonts().catch(err => {
  console.error('Download fonts failed:', err);
  process.exit(1);
});

