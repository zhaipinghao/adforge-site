import { SUPABASE_CONFIG } from "./supabase-config.js";

const ADMIN_EMAILS = ["b989010@gmail.com"];
const STATUS_OPTIONS = [
  ["pending", "待確認"],
  ["confirmed", "已確認"],
  ["making", "製作中"],
  ["done", "已完成"]
];

const configured =
  SUPABASE_CONFIG.url.startsWith("https://") &&
  SUPABASE_CONFIG.url.endsWith(".supabase.co") &&
  SUPABASE_CONFIG.anonKey &&
  !SUPABASE_CONFIG.anonKey.includes("YOUR_SUPABASE");

const elements = {
  loginCard: document.querySelector("#admin-login-card"),
  loginButton: document.querySelector("#admin-login"),
  signOutButton: document.querySelector("#admin-sign-out"),
  loginStatus: document.querySelector("#admin-login-status"),
  ordersSection: document.querySelector("#admin-orders"),
  orderList: document.querySelector("#admin-order-list"),
  refreshButton: document.querySelector("#admin-refresh"),
  adminStatus: document.querySelector("#admin-status")
};

let supabaseClient = null;
let currentUser = null;

if (!configured || !window.supabase) {
  setLoginStatus("Supabase 尚未設定完成，後台暫時無法使用。", "error");
  elements.loginButton.disabled = true;
} else {
  supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  boot();
}

async function boot() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setLoginStatus(friendlyError(error, "讀取登入狀態失敗，請重新整理。"), "error");
  }

  currentUser = data?.session?.user ?? null;
  await renderState();

  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user ?? null;
    await renderState();
  });
}

elements.loginButton.addEventListener("click", async () => {
  if (!supabaseClient) return;

  const redirectUrl = new URL(window.location.href);
  redirectUrl.hash = "";

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl.toString() }
  });

  if (error) {
    setLoginStatus(friendlyError(error, "Google 登入失敗，請改用 Safari 或 Chrome 再試一次。"), "error");
  }
});

elements.signOutButton.addEventListener("click", async () => {
  if (!supabaseClient) return;
  await supabaseClient.auth.signOut();
});

elements.refreshButton.addEventListener("click", loadOrders);

elements.orderList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-save-order]");
  if (!button) return;

  const row = button.closest("[data-order-id]");
  if (!row) return;

  const orderId = row.dataset.orderId;
  const status = row.querySelector("[data-order-status]").value;
  const adminNotes = row.querySelector("[data-admin-notes]").value.trim();

  button.disabled = true;
  button.textContent = "儲存中...";

  const { error } = await supabaseClient
    .from("orders")
    .update({ status, admin_notes: adminNotes })
    .eq("id", orderId);

  button.disabled = false;
  button.textContent = "儲存";

  if (error) {
    setAdminStatus(friendlyError(error, "訂單更新失敗，請確認管理員權限與 SQL policy。"), "error");
    return;
  }

  setAdminStatus("訂單已更新。", "success");
  await loadOrders();
});

async function renderState() {
  const email = currentUser?.email || "";
  const isSignedIn = Boolean(currentUser);
  const isAdmin = isSignedIn && ADMIN_EMAILS.includes(email.toLowerCase());

  elements.signOutButton.hidden = !isSignedIn;
  elements.loginCard.hidden = isAdmin;
  elements.ordersSection.hidden = !isAdmin;

  if (!isSignedIn) {
    setLoginStatus("請使用管理員 Google 帳號登入。", "muted");
    return;
  }

  if (!isAdmin) {
    setLoginStatus(`目前登入帳號 ${email} 沒有後台權限。`, "error");
    return;
  }

  setLoginStatus("", "muted");
  await loadOrders();
}

