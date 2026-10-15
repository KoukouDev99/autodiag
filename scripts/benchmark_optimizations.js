const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = http.request('http://localhost:3000' + path, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const durationMs = performance.now() - start;
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) {}
        resolve({
          status: res.statusCode,
          durationMs,
          data: parsed
        });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function benchmarkEndpoint(name, path, options = {}, iterations = 20) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const res = await request(path, options);
    if (res.status >= 200 && res.status < 300) {
      times.push(res.durationMs);
    }
  }
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.50)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const min = times[0];
  const max = times[times.length - 1];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;

  return { name, p50: p50.toFixed(2), p95: p95.toFixed(2), min: min.toFixed(2), max: max.toFixed(2), avg: avg.toFixed(2), count: times.length };
}

async function run() {
  console.log('--- Benchmarking AutoDiag Optimized Endpoints (20 iterations each) ---');

  const b1 = await benchmarkEndpoint('Catalog Makes (Cached)', '/api/catalog/makes');
  const b2 = await benchmarkEndpoint('Symptoms List (Cached)', '/api/symptoms');
  const b3 = await benchmarkEndpoint('DTC Lookup P0420 (Cached)', '/api/dtc/P0420');
  const b4 = await benchmarkEndpoint('DTC Search (Indexed)', '/api/dtc/search?q=P0300');
  const b5 = await benchmarkEndpoint('KB Categories (Cached)', '/api/kb/categories');
  const b6 = await benchmarkEndpoint('Diagnostic Recent', '/api/diagnostics/recent');
  
  // Benchmark diagnostic start + question fetch
  const startRes = await request('/api/diagnostic/start', { method: 'POST', body: { symptom_id: 1, vehicle_id: 1 } });
  const sessionId = startRes.data.session_id;
  const b7 = await benchmarkEndpoint('Diagnostic Question (Batched No-N+1)', `/api/diagnostic/${sessionId}/question`);
  const b8 = await benchmarkEndpoint('Diagnostic Results (Engine Eval)', `/api/diagnostic/${sessionId}/results`);

  const statsRes = await request('/api/system/stats');

  console.table([b1, b2, b3, b4, b5, b6, b7, b8]);
  console.log('\n--- Cache System Statistics ---');
  console.log(JSON.stringify(statsRes.data.cache, null, 2));
}

run().catch(console.error);
