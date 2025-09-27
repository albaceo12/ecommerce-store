import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

// export const redis = new Redis(process.env.upstash_redis_url);

export const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: 40,
  reconnectOnError(err) {
    // Forcing reconnect on specific errors
    return (
      err.message.includes("READONLY") || err.message.includes("ECONNRESET")
    );
  },
  retryStrategy(times) {
    const delay = Math.min(times * 2000, 30000);
    console.log(`[Redis] Retry #${times} in ${delay}ms`);
    return delay;
  },
});

redis.on("connect", () => console.log("[Redis] Connected."));
redis.on("error", (err) => console.error("[Redis] Error:", err));
redis.on("close", () => console.warn("[Redis] Connection closed."));
