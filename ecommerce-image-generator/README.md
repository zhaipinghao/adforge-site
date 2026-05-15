# ADFORGE 批量電商圖生成器

丟一張商品照，產出 10 張 1024x1024 電商圖，並自動打包成 ZIP。

這是 ADFORGE 內部工具，不建議直接開給客戶使用。標準流程應該是 LINE 收圖後，由內部人員整理需求、產圖、人工審核，再回傳給客戶。

## 啟動

```bash
cd /Users/linyuchen/Documents/Playground/ecommerce-image-generator
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

把 `.env` 裡的 `OPENAI_API_KEY` 換成你的 key 後啟動：

```bash
python app.py
```

開啟：

```text
http://127.0.0.1:7860
```

同一個 Wi-Fi 的手機或其他電腦要開，請用這台 Mac 的區網 IP，例如：

```text
http://192.168.x.x:7860
```

如果要讓區網裝置連進來，`.env` 需要設定：

```text
HOST=0.0.0.0
```

## 生成模式

- `自動`：有設定 `OPENAI_API_KEY` 就用 AI 生成，沒有 key 就用 Demo 預覽。
- `AI 生成`：一定會呼叫 OpenAI 圖片 API。
- `Demo 預覽`：不花 API 額度，只用原圖做版型預覽。

## 固定輸出模板

目前固定輸出 10 張：

1. 首圖
2. 使用情境
3. 材質細節
4. 賣點圖
5. 尺寸圖
6. 對比圖
7. 禮物感
8. 品牌感
9. 廣告感
10. Threads風格圖

## 風格模板

目前可選 7 種風格：

- 韓國感
- MUJI感
- Apple感
- 戶外露營感
- 精品感
- Threads感
- 小紅書感

Demo 模式只用來檢查排版和下載流程，不會重新生成商品情境照。要接近官網案例，請設定 `OPENAI_API_KEY` 並使用 AI 生成。

成品會存在：

```text
/Users/linyuchen/Documents/Playground/ecommerce-image-generator/outputs
```

每次生成也會同時輸出：

- `prompts-used.txt`：本次使用的 Prompt 與模板說明。
- `prompt-manifest.json`：訂單、客戶、模板、Prompt 版本與輸出檔案。
- `order-brief.json`：接單資料與商品 Brief。
- `prompt-effects.csv`：給內部 QA / 效果紀錄使用的表格。

Prompt 系統規格請看：

```text
/Users/linyuchen/Documents/Playground/ecommerce-image-generator/PROMPT_SYSTEM.md
```

## 目前推薦 SOP

1. LINE 收到客戶商品照。
2. 人工整理商品名稱、用途、主要賣點、平台、禁用事項。
3. 放進 7860 產 Demo 或 AI 圖。
4. 人工檢查商品是否變形、文字是否正確、是否適合上架。
5. 通過後下載 ZIP，整理成 JPG / PNG 回傳客戶。

完整流程請看：

```text
/Users/linyuchen/Documents/Playground/ADFORGE_INTERNAL_IMAGE_WORKFLOW.md
```

## Docker / SaaS 部署骨架

這個資料夾已放入最小 Docker-ready 骨架：

- `Dockerfile`：目前以 Flask + Gunicorn 啟動 `app.py`。
- `.dockerignore`：排除 `.env`、虛擬環境、快取與 `outputs/`，避免把本機產圖與 secrets 打進 image。
- `docker-compose.example.yml`：提供本機或雲端 VM 的範例啟動方式，並保留未來 Supabase SaaS 化會用到的環境變數占位。

本機容器啟動：

```bash
cd /Users/linyuchen/Documents/Playground/ecommerce-image-generator
OPENAI_API_KEY=你的_key docker compose -f docker-compose.example.yml up --build
```

開啟：

```text
http://127.0.0.1:7860
```

未來正式部署時，建議把以下變數放在部署平台的 secrets / environment settings，不要寫進 image：

```text
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=low

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=adforge-renders
DATABASE_URL=
```

目前 app 還是內部 Flask 工具，Supabase 變數只是先保留 SaaS-ready contract。之後若要產品化成會員制 AI 商品圖工廠，可以沿用同一個 Docker port、`/app/outputs` volume 與環境變數命名，再把後端入口逐步換成 FastAPI / Uvicorn，並把生成紀錄、使用者、方案額度與檔案儲存接到 Supabase。

## 公開上線

`127.0.0.1` 和 `192.168.x.x` 都不是公開網址：

- `127.0.0.1`：只有這台電腦自己能開。
- `192.168.x.x`：只有同一個 Wi-Fi / 區網能開。
- 一般人可點擊的網址：需要部署到 Render、Railway、Fly.io、VPS 等雲端主機，或綁定自己的網域。

這個專案已補齊雲端部署用檔案：

- `Procfile`：Heroku/Railway 類平台可用的啟動指令。
- `render.yaml`：Render Blueprint 範例。
- `Dockerfile`：可用 Docker 部署到 VPS/Fly/Cloud Run 類平台。
- `.gitignore`：避免把 `.env`、API key、輸出圖檔推到 GitHub。

最小部署流程：

1. 把 `ecommerce-image-generator` 推到 GitHub 私有 repo。
2. 到雲端平台新增 Web Service。
3. Build command 設為：

```bash
pip install -r requirements.txt
```

4. Start command 設為：

```bash
gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 300 app:app
```

5. 在平台環境變數設定：

```text
OPENAI_API_KEY=你的 OpenAI API key
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_IMAGE_SIZE=1024x1024
OPENAI_IMAGE_QUALITY=medium
APP_PASSWORD=設定一組後台密碼
WEB_TIMEOUT=300
WEB_CONCURRENCY=2
```

6. 部署完成後會拿到類似以下公開網址：

```text
https://adforge-image-generator.onrender.com
```

注意：目前這個工具沒有登入、沒有用量限制。若直接公開，任何拿到網址的人都可以使用你的 OpenAI API 額度。正式對外前，建議先做最小保護：

1. 管理員密碼或登入。
2. 每個月生成額度。
3. 任務紀錄與失敗重跑紀錄。
4. 產圖檔案改存到雲端儲存，不只存在伺服器本機。

目前已支援最小密碼保護：部署平台若設定 `APP_PASSWORD`，網站會跳出瀏覽器內建登入框。使用者名稱可任意填，密碼填 `APP_PASSWORD` 的值。本機沒設定 `APP_PASSWORD` 時不會要求密碼。
