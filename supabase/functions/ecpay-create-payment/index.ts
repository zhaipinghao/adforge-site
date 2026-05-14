import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import {
  createCheckMacValue,
  ecpayActionUrl,
  formatTradeDate,
  makeMerchantTradeNo,
  packageAmount,
  requireEnv
} from "../_shared/ecpay.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);
  if (req.method !== "POST") return jsonResponse(req, { ok: false, error: "只接受 POST 請求。" }, 405);

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const merchantId = requireEnv("ECPAY_MERCHANT_ID");
    const appBaseUrl = requireEnv("APP_BASE_URL").replace(/\/$/, "");

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return jsonResponse(req, { ok: false, error: "請先登入會員。" }, 401);

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } }
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return jsonResponse(req, { ok: false, error: "登入狀態已失效，請重新登入。" }, 401);

    const { order_id, order_no } = await req.json();
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey);
    let query = admin
      .from("orders")
      .select("id,order_no,user_id,product_name,package_type,amount_ntd,payment_status,merchant_trade_no")
      .eq("user_id", userData.user.id)
      .limit(1);

    if (order_id) query = query.eq("id", order_id);
    else if (order_no) query = query.eq("order_no", order_no);
    else return jsonResponse(req, { ok: false, error: "缺少訂單編號。" }, 400);

    const { data: orders, error: orderError } = await query;
    if (orderError) return jsonResponse(req, { ok: false, error: "讀取訂單失敗。" }, 500);
    const order = orders?.[0];
    if (!order) return jsonResponse(req, { ok: false, error: "找不到可付款訂單。" }, 404);

    const amount = packageAmount(order.package_type);
    if (amount <= 0) {
      return jsonResponse(req, { ok: true, free: true, message: "免費診斷不需要付款。" });
    }

    const merchantTradeNo = order.merchant_trade_no || makeMerchantTradeNo();
    const returnUrl = Deno.env.get("ECPAY_RETURN_URL") ||
      `${supabaseUrl.replace(/\/$/, "")}/functions/v1/ecpay-callback`;
    const successUrl = `${appBaseUrl}/payment/callback/?order_no=${encodeURIComponent(order.order_no)}&amount=${amount}`;

    const fields = {
      MerchantID: merchantId,
      MerchantTradeNo: merchantTradeNo,
      MerchantTradeDate: formatTradeDate(),
      PaymentType: "aio",
      TotalAmount: String(amount),
      TradeDesc: "ADFORGE AI 商品素材訂單",
      ItemName: `${labelPackage(order.package_type)}#${order.product_name}`.slice(0, 200),
      ReturnURL: returnUrl,
      ClientBackURL: successUrl,
      ChoosePayment: "Credit",
      EncryptType: "1",
      CustomField1: order.order_no
    };
    const checkMacValue = await createCheckMacValue(fields);

    const { error: updateError } = await admin
      .from("orders")
      .update({
        payment_provider: "ecpay",
        payment_status: "checkout_created",
        merchant_trade_no: merchantTradeNo,
        payment_amount_ntd: amount,
        currency: "TWD",
        checkout_url: ecpayActionUrl(),
        updated_at: new Date().toISOString()
      })
      .eq("id", order.id);

    if (updateError) return jsonResponse(req, { ok: false, error: "建立付款資料失敗。" }, 500);

    return jsonResponse(req, {
      ok: true,
      payment_url: ecpayActionUrl(),
      order_no: order.order_no,
      amount,
      currency: "TWD",
      fields: { ...fields, CheckMacValue: checkMacValue }
    });
  } catch (error) {
    return jsonResponse(req, { ok: false, error: friendlyError(error) }, 500);
  }
});

function labelPackage(value: string) {
  const labels: Record<string, string> = {
    trial_399: "NT$399 體驗包",
    batch_999: "NT$999 小批量包",
    page_2999: "NT$2,999 商品頁包",
    monthly_6900: "NT$6,900 品牌月包"
  };
  return labels[value] || "ADFORGE 商品素材";
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Missing environment variable")) return "付款環境變數尚未設定完整。";
  return "付款系統暫時無法建立交易，請稍後再試或改用 LINE 聯絡。";
}
