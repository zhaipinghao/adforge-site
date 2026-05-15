# ADFORGE Prompt System

本文件是 ADFORGE 電商圖生成器的 prompt 版本管理與品質規格。目的不是替代 `app.py`，而是讓每一次 prompt 調整、風格選擇、模板產出與效果回報都有固定格式，方便多人協作、回溯與擴充。

## 0. 協作範圍

- 本文件只定義 prompt 系統規格、版本命名、分類、效果紀錄與 QA 標準。
- 本次文件維護不得修改 `app.py`、`templates/index.html`、`static/styles.css`。
- 若未來要把規格落進程式，請另開任務並以小範圍 PR 實作，避免覆蓋主線改動。
- Prompt 的真實成效以「生成結果 + 人工 QA + 上架或投放數據」共同判定，不只看單張圖好不好看。

## 1. 系統目標

ADFORGE 的 prompt 系統要穩定完成 4 件事：

1. 用同一張商品原圖，固定產出 10 張 1024 x 1024 電商模板圖。
2. 每次生成都可指定 7 種風格之一：韓國感、MUJI感、Apple感、戶外露營感、精品感、Threads感、小紅書感。
3. 每個 prompt、風格、模板都有版本號，可回溯哪一版造成效果變好或變差。
4. 每次生成後必須留下效果紀錄，讓 prompt 從「憑感覺調整」變成「有紀錄地迭代」。

## 2. 核心資料單位

| 單位 | 用途 | 範例 |
| --- | --- | --- |
| Prompt Pack | 一組完整可出 10 張圖的 prompt 套件 | `ADG-PROMPT-PACK.v1.0.0` |
| Style Adapter | 7 種風格之一的視覺語言模組 | `S-KOR.v1.0.0` |
| Template Prompt | 10 張模板之一的任務 prompt | `T01-main-image.v1.0.0` |
| Run | 一次實際生成任務 | `RUN-20260511-0930-blue-shirt-S-KOR-p1.0.0` |
| Effect Record | 生成後的 QA 與成效紀錄 | `effect_log` 中的一列 |

## 3. 版本命名規格

### 3.1 Prompt Pack

格式：

```text
ADG-PROMPT-PACK.v{MAJOR}.{MINOR}.{PATCH}
```

規則：

- `MAJOR`：模板目的、整體 prompt 架構、輸出張數或核心策略改變。
- `MINOR`：某個風格、模板場景、鏡頭語言、構圖策略有明顯調整。
- `PATCH`：修字、補負面約束、加強安全區、修正容易誤解的描述。

範例：

```text
ADG-PROMPT-PACK.v1.0.0  初版穩定規格
ADG-PROMPT-PACK.v1.1.0  優化精品感與成交圖構圖
ADG-PROMPT-PACK.v1.1.1  補強禁止假文字與假 logo 的約束
ADG-PROMPT-PACK.v2.0.0  模板目的重排或從 10 張改為新結構
```

### 3.2 Style Adapter

格式：

```text
S-{STYLE_CODE}.v{MAJOR}.{MINOR}.{PATCH}
```

固定風格代碼：

| 代碼 | 風格 |
| --- | --- |
| `S-KOR` | 韓國感 |
| `S-MUJI` | MUJI感 |
| `S-APPLE` | Apple感 |
| `S-OUTDOOR` | 戶外露營感 |
| `S-LUX` | 精品感 |
| `S-THREADS` | Threads感 |
| `S-XHS` | 小紅書感 |

### 3.3 Template Prompt

格式：

```text
T{序號}-{template_slug}.v{MAJOR}.{MINOR}.{PATCH}
```

範例：

```text
T01-main-image.v1.0.0
T02-size-shape.v1.0.0
T03-material-details.v1.0.0
```

### 3.4 Run ID

格式：

```text
RUN-{YYYYMMDD-HHMM}-{product_slug}-{style_code}-p{pack_version}
```

範例：

```text
RUN-20260511-0930-blue-shirt-S-KOR-p1.0.0
RUN-20260511-1015-camping-cup-S-OUTDOOR-p1.1.0
```

