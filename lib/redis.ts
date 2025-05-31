import { createClient } from 'redis';
import env from './env';

class RedisClient {
  private client: ReturnType<typeof createClient>;
  private static instance: RedisClient;

  private constructor() {
    this.client = createClient({
      url: env.redis.url,
    });
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    this.client.on('connect', () => console.log('Redis Client Connected'));
    this.client.on('ready', () => console.log('Redis Client Ready'));
    this.client.on('end', () => console.log('Redis Client Disconnected'));
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private async ensureConnection(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  public async connect(): Promise<void> {
    await this.ensureConnection();
  }

  public async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  public async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.ensureConnection();
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl) {
      await this.client.setEx(key, ttl, stringValue);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    await this.ensureConnection();
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  public async increment(key: string, by: number = 1): Promise<number> {
    await this.ensureConnection();
    return this.client.incrBy(key, by);
  }

  public async decrement(key: string, by: number = 1): Promise<number> {
    await this.ensureConnection();
    return this.client.decrBy(key, by);
  }

  public async del(key: string): Promise<void> {
    await this.ensureConnection();
    await this.client.del(key);
  }

  /**
   * Delete an array of keys in one operation.
   * @param keys Array of Redis keys to delete.
   * @returns Promise<number> Number of keys that were deleted.
   */
  public async delKeys(keys: string[]): Promise<number> {
    await this.ensureConnection();
    if (keys.length === 0) return 0;
    return await this.client.del(keys);
  }

  public async expire(key: string, ttl: number): Promise<void> {
    await this.ensureConnection();
    await this.client.expire(key, ttl);
  }

  public async hSet(key: string, field: string, value: any): Promise<void> {
    await this.ensureConnection();
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await this.client.hSet(key, field, stringValue);
  }

  public async hGet<T = any>(key: string, field: string): Promise<T | null> {
    await this.ensureConnection();
    const value = await this.client.hGet(key, field);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  public async hGetAll<T = Record<string, any>>(key: string): Promise<T> {
    await this.ensureConnection();
    const values = await this.client.hGetAll(key);
    const result: Record<string, any> = {};
    for (const [field, value] of Object.entries(values)) {
      try {
        result[field] = JSON.parse(value);
      } catch {
        result[field] = value;
      }
    }
    return result as T;
  }

  public async keys(pattern: string): Promise<string[]> {
    await this.ensureConnection();
    return await this.client.keys(pattern);
  }
}

export const redis = RedisClient.getInstance();