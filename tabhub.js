/* ---------- mock data ---------- */
// brand: { main:'#hex', tint:'#hex' (淡色背景) }
const BRANDS = {
  'feishu.cn':       { main:'#3370FF', tint:'#E6EFFF' },
  'github.com':      { main:'#0E0F12', tint:'#E8E8EB' },
  'claude.ai':       { main:'#D97757', tint:'#FCEEE5' },
  'developer.chrome.com': { main:'#4285F4', tint:'#E4ECFE' },
  'notion.so':       { main:'#0E0F12', tint:'#ECEAE5' },
  'figma.com':       { main:'#F24E1E', tint:'#FFE7DF' },
  'youtube.com':     { main:'#FF0000', tint:'#FFE0E0' },
  'stackoverflow.com':{ main:'#F48024', tint:'#FFEDD9' },
  'localhost':       { main:'#1FA37A', tint:'#DAF3EA' },
};
function favUrl(host, fallbackUrl){
  // 扩展环境优先用 Chrome 内置 _favicon（manifest 已声明 favicon 权限）
  if(typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL){
    const pageUrl = fallbackUrl || `https://${host}/`;
    return chrome.runtime.getURL(`_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=64`);
  }
  // web 预览走 Google s2 兜底
  return `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
}

/* ---------- real chrome.tabs data ---------- */
const isExt = typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query;
let DATA = [];
let SELF_TAB_ID = null;
let WINDOW_COUNT = 1;

function hostOf(url){
  try{
    const u = new URL(url);
    if(u.protocol==='chrome:'||u.protocol==='chrome-extension:'||u.protocol==='edge:'||u.protocol==='about:') return u.protocol.replace(':','');
    const h = u.hostname;
    // eTLD+1 简化版：去掉 www. 前缀，其余直接用 hostname
    return h.replace(/^www\./,'');
  }catch(_){ return 'unknown'; }
}

function ago(ts){
  if(!ts) return '';
  const d = Math.max(0, Date.now()-ts);
  const s = Math.floor(d/1000);
  if(s<60) return `${s}s 前`;
  const m = Math.floor(s/60);
  if(m<60) return `${m} 分钟前`;
  const h = Math.floor(m/60);
  if(h<24) return `${h} 小时前`;
  return `${Math.floor(h/24)} 天前`;
}

async function loadRealTabs(){
  const tabs = await chrome.tabs.query({});
  const wins = new Set(tabs.map(t=>t.windowId));
  WINDOW_COUNT = wins.size;
  const self = await chrome.tabs.getCurrent();
  SELF_TAB_ID = self ? self.id : null;
  const groups = new Map();
  for(const t of tabs){
    if(t.id===SELF_TAB_ID) continue; // 不展示自己
    const host = hostOf(t.url || t.pendingUrl || '');
    if(!groups.has(host)) groups.set(host, []);
    groups.get(host).push({
      id: t.id,
      t: t.title || t.url || '(无标题)',
      url: t.url || '',
      last: ago(t.lastAccessed),
      lastTs: t.lastAccessed || 0,
      active: t.active,
      windowId: t.windowId,
      pinned: t.pinned,
    });
  }
  DATA = [...groups.entries()].map(([host, list])=>({
    host,
    tabs: list.sort((a,b)=>(b.lastTs||0)-(a.lastTs||0)),
  })).sort((a,b)=>b.tabs.length-a.tabs.length);
  updateHeaderCounts();
}

function updateHeaderCounts(){
  const totalTabs = DATA.reduce((s,g)=>s+g.tabs.length,0);
  const totalDomains = DATA.length;
  // hero-left 文案
  const h1 = document.querySelector('.hero-left h1');
  if(h1) h1.innerHTML = `当前打开 <em>${totalTabs} 个</em> 标签，<br/>来自 <span class="hl">${totalDomains} 个域名</span>。`;
  // hero-right stats
  const stats = document.querySelectorAll('.hero-right .stat-n');
  if(stats[0]) stats[0].textContent = totalTabs;
  if(stats[1]) stats[1].textContent = totalDomains;
  if(stats[2]) stats[2].textContent = WINDOW_COUNT;
  // topbar 摘要
  const sum = document.querySelector('.topbar-sum');
  if(sum) sum.textContent = `现在共有 ${totalTabs} 个标签 · ${WINDOW_COUNT} 个窗口 · ${totalDomains} 个分类`;
}

/* ---------- mock fallback (dev/preview without ext) ---------- */
const MOCK_DATA = [
  // feishu.cn — 7 tabs
  { host:'feishu.cn', color:'blue', initial:'飞', tabs:[
    { t:'lark-channel-bridge 项目空间', p:'open.feishu.cn/document/UkY...', last:'2 分钟前', active:true },
    { t:'飞书开放平台 · 卡片 v2 文档', p:'open.feishu.cn/document/...card-v2', last:'14 分钟前' },
    { t:'CardKit 在线预览 · TabHub v1', p:'open.feishu.cn/cardkit/...', last:'1 小时前' },
    { t:'我的临时暂存文档', p:'my.feishu.cn/wiki/T718wEwRxiGp...', last:'3 小时前' },
    { t:'奇思妙想 · TabHub 立项', p:'my.feishu.cn/wiki/VkS4d6uF0o95...', last:'4 小时前' },
    { t:'飞书机器人 webhook 自查表', p:'open.feishu.cn/document/...bot-faq', last:'昨天' },
    { t:'群消息卡片回调机制', p:'open.feishu.cn/document/...interactive', last:'昨天' },
  ]},
  // github.com — 6
  { host:'github.com', color:'ink', initial:'GH', tabs:[
    { t:'larksuite/lark-channel-bridge', p:'github.com/larksuite/lark...', last:'5 分钟前', active:true },
    { t:'wxt-dev/wxt — Next-gen WebExt framework', p:'github.com/wxt-dev/wxt', last:'25 分钟前' },
    { t:'PR #182 · feat(card): cardkit 2.0 schema', p:'github.com/.../pull/182', last:'1 小时前' },
    { t:'Issue #441 · masonry break-inside Safari', p:'github.com/.../issues/441', last:'2 小时前' },
    { t:'tldraw/tldraw — canvas SDK', p:'github.com/tldraw/tldraw', last:'昨天' },
    { t:'anthropics/claude-code', p:'github.com/anthropics/claude-code', last:'昨天' },
  ]},
  // chatgpt + claude + anthropic
  { host:'claude.ai', color:'orange', initial:'C', tabs:[
    { t:'TabHub 立项讨论 · session 12', p:'claude.ai/chat/...', last:'1 分钟前', active:true },
    { t:'设计 token 对齐 Pages 暖色', p:'claude.ai/chat/...', last:'30 分钟前' },
    { t:'WXT vs Plasmo 对比', p:'claude.ai/chat/...', last:'2 小时前' },
    { t:'飞书机器人最佳实践', p:'claude.ai/chat/...', last:'昨天' },
    { t:'EdgeOne Pages CI 自动化', p:'claude.ai/chat/...', last:'昨天' },
    { t:'Manifest V3 service worker 生命周期', p:'claude.ai/chat/...', last:'2 天前' },
  ]},
  { host:'developer.chrome.com', color:'yellow', initial:'Cr', tabs:[
    { t:'chrome.tabs · API reference', p:'developer.chrome.com/docs/.../tabs', last:'1 小时前' },
    { t:'chrome.tabGroups · Manifest V3', p:'developer.chrome.com/docs/.../tabGroups', last:'1 小时前' },
    { t:'New Tab override 指引', p:'developer.chrome.com/docs/.../override', last:'2 小时前' },
    { t:'Service Workers · MV3', p:'developer.chrome.com/docs/.../service-workers', last:'3 小时前' },
  ]},
  { host:'notion.so', color:'ink', initial:'N', tabs:[
    { t:'Product Roadmap Q2', p:'notion.so/lytton/...', last:'40 分钟前' },
    { t:'每周复盘 · Week 21', p:'notion.so/lytton/...', last:'昨天' },
    { t:'Tab 管理需求池', p:'notion.so/lytton/...', last:'2 天前' },
  ]},
  { host:'figma.com', color:'purple', initial:'Fg', tabs:[
    { t:'TabHub · 瀑布卡设计稿', p:'figma.com/file/...', last:'10 分钟前' },
    { t:'Pages 设计系统 v2', p:'figma.com/file/...', last:'昨天' },
  ]},
  { host:'youtube.com', color:'red', initial:'Y', tabs:[
    { t:'CSS Masonry 实战 · 2025', p:'youtube.com/watch?v=...', last:'昨天' },
    { t:'Lo-fi Hip Hop Radio 24/7', p:'youtube.com/watch?v=...', last:'昨天' },
  ]},
  { host:'stackoverflow.com', color:'orange', initial:'SO', tabs:[
    { t:'CSS column break-inside avoid not working', p:'stackoverflow.com/q/...', last:'1 小时前' },
    { t:'Web Audio API short blip example', p:'stackoverflow.com/q/...', last:'2 小时前' },
  ]},
  { host:'localhost', color:'green', initial:'L', tabs:[
    { t:'TabHub v1 · 瀑布流原型', p:'localhost:8768/', last:'刚刚', active:true },
  ]},
];
DATA = MOCK_DATA;
DATA.sort((a,b)=>b.tabs.length-a.tabs.length);

/* ---------- render ---------- */
const COLLAPSE_AT = 5;
const state = { expanded:new Set(), filter:'all', removed:new Set() };

function render(){
  const mount = document.getElementById('masonry');
  mount.innerHTML = '';
  for(const site of DATA){
    if(state.removed.has(site.host)) continue;
    const tabs = (site.tabs||[]).filter(tb => !state.removed.has(site.host+'|'+(tb.t||'')));
    if(!tabs.length){ state.removed.add(site.host); continue; }
    const expanded = state.expanded.has(site.host) || tabs.length<=COLLAPSE_AT;
    const visible = expanded ? tabs : tabs.slice(0,COLLAPSE_AT);

    const card = document.createElement('section');
    card.className = 'card';
    card.dataset.host = site.host;
    const brand = BRANDS[site.host] || { main:'#0E0F12', tint:'#EDE6D8' };
    card.style.setProperty('--brand', brand.main);
    card.style.setProperty('--brand-tint', brand.tint);
    const initial = (site.initial || (site.host||'?').slice(0,2).toUpperCase());
    const sampleUrl = (tabs[0] && tabs[0].url) || '';
    const fav = favUrl(site.host, sampleUrl);
    const lastTxt = (tabs[0] && tabs[0].last) ? `· 最近 ${tabs[0].last}` : '';
    card.innerHTML = `
      <header class="card-head">
        <div class="fav"><img src="${fav}" alt="" referrerpolicy="no-referrer" data-fallback="${initial.replace(/"/g,'&quot;')}"/></div>
        <div class="host">
          <div class="host-name">${site.host}</div>
          <div class="host-meta"><b>${tabs.length}</b> 个标签 ${lastTxt}</div>
        </div>
        <button class="card-close" title="关闭该域名全部标签" data-act="close-card">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </header>
      <div class="tabs">
        ${visible.map(tb => `
          <div class="tab ${tb.active?'active':''}" data-title="${(tb.t||'').replace(/"/g,'&quot;')}" data-tab-id="${tb.id||''}">
            <span class="tab-dot"></span>
            <span class="tab-title">${(tb.t||'(无标题)').replace(/</g,'&lt;')}</span>
            <button class="tab-x" data-act="close-tab" title="关闭"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
          </div>`).join('')}
      </div>
      ${tabs.length>COLLAPSE_AT ? `<button class="expand" data-act="toggle">${expanded?'收起':`展开剩余 ${tabs.length-COLLAPSE_AT} 个`}</button>` : ''}
      <footer class="card-foot">
        <span>窗口 · Main</span>
        <span class="spacer"></span>
        <button class="mini-btn" data-act="archive">归档</button>
        <button class="mini-btn danger" data-act="close-card">全部关掉</button>
      </footer>
    `;
    mount.appendChild(card);
  }
  // CSP 不允许 inline onerror — 用事件委托处理 fav 加载失败
  mount.querySelectorAll('img[data-fallback]').forEach(img=>{
    img.addEventListener('error', ()=>{
      const span = document.createElement('span');
      span.textContent = img.dataset.fallback;
      span.className = 'fav-fallback';
      img.replaceWith(span);
    }, { once:true });
  });
}

/* ---------- interactions ---------- */
document.addEventListener('click', (e)=>{
  const card = e.target.closest('.card');
  if(!card) return;
  const host = card.dataset.host;

  if(e.target.closest('[data-act="toggle"]')){
    state.expanded.has(host) ? state.expanded.delete(host) : state.expanded.add(host);
    render(); return;
  }
  if(e.target.closest('[data-act="close-tab"]')){
    const tabEl = e.target.closest('.tab');
    const r = tabEl.getBoundingClientRect();
    blip(440,.08); fireworks(r.right-12, r.top+r.height/2, 14);
    tabEl.classList.add('closing');
    const id = Number(tabEl.dataset.tabId);
    setTimeout(()=>{
      if(isExt && id){ chrome.tabs.remove(id).catch(()=>{}); }
      else { state.removed.add(host+'|'+tabEl.dataset.title); render(); }
    }, 280);
    return;
  }
  if(e.target.closest('[data-act="close-card"]')){
    const r = card.getBoundingClientRect();
    blip(330,.14); fireworks(r.left+r.width/2, r.top+60, 42);
    card.classList.add('closing');
    setTimeout(()=>{
      if(isExt){
        const group = DATA.find(g=>g.host===host);
        if(group){
          const ids = group.tabs.map(t=>t.id).filter(Boolean);
          if(ids.length) chrome.tabs.remove(ids).catch(()=>{});
        }
      } else { state.removed.add(host); render(); }
    }, 350);
    return;
  }
  if(e.target.closest('[data-act="archive"]')){
    const r = card.getBoundingClientRect();
    blip(560,.10); fireworks(r.left+r.width/2, r.top+60, 24);
    card.classList.add('closing');
    setTimeout(()=>{
      if(isExt){
        const group = DATA.find(g=>g.host===host);
        if(group){
          const ids = group.tabs.map(t=>t.id).filter(Boolean);
          if(ids.length) chrome.tabs.remove(ids).catch(()=>{});
        }
      } else { state.removed.add(host); render(); }
    }, 350);
    return;
  }
  // 点 tab 行其它区域（非按钮）= 切换到该 tab
  const tabEl = e.target.closest('.tab');
  if(tabEl && isExt){
    const id = Number(tabEl.dataset.tabId);
    if(id){
      // 轻触反馈：闪一下
      tabEl.classList.add('switching');
      setTimeout(()=>tabEl.classList.remove('switching'), 300);
      const t = DATA.flatMap(g=>g.tabs).find(x=>x.id===id);
      // 先把目标 window 提到前台，再把目标 tab 激活
      (async()=>{
        try{
          if(t && t.windowId) await chrome.windows.update(t.windowId, { focused:true });
          await chrome.tabs.update(id, { active:true });
        }catch(err){ console.warn('[TabHub] switch failed', err); }
      })();
    }
  }
});

document.querySelectorAll('.chip').forEach(c=>{
  c.addEventListener('click', ()=>{
    document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));
    c.classList.add('active');
    state.filter = c.dataset.filter;
  });
});

/* ---------- audio: "click/snap" two-tick ---------- */
let ac;
function ensureAc(){ ac = ac || new (window.AudioContext||window.webkitAudioContext)(); return ac; }
function noiseBurst(when, duration=0.022, gain=0.18, hp=2200){
  const a = ensureAc();
  const len = Math.ceil(a.sampleRate*duration);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const ch = buf.getChannelData(0);
  for(let i=0;i<len;i++){
    const t = i/len;
    ch[i] = (Math.random()*2-1) * Math.pow(1-t, 1.6);
  }
  const src = a.createBufferSource(); src.buffer = buf;
  const bp = a.createBiquadFilter(); bp.type='highpass'; bp.frequency.value=hp; bp.Q.value=0.8;
  const g = a.createGain(); g.gain.value = gain;
  src.connect(bp); bp.connect(g); g.connect(a.destination);
  src.start(when);
}
function blip(_freq, gainScale=1){
  // "kacha" — short percussive snap: high tick + low body
  try{
    const a = ensureAc(); const t = a.currentTime;
    noiseBurst(t, 0.016, 0.22*gainScale, 3200);     // crisp click
    noiseBurst(t+0.022, 0.045, 0.16*gainScale, 900); // lower body "cha"
  }catch(_){}
}

/* ---------- fireworks (geometric particles, warm palette) ---------- */
const cv = document.getElementById('fx'); const ctx = cv.getContext('2d');
function resizeFx(){ cv.width = innerWidth*devicePixelRatio; cv.height = innerHeight*devicePixelRatio; cv.style.width=innerWidth+'px'; cv.style.height=innerHeight+'px'; ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
resizeFx(); addEventListener('resize', resizeFx);
const COLORS = ['#FF5A2E','#FFD83A','#E63946','#0E0F12'];
const SHAPES = ['triangle','square','circle','diamond'];
let particles = [];
function fireworks(x,y,n=24){
  for(let i=0;i<n;i++){
    const ang = Math.random()*Math.PI*2;
    const sp = 1.6 + Math.random()*3.4;
    particles.push({
      x,y, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp - 0.5,
      g:0.08, life:0, max:40+Math.random()*30,
      size:3+Math.random()*4, rot:Math.random()*Math.PI, vr:(Math.random()-.5)*.3,
      color: COLORS[(Math.random()*COLORS.length)|0],
      shape: SHAPES[(Math.random()*SHAPES.length)|0]
    });
  }
  if(!running) loop();
}
let running=false;
function drawShape(p){
  ctx.save();
  ctx.translate(p.x, p.y); ctx.rotate(p.rot);
  ctx.fillStyle = p.color;
  const s = p.size;
  if(p.shape==='circle'){ ctx.beginPath(); ctx.arc(0,0,s,0,Math.PI*2); ctx.fill(); }
  else if(p.shape==='square'){ ctx.fillRect(-s,-s,s*2,s*2); }
  else if(p.shape==='triangle'){ ctx.beginPath(); ctx.moveTo(0,-s); ctx.lineTo(s,s); ctx.lineTo(-s,s); ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.moveTo(0,-s); ctx.lineTo(s,0); ctx.lineTo(0,s); ctx.lineTo(-s,0); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function loop(){
  running = true;
  ctx.clearRect(0,0,cv.width,cv.height);
  particles = particles.filter(p=>{
    p.life++; p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    const a = 1 - p.life/p.max;
    if(a<=0) return false;
    ctx.globalAlpha = Math.max(0,a);
    drawShape(p);
    return true;
  });
  ctx.globalAlpha=1;
  if(particles.length){ requestAnimationFrame(loop); } else { running=false; }
}

/* ---------- cmdk ---------- */
const mask = document.getElementById('cmdkMask');
const input = document.getElementById('cmdkInput');
const list = document.getElementById('cmdkList');
const cntEl = document.getElementById('cmdkCount');
let cmdkIdx = 0, cmdkRows = [];

function openCmdk(){ mask.classList.add('open'); input.value=''; renderCmdk(''); setTimeout(()=>input.focus(),20); }
function closeCmdk(){ mask.classList.remove('open'); }
document.getElementById('heroSearch').addEventListener('click', openCmdk);
mask.addEventListener('click', (e)=>{ if(e.target===mask) closeCmdk(); });
addEventListener('keydown', (e)=>{
  const meta = e.metaKey||e.ctrlKey;
  if(meta && e.key.toLowerCase()==='k'){ e.preventDefault(); mask.classList.contains('open') ? closeCmdk() : openCmdk(); return; }
  if(e.key==='Escape' && mask.classList.contains('open')){ closeCmdk(); return; }
  if(!mask.classList.contains('open')) return;
  if(e.key==='ArrowDown'){ e.preventDefault(); cmdkIdx=Math.min(cmdkIdx+1, cmdkRows.length-1); paintSel(); }
  if(e.key==='ArrowUp'){ e.preventDefault(); cmdkIdx=Math.max(cmdkIdx-1, 0); paintSel(); }
  if(e.key==='Enter'){ e.preventDefault(); /* would jump */ closeCmdk(); }
});
input.addEventListener('input', ()=>renderCmdk(input.value));

function hi(str, q){ if(!q) return str; const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'); return str.replace(re,'<mark>$1</mark>'); }
function renderCmdk(q){
  const items = [];
  for(const s of DATA){
    if(state.removed.has(s.host)) continue;
    for(const tb of s.tabs){
      if(state.removed.has(s.host+'|'+tb.t)) continue;
      const hay = (tb.t+' '+tb.p+' '+s.host).toLowerCase();
      if(!q || hay.includes(q.toLowerCase())) items.push({s,tb});
    }
  }
  cmdkRows = items.slice(0,50);
  cmdkIdx = 0;
  cntEl.textContent = cmdkRows.length;
  list.innerHTML = cmdkRows.map((r,i)=>`
    <div class="cmdk-row ${i===0?'sel':''}" data-i="${i}">
      <div class="fav"><img src="${favUrl(r.s.host)}" alt="" referrerpolicy="no-referrer"/></div>
      <div class="title">${hi(r.tb.t, q)}</div>
      <div class="meta">${hi(r.s.host, q)}</div>
    </div>
  `).join('') || `<div style="padding:24px;text-align:center;color:var(--ink-mute);font-size:13px">没匹配到，换个词试试</div>`;
  list.querySelectorAll('.cmdk-row').forEach(el=>{
    el.addEventListener('mouseenter', ()=>{ cmdkIdx = +el.dataset.i; paintSel(); });
    el.addEventListener('click', ()=>{ closeCmdk(); });
  });
}
function paintSel(){
  list.querySelectorAll('.cmdk-row').forEach((el,i)=>el.classList.toggle('sel', i===cmdkIdx));
  const el = list.querySelector('.cmdk-row.sel');
  if(el) el.scrollIntoView({block:'nearest'});
}

/* ---------- boot: real tabs (ext) or mock (preview) ---------- */
async function boot(){
  if(isExt){
    try{
      await loadRealTabs();
    }catch(err){
      console.error('[TabHub] loadRealTabs failed', err);
    }
    // 实时监听
    let pending = null;
    const refresh = ()=>{
      clearTimeout(pending);
      pending = setTimeout(async ()=>{ await loadRealTabs(); render(); }, 120);
    };
    chrome.tabs.onCreated.addListener(refresh);
    chrome.tabs.onRemoved.addListener(refresh);
    chrome.tabs.onUpdated.addListener((id, info)=>{ if(info.title||info.url||info.status==='complete') refresh(); });
    chrome.tabs.onActivated.addListener(refresh);
    chrome.tabs.onMoved.addListener(refresh);
    chrome.tabs.onAttached.addListener(refresh);
    chrome.tabs.onDetached.addListener(refresh);
  }
  render();
}
boot();
window.openCmdk = openCmdk;
window.fireworksDemo = ()=>fireworks(innerWidth/2, innerHeight/2, 60);