Run ID 必須寫入當次效果紀錄，並對應實際輸出資料夾或交付檔案。

## 4. Prompt 分類規格

每個 prompt 需同時標記下列分類，方便之後搜尋與比較。

| 分類 | 必填值 |
| --- | --- |
| `product_category` | `home_lifestyle`、`beauty`、`fashion`、`food_drink`、`electronics`、`outdoor`、`gift`、`other` |
| `style_code` | `S-KOR`、`S-MUJI`、`S-APPLE`、`S-OUTDOOR`、`S-LUX`、`S-THREADS`、`S-XHS` |
| `template_id` | `T01` 到 `T10` |
| `funnel_stage` | `click`、`understand`、`trust`、`desire`、`convert`、`share` |
| `prompt_layer` | `identity_lock`、`style_adapter`、`template_scene`、`negative_constraints`、`copy_safe_zone` |
| `output_status` | `draft`、`testing`、`approved`、`deprecated` |

## 5. Prompt 組裝結構

正式 prompt 應用以下順序組裝，避免不同人寫法漂移。

```text
[PRODUCT_IDENTITY_LOCK]
Product: {product_name}
Category: {product_category}
Target buyer: {target_buyer}
Core selling points: {selling_points}
Use the uploaded photo as the strict product identity reference.
Preserve the real product silhouette, color, material, proportions, logo if present, and distinctive details.

[STYLE_ADAPTER {style_code}.{style_version}]
{style_prompt}

[TEMPLATE_SCENE {template_id}.{template_version}]
{template_goal}
{composition_rule}
{safe_space_rule}

[TEXT_AND_BRAND_SAFETY]
The generated image must be text-free.
Do not add typography, labels, watermarks, QR codes, fake brand marks, fake certifications, fake UI, unreadable pseudo-text, or invented claims.
Leave clean safe space for Traditional Chinese overlay copy.

[OUTPUT_STANDARD]
Square 1024x1024 commercial ecommerce image.
Product must be clear, inspectable, and suitable for Shopee, landing page, ad creative, and social post repurposing.
```

必填輸入欄位：

| 欄位 | 說明 |
| --- | --- |
| `product_name` | 商品名稱，需符合客戶實際稱呼 |
| `product_category` | 商品類別 |
| `target_buyer` | 目標客群或使用場景 |
| `selling_points` | 3 到 5 個可被視覺化的賣點 |
| `forbidden_claims` | 不能出現的醫療、功效、品牌、價格、認證或誇大宣稱 |
| `platform` | 預計使用平台，例如 Shopee、Meta Ads、IG、Threads、小紅書 |
| `style_code` | 7 種固定風格之一 |
| `template_id` | 10 張固定模板之一 |

## 6. 七種固定風格

### S-KOR 韓國感

- 視覺語言：柔和日光、奶油色背景、清爽生活感、空氣感構圖。
- 適合商品：生活用品、美妝、服飾小物、可愛禮品、居家擺設。
- Prompt 核心：`soft daylight, clean cream background, gentle shadows, airy composition, elegant lifestyle props, Korean ecommerce visual style`
- QA 重點：畫面要乾淨、有溫度、不要變成過度甜膩或雜亂網拍風。

### S-MUJI MUJI感

- 視覺語言：自然材質、白色留白、木質、棉麻、紙感、低飽和。
- 適合商品：居家用品、收納、生活工具、香氛、簡約服飾。
- Prompt 核心：`natural materials, warm white space, wood, paper, cotton textures, quiet composition, honest product photography, no clutter`
- QA 重點：材質真實、光線安靜、不要加太多裝飾，也不要像廉價仿木背景。

### S-APPLE Apple感

- 視覺語言：高留白、精準構圖、白灰棚拍、科技精品感、乾淨反光。
- 適合商品：3C、配件、工具、單價較高的極簡商品。
- Prompt 核心：`pure white or soft gray studio, precise composition, premium product photography, high-end lighting, clean reflection, strong product clarity`
- QA 重點：邊緣銳利、產品可檢查、不要加多餘道具，不要讓商品看起來像 Apple 官方產品。

