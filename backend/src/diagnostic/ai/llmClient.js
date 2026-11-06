/**
 * LLM Client Abstraction & Factory
 * 
 * Provides:
 * - ILLMClient (Abstract Interface)
 * - MockLLMClient (In-memory testing without network calls)
 * - HttpLLMClient (Ollama in dev, OpenAI-compatible in prod, timeout 3000ms)
 * - logAiAudit() helper saving latency, prompt_hash, response to ai_audit_log
 */

const crypto = require('crypto');
const { getPool } = require('../../db/db');

/**
 * Base abstract interface for LLM clients.
 */
class ILLMClient {
  /**
   * Completes a prompt.
   * @param {string} prompt
   * @param {Object} [options]
   * @param {number} [options.timeoutMs=3000]
   * @param {number} [options.temperature=0.2]
   * @returns {Promise<string>}
   */
  async complete(prompt, options = {}) {
    throw new Error('ILLMClient.complete() must be implemented by subclass');
  }
}

/**
 * Mock LLM client for deterministic CI testing without network overhead.
 */
class MockLLMClient extends ILLMClient {
  /**
   * @param {Function|string|Object} responder
   */
  constructor(responder = '') {
    super();
    this.responder = responder;
    this.callHistory = [];
  }

  async complete(prompt, options = {}) {
    this.callHistory.push({ prompt, options, timestamp: new Date() });
    if (typeof this.responder === 'function') {
      return await this.responder(prompt, options);
    }
    if (typeof this.responder === 'object') {
      return JSON.stringify(this.responder);
    }
    return String(this.responder);
  }
}

/**
 * HTTP LLM Client supporting Ollama (dev) and OpenAI-compatible APIs (prod).
 * Enforces a strict 3000ms timeout via AbortController.
 */
class HttpLLMClient extends ILLMClient {
  constructor(config = {}) {
    super();
    this.provider = config.provider || process.env.AI_PROVIDER || 'ollama'; // 'ollama' | 'openai_compatible'
    this.baseUrl = config.baseUrl || process.env.AI_BASE_URL || (this.provider === 'ollama' ? 'http://127.0.0.1:11434' : 'https://api.openai.com/v1');
    this.apiKey = config.apiKey || process.env.AI_API_KEY || '';
    this.model = config.model || process.env.AI_MODEL || (this.provider === 'ollama' ? 'qwen2.5:3b' : 'gpt-4o-mini');
    this.timeoutMs = config.timeoutMs || parseInt(process.env.AI_TIMEOUT_MS || '3000', 10);
  }

  async complete(prompt, options = {}) {
    const timeout = options.timeoutMs || this.timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      if (this.provider === 'ollama') {
        const response = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.model,
            prompt: prompt,
            stream: false,
            options: { temperature: options.temperature || 0.2 }
          }),
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`Ollama HTTP error ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        return data.response || '';
      } else {
        // OpenAI-compatible endpoint
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: this.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: options.temperature || 0.2
          }),
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`OpenAI-compatible HTTP error ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Logs an AI module execution to the ai_audit_log table.
 * Silent on failure to prevent crashing the main diagnostic engine.
 * @param {Object} entry
 * @param {number|null} [entry.sessionId]
 * @param {'entry'|'explain'|'fallback'} entry.module
 * @param {string} entry.prompt
 * @param {string} entry.response
 * @param {number} entry.latencyMs
 */
async function logAiAudit({ sessionId = null, module, prompt, response, latencyMs }) {
  try {
    const pool = getPool();
    const promptHash = crypto.createHash('sha256').update(String(prompt)).digest('hex');
    await pool.query(
      `INSERT INTO ai_audit_log (session_id, module, prompt_hash, response, latency_ms)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, module, promptHash, String(response), latencyMs]
    );
  } catch (err) {
    console.warn(`[AI Audit Log] Non-fatal logging failure: ${err.message}`);
  }
}

/**
 * Creates an appropriate LLM client instance based on environment or options.
 * @param {Object} [overrideConfig]
 * @returns {ILLMClient}
 */
function createLLMClient(overrideConfig = null) {
  if (process.env.NODE_ENV === 'test' || process.env.CI) {
    return new MockLLMClient('{}');
  }
  return new HttpLLMClient(overrideConfig || {});
}

module.exports = {
  ILLMClient,
  MockLLMClient,
  HttpLLMClient,
  logAiAudit,
  createLLMClient
};
