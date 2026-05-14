const defaultOrigins = [
  "https://adforgetw.com",
  "https://www.adforgetw.com",
  "https://zhaipinghao.github.io",
  "http://127.0.0.1:8771",
  "http://localhost:8771"
];

function allowedOrigins() {
  const env = Deno.env.get("ALLOWED_ORIGINS");
  if (!env) return defaultOrigins;
  return env.split(",").map((item) => item.trim()).filter(Boolean);
}

export function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowed = allowedOrigins();
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin"
  };
}

export function jsonResponse(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export function handleOptions(req: Request) {
  return new Response("ok", { headers: corsHeaders(req) });
}