### S-OUTDOOR 戶外露營感

- 視覺語言：自然光、木桌、帆布、碎石、山景或營地氛圍、機能感。
- 適合商品：露營用品、保溫杯、戶外配件、機能服飾、寵物外出用品。
- Prompt 核心：`natural light, canvas, wood, gravel, campsite atmosphere, functional details, rugged but clean ecommerce composition`
- QA 重點：戶外感要服務商品，不要把商品淹沒在風景裡；商品需清楚可辨識。

### S-LUX 精品感

- 視覺語言：深色或中性色、精緻打光、低調反光、高級道具、精品廣告構圖。
- 適合商品：香氛、飾品、皮件、禮盒、高單價商品、品牌主視覺。
- Prompt 核心：`premium lighting, deep neutral tones, refined props, elegant shadows, upscale editorial ecommerce composition, not flashy`
- QA 重點：高級但不要浮誇；不要產生假品牌標誌、金色假字或過度奢華背景。

### S-THREADS Threads感

- 視覺語言：黑白灰、社群貼文截圖感、短句留白、觀點感、轉發友善。
- 適合商品：話題型商品、知識型賣點、社群測試圖、貼文封面。
- Prompt 核心：`clean black-white-gray layout, editorial spacing, conversational product storytelling, screenshot-ready square composition, clear short-form social feeling`
- QA 重點：圖片本體仍需無文字；文字感由後製覆蓋完成，AI 不得直接生成假文字。

### S-XHS 小紅書感

- 視覺語言：明亮生活場景、筆記感、收藏感、實用賣點、溫暖日常道具。
- 適合商品：美妝、生活用品、女性向商品、開箱推薦、禮物清單。
- Prompt 核心：`bright lifestyle scene, shopping-note feeling, warm daily-life props, practical benefit emphasis, visually saveable`
- QA 重點：生活化但不凌亂；避免 AI 直接生成中文註解，註解需後製。

## 7. 十張固定模板

| ID | Slug | 模板名稱 | Funnel | 目的 | QA 放行標準 |
| --- | --- | --- | --- | --- | --- |
| `T01` | `hero-image` | 首圖 | `click` | 第一眼吸引點擊，商品大、清楚、可作商品頁首圖。 | 商品佔畫面 45% 到 70%；輪廓、顏色、比例正確；背景乾淨；上方或下方可放標題。 |
| `T02` | `usage-scene` | 使用情境 | `desire` | 讓買家快速理解商品會如何進入日常使用場景。 | 商品仍是主角；情境合理；不得用道具或背景誤導商品功能、尺寸或用途。 |
| `T03` | `material-details` | 材質細節 | `trust` | 放大材質、表面、邊角、工藝或觸感，建立信任。 | 特寫需清楚；材質不得被 AI 改成另一種；不可新增不存在的紋路、按鈕、接口或零件。 |
| `T04` | `selling-points` | 賣點圖 | `understand` | 留出區域給 3 到 4 個賣點後製文字，讓買家快速理解購買理由。 | 至少 35% 乾淨留白；AI 圖內不得出現假文字；商品位置不得壓到後製賣點區。 |
| `T05` | `size-guide` | 尺寸圖 | `understand` | 讓買家快速理解尺寸感、形狀與外觀比例。 | 商品全身完整；不得裁切關鍵部位；可用簡潔道具暗示比例，但不得誤導實際尺寸。 |
| `T06` | `comparison` | 對比圖 | `trust` | 展示升級前後、使用前後或特點差異，降低理解成本。 | 對比邏輯必須合理；不得捏造不存在的效果、檢測數據、認證或誇大保證。 |
| `T07` | `gift-feel` | 禮物感 | `desire` | 表現禮物感、開箱感與送禮場合。 | 可有禮盒、緞帶、暖光，但不可加假品牌包裝；商品本體不可被包裝遮住。 |
| `T08` | `brand-feel` | 品牌感 | `trust` | 讓商品從隨手拍升級成一致、可信任的品牌視覺。 | 畫面需低噪、統一且高級；不得自行添加不存在的品牌標誌或官方視覺。 |
| `T09` | `ad-creative` | 廣告感 | `convert` | 作為 FB、IG、Threads、短影音封面的測試素材。 | 商品近景有吸引力；可放 CTA 後製區；不得出現假價格、假折扣、假平台 UI。 |
| `T10` | `threads-style` | Threads風格圖 | `share` | 把商品做成可分享、可截圖、可當社群貼文封面的素材。 | 視覺上可轉發；AI 圖內不得生成假文字；黑白灰社群感需服務商品，而不是壓過商品。 |

