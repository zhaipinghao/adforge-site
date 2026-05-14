import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

type OrderRow = {
  id: number;
  user_id: string;
  package_type: string;
  product_name: string;
  contact_name: string | null;
  line_id: string | null;
  created_at: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return jsonResponse(req, { ok: false, error: "只接受 POST 請求。" }, 405);

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const telegramBotToken = requireEnv("TELEGRAM_BOT_TOKEN");
    const telegramChatId = requireEnv("TELEGRAM_CHAT_ID");

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return jsonResponse(req, { ok: false, error: "請先登入會員。" }, 401);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return jsonResponse(req, { ok: false, error: "登入狀態已失效，請重新登入。" }, 401);

    const { order_id } = await req.json();
    if (!order_id) return jsonResponse(req, { ok: false, error: "缺少訂單 ID。" }, 400);

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id,user_id,package_type,product_name,contact_name,line_id,created_at")
      .eq("id", order_id)
      .maybeSingle<OrderRow>();

    if (orderError) return jsonResponse(req, { ok: false, error: "讀取訂單失敗。" }, 500);
    if (!order) return jsonResponse(req, { ok: false, error: "找不到訂單。" }, 404);
    if (order.user_id !== userData.user.id) return jsonResponse(req, { ok: false, error: "沒有權限通知這筆訂單。" }, 403);

    const message = [
      "【新訂單】",
      `方案：${labelPackage(order.package_type)}`,
      `商品：${order.product_name || "未填"}`,
      `客戶：${order.contact_name || userData.user.email || "未填"}`,
      `LINE：${order.line_id || "未填"}`,
      `時間：${formatTaipeiTime(order.created_at)}`
    ].join("\n");

    const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        disable_web_page_preview: true
      })
    });

    if (!telegramResponse.ok) {
      return jsonResponse(req, { ok: false, error: "Telegram 通知發送失敗。" }, 502);
    }

    return jsonResponse(req, { ok: true });
  } catch (error) {
    return jsonResponse(req, { ok: false, error: friendlyError(error) }, 500);
  }
});

function labelPackage(value: string) {
  const labels: Record<string, string> = {
    free_diagnosis: "免費診斷",
    trial_399: "NT$399 體驗包",
    batch_999: "NT$999 小批量包",
    page_2999: "NT$2,999 商品頁包",
    monthly_6900: "NT$6,900+ 品牌月包"
  };
  return labels[value] || value;
}

function formatTaipeiTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Missing environment variable")) return "Telegram 通知環境變數尚未設定完整。";
  return "Telegram 通知暫時無法發送。";
}
