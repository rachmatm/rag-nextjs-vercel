import { createClient } from 'redis';

let client: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (client) {
    return client;
  }

  // Support multiple Redis connection formats
  const redisUrl = process.env.REDIS_URL || 
                   process.env.UPSTASH_FOR_REDIS_KV_URL ||
                   process.env.KV_URL;
  
  if (!redisUrl) {
    console.warn('[Redis] No Redis URL found, caching disabled');
    return null;
  }

  try {
    client = createClient({ url: redisUrl });
    
    client.on('error', (err) => {
      console.error('[Redis] Client error:', err);
    });

    await client.connect();
    console.log('[Redis] Connected successfully');
    return client;
  } catch (error) {
    console.error('[Redis] Connection failed:', error);
    return null;
  }
}

export async function getCachedValue(key: string): Promise<string | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    return value;
  } catch (error) {
    console.error('[Redis] Error getting value:', error);
    return null;
  }
}

export async function setCachedValue(
  key: string,
  value: string,
  expirationSeconds: number = 28800 // 8 hours default
): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) return false;

  try {
    await redis.setEx(key, expirationSeconds, value);
    return true;
  } catch (error) {
    console.error('[Redis] Error setting value:', error);
    return false;
  }
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
