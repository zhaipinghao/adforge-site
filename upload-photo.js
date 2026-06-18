/**
 * ADFORGE AI — Customer Photo Upload Module
 * 串接 Supabase Storage，讓客戶在 app.html 下單時上傳商品照
 *
 * 使用方式：
 *   1. 在 app.html 中引入：<script src="upload-photo.js"></script>
 *   2. 呼叫 UploadPhoto.init({ bucket, supabaseUrl, anonKey, token, orderId })
 *   3. 監聽 'adforge:photo_uploaded' 事件取得上傳結果
 *
 * Supabase Storage 設定（先做）：
 *   Dashboard → Storage → New Bucket
 *   Bucket name: order-photos
 *   Public: false（私有桶，用 signed URL 存取）
 *   File size limit: 20MB
 *   Allowed types: image/jpeg, image/png, image/webp, image/heic
 */

(function (global) {
  'use strict';

  // ──────────────────────────────────────────────
  // Default Config
  // ──────────────────────────────────────────────
  var DEFAULT_CONFIG = {
    bucket:       'order-photos',
    maxSizeMB:    20,
    maxFiles:     5,
    acceptTypes:  ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    supabaseUrl:  '',
    anonKey:      '',
    token:        '',   // user JWT
    orderId:      '',   // e.g. 'ADG-20260514-XXXX' — used as folder name
    userId:       '',   // auth.uid()
    onProgress:   null, // callback(pct, file)
    onSuccess:    null, // callback(result)
    onError:      null, // callback(error)
  };

  var config = {};

  // ──────────────────────────────────────────────
  // Utilities
  // ──────────────────────────────────────────────
  function log() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[UploadPhoto]');
    console.log.apply(console, args);
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function ext(file) {
    return file.name.split('.').pop().toLowerCase();
  }

  function sanitizeFileName(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);
  }

  // ──────────────────────────────────────────────
  // Supabase Storage API (Vanilla Fetch)
  // ──────────────────────────────────────────────

  /**
   * Upload a single file to Supabase Storage
   * Path: {bucket}/{userId}/{orderId}/{timestamp}-{filename}
   */
  async function uploadFile(file, progressCb) {
    var timestamp = Date.now();
    var fileName  = sanitizeFileName(file.name);
    var folder    = config.userId
      ? config.userId + '/' + (config.orderId || 'unassigned')
      : 'unassigned/' + (config.orderId || timestamp);
    var storagePath = folder + '/' + timestamp + '-' + fileName;
    var url = config.supabaseUrl + '/storage/v1/object/' + config.bucket + '/' + storagePath;

    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('apikey', config.anonKey);
      xhr.setRequestHeader('Authorization', 'Bearer ' + config.token);
      xhr.setRequestHeader('x-upsert', 'true');
      // Content-Type intentionally not set — browser sets multipart boundary automatically

      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable && progressCb) {
          progressCb(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            var data = JSON.parse(xhr.responseText);
            resolve({ storagePath: storagePath, key: data.Key || storagePath });
          } catch (_) {
            resolve({ storagePath: storagePath, key: storagePath });
          }
        } else {
          try {
            var err = JSON.parse(xhr.responseText);
            reject(new Error(err.message || err.error || '上傳失敗 ' + xhr.status));
          } catch (_) {
            reject(new Error('上傳失敗 HTTP ' + xhr.status));
          }
        }
      };

      xhr.onerror = function () { reject(new Error('網路錯誤，請重試')); };
      xhr.ontimeout = function () { reject(new Error('上傳超時，請重試')); };
      xhr.timeout = 120000; // 2 min

      var form = new FormData();
      form.append('', file, file.name);
      xhr.send(form);
    });
  }

  /**
   * Get a signed URL (60 min expiry) for viewing uploaded file
   */
  async function getSignedUrl(storagePath) {
    var url = config.supabaseUrl + '/storage/v1/object/sign/' + config.bucket + '/' + storagePath;
    var res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': config.anonKey,
        'Authorization': 'Bearer ' + config.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.message || '無法取得簽名 URL');
    return config.supabaseUrl + '/storage/v1' + data.signedURL;
  }

  /**
   * Get public URL (only works if bucket is public)
   */
  function getPublicUrl(storagePath) {
    return config.supabaseUrl + '/storage/v1/object/public/' + config.bucket + '/' + storagePath;
  }

  // ──────────────────────────────────────────────
  // Validation
  // ──────────────────────────────────────────────
  function validateFile(file) {
    if (!config.acceptTypes.includes(file.type) && file.type !== '') {
      // HEIC often reports as empty type — allow by extension
      var e = ext(file);
      if (!['jpg','jpeg','png','webp','heic','heif'].includes(e)) {
        return '不支援的檔案格式：' + file.name + '（請上傳 JPG / PNG / WebP）';
      }
    }
    var maxBytes = config.maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return file.name + ' 檔案過大（最大 ' + config.maxSizeMB + 'MB，目前 ' + formatSize(file.size) + '）';
    }
    return null; // ok
  }

  // ──────────────────────────────────────────────
  // UI Renderer
  // ──────────────────────────────────────────────

  /**
   * Inject the upload UI into a container element
   * @param {HTMLElement} container
   */
  function renderUI(container) {
    container.innerHTML = '';
    container.style.cssText = 'font-family:inherit;';

    var style = document.createElement('style');
    style.textContent = `
      .afu-zone {
        border: 2px dashed rgba(139,92,246,.4);
        border-radius: 10px;
        background: rgba(139,92,246,.04);
        padding: 28px 20px;
        text-align: center;
        cursor: pointer;
        transition: all .2s;
        position: relative;
      }
      .afu-zone:hover, .afu-zone.drag-over {
        border-color: #8b5cf6;
        background: rgba(139,92,246,.09);
      }
      .afu-zone input[type=file] {
        position: absolute; inset: 0;
        opacity: 0; cursor: pointer; width: 100%; height: 100%;
      }
      .afu-zone-icon { font-size: 32px; margin-bottom: 8px; }
      .afu-zone-label { font-size: 14px; font-weight: 600; color: #a78bfa; margin-bottom: 4px; }
      .afu-zone-hint  { font-size: 12px; color: #6b6880; }
      .afu-list { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
      .afu-item {
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 8px;
        padding: 10px 14px;
        display: flex; align-items: center; gap: 12px;
      }
      .afu-thumb {
        width: 48px; height: 48px; border-radius: 6px;
        object-fit: cover; flex-shrink: 0;
        background: rgba(255,255,255,.08);
      }
      .afu-info { flex: 1; min-width: 0; }
      .afu-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .afu-size { font-size: 11px; color: #6b6880; }
      .afu-bar-wrap { height: 4px; background: rgba(255,255,255,.08); border-radius: 2px; margin-top: 6px; overflow: hidden; }
      .afu-bar { height: 100%; background: linear-gradient(90deg,#8b5cf6,#ec4899); border-radius: 2px; transition: width .2s; }
      .afu-status { font-size: 11px; margin-top: 4px; }
      .afu-status.ok     { color: #34d399; }
      .afu-status.error  { color: #f87171; }
      .afu-status.uploading { color: #a78bfa; }
      .afu-remove {
        background: none; border: none; cursor: pointer;
        color: #6b6880; font-size: 16px; padding: 4px;
        border-radius: 4px; transition: color .15s; flex-shrink: 0;
      }
      .afu-remove:hover { color: #f87171; }
      .afu-btn {
        margin-top: 14px; width: 100%;
        background: linear-gradient(135deg,#8b5cf6,#ec4899);
        border: none; border-radius: 8px; color: #fff;
        font-weight: 700; font-size: 14px; padding: 12px;
        cursor: pointer; transition: opacity .15s;
      }
      .afu-btn:hover { opacity: .9; }
      .afu-btn:disabled { opacity: .5; cursor: not-allowed; }
      .afu-error-msg {
        background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25);
        border-radius: 6px; color: #fca5a5; font-size: 12px;
        padding: 8px 12px; margin-top: 10px; display: none;
      }
    `;
    container.appendChild(style);

    // Drop zone
    var zone = document.createElement('div');
    zone.className = 'afu-zone';
    zone.innerHTML = `
      <div class="afu-zone-icon">📷</div>
      <div class="afu-zone-label">點擊或拖曳上傳商品照片</div>
      <div class="afu-zone-hint">支援 JPG / PNG / WebP，單檔最大 ${config.maxSizeMB}MB，最多 ${config.maxFiles} 張</div>
      <input type="file" id="afu-input" accept="image/*" multiple>
    `;

    var errMsg = document.createElement('div');
    errMsg.className = 'afu-error-msg';
    errMsg.id = 'afu-err';

    var list = document.createElement('div');
    list.className = 'afu-list';
    list.id = 'afu-list';

    var btn = document.createElement('button');
    btn.className = 'afu-btn';
    btn.id = 'afu-submit';
    btn.type = 'button';
    btn.textContent = '📤 上傳商品照片';
    btn.style.display = 'none';

    container.appendChild(zone);
    container.appendChild(errMsg);
    container.appendChild(list);
    container.appendChild(btn);

    // ── File input change
    var fileInput = zone.querySelector('#afu-input');
    fileInput.addEventListener('change', function () {
      handleFiles(Array.from(fileInput.files));
      fileInput.value = '';
    });

    // ── Drag & Drop
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handleFiles(Array.from(e.dataTransfer.files));
    });

    // ── Submit button
    btn.addEventListener('click', startUpload);
  }

  // ──────────────────────────────────────────────
  // File Queue
  // ──────────────────────────────────────────────
  var fileQueue = [];

  function handleFiles(newFiles) {
    var errEl = document.getElementById('afu-err');
    errEl.style.display = 'none';
    errEl.textContent = '';

    var errors = [];

    newFiles.forEach(function (file) {
      if (fileQueue.length >= config.maxFiles) {
        errors.push('最多只能上傳 ' + config.maxFiles + ' 張');
        return;
      }
      // Check duplicate
      var dup = fileQueue.some(function (q) {
        return q.file.name === file.name && q.file.size === file.size;
      });
      if (dup) return;

      var err = validateFile(file);
      if (err) { errors.push(err); return; }

      fileQueue.push({ file: file, status: 'pending', progress: 0, result: null });
    });

    if (errors.length) {
      errEl.textContent = errors.join(' | ');
      errEl.style.display = 'block';
    }

    renderList();
  }

  function renderList() {
    var list = document.getElementById('afu-list');
    var btn  = document.getElementById('afu-submit');
    if (!list) return;
    list.innerHTML = '';

    fileQueue.forEach(function (item, idx) {
      var item_el = document.createElement('div');
      item_el.className = 'afu-item';
      item_el.id = 'afu-item-' + idx;

      // Thumbnail
      var thumb = document.createElement('img');
      thumb.className = 'afu-thumb';
      thumb.alt = item.file.name;
      if (item.result && item.result.signedUrl) {
        thumb.src = item.result.signedUrl;
      } else {
        var reader = new FileReader();
        reader.onload = (function(t) { return function(e) { t.src = e.target.result; }; })(thumb);
        reader.readAsDataURL(item.file);
      }

      var info = document.createElement('div');
      info.className = 'afu-info';
      info.innerHTML =
        '<div class="afu-name">' + escHtml(item.file.name) + '</div>' +
        '<div class="afu-size">' + formatSize(item.file.size) + '</div>' +
        '<div class="afu-bar-wrap"><div class="afu-bar" id="afu-bar-' + idx + '" style="width:' + item.progress + '%"></div></div>' +
        '<div class="afu-status ' + item.status + '" id="afu-status-' + idx + '">' +
          statusText(item) +
        '</div>';

      var rmBtn = document.createElement('button');
      rmBtn.className = 'afu-remove';
      rmBtn.textContent = '✕';
      rmBtn.title = '移除';
      rmBtn.disabled = item.status === 'uploading';
      (function(i) {
        rmBtn.addEventListener('click', function () {
          fileQueue.splice(i, 1);
          renderList();
        });
      })(idx);

      item_el.appendChild(thumb);
      item_el.appendChild(info);
      item_el.appendChild(rmBtn);
      list.appendChild(item_el);
    });

    var hasPending = fileQueue.some(function(q) { return q.status === 'pending'; });
    btn.style.display = fileQueue.length ? 'block' : 'none';
    btn.textContent = hasPending ? '📤 上傳商品照片（' + fileQueue.filter(function(q){return q.status==='pending';}).length + ' 張）' : '✅ 已上傳完成';
    btn.disabled = !hasPending;
  }

  function statusText(item) {
    if (item.status === 'pending')   return '等待上傳';
    if (item.status === 'uploading') return '上傳中 ' + item.progress + '%';
    if (item.status === 'done')      return '✅ 上傳完成';
    if (item.status === 'error')     return '❌ ' + (item.error || '上傳失敗');
    return '';
  }

  function updateItemUI(idx) {
    var bar    = document.getElementById('afu-bar-' + idx);
    var status = document.getElementById('afu-status-' + idx);
    var item   = fileQueue[idx];
    if (!item) return;
    if (bar)    bar.style.width = item.progress + '%';
    if (status) {
      status.textContent = statusText(item);
      status.className = 'afu-status ' + item.status;
    }
  }

  // ──────────────────────────────────────────────
  // Upload Logic
  // ──────────────────────────────────────────────
  async function startUpload() {
    if (!config.supabaseUrl || !config.anonKey || !config.token) {
      showError('請先登入才能上傳圖片');
      return;
    }

    var btn = document.getElementById('afu-submit');
    btn.disabled = true;
    btn.textContent = '⏳ 上傳中…';

    var pending = fileQueue.filter(function(q) { return q.status === 'pending'; });
    var uploadedPaths = [];

    for (var i = 0; i < fileQueue.length; i++) {
      var item = fileQueue[i];
      if (item.status !== 'pending') continue;
      item.status = 'uploading';
      item.progress = 0;
      updateItemUI(i);

      try {
        var result = await uploadFile(item.file, (function(idx) {
          return function(pct) {
            fileQueue[idx].progress = pct;
            updateItemUI(idx);
          };
        })(i));

        // Try to get signed URL for preview
        var signedUrl = '';
        try { signedUrl = await getSignedUrl(result.storagePath); } catch(_) {}

        item.status   = 'done';
        item.progress = 100;
        item.result   = { storagePath: result.storagePath, signedUrl: signedUrl };
        updateItemUI(i);

        uploadedPaths.push(result.storagePath);

        // Dispatch per-file event
        document.dispatchEvent(new CustomEvent('adforge:photo_uploaded', {
          detail: { file_name: item.file.name, path: result.storagePath, signedUrl: signedUrl }
        }));

        if (config.onProgress) config.onProgress(i + 1, pending.length, item.file);

      } catch (e) {
        item.status = 'error';
        item.error  = e.message;
        updateItemUI(i);
        log('Upload error:', item.file.name, e);
        if (config.onError) config.onError(e, item.file);
      }
    }

    renderList();

    if (uploadedPaths.length > 0) {
      var summary = {
        paths:  uploadedPaths,
        total:  pending.length,
        success: uploadedPaths.length,
      };

      // Dispatch batch-done event
      document.dispatchEvent(new CustomEvent('adforge:photos_done', { detail: summary }));

      if (config.onSuccess) config.onSuccess(summary);

      // Update image_link in the order form (if field exists)
      var imgLinkField = document.getElementById('image_link');
      if (imgLinkField && uploadedPaths.length > 0) {
        imgLinkField.value = uploadedPaths.join(', ');
      }
    }
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────
  function showError(msg) {
    var errEl = document.getElementById('afu-err');
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  }

  function escHtml(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ──────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────

  /**
   * UploadPhoto.init(options)
   * @param {Object} options
   *   containerId  {string}   — DOM element ID to inject UI into
   *   bucket       {string}   — Supabase Storage bucket name (default: 'order-photos')
   *   supabaseUrl  {string}   — Project URL
   *   anonKey      {string}   — Anon public key
   *   token        {string}   — User JWT (from Supabase Auth session)
   *   userId       {string}   — auth.uid()
   *   orderId      {string}   — Order number (folder name)
   *   maxSizeMB    {number}   — Max file size in MB (default: 20)
   *   maxFiles     {number}   — Max files (default: 5)
   *   onSuccess    {Function} — Callback after all uploads done
   *   onError      {Function} — Callback on error
   */
  function init(options) {
    config = Object.assign({}, DEFAULT_CONFIG, options || {});
    fileQueue = [];

    var containerId = options.containerId || 'photo-upload-container';
    var container = document.getElementById(containerId);
    if (!container) {
      console.warn('[UploadPhoto] Container #' + containerId + ' not found');
      return;
    }

    renderUI(container);
    log('UploadPhoto initialized, bucket:', config.bucket);
  }

  /**
   * UploadPhoto.setAuth(token, userId)
   * Call this after user logs in to provide JWT
   */
  function setAuth(token, userId) {
    config.token  = token || '';
    config.userId = userId || '';
    log('Auth updated, userId:', userId);
  }

  /**
   * UploadPhoto.setOrderId(orderId)
   * Call this after order is submitted to set the folder name
   */
  function setOrderId(orderId) {
    config.orderId = orderId || '';
    log('Order ID set:', orderId);
  }

  /**
   * UploadPhoto.getUploadedPaths()
   * Returns array of storage paths for all successfully uploaded files
   */
  function getUploadedPaths() {
    return fileQueue
      .filter(function(q) { return q.status === 'done' && q.result; })
      .map(function(q) { return q.result.storagePath; });
  }

  global.UploadPhoto = {
    init:              init,
    setAuth:           setAuth,
    setOrderId:        setOrderId,
    getUploadedPaths:  getUploadedPaths,
  };

})(window);

