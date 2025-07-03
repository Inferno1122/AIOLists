// src/utils/cache.js
const { Redis } = require('@upstash/redis');

class Cache {
  constructor({ defaultTTL = 3_600_000, cleanupInterval = 300_000 } = {}) {
    this.defaultTTL = defaultTTL;

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      this.useRedis = true;
    } else {
      this.map = new Map();
      this.cleanupInterval = cleanupInterval;
      this.useRedis = false;
      this._startCleanupInterval();
    }
  }

  _startCleanupInterval() {
    this._cleanupTimer = setInterval(() => this._cleanup(), this.cleanupInterval);
    if (this._cleanupTimer.unref) this._cleanupTimer.unref();
  }

  _cleanup() {
    const now = Date.now();
    for (const [k, { expiry }] of this.map.entries()) {
      if (expiry < now) this.map.delete(k);
    }
  }

  destroy() {
    if (this._cleanupTimer) clearInterval(this._cleanupTimer);
    if (this.redis) this.redis.disconnect();
  }

  async getRemainingTTL(key) {
    if (this.useRedis) {
      const secs = await this.redis.ttl(key);
      return secs > 0 ? secs * 1000 : -1;
    }
    if (!this.map.has(key)) return -1;
    const { expiry } = this.map.get(key);
    const rem = expiry - Date.now();
    if (rem <= 0) { this.map.delete(key); return -1; }
    return rem;
  }

  async has(key) {
    if (this.useRedis) {
      return (await this.redis.exists(key)) === 1;
    }
    return (await this.getRemainingTTL(key)) > 0;
  }

  async get(key) {
    if (this.useRedis) {
      const s = await this.redis.get(key);
      return s == null ? null : JSON.parse(s);
    }
    if (!(await this.has(key))) return null;
    return this.map.get(key).value;
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (this.useRedis) {
      return this.redis.set(key, JSON.stringify(value), { ex: Math.floor(ttl/1000) });
    }
    const expiry = Date.now() + ttl;
    this.map.set(key, { value, expiry });
    return true;
  }

  async getMany(keys) {
    if (this.useRedis) {
      const arr = await this.redis.mget(...keys);
      const out = {};
      keys.forEach((k,i) => { if (arr[i]!=null) out[k]=JSON.parse(arr[i]); });
      return out;
    }
    const out = {};
    for (const k of keys) {
      const v = await this.get(k);
      if (v !== null) out[k] = v;
    }
    return out;
  }

  async setMany(entries, ttl = this.defaultTTL) {
    if (this.useRedis) {
      const pipe = this.redis.pipeline();
      for (const [k,v] of Object.entries(entries)) {
        pipe.set(k, JSON.stringify(v), { ex: Math.floor(ttl/1000) });
      }
      await pipe.exec();
      return true;
    }
    for (const [k,v] of Object.entries(entries)) {
      this.set(k, v, ttl);
    }
    return true;
  }

  async delete(key) {
    if (this.useRedis) return this.redis.del(key);
    return this.map.delete(key);
  }

  async clear() {
    if (this.useRedis) return this.redis.flushdb();
    return this.map.clear();
  }
}

module.exports = Cache;
