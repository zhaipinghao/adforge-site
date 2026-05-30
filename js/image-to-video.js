// 目前為「create + poll」流程 + mock fallback：
// 有連上 API 時走後端任務模式，否則回退到 demo 流程。

// ===== DATA =====
const GALLERY = [
  {em:'👩‍🎤',bg:'linear-gradient(135deg,#1a0e2e,#2d1844)',prompt:'電影感特寫，光影流動，髮絲隨風飄動，夢幻氛圍',model:'Veo 3',cat:'portrait'},
  {em:'🏔️',bg:'linear-gradient(135deg,#0d1a0e,#1a3020)',prompt:'山頂雲霧流動，延時攝影效果，壯闊史詩感',model:'Sora 2',cat:'nature'},
  {em:'🌆',bg:'linear-gradient(135deg,#0d0d1e,#1a1038)',prompt:'城市夜景霓虹閃爍，人潮快速流動，賽博朋克風',model:'Kling',cat:'city'},
  {em:'🎨',bg:'linear-gradient(135deg,#1e0a0a,#3a1020)',prompt:'水彩筆觸緩緩暈染，色彩流動，藝術感十足',model:'LitAI 5',cat:'art'},
  {em:'🌊',bg:'linear-gradient(135deg,#0d1a2e,#1a3050)',prompt:'海浪緩緩拍打礁石，夕陽映照金色水面',model:'Hailuo',cat:'nature'},
  {em:'👫',bg:'linear-gradient(135deg,#1a100e,#2d2018)',prompt:'朋友圍坐歡笑，暖光照耀，快樂時光定格',model:'Vidu',cat:'portrait'},
  {em:'🐱',bg:'linear-gradient(135deg,#1a1010,#2d1818)',prompt:'可愛貓咪慵懶伸展，毛髮柔順飄動，療癒系',model:'Seedance',cat:'nature'},
  {em:'🌲',bg:'linear-gradient(135deg,#0a180a,#142a14)',prompt:'空中俯瞰森林，晨霧從樹梢升起，大自然呼吸',model:'Wan',cat:'nature'},
  {em:'🏙️',bg:'linear-gradient(135deg,#0d0d1a,#1a1a30)',prompt:'現代辦公會議，人物動態流暢，商業質感',model:'PixVerse',cat:'city'},
];

const MODELS = [
  {em:'🌊',name:'Veo 3',tag:'new',tl:'最新',desc:'偏寫實質感，做參考測試時可作比對'},
  {em:'🎬',name:'Sora 2',tag:'hot',tl:'熱門',desc:'偏敘事風格，用於情境轉場參考'},
  {em:'⚡',name:'LitAI 5',tag:'fast',tl:'高速',desc:'偏速度導向，先做風格預覽'},
  {em:'🎭',name:'Hailuo',tag:'hot',tl:'熱門',desc:'偏寫實人物動態，供素材走向對比'},
  {em:'🌸',name:'Wan',tag:'fast',tl:'高效',desc:'偏靈活輸出，協助快速做方向選擇'},
  {em:'🎯',name:'Vidu',tag:'std',tl:'穩定',desc:'偏穩定運動軌跡，適合產品短片預覽'},
  {em:'💃',name:'Seedance',tag:'hot',tl:'熱門',desc:'偏舞感節奏，適合生活/動態素材'},
  {em:'👑',name:'Kling',tag:'new',tl:'新品',desc:'偏景深與光影，利於比較輸出風格'},
  {em:'❤️',name:'Love AI 2.0',tag:'std',tl:'情緒',desc:'偏情緒感氛圍，適合作為情境參考'},
  {em:'🌈',name:'PixVerse',tag:'fast',tl:'輕快',desc:'偏色彩風格實驗，作為轉場素材參考'},
];

const EFFECTS = [
  {em:'🎬',name:'電影慢動作',bg:'rgba(141,27,255,.12)'},
  {em:'✨',name:'夢幻光暈',bg:'rgba(228,85,212,.12)'},
  {em:'🌆',name:'賽博朋克',bg:'rgba(56,189,248,.12)'},
  {em:'🎨',name:'水墨暈染',bg:'rgba(100,239,155,.12)'},
  {em:'💥',name:'粒子爆炸',bg:'rgba(251,191,36,.12)'},
  {em:'📽️',name:'復古膠片',bg:'rgba(249,115,22,.12)'},
  {em:'🌟',name:'魔法流光',bg:'rgba(167,139,250,.12)'},
  {em:'🎵',name:'Lo-Fi 風格',bg:'rgba(52,211,153,.12)'},
  {em:'⏱️',name:'時間扭曲',bg:'rgba(244,63,94,.12)'},
  {em:'🌌',name:'極光效果',bg:'rgba(6,182,212,.12)'},
  {em:'🖌️',name:'油畫質感',bg:'rgba(245,158,11,.12)'},
  {em:'📺',name:'故障藝術',bg:'rgba(236,72,153,.12)'},
];

const FAQ = [
  {q:'1. 支援哪些圖片格式？',a:'目前流程頁支援 JPG、JPEG、PNG、BMP，建議不超過 5MB。正式專案接單流程將依你提供檔案規格規劃。'},
  {q:'2. 從圖片生成影片需要多久？',a:'流程頁為模擬參考，時間以載入體感為主；實際正式交付依素材複雜度、排程與規格而定。'},
  {q:'3. 上傳的圖片有大小限制嗎？',a:'為了體驗流暢，流程頁限制 5MB。正式交付建議提供清晰原始圖，並可改用較大解析度版本。'},
  {q:'4. 原始圖片與結果如何保存？',a:'目前頁面不做永久存檔。完成測試後請直接透過訂單提交原圖與素材需求，讓服務團隊做正式交付。'},
  {q:'5. 是否能拿去商用？',a:'正式 ADFORGE 交付素材可依你選購方案作商用用途。建議用「建立訂單」完成合約確認。'},
  {q:'6. 這是免費試用嗎？',a:'本頁為流程體驗頁，滿意後可透過 ADFORGE 登入下單，啟動正式製作服務。'},
];

const PAGE_QUERY = new URLSearchParams(location?.search || '');

// API 回傳需符合：
// POST create -> { taskId?: string, status?: string, progress?: number, videoUrl?: string }
// GET/POST status -> { taskId, status, progress, videoUrl, message }
// NOTE：如要接正式後端，直接將網址設定到下方 createEndpoint / pollEndpoint 即可。
// 或在頁面初始化前透過 window.ADFORGE_IMAGE_TO_VIDEO_API 覆蓋。示例：
// window.ADFORGE_IMAGE_TO_VIDEO_API = { createEndpoint: '/functions/v1/create-video-task', pollEndpoint: '/functions/v1/video-task-status' }
// 也可以用 apiProfile 指向既有服務，例：
// ?apiProfile=pixmotion 或 window.ADFORGE_IMAGE_TO_VIDEO_API = { apiProfile: 'pixmotion' }
const VIDEO_API_DEFAULT_ENDPOINT = {
  createEndpoint: '',
  pollEndpoint: '',
};

