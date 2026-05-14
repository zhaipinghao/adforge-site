-- ============================================================
-- ADFORGE AI — Admin RLS Hardening
-- 在 Supabase SQL Editor 執行此檔案
-- 執行前請確認：管理員 Email 已在 Supabase Auth Users 清單內
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- STEP 1：建立 admin_emails 白名單表
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 插入你的管理員 email（可多筆）
INSERT INTO public.admin_emails (email)
VALUES
  ('your-admin@adforge.ai')   -- ← 改成你的管理員 email
ON CONFLICT DO NOTHING;

-- 讓一般 authenticated 用戶無法讀這張表
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service role can access admin_emails" ON public.admin_emails;
CREATE POLICY "Only service role can access admin_emails"
  ON public.admin_emails
  USING (false);  -- 完全鎖死，只有 service_role / SQL Editor 可存取


-- ────────────────────────────────────────────────────────────
-- STEP 2：is_admin() helper function
-- SECURITY DEFINER = 以函數擁有者身份執行，可繞過 RLS 讀 admin_emails
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_emails
    WHERE email = auth.email()
  );
$$;

-- 確保一般用戶可以呼叫但無法看穿邏輯
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ────────────────────────────────────────────────────────────
-- STEP 3：Orders 表 — Admin 讀取 Policy
-- 管理員可以讀取所有訂單（一般用戶只能讀自己的）
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can read all orders" ON public.orders;
CREATE POLICY "Admins can read all orders"
  ON public.orders
  FOR SELECT
  USING (public.is_admin());

-- 確認原本用戶讀自己訂單的 Policy 還在（不要蓋掉）
-- 這兩條 Policy 並存，OR 邏輯：自己的訂單 OR 管理員
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
CREATE POLICY "Users can read own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- STEP 4：Orders 表 — Admin 更新 status/notes Policy
-- 只允許管理員更新 status、notes、updated_at 欄位
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can update order status" ON public.orders;
CREATE POLICY "Admins can update order status"
  ON public.orders
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Grant UPDATE 給 authenticated（admin 帳號用）
GRANT UPDATE (status, notes, updated_at) ON public.orders TO authenticated;


-- ────────────────────────────────────────────────────────────
-- STEP 5：Profiles 表 — Admin 可讀所有用戶 Profile
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles"
  ON public.profiles
  FOR SELECT
  USING (public.is_admin());


-- ────────────────────────────────────────────────────────────
-- STEP 6：強化 Orders INSERT — 禁止客戶偽造 user_id
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can create own orders" ON public.orders;
CREATE POLICY "Users can create own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'new'
    AND payment_status = 'not_required'
  );


-- ────────────────────────────────────────────────────────────
-- STEP 7：防止客戶自己改訂單 status（只允許管理員）
-- ────────────────────────────────────────────────────────────
-- 確認之前的 revoke 還在：
REVOKE UPDATE ON public.orders FROM authenticated;
-- 重新只 grant 管理員需要的欄位：
GRANT UPDATE (status, notes, updated_at) ON public.orders TO authenticated;

-- 客戶只能更新自己草稿的圖片連結與備註（下單後補件用）
DROP POLICY IF EXISTS "Users can update own draft image_link" ON public.orders;
CREATE POLICY "Users can update own draft image_link"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'new')
  WITH CHECK (auth.uid() = user_id AND status = 'new');


-- ────────────────────────────────────────────────────────────
-- STEP 8：驗證目前所有 Policy（確認設定正確）
-- ────────────────────────────────────────────────────────────
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'profiles', 'admin_emails')
ORDER BY tablename, policyname;

-- ============================================================
-- ✅ 完成後，至 Supabase → Table Editor → orders
-- 用管理員帳號登入 admin.html 後台確認可以看到所有訂單
-- ============================================================
