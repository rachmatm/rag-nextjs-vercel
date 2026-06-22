const ALLOWED_ORIGIN = "https://rachmatm.github.io";
const METALS_API_URL =
  "https://api.metals.dev/v1/latest?api_key=CQVSF8GPCRHWPPJYWFP0414JYWFP0&currency=IDR&unit=g";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  try {
    const res = await fetch(METALS_API_URL, {
      next: { revalidate: 60 },
    } as RequestInit);
    if (!res.ok) {
      return Response.json(
        { error: `Upstream returned ${res.status}` },
        { status: 502, headers: corsHeaders() }
      );
    }
    const data = await res.json();
    return Response.json(data, { headers: corsHeaders() });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return Response.json(
      { error: message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
