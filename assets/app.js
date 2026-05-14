import { startEcpayCheckout } from "./ecpay.js";
import { SUPABASE_CONFIG } from "./supabase-config.js";

const LINE_URL = "https://page.line.me/ndb3949k";
const PROFILE_FALLBACK_COLUMNS = "id,email,display_name,line_id,credits";
const configured =
  SUPABASE_CONFIG.url.startsWith("https://") &&
  SUPABASE_CONFIG.url.endsWith(".supabase.co") &&
  !SUPABASE_CONFIG.url.includes("YOUR_PROJECT_ID") &&
  SUPABASE_CONFIG.anonKey &&
  !SUPABASE_CONFIG.anonKey.includes("YOUR_SUPABASE");

const elements = {
  setupWarning: document.querySelector("#setup-warning"),
  browserWarning: document.querySelector("#browser-warning"),
  copyAppUrlButton: document.querySelector("#copy-app-url-button"),
  signedOutView: document.querySelector("#signed-out-view"),
  signedInView: document.querySelector("#signed-in-view"),
  googleLoginButton: document.querySelector("#google-login-button"),
  signOutButton: document.querySelector("#sign-out-button"),
  memberName: document.querySelector("#member-name"),
  memberEmail: document.querySelector("#member-email"),
  creditsCount: document.querySelector("#credits-count"),
  ordersCount: document.querySelector("#orders-count"),
  orderForm: document.querySelector("#order-form"),
  packageSelect: document.querySelector('select[name="package_type"]'),
  submitOrderButton: document.querySelector("#submit-order-button"),
  formStatus: document.querySelector("#form-status"),
  loginGate: document.querySelector("#login-gate"),
  lineHandoff: document.querySelector("#line-handoff"),
  lineHandoffTitle: document.querySelector("#line-handoff-title"),
  refreshOrdersButton: document.querySelector("#refresh-orders-button"),
  ordersEmpty: document.querySelector("#orders-empty"),
  ordersList: document.querySelector("#orders-list")
};

let supabaseClient = null;
let currentUser = null;
const inBlockedInAppBrowser = isBlockedInAppBrowser();

applyPackageFromUrl();
showBrowserWarningIfNeeded();

if (!configured) {
  elements.setupWarning.hidden = false;
  elements.googleLoginButton.disabled = true;
  elements.submitOrderButton.disabled = true;
  elements.refreshOrdersButton.disabled = true;
  setOrderFormAvailability(false);
  setStatus("會員中心資料庫設定中，請先用 LINE 聯絡。", "muted");
} else if (!window.supabase) {
  elements.setupWarning.hidden = false;
  elements.setupWarning.querySelector("strong").textContent = "Supabase SDK 載入失敗";
  elements.setupWarning.querySelector("p").textContent = "請確認網路可以載入 cdn.jsdelivr.net 的 @supabase/supabase-js。";
  elements.googleLoginButton.disabled = true;
  elements.submitOrderButton.disabled = true;
  elements.refreshOrdersButton.disabled = true;
  setOrderFormAvailability(false);
  setStatus("Supabase SDK 載入失敗，暫時無法登入或建立訂單。", "error");
} else {
  supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  boot();
}

async function boot() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setStatus(`讀取登入狀態失敗：${error.message}`, "error");
  }

  currentUser = data?.session?.user ?? null;
  await renderAuthState();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user ?? null;
    await renderAuthState();
  });
}

elements.googleLoginButton.addEventListener("click", async () => {
  if (!supabaseClient) return;

  if (inBlockedInAppBrowser) {
    showBrowserWarningIfNeeded();
    setStatus("目前是在 App 內建瀏覽器，Google 會封鎖登入。請複製網址後用 Safari 或 Chrome 開啟。", "error");
    return;
  }

  const redirectUrl = new URL(window.location.href);
  redirectUrl.hash = "";
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl.toString() }
  });

  if (error) {
    setStatus(friendlyError(error, "Google 登入失敗，請改用 Safari 或 Chrome 再試一次。"), "error");
  }
});

elements.signOutButton.addEventListener("click", async () => {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
});