const VIDEO_API_PROFILES = {
  pixmotion: {
    apiProfile: 'pixmotion',
    createEndpoint: 'https://pixmotion.adforgetw.com/api/video/generate',
    pollEndpoint: 'https://pixmotion.adforgetw.com/api/video/status/{taskId}',
    enabled: true,
    headers: { 'Content-Type': 'application/json' },
    bodyMode: 'json',
    credentials: 'include',
    requiresAuth: true,
    authToken: '',
    notes: 'PixMotion API: POST /api/video/generate, GET /api/video/status/{requestId}'
  },
};

const PIXMOTION_PROXY_ENDPOINTS = {
  createEndpoint: 'https://vcyuttzpbjfqzelcgurr.supabase.co/functions/v1/video-create',
  pollEndpoint: 'https://vcyuttzpbjfqzelcgurr.supabase.co/functions/v1/video-task-status/{taskId}',
  createTokenFallback: true,
};

const PIXMOTION_PROXY_PREFERRED =
  PAGE_QUERY.get('proxy') === '1' ||
  PAGE_QUERY.get('useProxy') === '1' ||
  location.hostname === 'adforgetw.com' ||
  location.hostname === 'www.adforgetw.com';

const PIXMOTION_SESSION_KEYS = [
  'pixmotion-auth',
  'pixmotion-auth-ok',
  'pixmotion-auth-session',
  'pixmotion-auth-legacy',
];
const PIXMOTION_SESSION_STORAGE_KEYS = [
  'pixmotion-auth',
  'pixmotion-auth-session',
  'pixmotion-auth-ok',
  'pixmotion-auth-legacy',
];
const PIXMOTION_TOKEN_KEYS = [
  ...PIXMOTION_SESSION_KEYS,
  'adforge-pixmotion-token',
  'adforge.pixmotion.token',
  'pixmotion-token',
  'pixmotion-token-manual',
];
const PIXMOTION_AUTH_QUERY_KEYS = ['authToken', 'token', 'pixmotionToken', 'pixmotionAuth'];
const PIXMOTION_TOKEN_QUERY_KEYS = ['pixmotionToken', 'authToken', 'token', 'accessToken'];
const PIXMOTION_HOST_FALLBACKS = [
  'pixmotion.adforgetw.com',
  '2b01be66.pixmotion-ai.pages.dev',
];
const PIXMOTION_DEFAULT_HOST = PIXMOTION_HOST_FALLBACKS[0];

const AUTH_REQUIRED_ERROR = 'PIXMOTION_AUTH_REQUIRED';

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function trimToken(raw) {
  return String(raw || '').trim();
}

function isLikelyJwt(token) {
  return typeof token === 'string' && token.split('.').length >= 2 && token.length >= 16;
}

function isLikelyAccessToken(token) {
  const t = trimToken(token);
  return t.length > 20 && /^[A-Za-z0-9_\\-\\.]+$/.test(t);
}

function isValidToken(token) {
  const t = trimToken(token);
  if (!t) return false;
  return isLikelyJwt(t) || isLikelyAccessToken(t);
}

function pickFirstTokenValue(session) {
  if (!session || typeof session !== 'object') return '';
  const candidates = [
    session.access_token,
    session.currentSession?.access_token,
    session.current_session?.access_token,
    session.currentSession?.accessToken,
    session.current_session?.accessToken,
    session.session?.access_token,
    session.session?.accessToken,
    session.token?.access_token,
    session.token?.accessToken,
    session.accessToken,
    session.token,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'string') continue;
    const token = candidate.trim();
    if (token.length > 16) {
      return token;
    }
  }
  return '';
}

function resolveSessionToken(session) {
  return pickFirstTokenValue(session);
}

function resolveExpiresAtValue(candidate) {
  if (candidate == null) return 0;
  if (typeof candidate === 'string' && candidate.trim() === '') {
    return 0;
  }

  const num = Number(candidate);
  if (!Number.isFinite(num) || num <= 0) {
    return 0;
  }

  if (num > 1e12) {
    return Math.floor(num / 1000);
  }
  return Math.floor(num);
}

function resolveSessionExpiresAt(session) {
  if (!session || typeof session !== 'object') return 0;
  const candidates = [
    session.expires_at,
    session.expiresAt,
    session.currentSession?.expires_at,
    session.currentSession?.expiresAt,
    session.current_session?.expires_at,
    session.current_session?.expiresAt,
    session.session?.expires_at,
    session.session?.expiresAt,
    session.token?.expires_at,
    session.token?.expiresAt,
  ];
  for (const candidate of candidates) {
    const ts = resolveExpiresAtValue(candidate);
    if (ts > 0) {
      return ts;
    }
  }
  return 0;
}

function normalizeApiHost(rawHost) {
  if (!rawHost || typeof rawHost !== 'string') {
    return '';
  }
  const trimmed = rawHost.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function resolveApiHost() {
  const rawHost = PAGE_QUERY.get('apiHost') || PAGE_QUERY.get('host') || PAGE_QUERY.get('pixmotionHost');
  if (rawHost) {
    return normalizeApiHost(rawHost);
  }
  return '';
}

function isAuthStorageObject(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.access_token === 'string' && obj.access_token.trim()) return true;
  if (typeof obj.currentSession?.access_token === 'string' && obj.currentSession.access_token.trim()) return true;
  if (typeof obj.current_session?.access_token === 'string' && obj.current_session.access_token.trim()) return true;
  if (typeof obj.currentSession?.accessToken === 'string' && obj.currentSession.accessToken.trim()) return true;
  if (typeof obj.current_session?.accessToken === 'string' && obj.current_session.accessToken.trim()) return true;
  if (typeof obj.session?.access_token === 'string' && obj.session.access_token.trim()) return true;
  if (typeof obj.session?.accessToken === 'string' && obj.session.accessToken.trim()) return true;
  if (typeof obj.accessToken === 'string' && obj.accessToken.trim()) return true;
  return false;
}

