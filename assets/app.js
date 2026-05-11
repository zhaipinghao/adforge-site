import { SUPABASE_CONFIG } from "./supabase-config.js";

const LINE_URL = "https://page.line.me/ndb3949k";
const configured =
  SUPABASE_CONFIG.url.startsWith("https://") &&
  SUPABASE_CONFIG.url.endsWith(".supabase.co") &&
  !SUPABASE_CONFIG.url.includes("YOUR_PROJECT_ID") &&
  SUPABASE_CONFIG.anonKey &&
  !SUPABASE_CONFIG.anonKey.includes("YOUR_SUPABASE");

const elements = {
  setupWarning: document.querySelector("#setup-warning"),
  signedOutView: document.querySelector("#signed-out-view"),
  signedInView: document.querySelector("#signed-in-view"),
  googleLoginButton: document.querySelector("#google-login-button"),
  signOutButton: document.querySelector("#sign-out-button"),
  memberName: document.querySelector("#member-name"),
  memberEmail: document.querySelector("#member-email"),
  creditsCount: document.querySelector("#credits-count"),
  ordersCount: document.querySelector("#orders-count"),
  orderForm: document.querySelector("#order-form"),
  submitOrderButton: document.querySelector("#submit-order-button"),
  formStatus: document.querySelector("#form-status"),
  refreshOrdersButton: document.querySelector("#refresh-orders-button"),
  ordersEmpty: document.querySelector("#orders-empty"),
  ordersList: document.querySelector("#orders-list")
};

let supabaseClient = null;
let currentUser = null;

if (!configured) {
  elements.setupWarning.hidden = false;
  elements.googleLoginButton.disabled = true;
  elements.submitOrderButton.disabled = true;
  elements.refreshOrdersButton.disabled = true;
  setStatus("尚未設定 Supabase，現在只能看會員中心版型。", "muted");
} else if (!window.supabase) {
  elements.setupWarning.hidden = false;
  elements.setupWarning.querySelector("strong").textContent = "Supabase SDK 載入失敗";
  elements.setupWarning.querySelector("p").textContent = "請確認網路可以載入 cdn.jsdelivr.net 的 @supabase/supabase-js。";
  elements.googleLoginButton.disabled = true;
  elements.submitOrderButton.disabled = true;
  elements.refreshOrdersButton.disabled = true;
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

  const redirectTo = new URL("app.html", window.location.href).toString();
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo }
  });

  if (error) {
    setStatus(`Google 登入失敗：${error.message}`, "error");
  }
});

elements.signOutButton.addEventListener("click", async () => {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
});

elements.refreshOrdersButton.addEventListener("click", loadOrders);

elements.orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    setStatus("尚未設定 Supabase，無法建立訂單。", "error");
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
    payment_status: "not_required",
    status: "new"
  };

  if (!payload.product_name || !payload.package_type) {
    setStatus("請至少填寫商品名稱與需求方案。", "error");
    return;
  }

  elements.submitOrderButton.disabled = true;
  setStatus("正在建立訂單...", "muted");

  const { error } = await supabaseClient.from("orders").insert(payload);
  elements.submitOrderButton.disabled = false;

  if (error) {
    setStatus(`建立訂單失敗：${error.message}。請確認已在 Supabase 執行 supabase-schema.sql。`, "error");
    return;
  }

  await updateProfileFromOrder(payload);
  elements.orderForm.reset();
  setStatus(`已建立訂單 ${payload.order_no}，請到 LINE 傳商品照片。`, "success");
  await loadOrders();

  setTimeout(() => {
    window.open(LINE_URL, "_blank", "noopener,noreferrer");
  }, 700);
});

async function renderAuthState() {
  const isSignedIn = Boolean(currentUser);
  elements.signedOutView.hidden = isSignedIn;
  elements.signedInView.hidden = !isSignedIn;
  elements.signOutButton.hidden = !isSignedIn;
  elements.submitOrderButton.disabled = !configured || !isSignedIn;
  elements.refreshOrdersButton.disabled = !configured || !isSignedIn;

  if (!isSignedIn) {
    elements.ordersList.innerHTML = "";
    elements.ordersEmpty.hidden = false;
    elements.ordersCount.textContent = "0";
    return;
  }

  await ensureProfile(currentUser);
  const profile = await loadProfile(currentUser.id);
  elements.memberName.textContent = profile?.display_name || currentUser.user_metadata?.full_name || "ADFORGE 會員";
  elements.memberEmail.textContent = currentUser.email || "";
  elements.creditsCount.textContent = String(profile?.credits ?? 0);
  await loadOrders();
}

async function ensureProfile(user) {
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || "";
  await supabaseClient.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      display_name: displayName,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );
}

async function updateProfileFromOrder(order) {
  const patch = {
    id: currentUser.id,
    email: currentUser.email,
    updated_at: new Date().toISOString()
  };

  if (order.contact_name) patch.display_name = order.contact_name;
  if (order.line_id) patch.line_id = order.line_id;

  const { error } = await supabaseClient.from("profiles").upsert(patch, { onConflict: "id" });
  if (error) {
    setStatus(`訂單已建立，但會員資料更新失敗：${error.message}`, "error");
  }
}

async function loadProfile(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id,email,display_name,line_id,credits")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    setStatus(`讀取會員資料失敗：${error.message}`, "error");
    return null;
  }

  return data;
}

async function loadOrders() {
  if (!supabaseClient || !currentUser) return;

  const { data, error } = await supabaseClient
    .from("orders")
    .select("id,order_no,product_name,package_type,platform,status,amount_ntd,payment_status,created_at")
    .eq("user_id", currentUser.id)
    .order("created_at", { ascending: false });

  if (error) {
    elements.ordersList.innerHTML = "";
    elements.ordersEmpty.hidden = false;
    elements.ordersEmpty.textContent = `讀取訂單失敗：${error.message}`;
    return;
  }

  elements.ordersCount.textContent = String(data.length);
  elements.ordersEmpty.hidden = data.length > 0;
  elements.ordersEmpty.textContent = "目前還沒有訂單。登入後送出第一筆商品需求，這裡就會出現紀錄。";
  elements.ordersList.innerHTML = data.map(renderOrder).join("");
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
        <small>${date}・${formatAmount(order.amount_ntd)}</small>
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
    new: "新需求",
    reviewing: "確認素材",
    quoted: "已報價",
    in_progress: "製作中",
    delivered: "已交付",
    cancelled: "已取消"
  }[value] || value;
}

function setStatus(message, type = "muted") {
  elements.formStatus.textContent = message;
  elements.formStatus.dataset.type = type;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