## 8. 效果紀錄欄位

每次 Run 完成後，至少建立一列效果紀錄。建議先用 Google Sheet、Notion Database 或 CSV 管理，欄位如下。

| 欄位 | 必填 | 格式 / 範例 | 說明 |
| --- | --- | --- | --- |
| `record_date` | 是 | `2026-05-11` | 紀錄日期 |
| `operator` | 是 | `Yuchen` | 操作者 |
| `run_id` | 是 | `RUN-20260511-0930-blue-shirt-S-KOR-p1.0.0` | 對應輸出任務 |
| `product_name` | 是 | `藍色機能襯衫` | 商品名稱 |
| `product_category` | 是 | `fashion` | 商品類別 |
| `source_image_id` | 是 | `line-20260511-001` | 原圖來源或檔名 |
| `prompt_pack_version` | 是 | `ADG-PROMPT-PACK.v1.0.0` | Prompt Pack 版本 |
| `style_code` | 是 | `S-KOR` | 風格 |
| `style_version` | 是 | `S-KOR.v1.0.0` | 風格版本 |
| `template_id` | 是 | `T01` | 模板 |
| `template_version` | 是 | `T01-main-image.v1.0.0` | 模板版本 |
| `model` | 是 | `gpt-image-2` | 實際使用模型 |
| `mode` | 是 | `AI` 或 `Demo` | 生成模式 |
| `output_path` | 是 | `outputs/.../01-main-image.png` | 對應成品 |
| `identity_score` | 是 | `1-5` | 商品像不像原圖 |
| `style_score` | 是 | `1-5` | 是否符合指定風格 |
| `template_score` | 是 | `1-5` | 是否完成模板目的 |
| `layout_score` | 是 | `1-5` | 是否有留白、可後製、構圖穩定 |
| `commercial_score` | 是 | `1-5` | 是否有上架或投放價值 |
| `text_safety` | 是 | `pass/fail` | 是否無假字、假標、浮水印 |
| `claim_safety` | 是 | `pass/fail` | 是否無誇大或不可證實宣稱 |
| `qa_status` | 是 | `pass/fail/rework` | QA 結論 |
| `rework_reason` | 否 | `商品顏色偏差` | 需重做原因 |
| `next_prompt_action` | 否 | `加強 preserve color` | 下一版 prompt 調整 |
| `ad_metric` | 否 | `CTR 2.1%, CPA 180` | 若有投放數據，回填 |
| `sales_metric` | 否 | `詢問 8, 下單 2` | 若有銷售數據，回填 |
| `notes` | 否 | `T09 成交感佳，可升級` | 其他觀察 |

### 8.1 分數定義

| 分數 | 定義 |
| --- | --- |
| `5` | 可直接交付或投放，幾乎不用改 |
| `4` | 小修後可用，例如文案區稍微調整 |
| `3` | 有潛力但需重跑或重修 |
| `2` | 明顯偏離商品或模板目的 |
| `1` | 不可用，且不應納入版本比較 |

## 9. QA 放行標準

單張圖必須同時符合下列條件才可標記 `pass`：

- `identity_score >= 4`
- `style_score >= 4`
- `template_score >= 4`
- `layout_score >= 4`
- `commercial_score >= 4`
- `text_safety = pass`
- `claim_safety = pass`

