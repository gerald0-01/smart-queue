import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const cacheLib = {
  async get<T>(key: string): Promise<T | null> {
    return cache.get<T>(key) ?? null;
  },

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    cache.set(key, value, ttlSeconds);
  },

  async delete(key: string): Promise<void> {
    cache.del(key);
  },

  async deletePattern(pattern: string): Promise<void> {
    const keys = cache.keys();
    const regex = new RegExp(pattern.replace("*", ".*"));
    keys.forEach((k) => {
      if (regex.test(k)) cache.del(k);
    });
  },
};

export function cacheKey(table: string, id: string): string {
  return `${table}:${id}`;
}

export function cacheKeyByField(table: string, field: string, value: string): string {
  return `${table}:${field}:${value}`;
}