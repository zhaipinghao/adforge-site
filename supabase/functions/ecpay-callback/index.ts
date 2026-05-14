import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createCheckMacValue, requireEnv } from "../_shared/ecpay.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Only POST", { status: 405 });

  try {
    const form = await req.formData();
    const payload: Record<string, string> = {};
    for (const [key, value] of form.entries()) payload[key] = String(value);

    const received = payload.CheckMacValue || "";
    const expected = await createCheckMacValue(payload);
    if (!received || received.toUpperCase() !== expected) {
      await logCallback(payload, false, "CheckMacValue mismatch");
      return new Response("0|CheckMacValue Error", { status: 400 });
    }

    const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
    const merchantTradeNo = payload.MerchantTradeNo;
    const rtnCode = payload.RtnCode;
    const isPaid = rtnCode === "1";
    const paidAt = isPaid ? new Date().toISOString() : null;

    const { data: updated, error } = await supabase
      .from("orders")
      .update({
        payment_status: isPaid ? "paid" : "failed",
        status: isPaid ? "confirmed" : "pending",
        transaction_id: payload.TradeNo || null,
        payment_method: payload.PaymentType || payload.PaymentTypeChargeFee || null,
        paid_at: paidAt,
        payment_raw_payload: payload,
        payment_error: isPaid ? null : `${payload.RtnCode || ""} ${payload.RtnMsg || ""}`.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("merchant_trade_no", merchantTradeNo)
      .select("id")
      .maybeSingle();

    if (error || !updated) {
      await logCallback(payload, false, "Order update failed");
      return new Response("0|Order Update Error", { status: 500 });
    }

    await logCallback(payload, true);
    return new Response("1|OK");
  } catch (error) {
    await logCallback({}, false, error instanceof Error ? error.message : String(error));
    return new Response("0|Server Error", { status: 500 });
  }
});

async function logCallback(payload: Record<string, string>, verified: boolean, errorMessage = "") {
  try {
    const supabase = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"));
    await supabase.from("payment_transactions").insert({
      provider: "ecpay",
      merchant_trade_no: payload.MerchantTradeNo || null,
      transaction_id: payload.TradeNo || null,
      amount_ntd: Number(payload.TradeAmt || payload.TotalAmount || 0),
      status: payload.RtnCode === "1" ? "paid" : "callback_received",
      verified,
      raw_payload: payload,
      error_message: errorMessage || null
    });
  } catch (_error) {
    // Do not expose internal errors to ECPay response.
  }
}
