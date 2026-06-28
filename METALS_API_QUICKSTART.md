# Metals API - Quick Start Guide

## 🚀 Setup in 3 Steps

### 1. Get Your API Key
- Visit https://metals.dev
- Generate an API key
- Copy it (you'll need it shortly)

### 2. Add Environment Variables to Vercel
Go to your Vercel project settings → Environment Variables (or Vars in v0):

```
METALS_DEV_API_KEY = your-api-key-from-metals-dev
REDIS_URL = redis://your-redis-connection-string
```

**Redis Options:**
- **Upstash** (recommended): Get from https://console.upstash.com
- **Self-hosted**: `redis://user:password@host:port`
- **Local dev**: `redis://localhost:6379`

### 3. Deploy
```bash
git push origin your-branch
# or manually deploy from Vercel dashboard
```

## 📊 API Response

**Request:**
```
GET https://your-domain.com/api/gold
```

**Response:**
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

## ⚡ Key Features

| Feature | Details |
|---------|---------|
| **Cache Duration** | 8 hours per price |
| **Cache Type** | Redis (or disabled if not configured) |
| **Fetch Speed** | Parallel (both prices simultaneously) |
| **Response Format** | `idr_gold_price` (IDR) + `idr_usd_price` (USD) |
| **CORS Origin** | `https://rachmatm.github.io` |

## 🔍 Testing Locally

```bash
# 1. Start Redis
redis-server

# 2. Set environment variables
export REDIS_URL=redis://localhost:6379
export METALS_DEV_API_KEY=your-api-key

# 3. Run dev server
npm run dev

# 4. Test with curl
curl http://localhost:3000/api/gold \
  -H "Origin: https://rachmatm.github.io"
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Redis connection error | Check `REDIS_URL` is correct and Redis is running |
| API key invalid | Get a new key from metals.dev |
| CORS errors | Origin must be `https://rachmatm.github.io` |
| Slow response | First request is slow (no cache), subsequent are ~1-5ms |

## 📁 What Changed

- ✅ `lib/redis.ts` - New Redis caching module
- ✅ `app/api/gold/route.ts` - Updated with Redis + dual prices
- ✅ `.env.example` - Added new env var docs

## 🔒 Security Notes

✅ API keys stored in environment variables (not in code)  
✅ CORS restricted to specific origin  
✅ Redis credentials in env vars  

## 📚 Full Documentation

- `METALS_API_SETUP.md` - Detailed setup guide
- `METALS_API_IMPLEMENTATION.md` - Implementation details

## 🎯 Next Steps

1. ✅ Set up Redis (Upstash or local)
2. ✅ Add `METALS_DEV_API_KEY` to Vercel
3. ✅ Add `REDIS_URL` to Vercel
4. ✅ Deploy
5. ✅ Test the endpoint
6. ✅ Monitor logs for cache hits

Done! Your metals price API is ready. 🎉