function readStorageToken(storage = window.localStorage) {
  if (!storage) return '';
  const keys = storage === window.sessionStorage
    ? PIXMOTION_SESSION_STORAGE_KEYS
    : [...new Set([...PIXMOTION_TOKEN_KEYS, ...PIXMOTION_SESSION_KEYS])];

  const normalizeToken = (token) => {
    const normalized = String(token || '').trim();
    return normalized.length > 16 ? normalized : '';
  };

  try {
    for (const key of keys) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      if (raw.trim().length > 24 && (/^[A-Za-z0-9_.-]+\.[A-Za-z0-9_.-]+\.[A-Za-z0-9_.-]+$/.test(raw.trim()) || /^[A-Za-z0-9-_]+$/.test(raw.trim()))) {
        const directToken = normalizeToken(raw);
        if (directToken) return directToken;
      }

      const parsed = safeJson(raw);
      if (!isAuthStorageObject(parsed)) continue;
      const token = resolveSessionToken(parsed);
      if (!token) continue;
      const expiresAt = resolveSessionExpiresAt(parsed);
      if (expiresAt && expiresAt < Date.now() / 1000) continue;
      const normalized = token.trim();
      if (normalized.length > 16) {
        return normalized;
      }
    }
  } catch {
    return '';
  }
  return '';
}

function safeJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistPixmotionToken(token) {
  const normalized = trimToken(token);
  if (!normalized || !isValidToken(normalized)) {
    return false;
  }

  try {
    window.localStorage.setItem('pixmotion-auth', normalized);
    window.localStorage.setItem('adforge-pixmotion-token', normalized);
    window.localStorage.setItem('pixmotionToken', normalized);
    PIXMOTION_TOKEN_KEYS.forEach((key) => {
      if (key && !key.startsWith('pixmotion-auth')) {
        window.localStorage.setItem(key, normalized);
      }
    });
    return true;
  } catch {
    return false;
  }
}

function clearPixmotionToken() {
  try {
    PIXMOTION_TOKEN_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    });
    window.sessionStorage.removeItem('pixmotion-auth');
    return true;
  } catch {
    return false;
  }
}

function updateAuthUI() {
  const input = document.getElementById('pixmotionToken');
  const state = document.getElementById('apiAuthState');
  if (!state) return;

  const hasToken = Boolean(VIDEO_API_CONFIG.authToken && isValidToken(VIDEO_API_CONFIG.authToken));
  if (input && input.value !== (VIDEO_API_CONFIG.authToken || '')) {
    input.value = VIDEO_API_CONFIG.authToken || '';
  }

  if (!hasToken) {
    state.textContent = '尚未設定 token，先用展示模式提供結果（可先點「生成」預覽）。';
    return;
  }

  state.textContent = '已套用本機儲存的 PixMotion token。';
}

function readPixmotionSessionToken() {
  let explicit = '';
  for (const key of PIXMOTION_TOKEN_QUERY_KEYS) {
    const v = PAGE_QUERY.get(key);
    if (v) {
      explicit = String(v).trim();
      break;
    }
  }
  if (explicit) {
    if (isValidToken(explicit)) {
      persistPixmotionToken(explicit);
    }
    return explicit;
  }

  try {
    const storageCandidates = [window.localStorage, window.sessionStorage];
    for (const storage of storageCandidates) {
      if (!storage) continue;
      const token = readStorageToken(storage);
      if (!token) continue;
      const normalized = String(token).trim();
      if (!normalized) continue;
      const tokenSession = storage.getItem('pixmotion-auth') ? safeJson(storage.getItem('pixmotion-auth')) : null;
      const expiresAt = resolveSessionExpiresAt(tokenSession);
      if (expiresAt && expiresAt < Date.now() / 1000) continue;
      return normalized;
    }
    return '';
  } catch {
    return '';
  }
}

function getApiProfileHostOverrides() {
  const fromQuery = normalizeApiHost(resolveApiHost());
  if (fromQuery) return fromQuery;

  const fallbackDomain = PAGE_QUERY.get('useLocalHost') === '1' ? window.location.hostname : '';
  return normalizeApiHost(fallbackDomain);
}

function resolvePixmotionEndpoints(config) {
  if (!config || config.apiProfile !== 'pixmotion') {
    return config;
  }

  const configuredBase = normalizeApiHost(PAGE_QUERY.get('supabaseHost'));
  const activeHost = configuredBase && PAGE_QUERY.get('useProxy') === '1'
    ? configuredBase
    : null;

  const finalProxyEndpoints = Object.assign({}, PIXMOTION_PROXY_ENDPOINTS);
  if (activeHost) {
    finalProxyEndpoints.createEndpoint = `${activeHost.replace(/\/$/, '')}/functions/v1/video-create`;
    finalProxyEndpoints.pollEndpoint = `${activeHost.replace(/\/$/, '')}/functions/v1/video-task-status/{taskId}`;
  }

  if (PIXMOTION_PROXY_PREFERRED && PAGE_QUERY.get('api') === '1') {
    return Object.assign({}, config, {
      createEndpoint: finalProxyEndpoints.createEndpoint,
      pollEndpoint: finalProxyEndpoints.pollEndpoint,
      requiresAuth: true,
      headers: { 'Content-Type': 'application/json' },
      bodyMode: 'json',
      createUsesProxy: true,
    });
  }

  const host = getApiProfileHostOverrides() || PIXMOTION_HOST_FALLBACKS[0];
  const create = `${host}/api/video/generate`;
  const poll = `${host}/api/video/status/{taskId}`;
  return Object.assign({}, config, {
    createEndpoint: create,
    pollEndpoint: poll,
  });
}

function isRealFlowEnabled() {
  return PAGE_QUERY.get('mode') === 'api' || PAGE_QUERY.get('api') === '1' || PAGE_QUERY.get('real') === '1' || PAGE_QUERY.get('apiProfile');
}

