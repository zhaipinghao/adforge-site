export type EcpayParams = Record<string, string | number>;

const ecpayEncodeMap: Record<string, string> = {
  "%2d": "-",
  "%5f": "_",
  "%2e": ".",
  "%21": "!",
  "%2a": "*",
  "%28": "(",
  "%29": ")"
};

export function packageAmount(packageType: string) {
  const amounts: Record<string, number> = {
    free_diagnosis: 0,
    trial_399: 399,
    batch_999: 999,
    page_2999: 2999,
    monthly_6900: 6900
  };
  return amounts[packageType] ?? 0;
}

export function ecpayActionUrl() {
  return Deno.env.get("ECPAY_ACTION_URL") ||
    (Deno.env.get("ECPAY_ENV") === "production"
      ? "https://payment.ecpay.com.tw/Cashier/AioCheckout/Index"
      : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckout/Index");
}

export function makeMerchantTradeNo() {
  const now = new Date();
  const ymd = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 9).toUpperCase();
  return `ADF${ymd}${suffix}`.slice(0, 20);
}

export function formatTradeDate(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ];
  const time = [
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0")
  ];
  return `${parts.join("/") } ${time.join(":")}`;
}

export async function createCheckMacValue(params: EcpayParams) {
  const hashKey = requireEnv("ECPAY_HASH_KEY");
  const hashIv = requireEnv("ECPAY_HASH_IV");
  const source = Object.entries(params)
    .filter(([key]) => key !== "CheckMacValue")
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const raw = `HashKey=${hashKey}&${source}&HashIV=${hashIv}`;
  const encoded = ecpayUrlEncode(raw).toLowerCase();
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(encoded));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export function ecpayUrlEncode(value: string) {
  let encoded = encodeURIComponent(value)
    .replaceAll("%20", "+");

  for (const [from, to] of Object.entries(ecpayEncodeMap)) {
    encoded = encoded.replace(new RegExp(from, "gi"), to);
  }

  return encoded;
}

export function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}