elements.copyAppUrlButton?.addEventListener("click", async () => {
  const url = new URL(window.location.href);
  url.hash = "";

  try {
    await navigator.clipboard.writeText(url.toString());
    setStatus("已複製會員中心網址，請貼到 Safari 或 Chrome 開啟。", "success");
  } catch (_error) {
    setStatus(`請手動複製網址：${url.toString()}`, "muted");
  }
});

elements.refreshOrdersButton.addEventListener("click", loadOrders);

elements.orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideLineHandoff();

  if (!supabaseClient) {
    setStatus("會員中心資料庫設定中，請先用 LINE 聯絡。", "error");
    return;
  }

  if (!currentUser) {
    setStatus("請先使用 Google 登入，再建立訂單。", "error");
    return;
  }

  const formData = new FormData(elements.orderForm);
  const selectedPackage = String(formData.get("package_type") || "").trim();
  const payload = {
    order_no: createOrderNo(),
    user_id: currentUser.id,
    contact_name: String(formData.get("contact_name") || "").trim(),
    contact_email: currentUser.email || "",
    product_name: String(formData.get("product_name") || "").trim(),
    package_type: selectedPackage,
    amount_ntd: packageAmount(selectedPackage),
    platform: String(formData.get("platform") || "").trim(),
    line_id: String(formData.get("line_id") || "").trim(),
    target_style: String(formData.get("target_style") || "").trim(),
    deadline: String(formData.get("deadline") || "").trim(),
    image_link: String(formData.get("image_link") || "").trim(),
    notes: String(formData.get("notes") || "").trim(),
    status: "pending"
  };

  if (!payload.product_name || !payload.package_type) {
    setStatus("請至少填寫商品名稱與需求方案。", "error");
    return;
  }

  elements.submitOrderButton.disabled = true;
  setStatus("正在建立訂單...", "muted");
  trackEvent("start_order", {
    package_type: payload.package_type,
    platform: payload.platform || "未填"
  });

  const { data: createdOrder, error } = await supabaseClient
    .from("orders")
    .insert(payload)
    .select("id,order_no,package_type,amount_ntd,payment_status")
    .single();
  elements.submitOrderButton.disabled = false;

  if (error) {
    setStatus(friendlyError(error, "建立訂單失敗，請確認商品名稱、方案已填寫，或稍後改用 LINE 傳資料。"), "error");
    return;
  }

  await updateProfileFromOrder(payload);
  notifyNewOrder(createdOrder?.id);
  elements.orderForm.reset();
  applyPackageFromUrl();
  const orderNo = createdOrder?.order_no || payload.order_no;
  trackEvent("submit_order_success", {
    order_no: orderNo,
    package_type: payload.package_type,
    platform: payload.platform || "未填"
  });
  await loadOrders();

  const amount = Number(createdOrder?.amount_ntd ?? payload.amount_ntd ?? 0);
  if (amount > 0) {
    setStatus(`已建立訂單 ${orderNo}，正在前往綠界付款...`, "success");

    try {
      await startEcpayCheckout({
        supabaseClient,
        orderId: createdOrder.id,
        orderNo,
        packageType: payload.package_type,
        amount
      });
    } catch (checkoutError) {
      setStatus(friendlyError(checkoutError, "付款頁建立失敗。訂單已保留，請稍後重試或直接到 LINE 傳照片讓我們協助。"), "error");
      showLineHandoff(orderNo, "付款尚未完成，訂單");
    }
    return;
  }

  setStatus(`已建立訂單 ${orderNo}，請到 LINE 傳商品照片。`, "success");
  showLineHandoff(orderNo);
});

async function renderAuthState() {
  const isSignedIn = Boolean(currentUser);
  elements.signedOutView.hidden = isSignedIn;
  elements.signedInView.hidden = !isSignedIn;
  elements.signOutButton.hidden = !isSignedIn;
  elements.submitOrderButton.disabled = !configured || !isSignedIn;
  elements.refreshOrdersButton.disabled = !configured || !isSignedIn;
  setOrderFormAvailability(configured && isSignedIn);

  if (!isSignedIn) {
    elements.ordersList.innerHTML = "";
    elements.ordersEmpty.hidden = false;
    elements.ordersCount.textContent = "0";
    hideLineHandoff();
    return;
  }

  await ensureProfile(currentUser);
  const profile = await loadProfile(currentUser.id);
  elements.memberName.textContent = profile?.display_name || currentUser.user_metadata?.full_name || "ADFORGE 會員";
  elements.memberEmail.textContent = currentUser.email || "";
  elements.creditsCount.textContent = String(profile?.credits ?? 0);
  await loadOrders();
}

function applyPackageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const packageType = params.get("package");
  if (!packageType || !elements.packageSelect) return;

  const option = Array.from(elements.packageSelect.options).find((item) => item.value === packageType);
  if (option) {
    elements.packageSelect.value = packageType;
  }
}

function isBlockedInAppBrowser() {
  const ua = navigator.userAgent || "";
  return /Line|FBAN|FBAV|Instagram|MicroMessenger|TikTok|Twitter|Threads|Messenger/i.test(ua);
}

function showBrowserWarningIfNeeded() {
  if (!elements.browserWarning || !inBlockedInAppBrowser) return;

  elements.browserWarning.hidden = false;
  elements.googleLoginButton.textContent = "請用 Safari / Chrome 登入";
}

function setOrderFormAvailability(enabled) {
  elements.loginGate.hidden = enabled;
  elements.orderForm
    .querySelectorAll("input, select, textarea")
    .forEach((field) => {
      field.disabled = !enabled;
    });
}

function showLineHandoff(orderNo, titlePrefix = "訂單") {
  elements.lineHandoff.hidden = false;
  elements.lineHandoffTitle.textContent = `${titlePrefix} ${orderNo} 已建立`;
}

function hideLineHandoff() {
  elements.lineHandoff.hidden = true;
}

async function ensureProfile(user) {
  const name = user.user_metadata?.full_name || user.user_metadata?.name || "";
  const profile = {
    id: user.id,
    email: user.email,
    name,
    display_name: name,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseClient.from("profiles").upsert(profile, { onConflict: "id" });
  if (!error) return;

  if (isMissingColumnError(error, "name")) {
    const { name: _name, ...fallbackProfile } = profile;
    const { error: fallbackError } = await supabaseClient
      .from("profiles")
      .upsert(fallbackProfile, { onConflict: "id" });

    if (!fallbackError) return;
    setStatus(friendlyError(fallbackError, "會員資料建立失敗，請稍後再試。"), "error");
    return;
  }

  setStatus(friendlyError(error, "會員資料建立失敗，請稍後再試。"), "error");
}

async function updateProfileFromOrder(order) {
  const patch = {
    id: currentUser.id,
    email: currentUser.email,
    name: order.contact_name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "",
    updated_at: new Date().toISOString()
  };

  if (order.contact_name) patch.display_name = order.contact_name;
  if (order.line_id) patch.line_id = order.line_id;

  const { error } = await supabaseClient.from("profiles").upsert(patch, { onConflict: "id" });
  if (!error) return;

  if (isMissingColumnError(error, "name")) {
    const { name: _name, ...fallbackPatch } = patch;
    const { error: fallbackError } = await supabaseClient
      .from("profiles")
      .upsert(fallbackPatch, { onConflict: "id" });

    if (!fallbackError) return;
    setStatus(friendlyError(fallbackError, "訂單已建立，但會員資料暫時無法更新。"), "error");
    return;
  }

  setStatus(friendlyError(error, "訂單已建立，但會員資料暫時無法更新。"), "error");
}

async function loadProfile(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select(PROFILE_FALLBACK_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    setStatus(friendlyError(error, "讀取會員資料失敗，請重新整理頁面。"), "error");
    return null;
  }

  return data;
}

async function loadOrders() {
  if (!supabaseClient || !currentUser) return;

  const { data, error } = await supabaseClient
    .from("orders")
    .select("id,order_no,product_name,package_type,platform,status,amount_ntd,payment_status,created_at,paid_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    elements.ordersList.innerHTML = "";
    elements.ordersEmpty.hidden = false;
    elements.ordersEmpty.textContent = friendlyError(error, "讀取訂單失敗，請稍後重新整理。");
    return;
  }

  elements.ordersCount.textContent = String(data.length);
  elements.ordersEmpty.hidden = data.length > 0;
  elements.ordersEmpty.textContent = "目前還沒有訂單。登入後送出第一筆商品需求，這裡就會出現紀錄。";
  elements.ordersList.innerHTML = data.map(renderOrder).join("");
}

async function notifyNewOrder(orderId) {
  if (!orderId || !supabaseClient) return;

  try {
    await supabaseClient.functions.invoke("notify-order", {
      body: { order_id: orderId }
    });
  } catch (_error) {
    // Notification failure should not block order creation or payment.
  }
}

function renderOrder(order) {
  const date = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(order.created_at));

  return `
    <article class="order-row">
      <div>
        <strong>${escapeHtml(order.product_name)}</strong>
        <span>${escapeHtml(order.order_no)}・${escapeHtml(labelPackage(order.package_type))}</span>
      </div>
      <div>
        <span>${escapeHtml(order.platform || "未填平台")}</span>
        <small>${date}・${formatAmount(order.amount_ntd)}・${escapeHtml(labelPaymentStatus(order.payment_status))}</small>
      </div>
      <mark>${escapeHtml(labelStatus(order.status))}</mark>
    </article>
  `;
}

