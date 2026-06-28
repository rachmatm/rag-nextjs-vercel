# Metals API Setup Guide

This guide explains how to set up the metals price caching API endpoint.

## Overview

The `/api/gold` endpoint now provides both gold and USD prices with Redis-backed caching:
- **Endpoint**: `GET /api/gold`
- **Cache TTL**: 8 hours per price type
- **Response**: JSON with `idr_gold_price` (IDR currency) and `idr_usd_price` (USD currency)

## Required Environment Variables

### 1. Metals.dev API Key

Get your API key from [metals.dev](https://metals.dev):

```bash
METALS_DEV_API_KEY=your-api-key-here
```

**Note**: The old hardcoded API key in the code has been removed for security. You MUST add this environment variable.

### 2. Redis Connection

Choose one of these options:

#### Option A: Upstash Redis (Recommended for Vercel)

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Copy the REST API URL and set up environment variables:

```bash
# Upstash-specific (auto-added by Vercel integration)
KV_URL=https://xxx.upstash.io
KV_REST_API_TOKEN=your-token
KV_REST_API_URL=https://xxx.upstash.io
KV_REST_API_READ_ONLY_TOKEN=your-read-only-token

# Standard Redis URL (optional fallback)
REDIS_URL=redis://default:password@xxx.upstash.io:12345
```

#### Option B: Self-Hosted Redis

```bash
REDIS_URL=redis://username:password@localhost:6379
# or with TLS:
REDIS_URL=rediss://username:password@your-redis-host:6379
```

#### Option C: Local Development

For local development, ensure Redis is running:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or install locally and run
redis-server
```

Then set:
```bash
REDIS_URL=redis://localhost:6379
```

## Setting Environment Variables in Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables** (or **Vars** in the v0 UI)
3. Add:
   - `METALS_DEV_API_KEY`: Your metals.dev API key
   - `REDIS_URL`: Your Redis connection string (or Upstash variables if using that)

## API Usage

### Request

```bash
curl https://your-domain.com/api/gold \
  -H "Origin: https://rachmatm.github.io"
```

### Response

```json
{
  "timestamp": "2024-06-28T10:30:45.123Z",
  "idr_gold_price": {
    "timestamp": "2024-06-28T10:30:00Z",
    "gold": 756000.0,
    "currency": "IDR"
  },
  "idr_usd_price": {
    "timestamp": "2024-06-28T10:30:00Z",
    "gold": 25.50,
    "currency": "USD"
  }
}
```

## Caching Behavior

- **Cache Duration**: 8 hours per price type (separately cached)
- **Cache Keys**: 
  - `metals_gold_price` (IDR)
  - `metals_usd_price` (USD)
- **On Miss**: Fetches fresh data from metals.dev API
- **On Error**: Falls back to `null` with error message in response

## Troubleshooting

### "REDIS_URL not set, caching disabled"

This warning means Redis is not configured. The endpoint will still work but without caching. Set `REDIS_URL` or Upstash variables.

### Redis Connection Failed

1. Check your Redis URL is correct: `redis://user:pass@host:port`
2. Verify Redis is running and accessible
3. For Upstash, ensure the database is active in the console
4. Check firewall/security rules allow outbound connections

### API Key Invalid

1. Visit [metals.dev](https://metals.dev) and verify your API key
2. Ensure `METALS_DEV_API_KEY` is set exactly as provided
3. Check for typos or extra spaces in the environment variable

### CORS Issues

The endpoint only accepts requests from `https://rachmatm.github.io`. If you need different origins, update the `ALLOWED_ORIGIN` in `/app/api/gold/route.ts`.

## File Changes

- **New**: `/lib/redis.ts` - Redis client and caching utilities
- **Updated**: `/app/api/gold/route.ts` - Metals price endpoint with Redis caching
- **Updated**: `.env.example` - Environment variables documentation

## Architecture

```
GET /api/gold
    ├─ getPriceWithCache("gold")
    │   ├─ Check Redis cache (key: "metals_gold_price")
    │   ├─ If miss: fetchMetalsPrice("IDR")
    │   └─ Store in Redis (8h expiry)
    │
    └─ getPriceWithCache("usd")
        ├─ Check Redis cache (key: "metals_usd_price")
        ├─ If miss: fetchMetalsPrice("USD")
        └─ Store in Redis (8h expiry)
```

Both prices are fetched in parallel for better performance.