function cloneJson(value){
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

const VIDEO_API_CONFIG = {
  apiProfile: '',
  createEndpoint: VIDEO_API_DEFAULT_ENDPOINT.createEndpoint,
  pollEndpoint: VIDEO_API_DEFAULT_ENDPOINT.pollEndpoint,
  timeoutMs: 120000,
  pollIntervalMs: 1500,
  maxPollAttempts: 120,
  bodyMode: 'form',
  headers: {},
  credentials: '',
  authToken: '',
  enabled: true,
};

Object.assign(VIDEO_API_CONFIG, typeof window !== 'undefined' && window.ADFORGE_IMAGE_TO_VIDEO_API ? window.ADFORGE_IMAGE_TO_VIDEO_API : {});

if (PAGE_QUERY.get('apiProfile')) {
  const profile = PAGE_QUERY.get('apiProfile');
  if (VIDEO_API_PROFILES[profile]) {
    Object.assign(VIDEO_API_CONFIG, resolvePixmotionEndpoints(cloneJson(VIDEO_API_PROFILES[profile])));
  }
}

VIDEO_API_CONFIG.authToken = readPixmotionSessionToken();

const FORCE_MOCK_FLOW = (() => {
  const forceMockQuery = PAGE_QUERY.get('mode') === 'mock';
  const explicitRealQuery = isRealFlowEnabled();
  const embed = PAGE_QUERY.get('embed') === '1' || window.ADFORGE_IMAGE_TO_VIDEO_EMBED;
  return Boolean(forceMockQuery || embed) && !explicitRealQuery;
})();

if (isRealFlowEnabled()) {
  VIDEO_API_CONFIG.enabled = true;
}

if (PAGE_QUERY.get('createApi')) {
  VIDEO_API_CONFIG.createEndpoint = PAGE_QUERY.get('createApi');
}
if (PAGE_QUERY.get('pollApi')) {
  VIDEO_API_CONFIG.pollEndpoint = PAGE_QUERY.get('pollApi');
}

function isApiReady(endpoint) {
  if (FORCE_MOCK_FLOW || VIDEO_API_CONFIG.enabled === false) return false;
  if (!endpoint || typeof endpoint !== 'string') return false;
  if (endpoint.includes('TODO') || endpoint.includes('sandbox')) {
    return false;
  }
  return true;
}

function getApiFlowMode() {
  if (!isRealFlowEnabled()) {
    return 'mock';
  }
  if (VIDEO_API_CONFIG.requiresAuth && !VIDEO_API_CONFIG.authToken) {
    return 'auth_required';
  }
  if (VIDEO_API_CONFIG.createEndpoint.startsWith('/functions/v1/')) {
    return 'adforge_proxy';
  }
  if (VIDEO_API_CONFIG.createEndpoint.includes('pixmotion.adforgetw.com') || VIDEO_API_CONFIG.createEndpoint.includes('pixmotion-ai.pages.dev')) {
    return 'pixmotion_profile';
  }
  return 'real_api';
}

function applyTokenToFlow(token) {
  const normalized = trimToken(token);
  if (!normalized || !isValidToken(normalized)) {
    VIDEO_API_CONFIG.authToken = '';
    clearPixmotionToken();
    renderApiStatus();
    updateAuthUI();
    return false;
  }
  VIDEO_API_CONFIG.authToken = normalized;
  persistPixmotionToken(normalized);
  renderApiStatus();
  updateAuthUI();
  return true;
}

function renderApiStatus() {
  const apiStatus = document.getElementById('apiStatus');
  if (!apiStatus) return;

  const mode = getApiFlowMode();
  const endpoint = VIDEO_API_CONFIG.createEndpoint || '';
  if (mode === 'auth_required') {
    apiStatus.textContent = '未偵測到 PixMotion token，先用展示模式。請在下方輸入 token 後重新生成。';
    return;
  }
  if (mode === 'real_api') {
    const shortEndpoint = endpoint.length > 78 ? `${endpoint.slice(0, 78)}...` : endpoint;
    apiStatus.textContent = `API 模式：已接上 ${shortEndpoint}`;
    return;
  }
  if (mode === 'adforge_proxy') {
    const shortEndpoint = endpoint.length > 78 ? `${endpoint.slice(0, 78)}...` : endpoint;
    apiStatus.textContent = `同域代理模式：${shortEndpoint}`;
    return;
  }
  if (mode === 'pixmotion_profile') {
    const shortEndpoint = endpoint.length > 78 ? `${endpoint.slice(0, 78)}...` : endpoint;
    apiStatus.textContent = `AI 影片 API：${shortEndpoint}`;
    return;
  }

  apiStatus.textContent = '本地預覽模式';
}

const DEMO_VIDEO_URL = 'assets/adforge-hero-demo.mp4';
const DEMO_TASK_PREFIX = 'demo_';

let selectedImageFile = null;
let selectedImagePreview = null;
let lastResultUrl = '';

// ===== PARTICLE CANVAS =====
(function(){
  const c=document.getElementById('bgc');
  if(!c)return;
  const ctx=c.getContext('2d');
  let W,H,ps=[];
  function rs(){W=c.width=innerWidth;H=c.height=innerHeight}
  rs();window.addEventListener('resize',rs);
  class P{
    reset(){this.x=Math.random()*W;this.y=Math.random()*H;this.r=Math.random()*1.2+.3;this.vx=(Math.random()-.5)*.25;this.vy=(Math.random()-.5)*.25;this.a=Math.random()*.45+.1;this.col=Math.random()>.5?'141,27,255':'228,85,212'}
    constructor(){this.reset()}
    step(){this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>W||this.y<0||this.y>H)this.reset()}
    draw(){ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fillStyle=`rgba(${this.col},${this.a})`;ctx.fill()}
  }
  for(let i=0;i<70;i++)ps.push(new P());
  function loop(){
    ctx.clearRect(0,0,W,H);
    ps.forEach(p=>{p.step();p.draw()});
    for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++){
      const dx=ps[i].x-ps[j].x,dy=ps[i].y-ps[j].y,d=Math.sqrt(dx*dx+dy*dy);
      if(d<90){ctx.beginPath();ctx.moveTo(ps[i].x,ps[i].y);ctx.lineTo(ps[j].x,ps[j].y);ctx.strokeStyle=`rgba(141,27,255,${.05*(1-d/90)})`;ctx.lineWidth=.5;ctx.stroke()}
    }
    requestAnimationFrame(loop);
  }
  loop();
})();

// ===== BEFORE/AFTER SLIDER =====
(function(){
  const wrap=document.getElementById('baSlider');
  const fw=document.getElementById('baFgWrap');
  const dv=document.getElementById('baDiv');
  const hd=document.getElementById('baHandle');
  if(!wrap)return;
  let drag=false;
  function set(x){
    const r=wrap.getBoundingClientRect();
    let p=Math.max(.05,Math.min(.95,(x-r.left)/r.width));
    const pStr=(p*100)+'%';
    fw.style.width=pStr;dv.style.left=pStr;hd.style.left=pStr;
  }
  wrap.addEventListener('mousedown',e=>{drag=true;set(e.clientX);e.preventDefault()});
  window.addEventListener('mousemove',e=>{if(drag)set(e.clientX)});
  window.addEventListener('mouseup',()=>drag=false);
  wrap.addEventListener('touchstart',e=>{drag=true;set(e.touches[0].clientX)},{passive:true});
  window.addEventListener('touchmove',e=>{if(drag)set(e.touches[0].clientX)},{passive:true});
  window.addEventListener('touchend',()=>drag=false);
})();

// ===== RENDER =====
function renderGallery(cat='all'){
  const items=cat==='all'?GALLERY:GALLERY.filter(d=>d.cat===cat);
  document.getElementById('ggrid').innerHTML=items.length?items.map(d=>`
    <div class="gitem fu" onclick="showToast('▶ 正在播放影片…','info')">
      <div class="gthumb" style="background:${d.bg}">
        <span class="gthumb-emoji">${d.em}</span>
        <div class="ghover"><div class="play-btn"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></div></div>
      </div>
      <div class="ginfo">
        <div class="gprompt">${d.prompt}</div>
        <div class="gmodel"><span class="gmodel-dot"></span> ${d.model}</div>
      </div>
    </div>`).join('')
    :'<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--t3)">此分類暫無作品</div>';
  observeFU();
}

