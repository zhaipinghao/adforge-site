import { handleOptions, jsonResponse } from "../_shared/cors.ts";

const DEFAULT_PIXMOTION_BASES = [
  "https://pixmotion.adforgetw.com",
  "https://2b01be66.pixmotion-ai.pages.dev",
];

function resolvePixmotionBase() {
  const envValue = Deno.env.get("PIXMOTION_BASE_URLS");
  if (envValue) {
    return envValue
      .split(/[,\s;|]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [...DEFAULT_PIXMOTION_BASES];
}

function getAuthRetryStatus(status: number) {
  return [401, 403, 419, 422].includes(status);
}

function shouldRetry(status: number) {
  return status >= 500 || status === 404;
}

function getAuthToken(req: Request, body: Record<string, unknown> | null) {
  const fromHeader = req.headers.get("Authorization") || "";
  if (fromHeader.startsWith("Bearer ")) {
    const token = fromHeader.replace(/^Bearer\s+/i, "").trim();
    if (token) return token;
  }

  if (body && typeof body === "object") {
    const token = String((body as Record<string, unknown>).authToken || "").trim();
    if (token) return token;
    const access = String((body as Record<string, unknown>).accessToken || "").trim();
    if (access) return access;
  }

  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") {
    return jsonResponse(req, { ok: false, error: "只接受 POST 請求。" }, 405);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse(req, { ok: false, error: "請提供正確 JSON。" }, 400);
  }

  const token = getAuthToken(req, body);
  if (!token) {
    return jsonResponse(req, { ok: false, error: "請先登入，缺少授權 token。" }, 401);
  }

  const candidates = resolvePixmotionBase().map((base) => base.replace(/\/$/, ""));
  const payload = Object.assign({}, body);
  delete (payload as Record<string, unknown>).authToken;
  delete (payload as Record<string, unknown>).accessToken;

  let lastError: Error | null = null;
  let lastStatus = 0;
  let lastBody: unknown = null;

  for (const base of candidates) {
    const endpoint = `${base}/api/video/generate`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const rawText = await response.text();
      let result: unknown;
      try {
        result = JSON.parse(rawText);
      } catch {
        result = { message: rawText };
      }

      const bodyRecord = (typeof result === "object" && result !== null && !Array.isArray(result))
        ? result as Record<string, unknown>
        : {};
      lastBody = result;
      lastStatus = response.status;

      if (!response.ok) {
        if (getAuthRetryStatus(response.status) || !shouldRetry(response.status)) {
          return jsonResponse(req, {
            ok: false,
            error: bodyRecord.error || "建立任務失敗",
            status: response.status,
            body: result,
            base
          }, response.status);
        }
        continue;
      }

      return jsonResponse(req, { ok: true, proxied: true, status: response.status, ...bodyRecord, base }, response.status);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("代理服務暫時無法連線。");
      continue;
    }
  }

  if (lastBody) {
    return jsonResponse(req, {
      ok: false,
      error: "建立任務失敗",
      detail: lastError?.message || "無法連線到備援主機",
      status: lastStatus || 502,
      body: lastBody,
    }, lastStatus || 502);
  }

  const message = lastError?.message || "代理服務暫時無法連線。";
  return jsonResponse(req, { ok: false, error: message }, 502);
});
