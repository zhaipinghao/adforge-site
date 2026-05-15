/**
 * tools-data.js
 * ADFORGE AI — 爆款模板資料庫
 * 模板資料層：包含 AI 圖片模板、Prompt 模板、短影音模板
 */

const TEMPLATE_DB = {

  /* ─────────────────────────────────────────────
     分類定義
  ───────────────────────────────────────────── */
  categories: [
    { id: "all",    label: "全部",        icon: "◈" },
    { id: "image",  label: "AI 圖片模板", icon: "🖼" },
    { id: "prompt", label: "Prompt 模板", icon: "✦" },
    { id: "video",  label: "短影音模板",  icon: "▶" },
  ],

  /* ─────────────────────────────────────────────
     標籤系統
  ───────────────────────────────────────────── */
  tags: {
    image:  ["電商首圖","社群封面","廣告素材","品牌視覺","情境場景","白底商品","Banner","節慶促銷"],
    prompt: ["商品文案","SEO標題","社群貼文","創意發想","賣點拆解","短影音腳本","品牌定調","競品分析","台灣爆款","Threads靈感","人物寫真","AI繪圖"],
    video:  ["開箱短片","痛點引入","Before/After","產品展示","教學型","限時優惠","UGC風格","Reels封面"],
  },

  /* ─────────────────────────────────────────────
     平台標籤
  ───────────────────────────────────────────── */
  platforms: ["全平台","蝦皮","小紅書","TikTok","Instagram","Facebook","Threads","YouTube Shorts","MOMO","LINE"],

  /* ─────────────────────────────────────────────
     模板資料
  ───────────────────────────────────────────── */
  templates: [

    /* ── AI 圖片模板 ── */
    {
      id: "img-001",
      category: "image",
      badge: "HOT",
      title: "電商爆款主圖 · 白底乾淨版",
      subtitle: "Product Hero — Clean White",
      desc: "白底去背＋文字賣點標記，適合蝦皮 / MOMO 主圖上架，一組 3 種色調輸出。",
      tags: ["白底商品","電商首圖","蝦皮"],
      platforms: ["蝦皮","MOMO"],
      ratio: "1:1",
      level: "基礎",
      uses: 1840,
      preview_gradient: "linear-gradient(135deg,#f8faff 0%,#e8f0fe 100%)",
      preview_icon: "◻",
      preview_color: "#2f66f4",
      prompt_hint: "white background, product centered, clean light, soft shadow, commercial photography",
      copy_template: "商品名稱 + 白底 + 去背 + 輕柔陰影 + 電商主圖比例 1:1",
    },
    {
      id: "img-002",
      category: "image",
      badge: "NEW",
      title: "生活情境場景圖 · 溫暖居家風",
      subtitle: "Lifestyle Scene — Warm Home",
      desc: "把商品放進溫暖居家情境，提升消費者代入感，適合小紅書、IG 貼文封面。",
      tags: ["情境場景","社群封面","品牌視覺"],
      platforms: ["小紅書","Instagram"],
      ratio: "4:5",
      level: "進階",
      uses: 1260,
      preview_gradient: "linear-gradient(135deg,#fff8f0 0%,#fde8d0 100%)",
      preview_icon: "⌂",
      preview_color: "#e07b39",
      prompt_hint: "cozy home scene, warm morning light, product on wooden table, bokeh background, lifestyle photography",
      copy_template: "商品名稱 + 居家場景 + 暖光 + 木質桌面 + Instagram 4:5",
    },
    {
      id: "img-003",
      category: "image",
      badge: "HOT",
      title: "促銷 Banner · 雙十一節慶版",
      subtitle: "Sale Banner — 11.11 Festival",
      desc: "高對比促銷版型，主打折扣數字與限時感，適合電商首頁 Banner 與廣告投放。",
      tags: ["Banner","節慶促銷","廣告素材"],
      platforms: ["蝦皮","Facebook","Instagram"],
      ratio: "16:9",
      level: "基礎",
      uses: 2310,
      preview_gradient: "linear-gradient(135deg,#1a1a2e 0%,#e63946 100%)",
      preview_icon: "◆",
      preview_color: "#ff4d6d",
      prompt_hint: "sale banner, bold typography, high contrast red and black, 11.11 promotion, countdown timer element",
      copy_template: "品牌名 + 折數文字 + 倒數感 + 深色高對比 + Banner 16:9",
    },
    {
      id: "img-004",
      category: "image",
      badge: "",
      title: "商品九宮格套圖 · 完整賣點版",
      subtitle: "9-Grid Product Set — Full Feature",
      desc: "主圖、賣點、材質、使用方式、情境、規格、促銷七種圖型一次輸出，直接上架。",
      tags: ["電商首圖","廣告素材","電商首圖"],
      platforms: ["蝦皮","MOMO","小紅書"],
      ratio: "1:1 × 9",
      level: "進階",
      uses: 980,
      preview_gradient: "linear-gradient(135deg,#f0f4ff 0%,#c7d7ff 100%)",
      preview_icon: "⊞",
      preview_color: "#2f66f4",
      prompt_hint: "product image set, 9 photos, feature callouts, clean layout, e-commerce listing",
      copy_template: "商品名 + 賣點清單（3-5 點）+ 目標受眾 + 價格區間",
    },
    {
      id: "img-005",
      category: "image",
      badge: "PRO",
      title: "品牌一致性模板 · 視覺識別系統",
      subtitle: "Brand Visual System",
      desc: "固定色系、字體節奏、構圖語言，讓多 SKU 商品在賣場看起來像同一個品牌。",
      tags: ["品牌視覺","社群封面","廣告素材"],
      platforms: ["全平台"],
      ratio: "多比例",
      level: "品牌級",
      uses: 675,
      preview_gradient: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)",
      preview_icon: "◈",
      preview_color: "#7dd3fc",
      prompt_hint: "brand system, consistent color palette, typography hierarchy, multiple SKU visual harmony",
      copy_template: "品牌名稱 + 主色調 HEX + 品牌個性（3 個形容詞）+ 競品參考",
    },
    {
      id: "img-006",
      category: "image",
      badge: "",
      title: "小紅書封面 · 高點擊插圖風",
      subtitle: "RED Book Cover — Illustration Style",
      desc: "手繪插圖感封面，搭配大字標題，符合小紅書用戶審美，提升收藏率。",
      tags: ["社群封面","品牌視覺"],
      platforms: ["小紅書"],
      ratio: "3:4",
      level: "進階",
      uses: 1540,
      preview_gradient: "linear-gradient(135deg,#fff0f6 0%,#ffd6e7 100%)",
      preview_icon: "✿",
      preview_color: "#e91e8c",
      prompt_hint: "xiaohongshu style, flat illustration, pastel colors, big bold title, cute character, aesthetic",
      copy_template: "主題句（8 字以內）+ 插圖描述 + 配色方向（馬卡龍/莫蘭迪/鮮豔）",
    },

    /* ── Prompt 模板 ── */
    {
      id: "pmt-001",
      category: "prompt",
      badge: "HOT",
      title: "蝦皮爆款標題 · 數據驅動版",
      subtitle: "Shopee Title — Data-Driven",
      desc: "把商品核心賣點、目標關鍵字與促銷資訊結構化，輸出 3 組標題讓你 A/B 測試。",
      tags: ["SEO標題","商品文案"],
      platforms: ["蝦皮"],
      ratio: "—",
      level: "基礎",
      uses: 3120,
      preview_gradient: "linear-gradient(135deg,#fff3e0 0%,#ffe0b2 100%)",
      preview_icon: "✦",
      preview_color: "#f59e0b",
      prompt_template: `你是一位資深蝦皮 SEO 專家。
請根據以下資訊，產出 3 組高點擊率蝦皮商品標題：

商品名稱：{{商品名稱}}
核心賣點：{{核心賣點1}}、{{核心賣點2}}、{{核心賣點3}}
目標受眾：{{目標受眾}}
促銷資訊：{{促銷資訊（如有）}}

輸出格式：
標題1：（主打功能型，包含關鍵字）
標題2：（主打受眾型，包含情境）
標題3：（主打促銷型，包含優惠感）

每個標題不超過 30 個字，且自然包含 2-3 個搜尋關鍵字。`,
    },
    {
      id: "pmt-002",
      category: "prompt",
      badge: "NEW",
      title: "社群爆文 · 痛點共鳴版",
      subtitle: "Social Viral Post — Pain Point",
      desc: "先說痛點、再給解法、最後號召行動的黃金三段結構，適合 IG / 小紅書貼文。",
      tags: ["社群貼文","商品文案"],
      platforms: ["Instagram","小紅書","Facebook"],
      ratio: "—",
      level: "基礎",
      uses: 2680,
      preview_gradient: "linear-gradient(135deg,#f0fdf4 0%,#bbf7d0 100%)",
      preview_icon: "◉",
      preview_color: "#16a34a",
      prompt_template: `你是一位擅長帶貨的社群內容創作者。
請幫我寫一篇 IG / 小紅書貼文，使用「痛點→共鳴→解法→行動」結構：

商品：{{商品名稱}}
目標受眾：{{目標受眾描述}}
最大痛點：{{消費者的痛點}}
核心解法：{{商品如何解決痛點}}
行動呼籲：{{想讓讀者做什麼}}

要求：
- 開頭第一句要讓人有感，不要從「如果你」開始
- 全文 150-200 字
- 結尾加 3-5 個相關 hashtag`,
    },
    {
      id: "pmt-003",
      category: "prompt",
      badge: "",
      title: "短影音腳本 · 15 秒開箱版",
      subtitle: "Short Video Script — 15s Unboxing",
      desc: "黃金 15 秒結構：0-3s 鉤子、4-10s 展示、11-15s CTA，輸出逐秒腳本與字幕。",
      tags: ["短影音腳本","賣點拆解"],
      platforms: ["TikTok","Instagram","YouTube Shorts"],
      ratio: "—",
      level: "進階",
      uses: 1890,
      preview_gradient: "linear-gradient(135deg,#fdf4ff 0%,#e9d5ff 100%)",
      preview_icon: "▶",
      preview_color: "#7c3aed",
      prompt_template: `你是一位 TikTok 爆款內容策略師。
請幫我寫一個 15 秒開箱短影音腳本：

商品：{{商品名稱}}
最大賣點：{{賣點（1-2個最有視覺衝擊力的）}}
目標平台：{{TikTok / IG Reels / YouTube Shorts}}
風格：{{真實感 / 炫技感 / 日系清新 / 台式接地氣}}

輸出格式：
【0-3秒】鉤子畫面 ＋ 台詞
【4-8秒】商品展示動作 ＋ 台詞
【9-12秒】賣點強調 ＋ 字幕
【13-15秒】CTA ＋ 引導行動
畫面備註：鏡頭運動建議`,
    },
    {
      id: "pmt-004",
      category: "prompt",
      badge: "PRO",
      title: "競品分析框架 · 差異化定位",
      subtitle: "Competitor Analysis — Positioning",
      desc: "系統性拆解競品定位、文案策略與視覺語言，找出你的差異化切入點。",
      tags: ["競品分析","品牌定調","創意發想"],
      platforms: ["全平台"],
      ratio: "—",
      level: "品牌級",
      uses: 890,
      preview_gradient: "linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)",
      preview_icon: "⊕",
      preview_color: "#475569",
      prompt_template: `你是一位電商品牌策略顧問。
請針對以下資訊，進行競品分析並找出差異化定位：

我的商品：{{我的商品描述}}
主要競品（2-3個）：{{競品名稱或商品連結}}
我的優勢（自評）：{{我認為的強項}}
目標受眾：{{目標客群描述}}

請輸出：
1. 競品定位摘要（各50字內）
2. 市場空缺分析
3. 建議差異化方向（3個）
4. 品牌標語建議（3組）`,
    },
    {
      id: "pmt-005",
      category: "prompt",
      badge: "HOT",
      title: "賣點拆解機 · 買家語言版",
      subtitle: "Feature → Benefit Translator",
      desc: "把規格參數翻譯成買家聽得懂的利益語言，從「功能」轉化為「感受」。",
      tags: ["賣點拆解","商品文案","SEO標題"],
      platforms: ["全平台"],
      ratio: "—",
      level: "基礎",
      uses: 2450,
      preview_gradient: "linear-gradient(135deg,#fff7ed 0%,#fed7aa 100%)",
      preview_icon: "↝",
      preview_color: "#ea580c",
      prompt_template: `你是一位消費心理學專家，擅長把商品規格翻譯成情感化的買家語言。

請把以下商品規格，轉化為買家能感受到的利益敘述：

商品名稱：{{商品名稱}}
規格列表：
- {{規格1，例如：容量 500ml}}
- {{規格2，例如：材質 304不鏽鋼}}
- {{規格3，例如：重量 180g}}

轉化方式：
功能（Feature）→ 優點（Advantage）→ 利益（Benefit）

每條規格輸出一行 FAB 句，字數控制在 20 字以內。`,
    },
    {
      id: "pmt-006",
      category: "prompt",
      badge: "NEW",
      title: "Midjourney 商業攝影 Prompt",
      subtitle: "MJ Commercial Photo Prompt",
      desc: "輸出可直接貼入 Midjourney 的商業攝影 Prompt，附燈光、場景、後製風格參數。",
      tags: ["創意發想","品牌定調"],
      platforms: ["全平台"],
      ratio: "—",
      level: "進階",
      uses: 1670,
      preview_gradient: "linear-gradient(135deg,#0f172a 0%,#312e81 100%)",
      preview_icon: "✧",
      preview_color: "#a5b4fc",
      prompt_template: `你是一位專業商業攝影師兼 Midjourney 提示詞工程師。
請根據以下商品資訊，生成 3 組可直接使用的 Midjourney 商業攝影 Prompt：

商品：{{商品名稱與簡短描述}}
風格偏好：{{極簡 / 奢華 / 自然 / 科技感 / 日系}}
使用場景：{{電商主圖 / IG 貼文 / 廣告 Banner}}
色調參考：{{暖色 / 冷色 / 中性 / 請指定 HEX}}

每組 Prompt 輸出：
[英文 Prompt，含 --ar 比例、--v 版本、--style 參數]
中文說明：（說明這組 Prompt 的視覺效果）`,
    },

    /* ── 短影音模板 ── */
    {
      id: "vid-001",
      category: "video",
      badge: "HOT",
      title: "產品開箱 · 15 秒爆款模板",
      subtitle: "Unboxing Reel — 15s Viral",
      desc: "鉤子開場→開箱過程→賣點特寫→CTA 的黃金結構，適合所有實體商品開箱。",
      tags: ["開箱短片","產品展示","限時優惠"],
      platforms: ["TikTok","Instagram","YouTube Shorts"],
      ratio: "9:16",
      level: "基礎",
      uses: 2760,
      preview_gradient: "linear-gradient(135deg,#0f172a 0%,#7c3aed 100%)",
      preview_icon: "▶",
      preview_color: "#a78bfa",
      script_structure: [
        { time: "0-3s",  role: "鉤子",  desc: "一個讓人停住拇指的畫面或問句" },
        { time: "4-8s",  role: "開箱",  desc: "開箱動作＋產品外觀特寫鏡頭" },
        { time: "9-12s", role: "賣點",  desc: "最強賣點大字幕＋產品功能展示" },
        { time: "13-15s",role: "CTA",   desc: "限時優惠文字＋引導留言或點擊" },
      ],
    },
    {
      id: "vid-002",
      category: "video",
      badge: "NEW",
      title: "痛點引入 · Before/After 對比",
      subtitle: "Pain Point — Before/After",
      desc: "用前後對比強化商品效果，先展示痛苦現狀，再展示解決後的美好結果。",
      tags: ["痛點引入","Before/After","教學型"],
      platforms: ["TikTok","Instagram","小紅書"],
      ratio: "9:16",
      level: "進階",
      uses: 1980,
      preview_gradient: "linear-gradient(135deg,#450a0a 0%,#16a34a 100%)",
      preview_icon: "⇄",
      preview_color: "#4ade80",
      script_structure: [
        { time: "0-4s",  role: "Before", desc: "展示使用前的問題或痛苦狀況" },
        { time: "5-8s",  role: "轉折",   desc: "產品出場，簡短說明使用方式" },
        { time: "9-13s", role: "After",  desc: "展示使用後的驚喜效果特寫" },
        { time: "14-16s",role: "CTA",    desc: "強化效果差異＋引導行動" },
      ],
    },
    {
      id: "vid-003",
      category: "video",
      badge: "",
      title: "UGC 真實感 · 素人開箱版",
      subtitle: "UGC Style — Authentic Review",
      desc: "模擬真實消費者分享，降低廣告感，提升信任度，適合再行銷與測款廣告。",
      tags: ["UGC風格","開箱短片","Reels封面"],
      platforms: ["Facebook","Instagram","TikTok"],
      ratio: "9:16",
      level: "基礎",
      uses: 1430,
      preview_gradient: "linear-gradient(135deg,#1c1917 0%,#44403c 100%)",
      preview_icon: "◎",
      preview_color: "#d6d3d1",
      script_structure: [
        { time: "0-3s",  role: "開場白", desc: "像在說話的自然語氣，不要腔調" },
        { time: "4-10s", role: "使用體驗",desc: "邊用邊說，不要讀稿感" },
        { time: "11-14s",role: "推薦理由",desc: "說出真實感受，1-2個具體點" },
        { time: "15-17s",role: "隨手 CTA",desc: "自然地說出行動呼籲" },
      ],
    },
    {
      id: "vid-004",
      category: "video",
      badge: "PRO",
      title: "品牌宣傳片 · 30 秒完整版",
      subtitle: "Brand Film — 30s Full Cut",
      desc: "品牌故事切入，展現品牌精神與產品質感，適合廣告投放與官網首頁使用。",
      tags: ["產品展示","Reels封面"],
      platforms: ["YouTube Shorts","Instagram","Facebook"],
      ratio: "16:9 / 9:16",
      level: "品牌級",
      uses: 540,
      preview_gradient: "linear-gradient(135deg,#0c0a09 0%,#1c1917 100%)",
      preview_icon: "◈",
      preview_color: "#fbbf24",
      script_structure: [
        { time: "0-5s",   role: "品牌開場", desc: "Logo 動態＋品牌氛圍鏡頭" },
        { time: "6-15s",  role: "問題共鳴", desc: "目標受眾日常痛點的情境鏡頭" },
        { time: "16-25s", role: "產品解法", desc: "產品細節＋使用體驗＋效果展示" },
        { time: "26-30s", role: "品牌結語", desc: "品牌標語＋官網或購買連結" },
      ],
    },
    {
      id: "vid-005",
      category: "video",
      badge: "HOT",
      title: "教學型內容 · Step-by-Step",
      subtitle: "Tutorial — Step by Step",
      desc: "清楚的步驟拆解帶出產品使用方式，教育受眾的同時自然帶出購買動機。",
      tags: ["教學型","產品展示","UGC風格"],
      platforms: ["YouTube Shorts","TikTok","Instagram"],
      ratio: "9:16",
      level: "進階",
      uses: 1650,
      preview_gradient: "linear-gradient(135deg,#082f49 0%,#0369a1 100%)",
      preview_icon: "⋯",
      preview_color: "#7dd3fc",
      script_structure: [
        { time: "0-3s",   role: "問題鉤子", desc: "「你是不是也遇過這個問題？」" },
        { time: "4-7s",   role: "步驟 1",   desc: "第一步動作＋字幕說明" },
        { time: "8-11s",  role: "步驟 2",   desc: "第二步動作＋字幕說明" },
        { time: "12-15s", role: "步驟 3",   desc: "第三步動作＋結果呈現" },
        { time: "16-18s", role: "成果＋CTA",desc: "最終效果展示＋行動呼籲" },
      ],
    },
    {
      id: "vid-006",
      category: "video",
      badge: "NEW",
      title: "限時優惠倒數 · 促銷衝單版",
      subtitle: "Flash Sale Countdown",
      desc: "製造稀缺感與緊迫感，倒數計時＋庫存提醒＋折扣視覺化，提升即時轉換率。",
      tags: ["限時優惠","Reels封面","痛點引入"],
      platforms: ["蝦皮","Facebook","Instagram","TikTok"],
      ratio: "9:16",
      level: "基礎",
      uses: 2100,
      preview_gradient: "linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)",
      preview_icon: "⏱",
      preview_color: "#fca5a5",
      script_structure: [
        { time: "0-2s",  role: "緊急開場", desc: "大字幕「限時優惠倒數 X 小時」" },
        { time: "3-7s",  role: "優惠說明", desc: "原價→折扣價的視覺對比" },
        { time: "8-12s", role: "產品亮點", desc: "快速閃過 3 個核心賣點" },
        { time: "13-15s",role: "衝單 CTA", desc: "點擊連結＋庫存剩餘提示" },
      ],
    },
  ],
};