function renderModels(){
  document.getElementById('mgrid').innerHTML=MODELS.map((m,i)=>`
    <div class="mcard fu${i===0?' on':''}" onclick="selModelCard(this,'${m.name}')">
      <div class="mc-em">${m.em}</div>
      <div class="mc-name">${m.name}</div>
      <div class="mc-tag ${m.tag}">${m.tl}</div>
      <div class="mc-desc">${m.desc}</div>
    </div>`).join('');
  observeFU();
}

function renderEffects(){
  document.getElementById('effRow').innerHTML=EFFECTS.map(e=>`
    <div class="eitem" onclick="showToast('已套用「${e.name}」效果','info')">
      <div class="ethumb" style="background:${e.bg}">${e.em}</div>
      <div class="ename">${e.name}</div>
    </div>`).join('');
  // Drag-scroll
  const sc=document.getElementById('effScroll');
  let down=false,startX,scrollL;
  sc.addEventListener('mousedown',e=>{down=true;startX=e.pageX-sc.offsetLeft;scrollL=sc.scrollLeft;sc.style.cursor='grabbing'});
  sc.addEventListener('mouseleave',()=>{down=false;sc.style.cursor='grab'});
  sc.addEventListener('mouseup',()=>{down=false;sc.style.cursor='grab'});
  sc.addEventListener('mousemove',e=>{if(!down)return;e.preventDefault();sc.scrollLeft=scrollL-(e.pageX-sc.offsetLeft-startX)});
}

function renderFAQ(){
  document.getElementById('flist').innerHTML=FAQ.map((f,i)=>`
    <div class="fitem" id="fq${i}">
      <div class="fq" onclick="toggleFAQ(${i})">
        <span>${f.q}</span>
        <span class="fic">+</span>
      </div>
      <div class="fans"><div class="fans-in">${f.a}</div></div>
    </div>`).join('');
}

// ===== INTERACTIONS =====
function selModel(el){
  document.querySelectorAll('.mt').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  const name=el.dataset.m;
  showToast(`已選擇 ${name.toUpperCase()} 模型`,'info');
}

function selModelCard(el,name){
  document.querySelectorAll('.mcard').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  showToast(`已選擇 ${name} 模型`,'info');
}

function filterG(el,cat){
  document.querySelectorAll('.gtab').forEach(t=>t.classList.remove('on'));
  el.classList.add('on');
  renderGallery(cat);
}

function toggleFAQ(i){
  const item=document.getElementById('fq'+i);
  const was=item.classList.contains('open');
  document.querySelectorAll('.fitem').forEach(f=>f.classList.remove('open'));
  if(!was)item.classList.add('open');
}

// ===== FILE UPLOAD =====
function ev(e,type){
  e.preventDefault();
  const dz=document.getElementById('dz');
  if(type==='over')dz.classList.add('drag');
  else if(type==='leave')dz.classList.remove('drag');
  else if(type==='drop'){dz.classList.remove('drag');const f=e.dataTransfer.files[0];if(f&&f.type.startsWith('image/'))loadImg({target:{files:[f]}})}
}

function loadImg(e){
  const f=e.target.files[0];if(!f)return;
  if(!f.type.startsWith('image/')){
    showToast('請上傳圖片格式（JPG、PNG、BMP）','error');
    return;
  }
  if(f.size>5*1024*1024){showToast('圖片大小不能超過 5MB','error');return}

  selectedImageFile=f;
  selectedImagePreview = f ? URL.createObjectURL(f) : '';

  const r=new FileReader();
  r.onload=function(ev){
    const dz=document.getElementById('dz');
    dz.classList.add('loaded');
    dz.onclick=null;
    dz.innerHTML=`<img src="${ev.target.result}" alt="上傳圖片"><div class="dz-loaded-badge">✓ 圖片已就緒</div>`;
    showToast('圖片上傳成功！可以開始生成了','success');
  };
  r.readAsDataURL(f);
}

function getSelectedModel(){
  const selectedModel = document.querySelector('.mt.on');
  if(selectedModel?.dataset.m) {
    return selectedModel.dataset.m;
  }
  const selectedCard = document.querySelector('.mcard.on');
  if(selectedCard) {
    const txt = selectedCard.querySelector('.mc-name')?.textContent || 'Veo 3';
    return txt.trim();
  }
  return 'Veo 3';
}

function parseDisplayToValue(text, fallback='') {
  const raw = (text || '').trim();
  if(!raw) return fallback;
  const num = raw.match(/\d+(?:\.\d+)?/);
  if(num && num[0]) {
    return num[0];
  }
  return raw;
}

function formatTaskPayload(){
  const prompt = document.getElementById('ptinp')?.value.trim() || '';
  const duration = parseDisplayToValue(document.getElementById('durationSel')?.value, '5');
  const ratio = (document.getElementById('ratioSel')?.value || '16:9').split(' ')[0];
  const quality = parseDisplayToValue(document.getElementById('qualitySel')?.value, '720');
  const motion = (document.getElementById('motionSel')?.value || '中等');
  const model = getSelectedModel();
  return {
    prompt,
    duration: Number(duration) || 5,
    ratio: ratio || '16:9',
    quality,
    motion,
    model,
    imageFile: selectedImageFile
  };
}

function setGeneratingState(start, percent=0) {
  const prog=document.getElementById('prog');
  const fill=document.getElementById('pfill');
  const stat=document.getElementById('pstat');
  const pct=document.getElementById('ppct');
  const btn=document.getElementById('genBtn');
  if(!prog||!fill||!stat||!pct||!btn)return;

  if(start){
    btn.classList.add('loading');
    btn.disabled=true;
    prog.classList.add('vis');
    fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    stat.textContent = '任務初始化…';
    pct.textContent = `${Math.max(0, Math.min(100, percent))}%`;
  } else {
    btn.classList.remove('loading');
    btn.disabled=false;
    stat.textContent='AI 正在分析圖像…';
    pct.textContent='0%';
    fill.style.width='0%';
    prog.classList.remove('vis');
  }
}

function setProgress(percent, message=''){
  const fill=document.getElementById('pfill');
  const stat=document.getElementById('pstat');
  const pct=document.getElementById('ppct');
  if(fill) fill.style.width = `${Math.max(0, Math.min(100, Math.round(percent)))}%`;
  if(pct) pct.textContent = `${Math.max(0, Math.min(100, Math.round(percent)))}%`;
  if(stat && message) stat.textContent = message;
}