/*
 * ============================================================
 * 📋 app.html 整合範例
 * ============================================================
 *
 * HTML（放在訂單表單內）：
 *   <div id="photo-upload-container"></div>
 *
 * JS（在 Supabase Auth 監聽裡）：
 *
 *   supabase.auth.onAuthStateChange(function(event, session) {
 *     if (session) {
 *       UploadPhoto.init({
 *         containerId: 'photo-upload-container',
 *         supabaseUrl: SUPABASE_URL,
 *         anonKey:     SUPABASE_ANON_KEY,
 *         token:       session.access_token,
 *         userId:      session.user.id,
 *         orderId:     '',  // 留空，submit 後再 setOrderId()
 *         onSuccess: function(result) {
 *           console.log('上傳完成', result.paths);
 *           // 可把 paths 更新到訂單 image_link 欄位
 *         }
 *       });
 *     }
 *   });
 *
 *   // 訂單送出後：
 *   UploadPhoto.setOrderId(newOrder.order_no);
 *
 * ============================================================
 * Supabase Storage RLS Policy（在 SQL Editor 執行）：
 * ============================================================
 *
 *   -- 允許已登入用戶上傳到自己的資料夾
 *   CREATE POLICY "Users can upload own photos"
 *     ON storage.objects FOR INSERT
 *     WITH CHECK (
 *       bucket_id = 'order-photos'
 *       AND auth.uid()::text = (storage.foldername(name))[1]
 *     );
 *
 *   -- 允許已登入用戶讀取自己的照片
 *   CREATE POLICY "Users can read own photos"
 *     ON storage.objects FOR SELECT
 *     USING (
 *       bucket_id = 'order-photos'
 *       AND auth.uid()::text = (storage.foldername(name))[1]
 *     );
 *
 *   -- 允許管理員讀取所有照片
 *   CREATE POLICY "Admins can read all photos"
 *     ON storage.objects FOR SELECT
 *     USING (
 *       bucket_id = 'order-photos'
 *       AND public.is_admin()
 *     );
 * ============================================================
 */
