/**
 * tools-app.js
 * ADFORGE AI — 爆款模板資料庫
 * 互動邏輯：篩選、搜尋、Modal、複製
 */

/* ═══════════════════════════════════════════
   State
═══════════════════════════════════════════ */
const State = {
  category: "all",    // all | image | prompt | video
  tag:       null,    // string | null
  platform:  null,    // string | null
  query:     "",      // search query
  sort:      "hot",   // hot | newest | az
  modalId:   null,    // template id | null
};

/* ═══════════════════════════════════════════
   DOM refs (lazy)
═══════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/* ═══════════════════════════════════════════
   Init
═══════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  buildSidebar();
  buildTagPills();
  buildPlatformChips();
  bindCategoryTabs();
  bindSearch();
  bindSort();
  bindModal();
  renderCards();
  animateHeroHighlight();
  animateStatCounters();
});

/* ═══════════════════════════════════════════
   Hero — rotating highlight word
═══════════════════════════════════════════ */
function animateHeroHighlight() {
  const el = document.getElementById("hero-highlight");
  if (!el) return;
  let i = 0;
  const words = HERO_HIGHLIGHTS;
  el.textContent = words[0];

  setInterval(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-6px)";
    setTimeout(() => {
      i = (i + 1) % words.length;
      el.textContent = words[i];
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, 260);
  }, 2400);

  el.style.transition = "opacity 0.25s ease, transform 0.25s ease";
}

/* ═══════════════════════════════════════════
   Hero — stat counters
═══════════════════════════════════════════ */
function animateStatCounters() {
  $$(".t-stat[data-target]").forEach(el => {
    const raw    = el.dataset.target;
    const suffix = raw.replace(/[\d.]/g, "");
    const target = parseFloat(raw);
    if (isNaN(target)) return;

    let start = null;
    const duration = 1200;

    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const current  = Math.round(eased * target);
      el.querySelector("strong").textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }

    // Trigger when in view
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(el);
  });
}

/* ═══════════════════════════════════════════
   Sidebar — dynamic category links with counts
═══════════════════════════════════════════ */
function buildSidebar() {
  const container = $("sidebar-links");
  if (!container) return;

  const catIcons = { all: "◈", image: "🖼", prompt: "✦", video: "▶" };
  const catLabels = { all: "全部模板", image: "AI 圖片模板", prompt: "Prompt 模板", video: "短影音模板" };

  TEMPLATE_DB.categories.forEach(cat => {
    const count = cat.id === "all"
      ? TEMPLATE_DB.templates.length
      : TEMPLATE_DB.templates.filter(t => t.category === cat.id).length;

    const a = document.createElement("a");
    a.href = "#";
    a.className = "t-sidebar-link" + (cat.id === "all" ? " active" : "");
    a.dataset.cat = cat.id;
    a.innerHTML = `
      <span class="s-icon">${catIcons[cat.id]}</span>
      <span>${catLabels[cat.id]}</span>
      <span class="s-count">${count}</span>
    `;
    a.addEventListener("click", e => {
      e.preventDefault();
      setCategoryFilter(cat.id, a);
    });
    container.appendChild(a);
  });
}

/* ═══════════════════════════════════════════
   Filter Bar — tag pills
═══════════════════════════════════════════ */
function buildTagPills() {
  const container = $("tag-pills");
  if (!container) return;

  // Collect all unique tags
  const allTags = [...new Set(TEMPLATE_DB.templates.flatMap(t => t.tags))];

  allTags.forEach(tag => {
    const btn = document.createElement("button");
    btn.className = "t-tag-pill";
    btn.textContent = tag;
    btn.dataset.tag = tag;
    btn.addEventListener("click", () => {
      const active = State.tag === tag;
      State.tag = active ? null : tag;
      $$(".t-tag-pill").forEach(p => p.classList.remove("active"));
      if (!active) btn.classList.add("active");
      renderCards();
    });
    container.appendChild(btn);
  });
}