function normalizeStatus(raw){
  const status = String(raw?.status || '').toLowerCase();
  const progress = Number(raw?.progress ?? raw?.progressPercent ?? raw?.percent ?? 0);
  const videoUrl = raw?.videoUrl || raw?.video_url || raw?.output_url || raw?.resultUrl || raw?.result_url;
  return {
    taskId: raw?.taskId || raw?.task_id || raw?.requestId || raw?.request_id || raw?.id,
    status: status || 'pending',
    progress: Number.isFinite(progress) ? progress : 0,
    videoUrl,
    message: raw?.message || raw?.statusMessage || raw?.msg || '',
  };
}

function navigateTo(url){
  if(!url) return;
  if(window.top !== window.self) {
    window.top.location.href = url;
    return;
  }
  window.location.href = url;
}

function isDoneStatus(status){
  return ['done', 'completed', 'success', 'succeeded', 'finished'].includes(status);
}

function isErrorStatus(status){
  return ['failed', 'error', 'cancelled', 'canceled', 'timeout'].includes(status);
}

function safeJsonText(text){
  try{
    return JSON.parse(text);
  } catch (e){
    return null;
  }
}

function normalizeRatioDisplay(v) {
  return (String(v || '').match(/\\d+:\\d+/) || ['source'])[0];
}

function normalizeDuration(v, fallback=5) {
  const parsed = Number(v);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return fallback;
}

function normalizeResolution(v, fallback='720p') {
  const lower = String(v || '').toLowerCase();
  if (/(4k|2160)/.test(lower)) return '2160p';
  if (/(1080|fhd|full|2k)/.test(lower)) return '1080p';
  if (/(720|hd)/.test(lower)) return '720p';
  return fallback;
}

function isHttpEndpoint(endpoint) {
  return typeof endpoint === 'string' && /^https?:\/\//i.test(endpoint);
}

function isRelativeFunctionEndpoint(endpoint) {
  return typeof endpoint === 'string' && endpoint.startsWith('/functions/v1/');
}

function resolveHost(endpoint, fallback = '') {
  if (!isHttpEndpoint(endpoint)) {
    return normalizeApiHost(fallback);
  }
  try {
    const u = new URL(endpoint);
    return `${u.protocol}//${u.host}`;
  } catch {
    return normalizeApiHost(fallback);
  }
}

function extractEndpointHost(endpoint) {
  if (!isHttpEndpoint(endpoint)) return '';
  try {
    return new URL(endpoint).host;
  } catch {
    return '';
  }
}

function replaceEndpointHost(endpoint, host) {
  if (!isHttpEndpoint(endpoint)) {
    return endpoint;
  }
  if (!host) return endpoint;

  try {
    const url = new URL(endpoint);
    const target = normalizeApiHost(host);
    return `${target}${url.pathname}${url.search}${url.hash}`;
  } catch {
    if (endpoint.includes('/api/video/status/{taskId}')) {
      return `${normalizeApiHost(host)}/api/video/status/{taskId}`;
    }
    if (endpoint.includes('/api/video/generate')) {
      return `${normalizeApiHost(host)}/api/video/generate`;
    }
    return endpoint;
  }
}

function getPixmotionEndpointCandidates(baseEndpoint) {
  if (!isHttpEndpoint(baseEndpoint) && !isRelativeFunctionEndpoint(baseEndpoint)) {
    return [baseEndpoint];
  }

  if (isRelativeFunctionEndpoint(baseEndpoint)) {
    return [baseEndpoint];
  }

  const currentHost = extractEndpointHost(baseEndpoint);
  const ordered = [
    normalizeApiHost(resolveHost(baseEndpoint, PIXMOTION_DEFAULT_HOST)),
    ...PIXMOTION_HOST_FALLBACKS.map((host) => normalizeApiHost(host)),
  ];

  const deduped = [...new Set(ordered.filter(Boolean))];
  return deduped.map((host) => {
    if (currentHost && normalizeApiHost(currentHost) === host) {
      return baseEndpoint;
    }
    return replaceEndpointHost(baseEndpoint, host);
  });
}

function shouldRetryEndpointStatus(status) {
  if (![401, 403, 410, 422].includes(Number(status))) {
    return Number(status) >= 500 || Number(status) === 404;
  }
  return false;
}

async function fetchWithFailover(endpoints, options) {
  let lastError = null;
  let lastResponse = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, options);
      lastResponse = { response, endpoint };
      if (!response.ok && shouldRetryEndpointStatus(response.status)) {
        lastError = new Error(`API 異常（${response.status}）：${endpoint}`);
        continue;
      }
      return { response, endpoint };
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  if (lastResponse) {
    return lastResponse;
  }
  throw lastError || new Error('所有 API endpoint 都無法回應');
}

function buildJsonPayload(payload) {
  const duration = normalizeDuration(payload.duration, 5);
  return {
    duration,
    resolution: normalizeResolution(payload.quality, '720p'),
    aspectRatio: normalizeRatioDisplay(payload.ratio || 'source'),
    prompt: payload.prompt || '',
    videoMode: 'reference',
  };
}

function buildPixmotionPayload(payload) {
  const basePayload = buildJsonPayload(payload);
  return {
    ...basePayload,
    imageBase64: payload.imageBase64 || '',
    audioMode: payload.audioMode || 'silent',
    templateId: payload.templateId || 'text-to-video'
  };
}

async function fileToDataUrl(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('檔案讀取失敗'));
    reader.readAsDataURL(file);
  });
}

function stripDataUrlPrefix(v) {
  return String(v || '').replace(/^data:[^;,]+;base64,/, '');
}

async function sleep(ms){
  return new Promise((resolve)=>setTimeout(resolve, ms));
}

function buildFormData(payload){
  const formData = new FormData();
  if(payload.imageFile) formData.append('image', payload.imageFile);
  formData.append('prompt', payload.prompt || '');
  formData.append('duration', String(payload.duration || 5));
  formData.append('ratio', payload.ratio || '16:9');
  formData.append('quality', payload.quality || '720');
  formData.append('motion', payload.motion || '中等');
  formData.append('model', payload.model || 'Veo 3');
  return formData;
}