function createOrderNo() {
  const date = new Date();
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("");
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ADF-${ymd}-${random}`;
}

function labelPackage(value) {
  return {
    free_diagnosis: "免費診斷",
    trial_399: "NT$399 體驗包",
    batch_999: "NT$999 小批量包",
    page_2999: "NT$2,999 商品頁包",
    monthly_6900: "NT$6,900+ 品牌月包"
  }[value] || value;
}

function packageAmount(value) {
  return {
    free_diagnosis: 0,
    trial_399: 399,
    batch_999: 999,
    page_2999: 2999,
    monthly_6900: 6900
  }[value] ?? 0;
}

function formatAmount(value) {
  const amount = Number(value || 0);
  return amount > 0 ? `NT$${amount.toLocaleString("zh-TW")}` : "未收款";
}

function labelStatus(value) {
  return {
    pending: "待確認",
    confirmed: "已確認",
    making: "製作中",
    done: "已完成",
    new: "新需求",
    reviewing: "確認素材",
    quoted: "已報價",
    in_progress: "製作中",
    delivered: "已交付",
    cancelled: "已取消"
  }[value] || value;
}

function labelPaymentStatus(value) {
  return {
    not_required: "免付款",
    pending: "待付款",
    checkout_created: "付款中",
    paid: "已付款",
    failed: "付款失敗",
    expired: "付款逾期",
    refunded: "已退款"
  }[value] || value || "待確認";
}

function setStatus(message, type = "muted") {
  elements.formStatus.textContent = message;
  elements.formStatus.dataset.type = type;
}

function friendlyError(error, fallback) {
  const message = String(error?.message || "");

  if (/violates row-level security|row-level security/i.test(message)) {
    return "目前帳號權限還沒開通，請確認已登入同一個 Google 帳號，或先用 LINE 傳資料。";
  }

  if (/duplicate key|already exists/i.test(message)) {
    return "這筆訂單編號已存在，請再送出一次。";
  }

  if (/network|fetch|failed to fetch/i.test(message)) {
    return "網路連線不穩，請重新整理後再試一次。";
  }

  if (/column .* does not exist|schema cache/i.test(message)) {
    return "資料庫欄位尚未同步，請先重新執行 Supabase SQL 設定檔。";
  }

  if (/check constraint|violates check/i.test(message)) {
    return "訂單欄位格式與資料庫設定不一致，請先確認方案或狀態欄位設定。";
  }

  return fallback;
}

function isMissingColumnError(error, columnName) {
  const message = String(error?.message || "");
  return message.includes(`'${columnName}'`) || message.includes(`"${columnName}"`) || message.includes(`column ${columnName}`);
}

function trackEvent(name, params = {}) {
  if (typeof window.adforgeTrack === "function") {
    window.adforgeTrack(name, params);
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
