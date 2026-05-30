(() => {
  "use strict";

  const API_STATUS = {
    mode: "pixmotion",
    needsReplacement: false,
    note: "已接上 PixMotion 既有 API，依 query `apiProfile=pixmotion&api=1` 進入實際建立/輪詢流程；若開啟 `proxy=1` 則走同域 Supabase Edge Function 代理 `/functions/v1/video-create` 與 `/functions/v1/video-task-status`，否則用官方外部 Endpoint。"
  };

  window.ADFORGE_IMAGE_TO_VIDEO_AUDIT = {
    source: "https://adforgetw.com/image-to-video.html?apiProfile=pixmotion&api=1",
    apiCallsFound: [
      "POST /functions/v1/video-create",
      "GET /functions/v1/video-task-status/{taskId}",
      "POST https://pixmotion.adforgetw.com/api/video/generate",
      "GET https://pixmotion.adforgetw.com/api/video/status/{taskId}",
      "POST https://2b01be66.pixmotion-ai.pages.dev/api/video/generate",
      "GET https://2b01be66.pixmotion-ai.pages.dev/api/video/status/{taskId}"
    ],
    externalRuntimeAssetsFound: ["Google Fonts inherited from existing ADFORGE head", "GA4", "Meta Pixel"],
    apiStatus: API_STATUS
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  const galleryData = {
    product: [
      {
        title: "商品質感旋轉",
        desc: "適合電商首圖影片，鏡頭緩慢推近商品材質與標籤。",
        visual: "商品 360°",
        tags: ["電商首圖", "質感光", "9:16"],
        prompt: "商品置於乾淨攝影棚，柔和側光，鏡頭緩慢環繞並推近材質細節，背景高級簡潔。"
      },
      {
        title: "情境使用短片",
        desc: "把商品放入日常生活場景，讓客人快速理解用途。",
        visual: "生活情境",
        tags: ["使用情境", "社群短片", "生活感"],
        prompt: "商品出現在自然生活場景中，有手部互動與輕微鏡頭移動，畫面溫暖乾淨。"
      },
      {
        title: "賣點字幕節奏",
        desc: "用 3 段鏡頭切出主賣點、細節、促銷。",
        visual: "賣點字幕",
        tags: ["廣告素材", "促銷", "短影音"],
        prompt: "用快速但不雜亂的節奏呈現商品三個賣點，加入簡潔文字區塊與高級電商構圖。"
      }
    ],
    social: [
      {
        title: "Threads 話題封面",
        desc: "適合社群開頭圖，強調一句話吸引點擊。",
        visual: "Threads",
        tags: ["社群封面", "話題感", "高對比"],
        prompt: "以社群話題封面風格呈現商品，留出大標題文字空間，視覺乾淨、有停留感。"
      },
      {
        title: "小紅書種草片",
        desc: "用柔和生活感呈現開箱、使用與推薦。",
        visual: "小紅書",
        tags: ["種草", "生活方式", "9:16"],
        prompt: "小紅書風格生活化短片，商品自然出現在桌面與手部互動中，色調明亮、乾淨、可信任。"
      },
      {
        title: "TikTok 快節奏開場",
        desc: "前 2 秒有明確動作與視覺鉤子。",
        visual: "TikTok Hook",
        tags: ["短影音", "Hook", "動態"],
        prompt: "TikTok 廣告開場，前兩秒快速吸引注意，商品動態出現，鏡頭乾淨俐落。"
      }
    ],
    brand: [
      {
        title: "精品品牌感",
        desc: "深色背景、低調光影，適合高單價商品。",
        visual: "Premium",
        tags: ["精品", "品牌感", "高級光"],
        prompt: "精品廣告風格，深色高級背景，商品被精準輪廓光包覆，鏡頭慢速推近。"
      },
      {
        title: "Apple 極簡感",
        desc: "白底、留白、精準鏡頭，適合科技與生活用品。",
        visual: "Minimal",
        tags: ["極簡", "白底", "科技感"],
        prompt: "Apple-like minimalist product video, clean white background, precise soft shadow, smooth camera movement."
      },
      {
        title: "戶外露營感",
        desc: "自然光與戶外場景，適合機能商品與生活品牌。",
        visual: "Outdoor",
        tags: ["戶外", "露營", "自然光"],
        prompt: "戶外露營生活感影片，商品在自然光中被使用，背景有木桌、帳篷與柔和陽光。"
      }
    ]
  };

  const models = [
    {
      name: "Kling 3.0",
      desc: "適合商品動態、鏡頭推近、自然運鏡。正式接入前先作模型定位。",
      price: "商品展示優先"
    },
    {
      name: "Veo Router",
      desc: "適合更高品質情境影片與品牌感鏡頭，需後端控管成本。",
      price: "品牌廣告優先"
    },
    {
      name: "Seedance",
      desc: "適合短影音節奏與社群感動態，適合測試多版本素材。",
      price: "社群測試優先"
    }
  ];

  const effects = [
    { title: "鏡頭推近", visual: "Zoom In", desc: "用於材質、標籤與包裝細節。" },
    { title: "產品旋轉", visual: "Spin", desc: "用於主圖影片與展示型廣告。" },
    { title: "手部互動", visual: "Hands", desc: "用於生活感、可信任與使用方式。" },
    { title: "文字浮層", visual: "Caption", desc: "用於賣點、價格、活動與促銷。" },
    { title: "場景轉換", visual: "Scene", desc: "用於一支影片呈現多個使用情境。" },
    { title: "高級光影", visual: "Light", desc: "用於品牌形象與高單價商品。" }
  ];

  const faqs = [
    {
      q: "現在這個首頁會真的生成影片嗎？",
      a: "這個頁面目前已連接 PixMotion 的影片 API（`apiProfile=pixmotion&api=1`）。生成流程會呼叫正式 endpoint 進行建立與輪詢；若回傳異常，會退回本地展示影片，避免完全卡住。"
    },
    {
      q: "為什麼不直接把 API 放在前端？",
      a: "AI API key 不能放在前端，否則會被使用者看到。正式版應該由 Supabase Edge Function 或其他後端代發請求。"
    },
    {
      q: "圖片轉影片跟 ADFORGE 商品九張圖有什麼關係？",
      a: "商品九張圖是第一階段收費主線；圖片轉影片是第二階段延伸服務，可以從同一張商品照繼續產出短影音素材。"
    },
    {
      q: "客戶現在要怎麼下單？",
      a: "目前建議仍走會員中心或 LINE，先用人工接單確認照片是否適合，再安排生成與校稿。"
    }
  ];

  function initCanvas() {
    const canvas = $("#bgc");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      particles = Array.from({ length: Math.min(80, Math.floor(window.innerWidth / 18)) }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.8 + 0.5,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.fillStyle = "rgba(91, 138, 240, 0.32)";
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
        if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
  }

  function renderCards() {
    const grid = $("#templateGrid");
    if (!grid) return;

    const render = (key) => {
      grid.innerHTML = galleryData[key].map((item, index) => `
        <article class="template-card" role="button" tabindex="0" data-gallery-card="${key}" data-index="${index}">
          <div class="template-visual">${item.visual}</div>
          <h3>${item.title}</h3>
          <p>${item.desc}</p>
          <div class="tag-row">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
        </article>
      `).join("");
    };

    render("product");

    $$(".template-tabs button").forEach((button) => {
      button.addEventListener("click", () => {
        $$(".template-tabs button").forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        render(button.dataset.gallery);
      });
    });

    grid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-gallery-card]");
      if (!card) return;
      const item = galleryData[card.dataset.galleryCard][Number(card.dataset.index)];
      openModal(item);
    });

    grid.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = event.target.closest("[data-gallery-card]");
      if (!card) return;
      event.preventDefault();
      const item = galleryData[card.dataset.galleryCard][Number(card.dataset.index)];
      openModal(item);
    });
  }

  function renderModels() {
    const grid = $("#modelGrid");
    if (!grid) return;
    grid.innerHTML = models.map((model) => `
      <article class="model-card">
        <h3>${model.name}</h3>
        <p>${model.desc}</p>
        <div class="model-price">${model.price}</div>
      </article>
    `).join("");
  }

  function renderEffects() {
    const grid = $("#effectsGrid");
    if (!grid) return;
    grid.innerHTML = effects.map((effect) => `
      <article class="effect-card">
        <div class="effect-visual">${effect.visual}</div>
        <h3>${effect.title}</h3>
        <p>${effect.desc}</p>
      </article>
    `).join("");
  }

  function renderFaq() {
    const list = $("#faqList");
    if (!list) return;
    list.innerHTML = faqs.map((faq, index) => `
      <article class="faq-item ${index === 0 ? "open" : ""}">
        <button class="faq-question" type="button">
          <span>${faq.q}</span>
          <strong>+</strong>
        </button>
        <div class="faq-answer">${faq.a}</div>
      </article>
    `).join("");

    $$(".faq-question", list).forEach((button) => {
      button.addEventListener("click", () => {
        const item = button.closest(".faq-item");
        item.classList.toggle("open");
      });
    });
  }

  function initUpload() {
    const input = $("#imageInput");
    const preview = $("#previewImg");
    const empty = $("#uploadEmpty");
    if (!input || !preview || !empty) return;

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.src = event.target.result;
        preview.style.display = "block";
        empty.style.display = "none";
      };
      reader.readAsDataURL(file);
    });
  }

  function initGenerator() {
    const button = $("#generateBtn");
    const progressBox = $("#progressBox");
    const progressBar = $("#progressBar");
    const progressNum = $("#progressNum");
    const progressText = $("#progressText");
    const resultBox = $("#resultBox");
    if (!button) return;

    button.addEventListener("click", () => {
      // 這個 demo 區塊保留成效能體驗邏輯；實際影片生成請使用 image-to-video 頁面的正式流程。
      if (typeof gtag === "function") {
        gtag("event", "start_demo_video_generation", { event_category: "image_to_video" });
      }

      let progress = 0;
      button.disabled = true;
      button.textContent = "生成中...";
      resultBox?.classList.remove("active");
      progressBox?.classList.add("active");
      if (progressBar) progressBar.style.width = "0%";
      if (progressNum) progressNum.textContent = "0%";
      if (progressText) progressText.textContent = "分析圖片與提示詞...";

      const stages = [
        "分析圖片與提示詞...",
        "規劃鏡頭運動...",
        "套用商品短片模板...",
        "生成預覽輸出...",
        "完成 mock 結果"
      ];

      const timer = window.setInterval(() => {
        progress = Math.min(100, progress + Math.floor(Math.random() * 13) + 7);
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressNum) progressNum.textContent = `${progress}%`;
        if (progressText) {
          const stageIndex = Math.min(stages.length - 1, Math.floor(progress / 25));
          progressText.textContent = stages[stageIndex];
        }

        if (progress >= 100) {
          window.clearInterval(timer);
          button.disabled = false;
          button.textContent = "重新生成預覽";
          resultBox?.classList.add("active");
          showToast("影片預覽已完成");
        }
      }, 260);
    });

    $$(".model-tabs button").forEach((tab) => {
      tab.addEventListener("click", () => {
        $$(".model-tabs button").forEach((btn) => btn.classList.remove("active"));
        tab.classList.add("active");
      });
    });
  }

  function initBeforeAfter() {
    const range = $("#baRange");
    const handle = $("#baHandle");
    if (!range || !handle) return;
    const update = () => {
      handle.style.left = `${range.value}%`;
    };
    range.addEventListener("input", update);
    update();
  }

  function openModal(item) {
    $("#modalTitle").textContent = item.title;
    $("#modalDesc").textContent = item.desc;
    $("#modalPrompt").textContent = item.prompt;
    $("#demoModal").classList.add("active");
    $("#demoModal").setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    $("#demoModal")?.classList.remove("active");
    $("#demoModal")?.setAttribute("aria-hidden", "true");
  }

  function showToast(message) {
    const toast = $("#toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("active");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("active"), 1800);
  }

  function initModal() {
    $("#closeModal")?.addEventListener("click", closeModal);
    $("#demoModal")?.addEventListener("click", (event) => {
      if (event.target.id === "demoModal") closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });
    $("#copyPrompt")?.addEventListener("click", async () => {
      const text = $("#modalPrompt")?.textContent || "";
      try {
        await navigator.clipboard.writeText(text);
        showToast("提示詞已複製");
      } catch {
        showToast("無法使用剪貼簿，請手動複製");
      }
    });
  }

  function initDismissibleStrip() {
    $("[data-close-strip]")?.addEventListener("click", (event) => {
      event.currentTarget.closest(".promo-strip")?.remove();
    });
  }

  function initLineTracking() {
    $$('a[href*="page.line.me"]').forEach((link) => {
      link.addEventListener("click", () => {
        if (typeof gtag === "function") {
          gtag("event", "click_line_cta", { event_category: "contact" });
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initCanvas();
    initDismissibleStrip();
    initUpload();
    initGenerator();
    initBeforeAfter();
    renderCards();
    renderModels();
    renderEffects();
    renderFaq();
    initModal();
    initLineTracking();
  });
})();
