/**
 * ADFORGE AI — Universal Tracking Module
 * GA4 + Meta Pixel 事件追蹤
 *
 * 使用方式：
 *   1. 在每個頁面的 <head> 底部加入：
 *      <script src="tracking.js"></script>
 *
 *   2. 修改下方 CONFIG 填入你的 Measurement ID 與 Pixel ID
 *
 *   3. 手動觸發自訂事件：
 *      ADFORGE.track('purchase', { value: 399, currency: 'TWD' })
 *      ADFORGE.track('order_submit', { package_type: 'trial_399' })
 */

(function () {
  'use strict';

  // ──────────────────────────────────────────────
  // ⚙️  CONFIG — 填入你的真實 ID
  // ──────────────────────────────────────────────
  var CONFIG = {
    GA4_MEASUREMENT_ID: 'G-XXXXXXXXXX',   // ← 換成你的 GA4 Measurement ID
    META_PIXEL_ID:      '000000000000000', // ← 換成你的 Meta Pixel ID
    DEBUG:              false,             // 開發時設 true，會在 console 印出事件
  };

  // ──────────────────────────────────────────────
  // Internal Logger
  // ──────────────────────────────────────────────
  function log() {
    if (CONFIG.DEBUG) {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[ADFORGE Tracking]');
      console.log.apply(console, args);
    }
  }

  // ──────────────────────────────────────────────
  // 1. GA4 — gtag.js Loader
  // ──────────────────────────────────────────────
  function initGA4() {
    if (!CONFIG.GA4_MEASUREMENT_ID || CONFIG.GA4_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      log('GA4: Measurement ID 未設定，跳過');
      return;
    }

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', CONFIG.GA4_MEASUREMENT_ID, {
      page_location: window.location.href,
      page_title: document.title,
      send_page_view: true,
    });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.GA4_MEASUREMENT_ID;
    document.head.appendChild(s);

    log('GA4 initialized:', CONFIG.GA4_MEASUREMENT_ID);
  }

  // ──────────────────────────────────────────────
  // 2. Meta Pixel — Loader
  // ──────────────────────────────────────────────
  function initMetaPixel() {
    if (!CONFIG.META_PIXEL_ID || CONFIG.META_PIXEL_ID === '000000000000000') {
      log('Meta Pixel: Pixel ID 未設定，跳過');
      return;
    }

    !function(f,b,e,v,n,t,s) {
      if(f.fbq) return;
      n=f.fbq=function() { n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments); };
      if(!f._fbq) f._fbq=n;
      n.push=n; n.loaded=!0; n.version='2.0';
      n.queue=[];
      t=b.createElement(e); t.async=!0;
      t.src=v;
      s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s);
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', CONFIG.META_PIXEL_ID);
    fbq('track', 'PageView');

    // NoScript fallback
    var ns = document.createElement('noscript');
    var img = document.createElement('img');
    img.height = 1; img.width = 1;
    img.style.display = 'none';
    img.src = 'https://www.facebook.com/tr?id=' + CONFIG.META_PIXEL_ID + '&ev=PageView&noscript=1';
    ns.appendChild(img);
    document.body.appendChild(ns);

    log('Meta Pixel initialized:', CONFIG.META_PIXEL_ID);
  }

  // ──────────────────────────────────────────────
  // 3. Unified Event Tracker
  // ──────────────────────────────────────────────

  /**
   * GA4 event name map ← Meta Pixel standard event map
   * Key   = ADFORGE custom event name
   * Value = { ga4, pixel, pixelParams }
   */
  var EVENT_MAP = {
    // 頁面類
    'page_view':          { ga4: 'page_view',          pixel: 'PageView' },

    // 訂單流程
    'order_start':        { ga4: 'begin_checkout',     pixel: 'InitiateCheckout' },
    'order_submit':       { ga4: 'purchase',            pixel: 'Purchase' },
    'order_success':      { ga4: 'purchase',            pixel: 'Purchase' },

    // 潛在客戶
    'lead':               { ga4: 'generate_lead',      pixel: 'Lead' },
    'line_click':         { ga4: 'click_line',         pixel: 'Contact' },
    'email_click':        { ga4: 'click_email',        pixel: 'Contact' },

    // 登入
    'login':              { ga4: 'login',              pixel: 'CompleteRegistration' },
    'signup':             { ga4: 'sign_up',            pixel: 'CompleteRegistration' },

    // 內容互動
    'view_pricing':       { ga4: 'view_item_list',     pixel: 'ViewContent' },
    'view_case':          { ga4: 'select_content',     pixel: 'ViewContent' },
    'faq_open':           { ga4: 'faq_open',           pixel: null },
    'gallery_filter':     { ga4: 'gallery_filter',     pixel: null },

    // 工具
    'tool_click':         { ga4: 'select_content',     pixel: 'ViewContent' },
    'upload_photo':       { ga4: 'upload_photo',       pixel: 'AddToCart' },
  };

  function track(eventName, params) {
    params = params || {};
    var mapping = EVENT_MAP[eventName];

    // GA4
    if (window.gtag && mapping && mapping.ga4) {
      var ga4Params = Object.assign({}, params);
      gtag('event', mapping.ga4, ga4Params);
      log('GA4 event:', mapping.ga4, ga4Params);
    } else if (window.gtag) {
      gtag('event', eventName, params);
      log('GA4 custom event:', eventName, params);
    }

    // Meta Pixel
    if (window.fbq && mapping && mapping.pixel) {
      var pixelParams = buildPixelParams(eventName, params);
      fbq('track', mapping.pixel, pixelParams);
      log('Pixel event:', mapping.pixel, pixelParams);
    } else if (window.fbq && !mapping) {
      fbq('trackCustom', eventName, params);
      log('Pixel custom event:', eventName, params);
    }
  }

  // Build standardized Pixel params from ADFORGE event params
  function buildPixelParams(eventName, params) {
    var out = {};
    if (params.value)        out.value = params.value;
    if (params.amount_ntd)   out.value = params.amount_ntd;
    if (params.currency)     out.currency = params.currency;
    else                     out.currency = 'TWD';
    if (params.package_type) out.content_name = params.package_type;
    if (params.content_name) out.content_name = params.content_name;
    if (params.order_no)     out.order_id = params.order_no;
    return out;
  }

  // ──────────────────────────────────────────────
  // 4. Auto-track: DOM click listeners
  // ──────────────────────────────────────────────
  function autoTrackClicks() {
    document.addEventListener('click', function (e) {
      var el = e.target;

      // Walk up to find anchor or button
      while (el && el !== document.body) {
        var href = el.href || '';

        // LINE click
        if (href.includes('line.me') || href.includes('page.line.me')) {
          track('line_click', { content_name: 'LINE Contact' });
          break;
        }

        // Email click
        if (href.startsWith('mailto:')) {
          track('email_click', { content_name: href });
          break;
        }

        // Pricing section CTA
        if (el.matches && el.matches('[href*="package="]')) {
          var pkg = (href.match(/package=([^&#]+)/) || [])[1];
          track('order_start', { package_type: pkg, content_name: pkg });
          break;
        }

        // FAQ toggle
        if (el.tagName === 'SUMMARY') {
          track('faq_open', { content_name: el.textContent.trim().substring(0, 60) });
          break;
        }

        // Tool card click
        if (el.closest && el.closest('.tool-card a')) {
          track('tool_click', { content_name: el.textContent.trim().substring(0, 60) });
          break;
        }

        // Pricing view
        if (el.closest && el.closest('.price-card')) {
          track('view_pricing', { content_name: el.textContent.trim().substring(0, 40) });
          break;
        }

        el = el.parentElement;
      }
    }, { passive: true });
  }

  // ──────────────────────────────────────────────
  // 5. Auto-track: Order form submit (app.html)
  // ──────────────────────────────────────────────
  function autoTrackOrderForm() {
    // Listen for custom event dispatched from app.html after successful submit
    document.addEventListener('adforge:order_success', function (e) {
      var detail = e.detail || {};
      track('order_submit', {
        value:        detail.amount_ntd || 0,
        amount_ntd:   detail.amount_ntd || 0,
        currency:     'TWD',
        package_type: detail.package_type || '',
        order_no:     detail.order_no || '',
      });
    });

    // Login success
    document.addEventListener('adforge:login_success', function () {
      track('login', { method: 'google' });
    });

    // Photo upload
    document.addEventListener('adforge:photo_uploaded', function (e) {
      var detail = e.detail || {};
      track('upload_photo', { content_name: detail.file_name || 'photo' });
    });
  }

  // ──────────────────────────────────────────────
  // 6. Scroll depth tracking (25%, 50%, 75%, 90%)
  // ──────────────────────────────────────────────
  function trackScrollDepth() {
    var milestones = [25, 50, 75, 90];
    var reached = {};

    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      var pct = Math.round((scrollTop / docHeight) * 100);

      milestones.forEach(function (m) {
        if (pct >= m && !reached[m]) {
          reached[m] = true;
          if (window.gtag) gtag('event', 'scroll', { percent_scrolled: m });
          log('Scroll depth:', m + '%');
        }
      });
    }, { passive: true });
  }

  // ──────────────────────────────────────────────
  // 🚀 Init
  // ──────────────────────────────────────────────
  function init() {
    initGA4();
    initMetaPixel();
    autoTrackClicks();
    autoTrackOrderForm();
    trackScrollDepth();
    log('ADFORGE Tracking ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ──────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────
  window.ADFORGE = window.ADFORGE || {};
  window.ADFORGE.track = track;
  window.ADFORGE.config = CONFIG;

})();

/*
 * ============================================================
 * 📋 使用說明
 * ============================================================
 *
 * 1. 填入 CONFIG（本檔案第 20-23 行）：
 *    GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX'   ← GA4 屬性 ID
 *    META_PIXEL_ID      = '1234567890'     ← Meta Business 後台 Pixel ID
 *
 * 2. 在每個 HTML 頁面的 </body> 前加入：
 *    <script src="tracking.js"></script>
 *
 * 3. 在 app.html 訂單送出成功後手動 dispatch：
 *    document.dispatchEvent(new CustomEvent('adforge:order_success', {
 *      detail: { amount_ntd: 399, package_type: 'trial_399', order_no: 'ADG-...' }
 *    }));
 *
 * 4. 手動追蹤任意事件：
 *    ADFORGE.track('view_pricing');
 *    ADFORGE.track('order_submit', { value: 399, currency: 'TWD' });
 *
 * 5. 測試：設 DEBUG: true，開 Chrome DevTools Console 查看事件日誌
 *    或到 GA4 → 即時報表 確認事件有打進來
 * ============================================================
 */
