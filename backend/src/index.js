const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initDatabase, getPool } = require('./db/db');
const apiRoutes = require('./routes/api');
const { globalApiLimiter } = require('./middleware/rateLimiters');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for reverse proxies (Nginx, Traefik, PaaS)
app.set('trust proxy', 1);

// HTTP Security Headers via Helmet (configured for Angular SPA + Fonts & Assets)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'http://localhost:3000',
          'http://localhost:4200',
          'https://api.groq.com',
          'https://api.deepseek.com',
          'https://api.openai.com'
        ],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration (Localhost in dev, CORS_ORIGIN whitelist in production)
const allowedOriginsDev = [
  'http://localhost:4200',
  'http://localhost:3000',
  'http://127.0.0.1:4200',
  'http://127.0.0.1:3000'
];

const corsOriginEnv = process.env.CORS_ORIGIN;
const allowedOriginsProd = corsOriginEnv
  ? corsOriginEnv.split(',').map(s => s.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile clients, curl, server-to-server)
      if (!origin) return callback(null, true);

      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        if (
          allowedOriginsDev.includes(origin) ||
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:')
        ) {
          return callback(null, true);
        }
      }

      if (allowedOriginsProd.includes(origin)) {
        return callback(null, true);
      }

      // In production if CORS_ORIGIN is not defined yet, log warning and allow for transition
      if (!isDev && allowedOriginsProd.length === 0) {
        console.warn(`[CORS WARN] No CORS_ORIGIN configured in .env. Allowing origin: ${origin}`);
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parser with strict payload size limits (100kb DoS mitigation)
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Global Rate Limiting on API endpoints
app.use('/api', globalApiLimiter);

// API Routes
app.use('/api', apiRoutes);

// Health check with database connectivity and memory telemetry
app.get(['/health', '/api/health'], async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    const pool = getPool();
    if (pool) {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    }
  } catch (e) {
    dbStatus = 'error: ' + (process.env.NODE_ENV === 'production' ? 'DB ping failed' : e.message);
  }

  const memory = process.memoryUsage();
  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    service: 'AutoDiag API',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    uptime_seconds: Math.floor(process.uptime()),
    memory_mb: {
      rss: Math.round(memory.rss / 1024 / 1024),
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024)
    },
    timestamp: new Date().toISOString()
  });
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

// Centralized production-safe error handler
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error('[API SERVER ERROR]', {
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    message: err.message,
    stack: isProd ? undefined : err.stack
  });

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: isProd
      ? 'Une erreur interne est survenue sur le serveur.'
      : err.message || 'Internal Server Error'
  });
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