/* ═══════════════════════════════════════════
   Sidebar — platform chips
═══════════════════════════════════════════ */
function buildPlatformChips() {
  const container = $("platform-chips");
  if (!container) return;

  TEMPLATE_DB.platforms.forEach(platform => {
    const btn = document.createElement("button");
    btn.className = "t-platform-chip";
    btn.textContent = platform;
    btn.addEventListener("click", () => {
      const active = State.platform === platform || platform === "全平台" && State.platform === null;
      if (platform === "全平台") {
        State.platform = null;
        $$(".t-platform-chip").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
      } else {
        State.platform = active ? null : platform;
        $$(".t-platform-chip").forEach(c => c.classList.remove("active"));
        if (!active) btn.classList.add("active");
        else $("platform-chips").firstElementChild.classList.add("active");
      }
      renderCards();
    });
    container.appendChild(btn);
  });
  // Activate "全平台" by default
  if (container.firstElementChild) container.firstElementChild.classList.add("active");
}

/* ═══════════════════════════════════════════
   Category tabs (filter bar)
═══════════════════════════════════════════ */
function bindCategoryTabs() {
  $$(".t-cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      setCategoryFilter(cat, btn);
    });
  });
}

function setCategoryFilter(cat, triggerEl) {
  State.category = cat;

  // Update all category buttons (filter bar)
  $$(".t-cat-btn").forEach(b => {
    b.classList.remove("active-all","active-image","active-prompt","active-video");
  });
  triggerEl.classList.add(`active-${cat}`);

  // Update sidebar links
  $$(".t-sidebar-link[data-cat]").forEach(l => {
    l.classList.toggle("active", l.dataset.cat === cat);
  });

  // Update tag pills for current category
  updateTagPillsForCategory(cat);

  renderCards();
}

function updateTagPillsForCategory(cat) {
  const available = cat === "all"
    ? new Set(TEMPLATE_DB.templates.flatMap(t => t.tags))
    : new Set(TEMPLATE_DB.templates.filter(t => t.category === cat).flatMap(t => t.tags));

  $$(".t-tag-pill").forEach(pill => {
    const visible = available.has(pill.dataset.tag);
    pill.style.display = visible ? "" : "none";
    if (!visible && pill.classList.contains("active")) {
      pill.classList.remove("active");
      State.tag = null;
    }
  });
}

/* ═══════════════════════════════════════════
   Search
═══════════════════════════════════════════ */
function bindSearch() {
  const input = $("search-input");
  const btn   = $("search-btn");
  if (!input) return;

  let debounce;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      State.query = input.value.trim().toLowerCase();
      renderCards();
    }, 200);
  });

  btn && btn.addEventListener("click", () => {
    State.query = input.value.trim().toLowerCase();
    renderCards();
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      State.query = input.value.trim().toLowerCase();
      renderCards();
    }
  });
}

/* ═══════════════════════════════════════════
   Sort
═══════════════════════════════════════════ */
function bindSort() {
  const sel = $("sort-select");
  if (!sel) return;
  sel.addEventListener("change", () => {
    State.sort = sel.value;
    renderCards();
  });
}

/* ═══════════════════════════════════════════
   Filter + Sort pipeline
═══════════════════════════════════════════ */
function getFilteredTemplates() {
  let list = [...TEMPLATE_DB.templates];

  // Category
  if (State.category !== "all") {
    list = list.filter(t => t.category === State.category);
  }

  // Tag
  if (State.tag) {
    list = list.filter(t => t.tags.includes(State.tag));
  }

  // Platform
  if (State.platform) {
    list = list.filter(t =>
      t.platforms.includes(State.platform) || t.platforms.includes("全平台")
    );
  }

  // Search
  if (State.query) {
    const q = State.query;
    list = list.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }

  // Sort
  switch (State.sort) {
    case "hot":    list.sort((a,b) => b.uses - a.uses); break;
    case "newest": list.sort((a,b) => b.id.localeCompare(a.id)); break;
    case "az":     list.sort((a,b) => a.title.localeCompare(b.title,"zh-TW")); break;
  }

  return list;
}

