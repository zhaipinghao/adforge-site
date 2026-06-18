// ============================================================
// ADFORGE AI — Supabase Edge Function: notify-order
// 觸發時機：訂單建立後（透過 Database Webhook 或直接呼叫）
// 功能：
//   1. 寄 Email 通知客戶（訂單確認信）
//   2. 傳 Telegram 通知管理員
//
// 部署方式：
//   supabase functions deploy notify-order --no-verify-jwt
//
// 需要在 Supabase Dashboard → Settings → Edge Functions → Secrets 設定：
//   RESEND_API_KEY       ← 從 https://resend.com 取得（免費方案每月 3000 封）
//   TELEGRAM_BOT_TOKEN   ← BotFather 建立的 Bot Token
//   TELEGRAM_CHAT_ID     ← 你的 Telegram 個人或群組 Chat ID
//   ADMIN_EMAIL          ← 管理員 Email（收副本通知）
//   FROM_EMAIL           ← 寄件人地址（需在 Resend 驗證網域）
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
interface OrderPayload {
  id: number
  order_no: string
  user_id: string
  contact_name?: string
  contact_email?: string
  product_name: string
  package_type: string
  amount_ntd: number
  platform?: string
  line_id?: string
  target_style?: string
  deadline?: string
  notes?: string
  status: string
  payment_status: string
  created_at: string
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  record: OrderPayload
  old_record?: OrderPayload
}

// ────────────────────────────────────────────────────────────
// Config from Secrets
// ────────────────────────────────────────────────────────────
const RESEND_API_KEY     = Deno.env.get('RESEND_API_KEY') ?? ''
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') ?? ''
const TELEGRAM_CHAT_ID   = Deno.env.get('TELEGRAM_CHAT_ID') ?? ''
const ADMIN_EMAIL        = Deno.env.get('ADMIN_EMAIL') ?? 'hello@adforge.ai'
const FROM_EMAIL         = Deno.env.get('FROM_EMAIL') ?? 'ADFORGE AI <noreply@adforge.ai>'

// ────────────────────────────────────────────────────────────
// Package Labels
// ────────────────────────────────────────────────────────────
const PACKAGE_LABELS: Record<string, string> = {
  free_diagnosis: '免費診斷',
  trial_399:      'NT$399 體驗包',
  batch_999:      'NT$999 小批量包',
  page_2999:      'NT$2,999 商品頁包',
  monthly_6900:   'NT$6,900 月包',
}

