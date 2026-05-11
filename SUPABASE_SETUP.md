# ADFORGE Supabase Google 登入設定

這份設定讓 ADFORGE 先驗證三件事：Google 登入、建立會員、建立訂單。第一版不做付款。

## 1. 建立 Supabase 專案

1. 到 Supabase 建立新專案。
2. 進入 `Project Settings > API`。
3. 複製：
   - Project URL
   - anon public key

把資料填到：

```js
// assets/supabase-config.js
export const SUPABASE_CONFIG = {
  url: "https://你的專案.supabase.co",
  anonKey: "你的 anon public key"
};
```

`anon public key` 可以放在前端，這是 Supabase 設計給瀏覽器使用的公開金鑰。資料安全靠 RLS policy 控制。

## 2. 建立資料表

到 `SQL Editor` 執行：

```sql
-- 直接貼上 supabase-schema.sql 全部內容
```

會建立：

- `profiles`：會員資料、LINE ID、剩餘點數
- `orders`：商品圖需求與訂單狀態
- RLS policy：每個會員只能讀寫自己的資料

## 3. 啟用 Google 登入

到 Supabase：

```text
Authentication > Providers > Google
```

填入 Google OAuth Client ID 與 Client Secret。

Google Cloud Console 需要設定：

```text
Authorized JavaScript origins:
https://zhaipinghao.github.io
https://adforge-ai-tw.netlify.app
http://127.0.0.1:8771

Authorized redirect URI:
https://你的專案.supabase.co/auth/v1/callback
```

Supabase 需要設定：

```text
Authentication > URL Configuration

Site URL:
https://zhaipinghao.github.io/adforge-site/

Redirect URLs:
https://zhaipinghao.github.io/adforge-site/app.html
https://adforge-ai-tw.netlify.app/app.html
http://127.0.0.1:8771/app.html
```

## 4. 測試流程

1. 開啟 `/app.html`。
2. 點「使用 Google 登入」。
3. 登入後確認畫面顯示 Email。
4. 填商品名稱、方案、平台、LINE ID、需求說明。
5. 送出後確認 `orders` 有新增資料。
6. 到 LINE 人工接手客戶傳圖與報價。

## 5. 目前刻意不做

- 付款
- 點數扣款
- 自動 AI 生圖
- 後台審核
- 客戶上傳檔案

這些等「登入 + 留資料 + 建訂單」跑通後再做。