整組 10 張圖必須符合下列條件才可交付：

- 10 張中至少 8 張單張 QA 為 `pass`。
- `T01` 首圖、`T03` 材質細節、`T04` 賣點圖、`T09` 廣告感必須通過。
- 任一張如果商品身份錯誤、顏色錯誤、材質錯誤、logo 錯誤，整組需重跑或人工修正。
- 不得出現假文字、假 logo、假 QR code、假價格、假折扣、假認證。
- 如果是客戶品牌商品，不得自行添加不存在的聯名、品牌包裝或官方視覺。

## 10. Prompt 迭代流程

1. 建立 Run：確認商品、平台、風格、10 張模板與 forbidden claims。
2. 選版本：記錄 `prompt_pack_version`、`style_version`、`template_version`。
3. 生成：產出 10 張圖與當次 `prompts-used.txt`。
4. 初篩：刪除商品身份明顯錯誤、假字、假標、嚴重變形的圖。
5. QA：依第 9 節逐張打分。
6. 紀錄：填寫第 8 節效果紀錄。
7. 決策：將 prompt 標記為 `approved`、`testing`、`rework` 或 `deprecated`。
8. 升版：只有在效果紀錄指出明確問題時才改 prompt；改完後依第 3 節升版。

## 11. 版本升級判斷

| 情境 | 動作 |
| --- | --- |
| 只是修錯字、補一句禁止假文字 | `PATCH +1` |
| 某模板構圖重寫，例如 T09 從棚拍改成情境近景 | `MINOR +1` |
| 某風格整體光線、道具、色調重寫 | `MINOR +1` |
| 固定模板數量、模板目的或整體流程改變 | `MAJOR +1` |
| 生成結果長期低於標準且無人再使用 | 標記 `deprecated` |

## 12. Prompt Registry 範本

```text
prompt_pack_version: ADG-PROMPT-PACK.v1.0.0
status: testing
owner: ADFORGE
created_at: 2026-05-11
updated_at: 2026-05-11

styles:
  - S-KOR.v1.0.0
  - S-MUJI.v1.0.0
  - S-APPLE.v1.0.0
  - S-OUTDOOR.v1.0.0
  - S-LUX.v1.0.0
  - S-THREADS.v1.0.0
  - S-XHS.v1.0.0

templates:
  - T01-main-image.v1.0.0
  - T02-size-shape.v1.0.0
  - T03-material-details.v1.0.0
  - T04-care-durability.v1.0.0
  - T05-desk-decor.v1.0.0
  - T06-gift.v1.0.0
  - T07-multi-scene.v1.0.0
  - T08-selling-points.v1.0.0
  - T09-closing.v1.0.0
  - T10-full-set.v1.0.0
```

## 13. Prompt 變更紀錄範本

每次改 prompt 必須新增一筆，而不是只覆蓋文字。

```text
date: 2026-05-11
changed_by: ADFORGE
version_from: ADG-PROMPT-PACK.v1.0.0
version_to: ADG-PROMPT-PACK.v1.0.1
scope: T08-selling-points, negative_constraints
reason: 多次生成出現不可讀假文字
change_summary: 加強 text-free、no pseudo-text、leave blank area for overlay copy
expected_effect: 降低假字；保留左側賣點區
verification_plan: 用 3 個不同商品各跑 T08，text_safety 需全部 pass
```

## 14. 最低可執行 SOP

每次正式產圖時，照這份最小流程執行：

1. 先選 `style_code`，不要同一組 10 張混用多個風格。
2. 用同一個 `prompt_pack_version` 產完整 10 張。
3. 輸出後保存 `prompts-used.txt`。
4. 建立效果紀錄，至少填完必填欄位與 5 個分數。
5. `T01`、`T03`、`T08`、`T09` 不通過時，不交付整組圖。
6. 若重跑，建立新的 Run ID，不覆蓋舊輸出。
7. 若 prompt 有調整，升版並寫變更紀錄。