// ===== GENERATE =====
async function doGen(){
  const dz=document.getElementById('dz');
  if(!dz.classList.contains('loaded')){
    showToast('請先上傳一張圖片','error');
    dz.style.borderColor='#f87171';
    setTimeout(()=>dz.style.borderColor='',2000);
    return;
  }
  if(!selectedImageFile){
    showToast('讀取上傳圖片失敗，請重新上傳','error');
    return;
  }

  setGeneratingState(true, 3);
  const btn=document.getElementById('genBtn');
  const start = Date.now();

  try{
    const payload = formatTaskPayload();
    const created = await createVideoTask(payload);
    let finalResult = normalizeStatus(created);

    setProgress(12, 'AI 任務已建立，準備產出…');
    if(isDoneStatus(finalResult.status) && finalResult.videoUrl){
      presentResult(finalResult.videoUrl);
      return;
    }

    if(isErrorStatus(finalResult.status)){
      throw new Error(`任務建立失敗：${finalResult.status}`);
    }

    const taskId = finalResult.taskId || `local_${Date.now()}`;
    const polled = await pollVideoTask(taskId, (percent, message) => {
      setProgress(percent, message || '影片生成中…');
    });
    finalResult = normalizeStatus(polled);

    if(!isDoneStatus(finalResult.status)){
      throw new Error(`任務未完成，狀態：${finalResult.status || 'unknown'}`);
    }

    if(!finalResult.videoUrl){
      throw new Error('任務完成但未返回影片位址');
    }

    presentResult(finalResult.videoUrl);
  } catch (error) {
    console.error('[image-to-video] API flow error:', error);
    const rawMessage = String(error?.message || 'unknown').toLowerCase();
    if (rawMessage === AUTH_REQUIRED_ERROR.toLowerCase() || rawMessage.includes('auth_required')) {
      showToast('PixMotion API 需要授權 Token，先登入官方站再貼 token，或改用展示流程。', 'info');
      await useMockResult();
      return;
    }
    if (rawMessage.includes('401') || rawMessage.includes('unauthorized')) {
      showToast('目前 API 需要登入 PixMotion 權限，暫時先顯示本地展示結果。', 'info');
    } else {
      showToast('後端 API 尚未啟用，已切到本地展示結果','info');
    }
    await useMockResult();
  } finally {
    const elapsed = Date.now() - start;
    if(!selectedImageFile || elapsed > VIDEO_API_CONFIG.timeoutMs){
      showToast('請確認檔案與網路連線穩定，必要時再試一次','info');
    }
    btn.textContent = '✦ 立即生成影片';
    setGeneratingState(false);
    document.getElementById('result')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
}

async function useMockResult() {
  try{
    const fallback = await submitImageToVideoMock(formatTaskPayload());
    const fallbackPoll = await pollVideoTask(fallback.taskId);
    const result = normalizeStatus(fallbackPoll);
    presentResult(result.videoUrl || DEMO_VIDEO_URL);
  }catch(e){
    presentResult(DEMO_VIDEO_URL, {message:'使用展示結果'});
  }
}

function presentResult(videoUrl, options = {}) {
  const video = document.getElementById('rvideo');
  const resultBlock = document.getElementById('result');
  const button = document.getElementById('genBtn');

  lastResultUrl = videoUrl || DEMO_VIDEO_URL;
  if(video){
    video.src = lastResultUrl;
    video.load();
    video.play?.();
  }
  resultBlock?.classList.add('vis');
  if(button) button.textContent='✦ 重新生成影片';
  showToast(options.message || '🎉 影片生成成功！','success');
  setProgress(100, options.message || '生成完成');
}

async function submitImageToVideoMock(payload){
  return new Promise((resolve)=>{
    const taskId = `${DEMO_TASK_PREFIX}${Date.now()}`;
    resolve({ taskId, status: 'done', payload });
  });
}

async function createVideoTask(payload) {
  if (VIDEO_API_CONFIG.requiresAuth && !VIDEO_API_CONFIG.authToken && isRealFlowEnabled()) {
    throw new Error(AUTH_REQUIRED_ERROR);
  }

  const formData = buildFormData(payload);
  let body = formData;
  const endpoint = VIDEO_API_CONFIG.createEndpoint;
  if(!isApiReady(endpoint) || endpoint.includes('sandbox') || endpoint.includes('/mock') || endpoint.startsWith('mock')){
    return submitImageToVideoMock(payload);
  }

  const headers = Object.assign({}, VIDEO_API_CONFIG.headers || {});
  if (VIDEO_API_CONFIG.authToken) {
    headers.Authorization = `Bearer ${VIDEO_API_CONFIG.authToken}`;
  }
  const options = { method: 'POST', headers };
  if (VIDEO_API_CONFIG.credentials) {
    options.credentials = VIDEO_API_CONFIG.credentials;
  }

  if (VIDEO_API_CONFIG.bodyMode === 'json') {
    if (payload.imageFile && !payload.imageBase64) {
      payload.imageBase64 = stripDataUrlPrefix(await fileToDataUrl(payload.imageFile));
    }
    const payloadBuilder = VIDEO_API_CONFIG.apiProfile === 'pixmotion' ? buildPixmotionPayload : buildJsonPayload;
    body = JSON.stringify(payloadBuilder(payload));
    options.headers['Content-Type'] = 'application/json';
  }

  const candidates = getPixmotionEndpointCandidates(endpoint);
  const { response } = await fetchWithFailover(candidates, { ...options, body });

  if(!response.ok){
    const errText = await response.text();
    const errObj = safeJsonText(errText);
    throw new Error(errObj?.error || `建立任務失敗（${response.status}）`);
  }

  const data = await response.json().catch(()=>({}));
  const result = normalizeStatus(data);
  if(result.status === 'done' && !result.videoUrl) {
    throw new Error('建立回傳完成但未提供影片位址');
  }
  return { ...result, ...data };
}

async function pollVideoTask(taskId, onUpdate) {
  const endpoint = VIDEO_API_CONFIG.pollEndpoint;
  if(!isApiReady(endpoint) || endpoint.includes('sandbox') || endpoint.includes('/mock') || endpoint.startsWith('mock')){
    return submitImageToVideoMock({taskId});
  }
  const isPathPolling = endpoint.includes('{taskId}');
  const altPollEndpoint = endpoint.includes('/video/status/') ? endpoint.replace('/video/status/', '/videos/') : '';
  const headers = Object.assign({}, VIDEO_API_CONFIG.headers || {});
  if (VIDEO_API_CONFIG.authToken) {
    headers.Authorization = `Bearer ${VIDEO_API_CONFIG.authToken}`;
  }
  const options = {
    method: 'GET',
    headers,
  };
  if (VIDEO_API_CONFIG.credentials) {
    options.credentials = VIDEO_API_CONFIG.credentials;
  }

  const endpoints = getPixmotionEndpointCandidates(endpoint);

  for(let i=0;i<VIDEO_API_CONFIG.maxPollAttempts;i++){
    const attemptStartedAt = Date.now();
    const endpointCandidates = endpoints.map((item) => {
      const finalEndpoint = isPathPolling
        ? item.replace('{taskId}', encodeURIComponent(taskId))
        : item;
      const url = new URL(finalEndpoint, location.origin);
      if (!isPathPolling) {
        url.searchParams.set('taskId', taskId);
      }
      return url.toString();
    });

    let response = null;
    for (const pollUrl of endpointCandidates) {
      try {
        response = await fetch(pollUrl, options);
        if (!response.ok && shouldRetryEndpointStatus(response.status)) {
          continue;
        }
        break;
      } catch {
        response = null;
      }
    }

    if (!response) {
      throw new Error(`查詢任務失敗（endpoint error）`);
    }

    if (!response.ok && altPollEndpoint) {
      const alt = altPollEndpoint.replace('{taskId}', encodeURIComponent(taskId));
      const altUrl = new URL(alt, location.origin);
      if (!isPathPolling && taskId) {
        altUrl.searchParams.set('videoId', taskId);
      }
      response = await fetch(altUrl.toString(), options);
    }
    if(!response.ok){
      throw new Error(`查詢任務失敗（${response.status}）`);
    }

    const data = await response.json().catch(()=>({}));
    const normalized = normalizeStatus(data);
    const status = (normalized.status || '').toLowerCase();
    const progress = Number.isFinite(normalized.progress) ? normalized.progress : Math.min(95, i* (95 / VIDEO_API_CONFIG.maxPollAttempts));
    const msg = normalized.message || `任務進行中…（${status || 'processing'}）`;
    if(onUpdate) onUpdate(progress, msg);

    if(isDoneStatus(status) && normalized.videoUrl){
      return normalized;
    }
    if(isErrorStatus(status)){
      throw new Error(`任務失敗：${normalized.message || status}`);
    }

    const elapsed = Date.now() - attemptStartedAt;
    await sleep(Math.max(VIDEO_API_CONFIG.pollIntervalMs - elapsed, 400));
  }

  return submitImageToVideoMock({taskId, status: 'done'});
}

function doReset(){
  const dz=document.getElementById('dz');
  dz.classList.remove('loaded');
  if(selectedImagePreview) {
    URL.revokeObjectURL(selectedImagePreview);
  }
  selectedImageFile = null;
  selectedImagePreview = null;
  lastResultUrl = '';
  dz.onclick=()=>document.getElementById('fin').click();
  dz.innerHTML=`
    <div class="dz-icon"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
    <div class="dz-main">拖曳圖片至此，或點擊上傳</div>
    <div class="dz-sub">支援 JPG · JPEG · PNG · BMP，最大 5MB</div>
    <button class="dz-btn"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> 選擇圖片</button>`;
  document.getElementById('result').classList.remove('vis');
  document.getElementById('ptinp').value='';
  document.getElementById('fin').value='';
  showToast('已重置，開始新的創作吧！','info');
}

function doShare(){
  if(navigator.share){navigator.share({title:'ADFORGE 圖片轉影片',text:'我用 ADFORGE 圖片轉影片功能做了素材測試',url:location.href})}
  else{navigator.clipboard&&navigator.clipboard.writeText(location.href).then(()=>showToast('連結已複製！','success')).catch(()=>showToast('請手動複製頁面連結','info'))}
}

function downloadDemo(){
  if(!lastResultUrl){
    showToast('尚未生成結果，先建立一次影片再下載','info');
    return;
  }
  const a=document.createElement('a');
  a.href=lastResultUrl;
  a.download = `adforge-video-${Date.now()}.mp4`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast('影片下載已開始','success');
}

function bindAuthPanel() {
  const tokenInput = document.getElementById('pixmotionToken');
  const saveBtn = document.getElementById('saveTokenBtn');
  const clearBtn = document.getElementById('clearTokenBtn');
  if (!tokenInput || !saveBtn || !clearBtn) return;

  saveBtn.addEventListener('click', () => {
    const ok = applyTokenToFlow(tokenInput.value);
    if (ok) {
      showToast('PixMotion token 已儲存，重新生成即可走正式 API。','success');
      const hasEndpoints = Boolean(
        (VIDEO_API_CONFIG.createEndpoint || '').trim() &&
        (VIDEO_API_CONFIG.pollEndpoint || '').trim()
      );
      if (VIDEO_API_CONFIG.apiProfile === 'pixmotion' && !hasEndpoints) {
        const recovered = resolvePixmotionEndpoints(cloneJson(VIDEO_API_PROFILES.pixmotion));
        VIDEO_API_CONFIG.createEndpoint = recovered.createEndpoint;
        VIDEO_API_CONFIG.pollEndpoint = recovered.pollEndpoint;
        renderApiStatus();
      }
    } else {
      showToast('token 格式有誤，請確認完整貼上。','error');
    }
  });

  clearBtn.addEventListener('click', () => {
    tokenInput.value = '';
    clearPixmotionToken();
    VIDEO_API_CONFIG.authToken = '';
    renderApiStatus();
    updateAuthUI();
    showToast('已清除 token。','info');
  });
}

function syncAuthPanelState() {
  const input = document.getElementById('pixmotionToken');
  if (input && VIDEO_API_CONFIG.authToken) {
    if (!input.value) {
      input.value = VIDEO_API_CONFIG.authToken;
    }
  }
  updateAuthUI();
}

function toOrderFlow(){
  navigateTo('app.html?source=image-to-video');
}

// ===== TOAST =====
function showToast(msg,type='info'){
  const icons={success:'✅',error:'❌',info:'💜'};
  const c=document.getElementById('toastC');
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{t.style.cssText='opacity:0;transform:translateX(16px);transition:all .3s';setTimeout(()=>t.remove(),300)},3200);
}

