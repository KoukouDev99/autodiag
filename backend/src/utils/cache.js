/**
 * AutoDiag In-Memory Cache Utility.
 * Zero-dependency, thread-safe, high-performance in-memory cache with TTL and hit/miss metrics.
 */

class MemoryCache {
  constructor(defaultTTLSeconds = 300) {
    this.defaultTTL = defaultTTLSeconds * 1000;
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  set(key, value, ttlSeconds = null) {
    const ttl = (ttlSeconds !== null ? ttlSeconds : this.defaultTTL / 1000) * 1000;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now()
    });
    return value;
  }

  async getOrSet(key, fetchFn, ttlSeconds = null) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const freshValue = await fetchFn();
    this.set(key, freshValue, ttlSeconds);
    return freshValue;
  }

  del(key) {
    return this.store.delete(key);
  }

  delPrefix(prefix) {
    let deletedCount = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  has(key) {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  flush() {
    const count = this.store.size;
    this.store.clear();
    return count;
  }

  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? Number(((this.hits / totalRequests) * 100).toFixed(2)) : 0;
    return {
      entries_count: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hit_rate_pct: hitRate
    };
  }
}

// Global shared cache instance
const appCache = new MemoryCache(600); // 10 minutes default TTL

module.exports = {
  MemoryCache,
  appCache
};