async function loadOrders() {
  if (!supabaseClient || !currentUser) return;

  setAdminStatus("正在載入訂單...", "muted");
  elements.orderList.innerHTML = `<tr><td colspan="7">載入中...</td></tr>`;

  const { data, error } = await supabaseClient
    .from("orders")
    .select("id,order_no,created_at,contact_name,contact_email,product_name,package_type,platform,status,notes,admin_notes,line_id,target_style,deadline,image_link,amount_ntd")
    .order("created_at", { ascending: false });

  if (error) {
    elements.orderList.innerHTML = `<tr><td colspan="7">${escapeHtml(friendlyError(error, "讀取訂單失敗，請確認 Supabase RLS policy。"))}</td></tr>`;
    setAdminStatus("讀取訂單失敗。", "error");
    return;
  }

  if (!data.length) {
    elements.orderList.innerHTML = `<tr><td colspan="7">目前沒有訂單。</td></tr>`;
    setAdminStatus("目前沒有訂單。", "muted");
    return;
  }

  elements.orderList.innerHTML = data.map(renderOrderRow).join("");
  setAdminStatus(`已載入 ${data.length} 筆訂單。`, "success");
}

function renderOrderRow(order) {
  const createdAt = new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(order.created_at));

  const customer = order.contact_name || order.contact_email || "未填稱呼";
  const contact = [
    order.contact_email,
    order.line_id ? `LINE：${order.line_id}` : ""
  ].filter(Boolean).map(escapeHtml).join("<br>");

  return `
    <tr data-order-id="${escapeHtml(order.id)}">
      <td>
        <span class="admin-order-no">${escapeHtml(order.order_no)}</span>
        <span class="admin-muted">${createdAt}</span>
      </td>
      <td>
        <strong>${escapeHtml(customer)}</strong>
        <div class="admin-muted">${contact || "未填聯絡方式"}</div>
      </td>
      <td>
        <strong>${escapeHtml(order.product_name)}</strong>
        <div class="admin-muted">${escapeHtml(labelPackage(order.package_type))}・${formatAmount(order.amount_ntd)}</div>
        <div class="admin-muted">${escapeHtml(order.notes || "未填需求說明")}</div>
      </td>
      <td>
        <strong>${escapeHtml(order.platform || "未填平台")}</strong>
        <div class="admin-muted">${escapeHtml(order.target_style || "未填風格")}</div>
      </td>
      <td>
        <select data-order-status aria-label="訂單狀態">
          ${STATUS_OPTIONS.map(([value, label]) => `<option value="${value}" ${normalizeStatus(order.status) === value ? "selected" : ""}>${label}</option>`).join("")}
        </select>
      </td>
      <td>
        <textarea data-admin-notes placeholder="內部備註，例如：已加 LINE、照片不足、排程中">${escapeHtml(order.admin_notes || "")}</textarea>
      </td>
      <td>
        <button class="admin-save-button" data-save-order type="button">儲存</button>
      </td>
    </tr>
  `;
}

function normalizeStatus(status) {
  return {
    new: "pending",
    reviewing: "confirmed",
    quoted: "confirmed",
    in_progress: "making",
    delivered: "done"
  }[status] || status || "pending";
}

function labelPackage(value) {
  return {
    free_diagnosis: "免費診斷",
    trial_399: "NT$399 體驗包",
    batch_999: "NT$999 小批量包",
    page_2999: "NT$2,999 商品頁包",
    monthly_6900: "NT$6,900+ 品牌月包"
  }[value] || value || "未填方案";
}

function formatAmount(value) {
  const amount = Number(value || 0);
  return amount > 0 ? `NT$${amount.toLocaleString("zh-TW")}` : "未收款";
}

function friendlyError(error, fallback) {
  const message = String(error?.message || "");

  if (/row-level security|permission denied/i.test(message)) {
    return "目前帳號沒有後台權限，請確認登入的是管理員 Google 帳號，並已執行最新 Supabase SQL。";
  }

  if (/column .* does not exist|schema cache/i.test(message)) {
    return "資料庫欄位尚未同步，請先重新執行 supabase-schema.sql。";
  }

  if (/network|fetch|failed to fetch/i.test(message)) {
    return "網路連線不穩，請重新整理後再試一次。";
  }

  return fallback;
}

function setLoginStatus(message, type = "muted") {
  elements.loginStatus.textContent = message;
  elements.loginStatus.dataset.type = type;
}

function setAdminStatus(message, type = "muted") {
  elements.adminStatus.textContent = message;
  elements.adminStatus.dataset.type = type;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