/* ═══════════════════════════════════════════
   Render Cards
═══════════════════════════════════════════ */
function renderCards() {
  const grid    = $("cards-grid");
  const counter = $("result-count");
  if (!grid) return;

  const list = getFilteredTemplates();

  // Update counter
  if (counter) {
    counter.innerHTML = `共 <strong>${list.length}</strong> 個模板`;
  }

  // Clear
  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="t-no-results">
        <p>找不到符合條件的模板</p>
        <small>試試其他關鍵字，或清除篩選條件</small>
      </div>`;
    return;
  }

  // Render
  list.forEach((tpl, idx) => {
    const card = createCard(tpl, idx);
    grid.appendChild(card);
  });
}

/* ═══════════════════════════════════════════
   Card Factory
═══════════════════════════════════════════ */
const CAT_LABEL = { image: "AI 圖片模板", prompt: "Prompt 模板", video: "短影音模板" };
const CAT_DOT   = { image: "dot-image",   prompt: "dot-prompt",   video: "dot-video" };
const CAT_CLASS = { image: "cat-image",   prompt: "cat-prompt",   video: "cat-video" };
const CAT_ICON  = { image: "🖼", prompt: "✦", video: "▶" };

function createCard(tpl, idx) {
  const card = document.createElement("article");
  card.className = "t-card";
  card.style.setProperty("--delay", `${idx * 40}ms`);
  card.setAttribute("tabindex", "0");
  card.setAttribute("role", tpl.href ? "link" : "button");
  card.setAttribute("aria-label", tpl.href ? `前往 ${tpl.title}` : `開啟 ${tpl.title} 模板`);

  const badgeHTML = tpl.badge
    ? `<span class="t-card-badge badge-${tpl.badge.toLowerCase()}">${tpl.badge}</span>`
    : "";

  const tagsHTML = tpl.tags.slice(0, 3).map(t =>
    `<span class="t-card-tag">${t}</span>`
  ).join("");

  card.innerHTML = `
    <div class="t-card-preview" style="background:${tpl.preview_gradient}">
      <div class="t-card-preview-inner" style="color:${tpl.preview_color}">${tpl.preview_icon}</div>
      <div class="t-card-preview-shimmer"></div>
      ${badgeHTML}
      <span class="t-card-cat-dot ${CAT_DOT[tpl.category]}">${CAT_ICON[tpl.category]}</span>
    </div>
    <div class="t-card-body">
      <div class="t-card-meta">
        <span class="t-card-cat-label ${CAT_CLASS[tpl.category]}">${CAT_LABEL[tpl.category]}</span>
        <span class="t-card-ratio">${tpl.ratio}</span>
      </div>
      <h3 class="t-card-title">${tpl.title}</h3>
      <p class="t-card-subtitle">${tpl.subtitle}</p>
      <p class="t-card-desc">${tpl.desc}</p>
      <div class="t-card-tags">${tagsHTML}</div>
      <div class="t-card-footer">
        <span class="t-card-level ${tpl.level}">
          <span class="level-dot"></span>${tpl.level}
        </span>
        <span class="t-card-uses"><span>${tpl.uses.toLocaleString()}</span> 次使用</span>
        <div class="t-card-actions">
          ${tpl.href
            ? `<a class="t-action-btn primary" href="${tpl.href}">${tpl.button_label || "前往工具"}</a>`
            : `<button class="t-action-btn primary" data-id="${tpl.id}" data-action="open">查看模板</button>`}
        </div>
      </div>
    </div>
  `;

  // Click anywhere on card → open modal
  card.addEventListener("click", e => {
    if (tpl.href) {
      if (!e.target.closest("a")) window.location.href = tpl.href;
      return;
    }
    openModal(tpl.id);
  });
  card.addEventListener("keydown", e => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (tpl.href) {
        window.location.href = tpl.href;
        return;
      }
      openModal(tpl.id);
    }
  });

  return card;
}

/* ═══════════════════════════════════════════
   Modal
═══════════════════════════════════════════ */
function bindModal() {
  const overlay = $("modal-overlay");
  if (!overlay) return;

  // Close on overlay click
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeModal();
  });

  // Close button
  $("modal-close") && $("modal-close").addEventListener("click", closeModal);

  // ESC key
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && State.modalId) closeModal();
  });
}

function openModal(id) {
  const tpl = TEMPLATE_DB.templates.find(t => t.id === id);
  if (!tpl) return;
  State.modalId = id;

  // Populate modal
  populateModal(tpl);

  const overlay = $("modal-overlay");
  overlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  const overlay = $("modal-overlay");
  overlay.classList.remove("open");
  document.body.style.overflow = "";
  State.modalId = null;
}

function populateModal(tpl) {
  // Header
  const previewIcon = $("modal-preview-icon");
  if (previewIcon) {
    previewIcon.style.background = tpl.preview_gradient;
    previewIcon.textContent = tpl.preview_icon;
    previewIcon.style.color = tpl.preview_color;
  }

  const catClass = { image: "cat-image", prompt: "cat-prompt", video: "cat-video" };
  setHTML("modal-category", `<span class="${catClass[tpl.category]}">${CAT_LABEL[tpl.category]}</span>`);
  setText("modal-title",    tpl.title);
  setText("modal-subtitle", tpl.subtitle);

  // Info grid
  setHTML("modal-info", `
    <dl class="t-info-grid">
      <div class="t-info-item"><dt>類別</dt><dd>${CAT_LABEL[tpl.category]}</dd></div>
      <div class="t-info-item"><dt>比例</dt><dd>${tpl.ratio}</dd></div>
      <div class="t-info-item"><dt>難度</dt><dd>${tpl.level}</dd></div>
      <div class="t-info-item"><dt>使用次數</dt><dd>${tpl.uses.toLocaleString()}</dd></div>
    </dl>
    <div class="t-modal-platforms">
      ${tpl.platforms.map(p => `<span class="t-modal-platform">${p}</span>`).join("")}
    </div>
  `);

  // Content area — differs by category
  const contentEl = $("modal-content");
  if (!contentEl) return;

  if (tpl.category === "prompt") {
    contentEl.innerHTML = `
      <div class="t-prompt-block">
        <p class="t-prompt-label">✦ Prompt 模板（點擊複製）</p>
        <div class="t-prompt-code" id="prompt-code-wrap">
          <pre>${escapeHTML(tpl.prompt_template)}</pre>
          <button class="t-copy-btn" id="copy-prompt-btn">複製</button>
        </div>
      </div>
    `;
    $("copy-prompt-btn").addEventListener("click", () => {
      copyText(tpl.prompt_template, "copy-prompt-btn");
    });

  } else if (tpl.category === "image") {
    const hint = tpl.prompt_hint || "";
    const copyTpl = tpl.copy_template || "";
    contentEl.innerHTML = `
      <div class="t-prompt-block">
        <p class="t-prompt-label">🖼 AI 圖片生成 Prompt（英文）</p>
        <div class="t-prompt-code">
          <pre>${escapeHTML(hint)}</pre>
          <button class="t-copy-btn" id="copy-hint-btn">複製</button>
        </div>
      </div>
      <div class="t-prompt-block">
        <p class="t-prompt-label">📋 中文說明模板（填入商品資訊）</p>
        <div class="t-prompt-code">
          <pre>${escapeHTML(copyTpl)}</pre>
          <button class="t-copy-btn" id="copy-tpl-btn">複製</button>
        </div>
      </div>
    `;
    $("copy-hint-btn").addEventListener("click", () => copyText(hint, "copy-hint-btn"));
    $("copy-tpl-btn").addEventListener("click",  () => copyText(copyTpl, "copy-tpl-btn"));

  } else if (tpl.category === "video") {
    const timelineHTML = (tpl.script_structure || []).map(item => `
      <div class="t-timeline-item">
        <span class="t-timeline-time">${item.time}</span>
        <div class="t-timeline-content">
          <p class="t-timeline-role">${item.role}</p>
          <p class="t-timeline-desc">${item.desc}</p>
        </div>
      </div>
    `).join("");

    contentEl.innerHTML = `
      <div class="t-prompt-block">
        <p class="t-prompt-label">▶ 影片腳本結構</p>
        <div class="t-script-timeline">${timelineHTML}</div>
      </div>
    `;
  }
}

/* ═══════════════════════════════════════════
   Copy to clipboard
═══════════════════════════════════════════ */
function copyText(text, btnId) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = $(btnId);
    if (btn) {
      btn.textContent = "✓ 已複製";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "複製";
        btn.classList.remove("copied");
      }, 2000);
    }
    showToast("已複製到剪貼簿 ✓");
  }).catch(() => {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast("已複製到剪貼簿 ✓");
  });
}

/* ═══════════════════════════════════════════
   Toast
═══════════════════════════════════════════ */
function showToast(msg) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ═══════════════════════════════════════════
   Helpers
═══════════════════════════════════════════ */
function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}
function setHTML(id, html) {
  const el = $(id);
  if (el) el.innerHTML = html;
}
function escapeHTML(str) {
  return str
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}