// ===== FADE-UP OBSERVER =====
function observeFU(){
  const obs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('vis');obs.unobserve(e.target)}});
  },{threshold:.1});
  document.querySelectorAll('.fu:not(.vis)').forEach(el=>obs.observe(el));
}

// ===== HERO ENTRANCE =====
function heroIn(){
  const el=document.getElementById('heroIn');
  if(!el)return;
  [...el.children].forEach((c,i)=>{
    c.style.cssText=`opacity:0;transform:translateY(26px);transition:opacity .7s ${i*.13}s ease,transform .7s ${i*.13}s ease`;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{c.style.opacity='1';c.style.transform='translateY(0)'}));
  });
}

// ===== STATS COUNTER =====
let statsDone=false;
function initStats(){
  const strip=document.querySelector('.stats');
  if(!strip)return;
  new IntersectionObserver(entries=>{
    if(entries[0].isIntersecting&&!statsDone){
      statsDone=true;
      // already showing static values, optionally animate
    }
  },{threshold:.3}).observe(strip);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded',()=>{
  renderApiStatus();
  bindAuthPanel();
  syncAuthPanelState();
  heroIn();
  renderGallery();
  renderModels();
  renderEffects();
  renderFAQ();
  observeFU();
  initStats();
  // Watch dynamic content
  const mo=new MutationObserver(observeFU);
  ['ggrid','mgrid'].forEach(id=>{
    const el=document.getElementById(id);
    if(el)mo.observe(el,{childList:true});
  });
});
