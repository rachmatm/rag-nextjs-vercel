import { getCachedValue, setCachedValue } from "@/lib/redis";

const ALLOWED_ORIGIN = "https://rachmatm.github.io";
const CACHE_EXPIRATION = 8 * 60 * 60; // 8 hours in seconds

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function fetchMetalsPrice(currency: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.METALS_DEV_API_KEY;
  if (!apiKey) {
    console.error("[Metals API] METALS_DEV_API_KEY not set");
    return null;
  }

  const url = `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=${currency}&unit=g`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const res = await fetch(url, { 
      signal: controller.signal,
      next: { revalidate: 3600 } 
    } as RequestInit);

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[Metals API] Upstream returned ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("[Metals API] Fetch error:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function getPricesWithCache(): Promise<{
  goldPrice: number | null;
  usdPrice: number | null;
}> {
  const goldCacheKey = "metals_gold_price";
  const usdCacheKey = "metals_usd_price";

  console.log("[v0] Starting getPricesWithCache");

  // Try to get both from cache first (with timeout protection)
  try {
    const cachePromise = Promise.all([
      getCachedValue(goldCacheKey),
      getCachedValue(usdCacheKey),
    ]);
    
    const cacheTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Cache timeout")), 3000)
    );

    const result = await Promise.race([cachePromise, cacheTimeout]);
    const [cachedGold, cachedUsd] = result as [string | null, string | null];

    if (cachedGold && cachedUsd) {
      console.log("[Cache] Both prices hit - returning from cache");
      return {
        goldPrice: Number(cachedGold),
        usdPrice: Number(cachedUsd),
      };
    }
  } catch (error) {
    console.log("[v0] Cache check timeout or failed:", error instanceof Error ? error.message : String(error));
  }

  console.log("[v0] Fetching from API");

  // Fetch once from API with IDR currency
  const apiData = await fetchMetalsPrice("IDR");

  if (!apiData) {
    console.error("[API] Failed to fetch prices");
    return {
      goldPrice: null,
      usdPrice: null,
    };
  }

  console.log("[v0] Got API data");

  // Extract both values from single API response
  // metals.dev returns: { metals: { gold: X }, currencies: { USD: Y } }
  const goldPrice =
    typeof (apiData as any).metals?.gold === "number" ? (apiData as any).metals.gold : null;
  const usdPrice = typeof (apiData as any).currencies?.USD === "number" ? (apiData as any).currencies.USD : null;

  // Cache both values independently (fire and forget)
  if (goldPrice !== null) {
    setCachedValue(goldCacheKey, goldPrice.toString(), CACHE_EXPIRATION)
      .then(() => console.log(`[Cache] Stored ${goldCacheKey}`))
      .catch((err) => console.log("[v0] Cache store failed:", err));
  }

  if (usdPrice !== null) {
    setCachedValue(usdCacheKey, usdPrice.toString(), CACHE_EXPIRATION)
      .then(() => console.log(`[Cache] Stored ${usdCacheKey}`))
      .catch((err) => console.log("[v0] Cache store failed:", err));
  }

  return { goldPrice, usdPrice };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  try {
    // Fetch both prices in single API call (with caching)
    // Prices: 1 gram gold in IDR, 1 USD in IDR
    const { goldPrice, usdPrice } = await getPricesWithCache();

    // Build response
    const response: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    if (goldPrice !== null) {
      response.idr_gold_price = goldPrice;
    } else {
      response.idr_gold_price_error = "Failed to fetch gold price";
    }

    if (usdPrice !== null) {
      response.idr_usd_price = usdPrice;
    } else {
      response.idr_usd_price_error = "Failed to fetch USD/IDR exchange rate";
    }

    return Response.json(response, { headers: corsHeaders() });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[API] Error:", message);
    return Response.json(
      { error: message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