/* ──────────────────────────────────────────────
   統計資料（用於 Hero 區塊展示）
────────────────────────────────────────────── */
const STATS = [
  { value: "28",    label: "爆款模板",    icon: "◈" },
  { value: "3",     label: "資料庫類型",  icon: "⊞" },
  { value: "每週",  label: "持續更新",    icon: "↻" },
  { value: "免費",  label: "複製使用",    icon: "✦" },
];

/* ──────────────────────────────────────────────
   Hero 標語候選（JS 隨機輪換）
────────────────────────────────────────────── */
const HERO_HIGHLIGHTS = [
  "Prompt 庫",
  "AI 圖片",
  "短影音",
  "爆款庫",
  "Threads 爆款",
];

/* ──────────────────────────────────────────────
   Google Sheet 靈感整理：Threads / 小紅書 / AI 圖片 prompt
   注意：已改寫成 ADFORGE 可公開使用的模板，未直接照搬來源原文。
────────────────────────────────────────────── */
TEMPLATE_DB.templates.push(
  {
    id: "prompt-threads-001",
    category: "prompt",
    badge: "NEW",
    title: "醜萌塗鴉迷因風",
    subtitle: "Messy Doodle Meme",
    desc: "把照片改成蠟筆手繪、比例笨拙、帶童趣的迷因感圖，適合親子梗、Threads 日常梗圖。",
    tags: ["AI繪圖","Threads靈感","社群貼文","台灣爆款"],
    platforms: ["Threads","Instagram","小紅書"],
    ratio: "1:1 / 4:5",
    level: "基礎",
    uses: 326,
    preview_gradient: "linear-gradient(135deg,#eef5ff 0%,#d9e9ff 100%)",
    preview_icon: "✎",
    preview_color: "#2f66f4",
    prompt_template: `請把上傳照片改造成一張「醜萌塗鴉迷因風」圖片。

保留主體身份與主要輪廓，但讓畫面像用便宜彩色筆、蠟筆快速畫出的草圖。
風格要凌亂、粗糙、童趣、比例略微尷尬，線條可以不完美，表情可稍微誇張。

畫面要求：
- 加入簡單卡通背景，例如街道、房間、樹木、招牌或日常小物。
- 上色不均勻，保留明顯筆觸。
- 加入少量隨手線條、手繪小符號、笨拙但可愛的細節。

避免：
- 不要太寫實。
- 不要精緻插畫感。
- 不要變成高級商業海報。

輸出比例：1:1 或 4:5。
適合用途：Threads 梗圖、親子社群、日常互動貼文。`,
  },
  {
    id: "prompt-threads-002",
    category: "prompt",
    badge: "HOT",
    title: "賽車直播女友鏡頭",
    subtitle: "Racing Broadcast Paddock",
    desc: "方程式賽車直播截圖感，適合人物寫真、社群爆款劇情圖；車隊、名字、排名都可替換。",
    tags: ["AI繪圖","人物寫真","Threads靈感","台灣爆款"],
    platforms: ["Threads","Instagram","小紅書"],
    ratio: "16:9",
    level: "進階",
    uses: 412,
    preview_gradient: "linear-gradient(135deg,#edf4ff 0%,#cfe0ff 100%)",
    preview_icon: "▣",
    preview_color: "#5b8af0",
    prompt_template: `使用上傳照片作為人物參考，生成一張「方程式賽車直播畫面截圖」。

場景：
人物坐在賽車隊車庫或 VIP 圍場中，戴著車隊無線電耳機，正在看最後一圈直播監視器。
表情要緊張、自豪、專注，像官方轉播鏡頭意外捕捉到的名場面。

人物：
- 保留上傳照片的臉部特徵、髮型、膚色與氣質。
- 穿著乾淨俐落的背心或外套，可搭配車隊風格夾克、金屬飾品、窄版通行證。
- 不要自拍角度，不要假大型證件。

畫面元素：
- 加入直播介面：FINAL LAP、LIVE、車手排名塔、底部姓名條。
- 車庫技師、螢幕、設備做背景虛化。
- 長焦直播鏡頭、數位噪點、壓縮痕跡、明亮棚燈、自然膚質。

可替換欄位：
車隊名稱：{{車隊}}
人物姓名：{{名字}}
排名資訊：{{排名}}

輸出比例：16:9。
適合用途：Threads 爆款圖、人物寫真、社群故事圖。`,
  },
  {
    id: "prompt-threads-003",
    category: "prompt",
    badge: "HOT",
    title: "K-pop 結尾妖精鏡頭",
    subtitle: "K-pop Ending Fairy",
    desc: "把人物照片變成韓國音樂節目結尾鏡頭，適合個人形象、偶像感短影音封面。",
    tags: ["AI繪圖","人物寫真","Threads靈感","社群貼文"],
    platforms: ["Threads","Instagram","小紅書","TikTok"],
    ratio: "9:16 / 4:5",
    level: "進階",
    uses: 538,
    preview_gradient: "linear-gradient(135deg,#f4f7ff 0%,#dce8ff 100%)",
    preview_icon: "✦",
    preview_color: "#6d7df6",
    prompt_template: `使用上傳照片作為人物參考，生成寫實的 K-pop 音樂節目「結尾妖精」畫面。

畫面設定：
人物在表演剛結束後，以近距離直播鏡頭直視攝影機。
表情自然、溫柔、自信，帶有表演後微微喘息的真實感。

動作：
- 只使用 1 到 2 個自然小手勢，例如手指愛心、輕揮手、V 字手、整理頭髮或輕碰臉頰。
- 不要同時塞滿所有手勢。
- 頭髮可被舞台微風吹動。

舞台：
- 背景是紫色、粉色、藍色 LED 燈光散景。
- 高品質音樂節目轉播感、臉部焦點銳利、舞台妝容有光澤。

限制：
- 保留人物臉型、五官、髮型、妝容與身份。
- 不添加額外人物。
- 不扭曲手指、眼睛、嘴巴。

適合用途：TikTok 封面、小紅書人物圖、Threads 互動圖。`,
  },
  {
    id: "prompt-threads-004",
    category: "prompt",
    badge: "NEW",
    title: "手寫註解日記塗鴉",
    subtitle: "Handwritten Story Notes",
    desc: "在照片上加手繪線條、箭頭與生活感短句，做成 IG 限動或小紅書日記感素材。",
    tags: ["AI繪圖","社群貼文","Threads靈感","小紅書"],
    platforms: ["Instagram","小紅書","Threads"],
    ratio: "4:5 / 9:16",
    level: "基礎",
    uses: 641,
    preview_gradient: "linear-gradient(135deg,#f7fbff 0%,#e2eeff 100%)",
    preview_icon: "✍",
    preview_color: "#2f66f4",
    prompt_template: `請分析上傳照片中的物件與場景，加入自然的手寫註解與手繪裝飾。

風格：
- 像 IG 限時動態的白色手寫筆。
- 線條要自然、略有粗細變化，不要像向量圖太整齊。
- 保留照片本身的真實感，只做輕量裝飾。

註解規則：
- 飲料：描述味道、溫度、喝下去的感覺。
- 食物：描述口感、美味程度與當下心情。
- 空間：描述光線、氛圍、放鬆感。
- 整體：最後加一句日記感短句。

可加入：
箭頭、虛線、愛心、閃光、蒸氣、小表情，但不要太多。

文字語氣：
短句、自然、像自言自語。
例如：今天剛剛好、這口很舒服、好想停在這一刻。

適合用途：IG 限動、小紅書生活筆記、Threads 日常圖。`,
  },
  {
    id: "prompt-threads-005",
    category: "prompt",
    badge: "PRO",
    title: "電影級人像拼貼",
    subtitle: "Cinematic Collage Portrait",
    desc: "把人物照做成雜誌級拼貼藝術：紙張、雙重曝光、手寫痕跡、低飽和電影色。",
    tags: ["AI繪圖","人物寫真","品牌定調","Threads靈感"],
    platforms: ["Instagram","小紅書","Threads"],
    ratio: "4:5",
    level: "品牌級",
    uses: 489,
    preview_gradient: "linear-gradient(135deg,#eef4ff 0%,#d6e5ff 100%)",
    preview_icon: "◫",
    preview_color: "#5b8af0",
    prompt_template: `使用上傳照片作為主體人物，生成一張電影級人像拼貼藝術作品。

主體：
- 保留人物原本臉部特徵、五官、姿勢與氣質。
- 不改變身份，不變成其他人。
- 保留真實皮膚紋理與寫實攝影感。

視覺風格：
藝術攝影、拼貼混合媒材、復古紙張、時尚雜誌、雙重曝光。

構圖：
- 人物與背景自然融合。
- 加入不規則拼貼、破碎幾何、半透明圖層、撕裂紙邊。
- 畫面要有秩序中的藝術混亂感。

材質：
舊紙張、手寫字跡、筆記殘影、水彩暈染、顏料刷痕、灰塵、刮痕、底片顆粒。

光線與色調：
自然側光或逆光、金色時刻、柔和高光、低飽和復古色、米色、灰藍、淡橘、暖棕。

避免：
卡通、動漫、3D 渲染、塑膠皮膚、過度磨皮、假 HDR、過度乾淨。`,
  },
  {
    id: "prompt-threads-006",
    category: "prompt",
    badge: "NEW",
    title: "照片互動手繪小畫",
    subtitle: "Interactive Doodle Overlay",
    desc: "讓手繪圖案跟照片主體互動，例如跟著姿勢、延伸動作、放大情緒。",
    tags: ["AI繪圖","社群貼文","創意發想","Threads靈感"],
    platforms: ["Threads","Instagram","小紅書"],
    ratio: "1:1 / 4:5",
    level: "基礎",
    uses: 377,
    preview_gradient: "linear-gradient(135deg,#f4f8ff 0%,#dceaff 100%)",
    preview_icon: "✐",
    preview_color: "#4a77e8",
    prompt_template: `分析上傳圖片，保留原始主體、構圖與光線，不改變主體身份或結構。

請加入有趣的手繪小圖案，並讓這些圖案直接與主體互動。

互動方式可以包含：
- 沿著人物或商品姿勢加動作線。
- 模仿主體的表情或動作。
- 誇張延伸手勢、肢體、物品輪廓。
- 加入想像中的小角色、小符號、小箭頭或情緒氣泡。

視覺要求：
- 手繪元素要像直接畫在照片上。
- 不要使用固定口號。
- 依照片內容自動生成背景意識與小笑點。
- 保留照片質感，不要讓塗鴉喧賓奪主。

適合用途：Threads 互動圖、IG 限動、小紅書生活趣味圖。`,
  },
  {
    id: "prompt-threads-007",
    category: "prompt",
    badge: "HOT",
    title: "美式獨立電影角色海報",
    subtitle: "Indie Film Character Poster",
    desc: "做出像獨立電影角色海報的社群圖，有復古底片、街頭時尚與人物故事。",
    tags: ["AI繪圖","人物寫真","品牌定調","台灣爆款"],
    platforms: ["Instagram","Threads","小紅書"],
    ratio: "4:5",
    level: "進階",
    uses: 563,
    preview_gradient: "linear-gradient(135deg,#eef5ff 0%,#d7e5ff 100%)",
    preview_icon: "▤",
    preview_color: "#2f66f4",
    prompt_template: `使用上傳照片建立一張「美式獨立電影角色海報」。

主角設定：
請依照片人物氣質設定角色身份。人物要自然、自信、不過度擺拍。

場景：
都市街景、復古咖啡館、黃昏路口、霓虹反光或清晨街道。

視覺：
- 現代生活風格肖像。
- 美式獨立電影感。
- 大膽雜誌式構圖。
- 復古 Kodak 底片顆粒。
- 深橘、褪色藍、奶油白配色。
- 撕裂紙張拼貼與手寫麥克筆點綴。

文字排版：
名字：{{人物名稱}}
海報標題：{{一句角色標語}}
簡介：{{兩行角色故事}}
標籤：#視覺敘事 #城市氛圍 #獨立電影 #慢節奏瞬間

輸出比例：4:5。
適合用途：人物品牌、Threads 爆款圖、社群封面。`,
  },
  {
    id: "prompt-threads-008",
    category: "prompt",
    badge: "PRO",
    title: "黑色和服 Quiet Luxury 寫真",
    subtitle: "Quiet Luxury Night Portrait",
    desc: "低調奢華、黑色和服、夜間豪華車與時尚雜誌感，適合高級人像劇情圖。",
    tags: ["AI繪圖","人物寫真","品牌定調","Threads靈感"],
    platforms: ["Instagram","Threads","小紅書"],
    ratio: "4:5 / 9:16",
    level: "品牌級",
    uses: 291,
    preview_gradient: "linear-gradient(135deg,#eaf2ff 0%,#d0e0ff 100%)",
    preview_icon: "◆",
    preview_color: "#5b8af0",
    prompt_template: `依照上傳照片保留人物五官、輪廓、臉型與氣質，生成一張低調奢華夜間寫真。

角色：
人物穿著精緻黑色花紋和服，盤髮，瀏海自然垂下，表情冷靜、優雅、克制。

場景：
夜晚高級商務車旁或車內下車瞬間，背景是都市上流夜生活氛圍。

視覺風格：
- Quiet Luxury 低調奢華。
- 高級時尚雜誌大片。
- 電影級寫實攝影。
- 柔和夜間光線、底片顆粒、真實皮膚細節。
- 黑色、深灰、暖金作為主色。

可加入：
黑色西裝助理、雨傘、車門、街燈反光，但人物必須是主角。

避免：
過度修圖、過度暴露、廉價黑幫符號、誇張武器或血腥元素。`,
  },
  {
    id: "prompt-threads-009",
    category: "prompt",
    badge: "NEW",
    title: "情感合成迷你小我",
    subtitle: "Mini Self Emotional Composite",
    desc: "把人物照片變成中心主角，周圍圍繞多個迷你版自己，適合情緒故事與品牌人設。",
    tags: ["AI繪圖","人物寫真","社群貼文","Threads靈感"],
    platforms: ["Instagram","Threads","小紅書"],
    ratio: "4:5",
    level: "進階",
    uses: 335,
    preview_gradient: "linear-gradient(135deg,#f2f7ff 0%,#dae8ff 100%)",
    preview_icon: "●",
    preview_color: "#4f7df0",
    prompt_template: `基於上傳照片，以人物為中心，創作一張「日常生活中的小自我」情感合成圖。

主人物：
- 使用原圖人物作為中心主角。
- 保留臉部、姿勢、服裝與身份。
- 加入自然陰影與細白邊貼紙感輪廓。

迷你角色：
- 根據本人建立 3 到 7 個迷你版人物。
- 風格可愛、立體、社群感，但不要幼稚。
- 迷你人物要還原髮型、服裝特徵與表情。

動作：
每個迷你角色都必須有動作，例如揮手、坐在包包上、爬到肩膀、模仿本人、抱著小物、互相對話。

構圖：
前後錯落，有空間感，像一張有故事的 Instagram 視覺圖。

適合用途：個人品牌、情緒內容、Threads 人設圖。`,
  },
  {
    id: "prompt-threads-010",
    category: "prompt",
    badge: "HOT",
    title: "3D Pop-out 社群人像海報",
    subtitle: "3D Pop-out Social Poster",
    desc: "人物從手機社群頁面衝出來的 3D 立體海報，適合社群封面與爆款貼文。",
    tags: ["AI繪圖","人物寫真","社群貼文","台灣爆款"],
    platforms: ["Instagram","Threads","小紅書","TikTok"],
    ratio: "4:5 / 9:16",
    level: "進階",
    uses: 604,
    preview_gradient: "linear-gradient(135deg,#edf4ff 0%,#d4e3ff 100%)",
    preview_icon: "▧",
    preview_color: "#2f66f4",
    prompt_template: `使用上傳照片作為人物主體，生成一張 3D Pop-out 社群人像海報。

核心畫面：
人物坐在巨大的智慧型手機畫面裡，像社群平台個人頁面。
人物一隻手或腳突破螢幕邊框，朝鏡頭延伸，形成強烈近大遠小的立體衝擊。

人物：
- 嚴格保留原始人物五官、比例、造型與氣質。
- 穿搭可改成潮流風、甜酷風、Y2K、韓系時尚。

手機介面：
- 做成原創社群 UI，不要完整複製真實平台。
- 可加入帳號名稱、頭像、追蹤數、按鈕、貼文元素。

背景：
可設定為 K-pop 少女房間、潮流工作室、品牌拍攝間、社群創作者房間。
加入氣球、拍立得、閃光粒子、水鑽、玻璃碎裂特效，但不要過度混亂。

可替換欄位：
帳號名稱：{{帳號}}
主色系：{{色系}}
角色風格：{{甜酷 / 韓系 / 潮流 / 品牌感}}

適合用途：社群封面、TikTok 封面、Threads 爆款圖、小紅書筆記首圖。`,
  }
);
