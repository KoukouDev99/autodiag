const rateLimit = require('express-rate-limit');

// 1. Limiteur global pour toutes les routes API
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 400, // max 400 requêtes par fenêtre de 15 min par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de requêtes envoyées à l\'API AutoDiag. Veuillez patienter quelques instants.'
  }
});

// 2. Limiteur strict pour l'assistant IA (prévention des coûts et abus de requêtes LLM)
const aiChatLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // max 20 messages par 10 minutes par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Trop de requêtes adressées au conseiller IA. Pour préserver les ressources, veuillez patienter avant de poser une nouvelle question.'
  }
});

// 3. Limiteur pour la création de sessions de diagnostic
const diagStartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // max 30 démarrages par 15 min par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Nombre maximal de sessions de diagnostic atteint pour cette période. Veuillez patienter.'
  }
});

module.exports = {
  globalApiLimiter,
  aiChatLimiter,
  diagStartLimiter
};

