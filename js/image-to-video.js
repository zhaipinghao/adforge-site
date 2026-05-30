// [NEEDS_REPLACEMENT] 目前為純前端 mock 版：無外部 API 呼叫，進度與結果僅做示意。
// 待串接正式影像生成 API 時，可在 doGen() 內送出上傳檔案與參數，並用回傳 URL 取代 demo 視訊。

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
  {q:'1. 支援哪些圖片格式？',a:'目前示意頁支援 JPG、JPEG、PNG、BMP，建議不超過 5MB。正式專案接單流程將依你提供檔案規格規劃。'},
  {q:'2. 從圖片生成影片需要多久？',a:'展示頁為模擬流程，時間以載入體感為主；實際正式交付依素材複雜度、排程與規格而定。'},
  {q:'3. 上傳的圖片有大小限制嗎？',a:'為了體驗流暢，示意頁限制 5MB。正式交付建議提供清晰原始圖，並可改用較大解析度版本。'},
  {q:'4. 原始圖片與結果如何保存？',a:'目前展示頁不做永久存檔。完成測試後請直接透過訂單提交原圖與素材需求，讓服務團隊做正式交付。'},
  {q:'5. 是否能拿去商用？',a:'正式 ADFORGE 交付素材可依你選購方案作商用用途。建議用「建立訂單」完成合約確認。'},
  {q:'6. 這是免費試用嗎？',a:'這個頁面為展示版，流程參考用。若要實際製作，請到 ADFORGE 登入下單。'},
];

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
  if(f.size>5*1024*1024){showToast('圖片大小不能超過 5MB','error');return}
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

// ===== GENERATE =====
function doGen(){
  const dz=document.getElementById('dz');
  if(!dz.classList.contains('loaded')){
    showToast('請先上傳一張圖片','error');
    dz.style.borderColor='#f87171';
    setTimeout(()=>dz.style.borderColor='',2000);
    return;
  }
  const btn=document.getElementById('genBtn');
  btn.classList.add('loading');btn.disabled=true;
  const prog=document.getElementById('prog');
  const fill=document.getElementById('pfill');
  const stat=document.getElementById('pstat');
  const pct=document.getElementById('ppct');
  prog.classList.add('vis');
  const steps=[
    {p:10,s:'AI 正在分析圖像結構…'},
    {p:24,s:'識別主體與背景元素…'},
    {p:42,s:'生成動態運動軌跡…'},
    {p:58,s:'渲染影格序列…'},
    {p:73,s:'套用視覺效果與色調…'},
    {p:88,s:'最終畫質優化…'},
    {p:100,s:'生成完成！🎉'},
  ];
  let si=0;
  // [NEEDS_REPLACEMENT] 以下進度為假資料，接 API 後改為「輪詢任務狀態」並依回傳填值。
  const iv=setInterval(()=>{
    if(si>=steps.length){
      clearInterval(iv);
      setTimeout(()=>{
        btn.classList.remove('loading');btn.disabled=false;
        prog.classList.remove('vis');fill.style.width='0%';
        document.getElementById('result').classList.add('vis');
        showToast('🎉 影片生成成功！','success');
        document.getElementById('result').scrollIntoView({behavior:'smooth',block:'center'});
      },600);
      return;
    }
    const s=steps[si++];
    fill.style.width=s.p+'%';stat.textContent=s.s;pct.textContent=s.p+'%';
  },700);
}

function doReset(){
  const dz=document.getElementById('dz');
  dz.classList.remove('loaded');
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
  showToast('此為展示片段，完整檔案請改由正式訂單下載','info');
}

function toOrderFlow(){
  window.location.href='app.html?source=image-to-video';
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
