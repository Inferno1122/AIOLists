// src/utils/redisCache.js
const { Redis } = require('@upstash/redis');
const PREFIX = 'aiolists';

class RedisCache {
  constructor({ defaultTTL = 3600 } = {}) {
    this.ttl = defaultTTL; // seconds
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.client = new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      this.enabled = true;
    } else {
      this.enabled = false;
    }
  }
  _key(k) { return `${PREFIX}:${k}`; }
  async get(k) {
    if (!this.enabled) return null;
    const v = await this.client.get(this._key(k));
    return v == null ? null : JSON.parse(v);
  }
  async set(k, val, ttl = this.ttl) {
    if (!this.enabled) return;
    await this.client.set(this._key(k), JSON.stringify(val), { ex: ttl });
  }
  async del(k) {
    if (!this.enabled) return;
    await this.client.del(this._key(k));
  }
}

module.exports = RedisCache;
