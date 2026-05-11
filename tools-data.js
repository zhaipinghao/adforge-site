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
    prompt: ["商品文案","SEO標題","社群貼文","創意發想","賣點拆解","短影音腳本","品牌定調","競品分析"],
    video:  ["開箱短片","痛點引入","Before/After","產品展示","教學型","限時優惠","UGC風格","Reels封面"],
  },

  /* ─────────────────────────────────────────────
     平台標籤
  ───────────────────────────────────────────── */
  platforms: ["全平台","蝦皮","小紅書","TikTok","Instagram","Facebook","YouTube Shorts","MOMO","LINE"],

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
  { value: "60+",   label: "爆款模板",    icon: "◈" },
  { value: "3",     label: "資料庫類型",  icon: "⊞" },
  { value: "每週",  label: "持續更新",    icon: "↻" },
  { value: "免費",  label: "複製使用",    icon: "✦" },
];

/* ──────────────────────────────────────────────
   Hero 標語候選（JS 隨機輪換）
────────────────────────────────────────────── */
const HERO_HIGHLIGHTS = [
  "Prompt 模板",
  "AI 圖片模板",
  "短影音腳本",
  "爆款素材庫",
];
