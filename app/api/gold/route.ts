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
    const res = await fetch(url, { next: { revalidate: 3600 } } as RequestInit);
    if (!res.ok) {
      console.error(`[Metals API] Upstream returned ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("[Metals API] Fetch error:", error);
    return null;
  }
}

async function getPriceWithCache(priceType: "gold" | "usd"): Promise<{
  [key: string]: unknown;
} | null> {
  const cacheKey = `metals_${priceType}_price`;

  // Try to get from cache first
  const cached = await getCachedValue(cacheKey);
  if (cached) {
    console.log(`[Cache] Hit for ${cacheKey}`);
    return JSON.parse(cached);
  }

  console.log(`[Cache] Miss for ${cacheKey}, fetching from API`);

  // Fetch from API
  let data: Record<string, unknown> | null = null;
  
  if (priceType === "gold") {
    // Get gold price in IDR (1 gram gold = X IDR)
    data = await fetchMetalsPrice("IDR");
  } else if (priceType === "usd") {
    // Get exchange rate: 1 USD = X IDR
    // Fetch in IDR currency, which will give us the conversion rate
    data = await fetchMetalsPrice("IDR");
    // Extract only the exchange rate data (USD to IDR conversion)
    // The API response will contain rates object with usd_idr or similar
  }

  if (data) {
    // Cache the result
    await setCachedValue(cacheKey, JSON.stringify(data), CACHE_EXPIRATION);
    console.log(`[Cache] Stored ${cacheKey}`);
  }

  return data;
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  try {
    // Fetch both gold (IDR) and exchange rate data in parallel
    const [goldData, exchangeData] = await Promise.all([
      getPriceWithCache("gold"),
      getPriceWithCache("usd"),
    ]);

    // Build response
    const response: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    // Extract gold price in IDR (1 gram)
    if (goldData && typeof goldData === "object" && "gold" in goldData) {
      response.idr_gold_price = (goldData as Record<string, unknown>).gold;
    } else {
      response.idr_gold_price_error = "Failed to fetch gold price";
    }

    // Extract USD to IDR exchange rate (1 USD = X IDR)
    if (exchangeData && typeof exchangeData === "object" && "usd" in exchangeData) {
      response.idr_usd_price = (exchangeData as Record<string, unknown>).usd;
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