// ────────────────────────────────────────────────────────────
// Send Email via Resend
// ────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.warn('[notify-order] RESEND_API_KEY not set, skipping email')
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      bcc: [ADMIN_EMAIL],
      subject,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Resend error: ${JSON.stringify(data)}`)
  console.log('[notify-order] Email sent:', data.id)
}

// ────────────────────────────────────────────────────────────
// Send Telegram Message
// ────────────────────────────────────────────────────────────
async function sendTelegram(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('[notify-order] Telegram not configured, skipping')
    return
  }

  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    }
  )

  const data = await res.json()
  if (!res.ok) throw new Error(`Telegram error: ${JSON.stringify(data)}`)
  console.log('[notify-order] Telegram sent')
}

// ────────────────────────────────────────────────────────────
// Email HTML Template — Customer Confirmation
// ────────────────────────────────────────────────────────────
function buildCustomerEmail(order: OrderPayload): string {
  const pkgLabel = PACKAGE_LABELS[order.package_type] ?? order.package_type
  const amountStr = order.amount_ntd > 0 ? `NT$${order.amount_ntd.toLocaleString()}` : '免費'
  const dateStr = new Date(order.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>ADFORGE 訂單確認</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'PingFang TC','Microsoft JhengHei',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#8b5cf6,#ec4899);padding:32px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,.7);letter-spacing:.1em;text-transform:uppercase;">ADFORGE AI</p>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;">訂單建立成功 ✅</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
              嗨 ${order.contact_name || '您'}，<br>
              感謝您的訂單！我們已收到您的需求，會盡快安排確認。<br>
              如有任何問題，請直接在 <a href="https://page.line.me/ndb3949k" style="color:#8b5cf6;">LINE</a> 聯絡我們。
            </p>

            <!-- Order Details Table -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9f7ff;border-radius:8px;border:1px solid #e5e1f5;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#8b5cf6;letter-spacing:.1em;text-transform:uppercase;">訂單明細</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${[
                      ['訂單編號', order.order_no],
                      ['商品名稱', order.product_name],
                      ['服務方案', pkgLabel],
                      ['訂單金額', amountStr],
                      ['建立時間', dateStr],
                    ].map(([label, val]) => `
                    <tr>
                      <td style="padding:6px 0;font-size:13px;color:#6b7280;width:100px;">${label}</td>
                      <td style="padding:6px 0;font-size:13px;color:#111827;font-weight:600;">${val}</td>
                    </tr>`).join('')}
                  </table>
                </td>
              </tr>
            </table>

            <!-- Next Steps -->
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#374151;">📋 接下來的步驟：</p>
            <ol style="margin:0 0 28px;padding-left:20px;font-size:13px;color:#6b7280;line-height:2;">
              <li>我們會在 <strong style="color:#374151;">24 小時內</strong> 審核您的訂單</li>
              <li>審核後透過 <strong style="color:#374151;">LINE</strong> 與您確認商品照片與方向</li>
              <li>確認後開始 AI 製作 + 設計師校稿</li>
              <li>完成後提供下載連結（通常 24-48 小時）</li>
            </ol>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:8px;">
              <a href="https://page.line.me/ndb3949k" target="_blank"
                style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#ec4899);color:#fff;text-decoration:none;padding:13px 32px;border-radius:8px;font-size:14px;font-weight:700;">
                加入 LINE 傳商品照 →
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f7ff;padding:20px 40px;text-align:center;border-top:1px solid #e5e1f5;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              ADFORGE AI｜台灣電商 AI 商品素材工廠<br>
              <a href="mailto:hello@adforge.ai" style="color:#8b5cf6;">hello@adforge.ai</a> ·
              <a href="https://adforge.ai" style="color:#8b5cf6;">adforge.ai</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ────────────────────────────────────────────────────────────
// Telegram Message — Admin Notification
// ────────────────────────────────────────────────────────────
function buildTelegramMessage(order: OrderPayload): string {
  const pkgLabel = PACKAGE_LABELS[order.package_type] ?? order.package_type
  const amountStr = order.amount_ntd > 0 ? `NT$${order.amount_ntd.toLocaleString()}` : '免費'
  const dateStr = new Date(order.created_at).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })

  return `🆕 <b>ADFORGE 新訂單</b>

📋 訂單編號：<code>${order.order_no}</code>
👤 客戶姓名：${order.contact_name || '未填寫'}
📧 Email：${order.contact_email || '未填寫'}
💬 LINE：${order.line_id || '未填寫'}
📦 商品：${order.product_name}
🎯 方案：${pkgLabel}
💰 金額：${amountStr}
🖥 平台：${order.platform || '未填寫'}
⏰ 時間：${dateStr}
${order.notes ? `\n📝 備註：${order.notes}` : ''}

👉 <a href="https://adforge.ai/admin.html">前往後台處理</a>`
}

// ────────────────────────────────────────────────────────────
// Main Handler
// ────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const payload: WebhookPayload = await req.json()

    // Only handle INSERT on orders table
    if (payload.type !== 'INSERT' || payload.table !== 'orders') {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    const order = payload.record
    console.log(`[notify-order] Processing order: ${order.order_no}`)

    const results: Record<string, string> = {}

    // 1. Customer Email
    if (order.contact_email) {
      try {
        await sendEmail(
          order.contact_email,
          `✅ ADFORGE 訂單確認 — ${order.order_no}`,
          buildCustomerEmail(order)
        )
        results.email = 'sent'
      } catch (e) {
        console.error('[notify-order] Email failed:', e)
        results.email = `error: ${e}`
      }
    } else {
      results.email = 'skipped (no email)'
    }

    // 2. Telegram Admin Notification
    try {
      await sendTelegram(buildTelegramMessage(order))
      results.telegram = 'sent'
    } catch (e) {
      console.error('[notify-order] Telegram failed:', e)
      results.telegram = `error: ${e}`
    }

    return new Response(JSON.stringify({ ok: true, order_no: order.order_no, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (e) {
    console.error('[notify-order] Fatal error:', e)
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
