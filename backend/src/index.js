const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./db/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AutoDiag API', timestamp: new Date() });
});

// Root welcome & API documentation page
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AutoDiag API · Backend</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', sans-serif;
            background: #0b0f19;
            color: #f1f5f9;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
          }
          .card {
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 20px;
            padding: 32px;
            max-width: 580px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          }
          .badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(16, 185, 129, 0.15);
            color: #34d399;
            border: 1px solid rgba(16, 185, 129, 0.3);
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 16px;
          }
          .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
          h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 8px;
          }
          p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
          .endpoints-title {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin-bottom: 12px;
          }
          .links-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
          .endpoint-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #1f2937;
            border: 1px solid #374151;
            padding: 10px 14px;
            border-radius: 10px;
            color: #93c5fd;
            text-decoration: none;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s;
          }
          .endpoint-link:hover {
            background: #2563eb;
            color: #ffffff;
            border-color: #2563eb;
          }
          .method {
            background: #0f172a;
            color: #38bdf8;
            font-size: 11px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .frontend-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #2563eb;
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 12px;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            transition: all 0.2s;
          }
          .frontend-btn:hover {
            background: #1d4ed8;
            transform: translateY(-1px);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">
            <span class="dot"></span>
            Backend Node.js & MySQL Live
          </div>
          <h1>🚗 AutoDiag Backend API</h1>
          <p>Le serveur backend est opérationnel et connecté à la base de données MySQL <code>autodiag</code>. L'application Angular s'exécute sur le port 4200.</p>
          
          <div class="endpoints-title">Points d'accès API disponibles :</div>
          <div class="links-list">
            <a href="/api/vehicles" class="endpoint-link" target="_blank">
              <span>/api/vehicles</span>
              <span class="method">GET</span>
            </a>
            <a href="/api/symptoms" class="endpoint-link" target="_blank">
              <span>/api/symptoms</span>
              <span class="method">GET</span>
            </a>
            <a href="/api/diagnostics/recent" class="endpoint-link" target="_blank">
              <span>/api/diagnostics/recent</span>
              <span class="method">GET</span>
            </a>
            <a href="/api/dtc/P0300" class="endpoint-link" target="_blank">
              <span>/api/dtc/P0300</span>
              <span class="method">GET</span>
            </a>
            <a href="/health" class="endpoint-link" target="_blank">
              <span>/health</span>
              <span class="method">GET</span>
            </a>
          </div>

          <a href="http://localhost:4200" class="frontend-btn" target="_blank">
            <span>Ouvrir l'application Angular (Port 4200)</span>
            <span>→</span>
          </a>
        </div>
      </body>
      </html>
    `);
  } else {
    res.json({
      name: 'AutoDiag API',
      status: 'online',
      database: 'MySQL autodiag',
      frontend: 'http://localhost:4200',
      endpoints: [
        '/api/vehicles',
        '/api/symptoms',
        '/api/diagnostics/recent',
        '/api/dtc/:code',
        '/api/diagnostic/start',
        '/api/diagnostic/:sessionId/results',
        '/api/diagnostic/guide/:hypothesisId',
        '/health'
      ]
    });
  }
});

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚗 AutoDiag Backend Server running on http://localhost:${PORT}`);
      console.log(`🔌 API Endpoints available at http://localhost:${PORT}/api`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
