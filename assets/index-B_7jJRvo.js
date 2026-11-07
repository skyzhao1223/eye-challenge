(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&s(o)}).observe(document,{childList:!0,subtree:!0});function e(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=e(i);fetch(i.href,n)}})();class B{startedAt=0;accumulated=0;running=!1;raf=0;limitMs;onTick;onExpire;fired=!1;constructor(t,e,s){this.limitMs=t*1e3,this.onTick=e,this.onExpire=s}start(){this.running||(this.running=!0,this.startedAt=performance.now(),this.loop())}pause(){this.running&&(this.accumulated+=performance.now()-this.startedAt,this.running=!1,cancelAnimationFrame(this.raf))}resume(){this.running||(this.running=!0,this.startedAt=performance.now(),this.loop())}stop(){this.pause()}get elapsedMs(){return this.accumulated+(this.running?performance.now()-this.startedAt:0)}get leftMs(){return Math.max(0,this.limitMs-this.elapsedMs)}get leftSec(){return Math.ceil(this.leftMs/1e3)}loop=()=>{const t=this.leftMs;if(this.onTick(t),t<=0){this.fired||(this.fired=!0,this.pause(),this.onExpire());return}this.raf=requestAnimationFrame(this.loop)}}const U="lv-001",D="1.0.0",V="街角咖啡店",N={src:"assets/lv-001/a.webp",hash:"bdabc6ea36d1ddd5d816246fb71b9467541749830bd5bd789958d75d648a640e"},j={src:"assets/lv-001/b.webp",hash:"b3eb0c7e0756f53f32f83fb4a687ca8417d2f883e3a657ce34012c03cd244a8f"},K=5,Y=[{id:"d1",x:.8417,y:.4711,r:.0666,hint:"右侧",altText:"这个位置的东西不见了",kind:"removed"},{id:"d2",x:.5234,y:.131,r:.0558,hint:"上方",altText:"这里颜色变了",kind:"recolored"},{id:"d3",x:.6048,y:.7304,r:.0669,hint:"下方",altText:"这里大小变了",kind:"resized"},{id:"d4",x:.8849,y:.7194,r:.1001,hint:"右下角",altText:"这里位置挪动了",kind:"moved"},{id:"d5",x:.1396,y:.7483,r:.0595,hint:"左下角",altText:"这个位置多了一样东西",kind:"added"}],G=2,X=100,J={count:3,cooldownSec:15,scorePenaltyPct:10},W={base:250,perSecondLeft:2,perMissPenalty:2,starThresholds:[362,287,212]},Q={aspectRatio:1.5,width:1920,height:1280,altText:"午后阳光照进的街角咖啡店，木吧台、吊灯、窗台绿植、墙上的画框"},Z={id:U,schemaVersion:D,title:V,imageA:N,imageB:j,diffCount:K,diffs:Y,difficulty:G,timeLimit:X,hints:J,scoring:W,assets:Q},tt="lv-002",et="1.0.0",st="午后咖啡店",it={src:"assets/lv-002/a.webp",hash:"655a6a330de77dd2e71a3844e35b949784badba9a438c48907a7d1280e0bb55a"},at={src:"assets/lv-002/b.webp",hash:"d2ccba3a6b3a95b1fea844668e7847ef8d1a1f4dd5e992b28f0307ce512af858"},nt=5,ot=[{id:"d1",x:.8709,y:.8489,r:.0747,hint:"右侧",altText:"这个位置的东西不见了",kind:"removed"},{id:"d2",x:.1472,y:.237,r:.0544,hint:"左上角",altText:"这里颜色变了",kind:"recolored"},{id:"d3",x:.4435,y:.3372,r:.0794,hint:"上方",altText:"这里大小变了",kind:"resized"},{id:"d4",x:.6288,y:.8169,r:.1154,hint:"下方",altText:"这里位置挪动了",kind:"moved"},{id:"d5",x:.4227,y:.6418,r:.1153,hint:"中间",altText:"这个位置多了一样东西",kind:"added"}],ct=2,lt=100,rt={count:3,cooldownSec:15,scorePenaltyPct:10},dt={base:250,perSecondLeft:2,perMissPenalty:2,starThresholds:[362,287,212]},ht={aspectRatio:1.5,width:1920,height:1280,altText:"午后阳光照进的街角咖啡店，木吧台、吊灯、窗台绿植、墙上的画框"},ut={id:tt,schemaVersion:et,title:st,imageA:it,imageB:at,diffCount:nt,diffs:ot,difficulty:ct,timeLimit:lt,hints:rt,scoring:dt,assets:ht},ft="lv-003",pt="1.0.0",mt="深夜书房",vt={src:"assets/lv-003/a.webp",hash:"df37282f59cb54853eea5b81b3eb6a9482b65c368eab50197909e9b4e62ca16f"},gt={src:"assets/lv-003/b.webp",hash:"c1a50baeddc37ce90ccfdf2b899ed69957bd9f4b3b85aa9f60636e99fdc303ed"},yt=6,bt=[{id:"d1",x:.3016,y:.3012,r:.0824,hint:"左上角",altText:"这个位置的东西不见了",kind:"removed"},{id:"d2",x:.269,y:.7453,r:.0535,hint:"左侧",altText:"这里颜色变了",kind:"recolored"},{id:"d3",x:.5174,y:.5617,r:.0673,hint:"中间",altText:"这里大小变了",kind:"resized"},{id:"d4",x:.5472,y:.1906,r:.1096,hint:"上方",altText:"这里位置挪动了",kind:"moved"},{id:"d5",x:.6251,y:.4708,r:.0473,hint:"中间",altText:"这个位置多了一样东西",kind:"added"},{id:"d6",x:.8822,y:.4968,r:.0484,hint:"右侧",altText:"这里颜色变了",kind:"recolored"}],xt=3,wt=110,_t={count:3,cooldownSec:15,scorePenaltyPct:10},kt={base:280,perSecondLeft:2,perMissPenalty:2,starThresholds:[406,322,238]},St={aspectRatio:1.5,width:1920,height:1280,altText:"暖光下的书房，高书架、木书桌、台灯、靠窗的扶手椅"},Et={id:ft,schemaVersion:pt,title:mt,imageA:vt,imageB:gt,diffCount:yt,diffs:bt,difficulty:xt,timeLimit:wt,hints:_t,scoring:kt,assets:St},M=a=>"./"+a.replace(/^\.?\//,"");function k(a){return{id:a.id,schemaVersion:a.schemaVersion,title:a.title,diffCount:a.diffCount,diffs:a.diffs,difficulty:a.difficulty,timeLimit:a.timeLimit,hints:a.hints,scoring:a.scoring,assets:a.assets,imageA:M(a.imageA.src),imageB:M(a.imageB.src)}}const $t=[k(Z),k(ut),k(Et)],g=[...$t];function C(){return g.length}function Lt(){return g.map((a,t)=>({id:a.id,no:t+1,difficulty:a.difficulty,title:a.title}))}function Tt(a){return a?g.find(t=>t.id===a)??g[0]:g[0]}function Mt(a){const t=g.findIndex(e=>e.id===a);return t<0||t+1>=g.length?null:g[t+1]}function Bt(a){const t=g.findIndex(e=>e.id===a);return t<0?1:t+1}const A="ec.progress.v1",$=1,L=()=>({stars:0,bestScore:0,bestTimeSec:0,plays:0,clearedAt:null});function S(){return{version:$,levels:{},lastPlayed:null}}let h=null;function _(){if(h)return h;try{const a=localStorage.getItem(A);if(!a)return h=S(),h;const t=JSON.parse(a);return!t||t.version!==$||typeof t.levels!="object"||!t.levels?(h=S(),h):(h={version:$,levels:t.levels,lastPlayed:typeof t.lastPlayed=="string"?t.lastPlayed:null},h)}catch{return h=S(),h}}function Ct(a){h=a;try{localStorage.setItem(A,JSON.stringify(a))}catch{}}function At(a){const t=_().levels[a];return t?{...L(),...t}:L()}function qt(a){return At(a).stars}function Pt(){return _().lastPlayed}function Ft(){const a=_().levels;return Object.keys(a).reduce((t,e)=>t+(a[e].stars||0),0)}function q(a){const t=_(),e=t.levels[a.levelId]??L(),s={...e};s.plays=e.plays+1;const i=a.score>e.bestScore;i&&(s.bestScore=a.score);const n=a.cleared&&(e.bestTimeSec===0||a.timeSec<e.bestTimeSec);n&&(s.bestTimeSec=a.timeSec);const o=a.cleared&&a.stars>e.stars;return o&&(s.stars=a.stars),a.cleared&&e.clearedAt===null&&(s.clearedAt=Date.now()),t.levels[a.levelId]=s,t.lastPlayed=a.levelId,Ct(t),{newBestScore:i,newBestTime:n,newBestStars:o}}let m=null,x=null,b=!0;const Rt=.28;function Ot(){try{return window.matchMedia("(prefers-reduced-motion: reduce)").matches}catch{return!1}}function P(){if(b){if(Ot()){b=!1;return}try{if(!m){const a=window.AudioContext??window.webkitAudioContext;if(!a){b=!1;return}m=new a,x=m.createGain(),x.gain.value=Rt,x.connect(m.destination)}m.state==="suspended"&&m.resume()}catch{b=!1}}}function u(a,t,e="sine",s=.5,i){if(!(!b||!m||!x))try{const n=m.currentTime,o=m.createOscillator(),c=m.createGain();o.type=e,o.frequency.setValueAtTime(a,n),i!==void 0&&o.frequency.exponentialRampToValueAtTime(Math.max(1,i),n+t),c.gain.setValueAtTime(1e-4,n),c.gain.exponentialRampToValueAtTime(s,n+.008),c.gain.exponentialRampToValueAtTime(1e-4,n+t),o.connect(c),c.connect(x),o.start(n),o.stop(n+t+.02)}catch{}}function zt(){u(880,.09,"triangle",.55),window.setTimeout(()=>u(1320,.12,"triangle",.45),70)}function Ht(){u(220,.14,"sawtooth",.32,130)}function It(){u(660,.07,"sine",.5),window.setTimeout(()=>u(990,.09,"sine",.4),55)}function Ut(){u(180,.16,"square",.22,110)}function Dt(a){const t=a<=1?1400:a<=3?1100:900;u(t,.045,"sine",.3)}function F(){[523.25,659.25,783.99,1046.5].forEach((t,e)=>{window.setTimeout(()=>u(t,.18,"triangle",.4),e*90)})}function R(){u(392,.2,"triangle",.35,330),window.setTimeout(()=>u(262,.3,"triangle",.3,196),160)}function Vt(){u(520,.22,"sine",.28,780)}class Nt{level;phase="loading";root;stage;paneA;paneB;hud;timerEl;foundEl;scoreEl;hintBtn;states=[];timer;score=0;misses=0;hintsUsed=0;hintCooldownUntil=0;scale=1;tx=0;ty=0;dragging=!1;dragMoved=!1;dragStart={x:0,y:0,tx:0,ty:0};downTarget=null;imagesReady=0;lastTickSec=-1;constructor(t,e){this.root=t,this.level=Tt(e),this.states=this.level.diffs.map(s=>({diff:s,state:"idle"}))}mount(){const t=()=>{P(),window.removeEventListener("pointerdown",t),window.removeEventListener("keydown",t)};window.addEventListener("pointerdown",t,{once:!0}),window.addEventListener("keydown",t,{once:!0}),this.renderShell(),this.preloadImages()}renderShell(){this.root.innerHTML=`
      <header class="ec-hud" data-state="default">
        <div class="ec-hud__title">${this.level.title}</div>
        <div class="ec-hud__spacer"></div>
        <div class="ec-hud__stat"><b data-found>0</b><span>/ ${this.level.diffCount}</span></div>
        <div class="ec-hud__timer ec-numeric" data-timer>--:--</div>
        <div class="ec-hud__stat">分 <b data-score>0</b></div>
      </header>

      <div class="ec-stage-wrap">
        <div class="ec-stage" data-locked="true">
          <div class="ec-pane" data-pane="a">
            <img alt="${this.level.assets.altText}（A）" />
            <span class="ec-pane__tag">A</span>
            <div class="ec-hotspots" data-hotspots="a"></div>
            <div class="ec-loading"><span class="ec-spinner"></span>载入中</div>
          </div>
          <div class="ec-pane" data-pane="b">
            <img alt="${this.level.assets.altText}（B）" />
            <span class="ec-pane__tag">B</span>
            <div class="ec-hotspots" data-hotspots="b"></div>
            <div class="ec-loading"><span class="ec-spinner"></span>载入中</div>
          </div>
        </div>
      </div>

      <div class="ec-tools">
        <button class="ec-btn ec-btn--ghost" data-act="restart">重开</button>
        <button class="ec-btn ec-btn--secondary" data-act="hint">
          提示 <span class="ec-btn__badge" data-hint-badge>${this.level.hints.count}</span>
        </button>
        <div class="ec-tools__spacer"></div>
        <button class="ec-btn ec-btn--secondary" data-act="zoom">100%</button>
        <button class="ec-btn ec-btn--secondary" data-act="pause">暂停</button>
      </div>
    `,this.stage=this.q(".ec-stage"),this.paneA=this.q('[data-pane="a"]'),this.paneB=this.q('[data-pane="b"]'),this.hud=this.q(".ec-hud"),this.timerEl=this.q("[data-timer]"),this.foundEl=this.q("[data-found]"),this.scoreEl=this.q("[data-score]");const t=Array.from(this.root.querySelectorAll(".ec-pane img"));t[0].src=this.level.imageA,t[1].src=this.level.imageB;const e=`${this.level.assets.aspectRatio}`;this.paneA.style.aspectRatio=e,this.paneB.style.aspectRatio=e,this.hintBtn=this.root.querySelector('[data-act="hint"]'),this.bindStage(),this.bindTools(),this.bindVisibility()}q(t){const e=this.root.querySelector(t);if(!e)throw new Error(`缺少节点: ${t}`);return e}preloadImages(){this.timer=new B(this.level.timeLimit,e=>this.onTick(e),()=>this.settle("lose-timeout")),this.paintTimer(this.level.timeLimit*1e3),Array.from(this.root.querySelectorAll(".ec-pane img")).forEach(e=>{const s=()=>{if(e.dataset.ready==="1")return;e.dataset.ready="1",this.imagesReady+=1,e.parentElement.querySelector(".ec-loading")?.remove(),this.imagesReady>=2&&this.beginPlay()};e.complete?s():(e.addEventListener("load",s,{once:!0}),e.addEventListener("error",s,{once:!0}))})}beginPlay(){this.phase="playing",this.stage.dataset.locked="false",this.paintHintBtn(),this.timer.start()}onTick(t){this.phase==="playing"&&this.paintTimer(t)}paintTimer(t){const e=this.level.timeLimit*1e3,s=Math.ceil(t/1e3),i=String(Math.floor(s/60)).padStart(2,"0"),n=String(s%60).padStart(2,"0");this.timerEl.textContent=`${i}:${n}`;const o=t/e;this.timerEl.dataset.warn=String(o<=.3&&o>0),this.timerEl.dataset.critical=String(t<=1e4),s>0&&s<=5&&s!==this.lastTickSec&&(this.lastTickSec=s,Dt(s))}paintScore(){const t=this.states.filter(e=>e.state==="hit").length;this.foundEl.textContent=String(t),this.scoreEl.textContent=String(Math.max(0,Math.round(this.score)))}bindStage(){this.stage.addEventListener("pointerdown",e=>{this.phase==="playing"&&(this.dragging=!0,this.dragMoved=!1,this.downTarget=e.target,this.dragStart={x:e.clientX,y:e.clientY,tx:this.tx,ty:this.ty},this.stage.setPointerCapture(e.pointerId))}),this.stage.addEventListener("pointermove",e=>{if(!this.dragging)return;const s=e.clientX-this.dragStart.x,i=e.clientY-this.dragStart.y;Math.hypot(s,i)>6&&(this.dragMoved=!0,this.stage.dataset.dragging="true"),this.scale>1&&(this.tx=this.dragStart.tx+s,this.ty=this.dragStart.ty+i,this.applyTransform())});const t=e=>{this.dragging&&(this.dragging=!1,this.stage.dataset.dragging="false",this.dragMoved||this.handleClick(e.clientX,e.clientY),this.downTarget=null)};this.stage.addEventListener("pointerup",t),this.stage.addEventListener("pointercancel",()=>{this.dragging=!1,this.stage.dataset.dragging="false"}),this.stage.addEventListener("wheel",e=>{if(this.phase!=="playing")return;e.preventDefault();const s=jt(this.scale*(e.deltaY<0?1.12:1/1.12),1,3);this.zoomAt(s,e.clientX,e.clientY)},{passive:!1})}handleClick(t,e){const s=this.downTarget;if(!s)return;const i=s.closest(".ec-pane");if(!i)return;const n=i.getBoundingClientRect();if(n.width===0||n.height===0)return;const o=(t-n.left)/n.width,c=(e-n.top)/n.height;if(o<0||o>1||c<0||c>1)return;const l=this.states.find(d=>{if(d.state==="hit")return!1;const v=o-d.diff.x,f=(c-d.diff.y)*this.level.assets.aspectRatio;return Math.hypot(v,f)<=d.diff.r});l?this.onHit(l):this.onMiss(i,t-n.left,e-n.top)}onHit(t){t.state="hit",this.score+=this.perDiffScore(),this.paintScore(),this.paintHotspot(t),zt(),this.toast(`找到了 · ${t.diff.altText}`),this.score+=this.timer.leftSec*this.level.scoring.perSecondLeft,this.paintScore(),this.states.filter(s=>s.state==="hit").length===this.level.diffCount&&this.settle("win")}onMiss(t,e,s){this.misses+=1,this.score-=this.level.scoring.perMissPenalty,Ht();const i=document.createElement("div");i.className="ec-miss",i.style.left=`${e}px`,i.style.top=`${s}px`,t.appendChild(i),window.setTimeout(()=>i.remove(),560),this.misses%3===0&&this.toast(`连续点空 ${this.misses} 次，别乱戳`),this.paintScore()}perDiffScore(){return Math.round(this.level.scoring.base/this.level.diffCount)}paintHotspot(t){for(const e of["a","b"]){const s=this.root.querySelector(`[data-hotspots="${e}"]`);if(!s)continue;let i=s.querySelector(`[data-diff="${t.diff.id}"]`);i||(i=document.createElement("div"),i.className="ec-hotspot",i.dataset.diff=t.diff.id,i.setAttribute("role","button"),i.setAttribute("aria-label",`${t.diff.altText}`),s.appendChild(i));const n=t.diff.r*2*100;i.style.left=`${t.diff.x*100}%`,i.style.top=`${t.diff.y*100}%`,i.style.width=`${n}%`,i.style.height=`${n*this.level.assets.aspectRatio}%`,i.dataset.state=t.state}}bindTools(){this.root.querySelector('[data-act="restart"]').addEventListener("click",()=>location.reload()),this.root.querySelector('[data-act="pause"]').addEventListener("click",()=>this.togglePause()),this.root.querySelector('[data-act="zoom"]').addEventListener("click",()=>{this.zoomAt(this.scale>=2?1:2,window.innerWidth/2,window.innerHeight/2)}),this.hintBtn.addEventListener("click",()=>this.useHint()),this.paintHintBtn()}useHint(){if(this.phase!=="playing")return;const t=performance.now();if(t<this.hintCooldownUntil||this.hintsUsed>=this.level.hints.count)return;const e=this.states.find(s=>s.state==="idle");e&&(this.hintsUsed+=1,this.score-=this.score*this.level.hints.scorePenaltyPct/100,e.state="hinted",this.paintHotspot(e),this.paintScore(),Vt(),this.toast(`提示：${e.diff.hint}`),window.setTimeout(()=>{e.state==="hinted"&&(e.state="idle",this.paintHotspot(e))},4800),this.hintCooldownUntil=t+this.level.hints.cooldownSec*1e3,this.paintHintBtn(),this.tickCooldown())}tickCooldown(){this.phase!=="settled"&&(this.paintHintBtn(),performance.now()<this.hintCooldownUntil&&window.setTimeout(()=>this.tickCooldown(),200))}paintHintBtn(){const t=this.level.hints.count-this.hintsUsed,e=performance.now()<this.hintCooldownUntil,s=this.hintBtn.querySelector("[data-hint-badge]");s.textContent=e?`${Math.ceil((this.hintCooldownUntil-performance.now())/1e3)}s`:String(t),this.hintBtn.disabled=e||t<=0||this.phase!=="playing"}togglePause(){this.phase==="playing"?(this.phase="paused",this.timer.pause(),this.hud.dataset.state="paused",this.stage.dataset.locked="true",this.showOverlay(`
        <div class="ec-modal" role="dialog" aria-modal="true">
          <p class="ec-modal__eyebrow">Paused</p>
          <h2 class="ec-modal__title">已暂停</h2>
          <div class="ec-modal__actions">
            <button class="ec-btn ec-btn--primary" data-act="resume">继续</button>
            <button class="ec-btn ec-btn--ghost" data-act="quit">放弃本关</button>
          </div>
        </div>
      `),this.q('[data-act="resume"]').addEventListener("click",()=>this.togglePause()),this.q('[data-act="quit"]').addEventListener("click",()=>this.settle("lose-quit"))):this.phase==="paused"&&(this.phase="playing",this.timer.resume(),this.hud.dataset.state="default",this.stage.dataset.locked="false",this.clearOverlay())}bindVisibility(){document.addEventListener("visibilitychange",()=>{document.hidden&&this.phase==="playing"&&this.togglePause()})}settle(t){if(this.phase==="settled")return;this.phase="settled",this.timer.stop(),this.stage.dataset.locked="true",this.hud.dataset.state="hidden";const e=this.states.filter(r=>r.state==="hit").length,s=t==="win";s||this.states.forEach(r=>{r.state!=="hit"&&(r.state="revealed",this.paintHotspot(r))});const i=s?this.starOf(this.score):0,n="#FFB020",o="#5A6785",c=r=>`<svg viewBox="0 0 24 24" fill="${r?n:o}" aria-hidden="true">
        <path d="M12 2l2.9 6.3 6.9.9-5 4.8 1.2 6.8L12 17.6 6 20.8l1.2-6.8-5-4.8 6.9-.9z"/>
      </svg>`,l=s?"通关":t==="lose-timeout"?"时间到":"已放弃",d=s?"win":"lose",v=Math.round(this.timer.elapsedMs/1e3),f=q({levelId:this.level.id,stars:i,score:Math.max(0,Math.round(this.score)),timeSec:v,cleared:s});s?F():R();const p=s?Mt(this.level.id):null,y=s&&p===null,z=Bt(this.level.id),H=C(),I=f.newBestScore||f.newBestStars||f.newBestTime?'<p class="ec-modal__ribbon" data-ribbon="new">新纪录</p>':"";this.showOverlay(`
      <div class="ec-modal" role="dialog" aria-modal="true" aria-labelledby="ec-res-title">
        <p class="ec-modal__eyebrow">第 ${z} / ${H} 关 · ${this.level.title}</p>
        <h2 class="ec-modal__title" id="ec-res-title" data-tone="${d}">${l}</h2>
        ${I}
        ${s?`<div class="ec-modal__stars">${[0,1,2].map(r=>c(r<i)).join("")}</div>`:""}
        <div class="ec-modal__grid">
          <div class="ec-modal__cell"><span>找到</span><b>${e}/${this.level.diffCount}</b></div>
          <div class="ec-modal__cell"><span>用时</span><b>${v}s</b></div>
          <div class="ec-modal__cell"><span>得分</span><b>${Math.max(0,Math.round(this.score))}</b></div>
        </div>
        <div class="ec-modal__actions">
          ${s&&p?'<button class="ec-btn ec-btn--primary" data-act="next">下一关 →</button>':""}
          ${y?'<button class="ec-btn ec-btn--primary" data-act="hall">完成全部关卡 · 回大厅</button>':""}
          <button class="ec-btn ${s&&p?"ec-btn--ghost":"ec-btn--primary"}" data-act="again">重玩本关</button>
          ${s&&p?'<button class="ec-btn ec-btn--ghost" data-act="hall">回大厅</button>':""}
        </div>
      </div>
    `),this.q('[data-act="again"]').addEventListener("click",()=>{const r=new URL(location.href);r.searchParams.set("mode","diff"),r.searchParams.set("level",this.level.id),location.href=r.toString()}),this.root.querySelector('[data-act="next"]')?.addEventListener("click",()=>{if(!p)return;const r=new URL(location.href);r.searchParams.set("mode","diff"),r.searchParams.set("level",p.id),location.href=r.toString()}),this.root.querySelector('[data-act="hall"]')?.addEventListener("click",()=>{location.href="./"}),this.root.querySelector(".ec-modal")?.querySelector("button")?.focus()}starOf(t){const[e,s,i]=this.level.scoring.starThresholds;return t>=e?3:t>=s?2:t>=i?1:0}showOverlay(t){this.clearOverlay();const e=document.createElement("div");e.className="ec-overlay",e.dataset.overlay="1",e.innerHTML=t,document.body.appendChild(e),document.addEventListener("keydown",this.onEsc)}clearOverlay(){document.querySelectorAll("[data-overlay]").forEach(t=>t.remove()),document.removeEventListener("keydown",this.onEsc)}onEsc=t=>{t.key==="Escape"&&this.phase==="paused"&&this.togglePause()};toast(t){document.querySelectorAll(".ec-toast").forEach(s=>s.remove());const e=document.createElement("div");e.className="ec-toast",e.textContent=t,document.body.appendChild(e),window.setTimeout(()=>e.remove(),2100)}zoomAt(t,e,s){const i=this.stage.getBoundingClientRect(),n=(e-i.left)/this.scale,o=(s-i.top)/this.scale;this.tx+=n*(this.scale-t),this.ty+=o*(this.scale-t),this.scale=t,this.scale===1&&(this.tx=0,this.ty=0),this.applyTransform()}applyTransform(){this.stage.style.transform=`translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;const t=this.root.querySelector('[data-act="zoom"]');t&&(t.textContent=`${Math.round(this.scale*100)}%`)}}const jt=(a,t,e)=>Math.min(e,Math.max(t,a));function Kt(a){switch(a){case"pen":return`<g transform="rotate(-24 50 50)">
        <rect x="43" y="10" width="14" height="58" rx="3" fill="#F2C14E"/>
        <rect x="43" y="10" width="14" height="12" rx="3" fill="#E07A5F"/>
        <path d="M43 68h14l-7 20z" fill="#F0E2C8"/>
        <path d="M46.5 82h7l-3.5 8z" fill="#33322F"/>
        <rect x="43" y="30" width="14" height="4" fill="#D9A93A"/>
      </g>`;case"ruler":return`<g transform="rotate(-6 50 50)">
        <rect x="8" y="41" width="84" height="18" rx="3" fill="#F4A259"/>
        <g stroke="#7A4A1E" stroke-width="2" stroke-linecap="round">
          <path d="M18 41v6M26 41v9M34 41v6M42 41v9M50 41v6M58 41v9M66 41v6M74 41v9M82 41v6"/>
        </g>
      </g>`;case"eraser":return`<g transform="rotate(9 50 50)">
        <rect x="24" y="36" width="52" height="28" rx="6" fill="#F7C6D9"/>
        <rect x="24" y="36" width="52" height="11" rx="6" fill="#FFF5F8"/>
        <rect x="24" y="56" width="52" height="8" fill="#E9A9C4"/>
      </g>`;case"scissors":return`<g transform="rotate(14 50 50)">
        <path d="M30 22 L52 52 L44 58 L24 28 z" fill="#C9D3DE"/>
        <path d="M70 22 L48 52 L56 58 L76 28 z" fill="#AEBAC8"/>
        <circle cx="28" cy="72" r="11" fill="none" stroke="#D94F4F" stroke-width="7"/>
        <circle cx="72" cy="72" r="11" fill="none" stroke="#D94F4F" stroke-width="7"/>
        <circle cx="50" cy="55" r="3.5" fill="#6B7683"/>
      </g>`;case"cookie":return`<g>
        <circle cx="50" cy="50" r="30" fill="#C98A4B"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="#A96F36" stroke-width="3"/>
        <g fill="#5A3A1A">
          <circle cx="40" cy="40" r="4"/><circle cx="60" cy="44" r="3.5"/>
          <circle cx="46" cy="60" r="4"/><circle cx="62" cy="62" r="3"/>
          <circle cx="52" cy="50" r="2.5"/>
        </g>
      </g>`;case"candy":return`<g transform="rotate(-12 50 50)">
        <ellipse cx="50" cy="50" rx="22" ry="16" fill="#F26D9C"/>
        <path d="M28 50 L10 36 L12 50 L10 64 z" fill="#F7A0BE"/>
        <path d="M72 50 L90 36 L88 50 L90 64 z" fill="#F7A0BE"/>
        <path d="M36 44 q6 6 0 12" stroke="#FFF" stroke-width="3" fill="none" opacity="0.7"/>
      </g>`;case"apple":return`<g>
        <circle cx="50" cy="54" r="27" fill="#D64545"/>
        <circle cx="50" cy="54" r="27" fill="none" stroke="#B33333" stroke-width="2"/>
        <path d="M50 27 q2 -10 10 -12 q-2 10 -8 13 z" fill="#3F9D63"/>
        <rect x="48" y="20" width="3" height="10" rx="1.5" fill="#6B4A2B"/>
        <ellipse cx="40" cy="46" rx="7" ry="9" fill="#fff" opacity="0.18"/>
      </g>`;case"carton":return`<g>
        <path d="M18 36 L50 24 L82 36 L82 78 L50 90 L18 78 z" fill="#C08552"/>
        <path d="M18 36 L50 48 L82 36" fill="none" stroke="#9C6537" stroke-width="3"/>
        <path d="M50 48 L50 90" stroke="#9C6537" stroke-width="3"/>
        <path d="M18 36 L50 24 L50 40 L18 50 z" fill="#D19A63"/>
        <path d="M82 36 L50 24 L50 40 L82 50 z" fill="#B07545"/>
        <rect x="44" y="60" width="12" height="20" fill="#E8D5B7" opacity="0.75"/>
      </g>`;case"ball":return`<g>
        <circle cx="50" cy="50" r="28" fill="#4A90D9"/>
        <path d="M22 50 a28 28 0 0 1 56 0" fill="#6FB1EE"/>
        <path d="M23 44 q27 -14 54 0" stroke="#FFF" stroke-width="3" fill="none" opacity="0.7"/>
        <path d="M23 58 q27 14 54 0" stroke="#FFF" stroke-width="3" fill="none" opacity="0.5"/>
        <ellipse cx="38" cy="36" rx="7" ry="5" fill="#fff" opacity="0.35" transform="rotate(-25 38 36)"/>
      </g>`;case"cup":return`<g>
        <path d="M30 32 h36 l-5 46 a6 6 0 0 1 -6 5 h-14 a6 6 0 0 1 -6 -5 z" fill="#EEF3F8"/>
        <path d="M30 32 h36 l-1.5 13 h-33 z" fill="#D8E2EC"/>
        <path d="M66 42 q14 2 12 14 q-2 10 -14 9" fill="none" stroke="#D8E2EC" stroke-width="6" stroke-linecap="round"/>
        <path d="M40 52 q4 6 0 12" stroke="#C9D6E3" stroke-width="3" fill="none"/>
      </g>`;default:return'<rect x="30" y="30" width="40" height="40" rx="6" fill="#8B97B0"/>'}}const Yt=a=>`<svg viewBox="0 0 100 100" aria-hidden="true">${Kt(a)}</svg>`,Gt={id:"lv-c01",mode:"collect",schemaVersion:"1.0.0",title:"收拾桌面",boxes:[{id:"b1",label:"文具盒",kinds:["pen","ruler","eraser","scissors"],color:"#FFB020"},{id:"b2",label:"零食盒",kinds:["cookie","candy","apple"],color:"#3DD68C"},{id:"b3",label:"杂物箱",kinds:["carton","ball","cup"],color:"#35D0E0"}],items:[{id:"i1",kind:"pen",x:.13,y:.2,w:.095,rot:-18,z:3},{id:"i2",kind:"ruler",x:.31,y:.13,w:.135,rot:7,z:2},{id:"i3",kind:"eraser",x:.2,y:.44,w:.085,rot:11,z:4},{id:"i4",kind:"scissors",x:.44,y:.31,w:.115,rot:-9,z:5},{id:"i5",kind:"cookie",x:.66,y:.17,w:.1,rot:0,z:2},{id:"i6",kind:"candy",x:.82,y:.31,w:.1,rot:16,z:3},{id:"i7",kind:"apple",x:.73,y:.63,w:.105,rot:-6,z:3},{id:"i8",kind:"carton",x:.24,y:.72,w:.175,rot:5,z:1},{id:"i9",kind:"ball",x:.5,y:.74,w:.125,rot:0,z:2},{id:"i10",kind:"cup",x:.87,y:.77,w:.095,rot:-10,z:3}],timeLimit:75,hints:{count:3,cooldownSec:10,scorePenaltyPct:8},scoring:{perItem:20,boxClearBonus:60,perSecondLeft:2,wrongPenalty:8,starThresholds:[520,420,320]},scene:{background:"table",altText:"一张堆满文具、零食和杂物的大木桌"}};class Xt{level=Gt;phase="loading";root;itemLayer;boxRow;hud;timerEl;foundEl;scoreEl;hintBtn;items=[];boxIdx=0;score=0;wrongs=0;hintsUsed=0;hintCooldownUntil=0;timer;constructor(t){this.root=t}mount(){const t=()=>{P(),window.removeEventListener("pointerdown",t),window.removeEventListener("keydown",t)};window.addEventListener("pointerdown",t,{once:!0}),window.addEventListener("keydown",t,{once:!0}),this.renderShell(),this.placeItems(),this.beginPlay()}renderShell(){this.root.innerHTML=`
      <header class="ec-hud" data-state="default">
        <div class="ec-hud__title">${this.level.title}</div>
        <div class="ec-hud__spacer"></div>
        <div class="ec-hud__stat"><b data-done>0</b><span>/ ${this.level.items.length}</span></div>
        <div class="ec-hud__timer ec-numeric" data-timer>--:--</div>
        <div class="ec-hud__stat">分 <b data-score>0</b></div>
      </header>

      <div class="ec-collect">
        <div class="ec-boxrow" data-boxrow></div>
        <div class="ec-scene" data-scene>
          <div class="ec-scene__floor"></div>
          <div class="ec-items" data-items></div>
        </div>
      </div>

      <div class="ec-tools">
        <button class="ec-btn ec-btn--ghost" data-act="restart">重开</button>
        <button class="ec-btn ec-btn--secondary" data-act="hint">
          提示 <span class="ec-btn__badge" data-hint-badge>${this.level.hints.count}</span>
        </button>
        <div class="ec-tools__spacer"></div>
        <button class="ec-btn ec-btn--secondary" data-act="pause">暂停</button>
      </div>
    `,this.itemLayer=this.q("[data-items]"),this.boxRow=this.q("[data-boxrow]"),this.hud=this.q(".ec-hud"),this.timerEl=this.q("[data-timer]"),this.foundEl=this.q("[data-done]"),this.scoreEl=this.q("[data-score]"),this.hintBtn=this.q('[data-act="hint"]'),this.timer=new B(this.level.timeLimit,t=>this.onTick(t),()=>this.settle("lose-timeout")),this.paintTimer(this.level.timeLimit*1e3),this.renderBoxes(),this.bindTools(),this.bindVisibility()}q(t){const e=this.root.querySelector(t);if(!e)throw new Error(`缺少节点: ${t}`);return e}renderBoxes(){this.boxRow.innerHTML="",this.level.boxes.forEach((t,e)=>{const s=document.createElement("div");s.className="ec-box",s.dataset.box=t.id,s.dataset.state=e===0?"active":e===1?"next":"pending",s.style.setProperty("--box-hue",t.color??"#FFB020"),s.innerHTML=`
        <div class="ec-box__lid"></div>
        <div class="ec-box__body">
          <span class="ec-box__label">${t.label}</span>
          <span class="ec-box__count">0/${t.kinds.reduce((i,n)=>i+this.itemsOfKind(n).length,0)}</span>
        </div>
      `,this.boxRow.appendChild(s)})}itemsOfKind(t){return this.items.filter(e=>e.item.kind===t)}get activeBox(){return this.level.boxes[this.boxIdx]}activeBoxEl(){const t=this.activeBox;return t?this.root.querySelector(`[data-box="${t.id}"]`):null}placeItems(){this.items=this.level.items.map(t=>{const e=document.createElement("button");e.className="ec-item",e.type="button",e.dataset.item=t.id,e.dataset.kind=t.kind,e.setAttribute("aria-label",`物品 ${t.kind}`),e.style.left=`${t.x*100}%`,e.style.top=`${t.y*100}%`,e.style.width=`${t.w*100}%`,e.style.zIndex=String(t.z??1),e.style.setProperty("--rot",`${t.rot??0}deg`),e.innerHTML=Yt(t.kind),this.itemLayer.appendChild(e),e.addEventListener("click",i=>this.onTap(i,s));const s={item:t,el:e,done:!1};return s})}onTap(t,e){if(this.phase!=="playing"||e.done)return;t.preventDefault();const s=this.activeBox,i=this.activeBoxEl();if(!(!s||!i)){if(s.kinds.includes(e.item.kind)){this.acceptItem(e,i);return}this.wrongs+=1,this.score-=this.level.scoring.wrongPenalty,this.paintScore(),this.shake(e.el),this.shake(i),this.toast("这个不属于当前箱子")}}acceptItem(t,e){const s=this.activeBox;if(!s.kinds.includes(t.item.kind)){t.el.style.transform="",this.wrongs+=1,this.score-=this.level.scoring.wrongPenalty,this.paintScore(),Ut(),this.toast(`${s.label}不收这个东西`),this.shake(e);return}t.done=!0,t.el.dataset.done="true",t.el.disabled=!0,t.el.style.pointerEvents="none",t.el.style.transform="";const i=t.el.getBoundingClientRect(),n=e.getBoundingClientRect(),o=n.left+n.width/2-(i.left+i.width/2),c=n.top+n.height/2-(i.top+i.height/2);t.el.style.transform=`translate(${o}px, ${c}px) scale(0.25) rotate(var(--rot))`,t.el.style.opacity="0",window.setTimeout(()=>{t.el.style.visibility="hidden"},340),this.score+=this.level.scoring.perItem,this.paintScore(),It(),this.bump(e),this.paintBoxCounts(),this.boxComplete()&&this.completeBox()}boxComplete(){const t=this.activeBox;return t?t.kinds.every(e=>this.itemsOfKind(e).every(s=>s.done)):!1}completeBox(){const t=this.activeBoxEl();if(t&&(t.dataset.state="clearing",window.setTimeout(()=>{t.dataset.state="gone"},380)),this.score+=this.level.scoring.boxClearBonus,this.paintScore(),this.toast("箱子收好了"),this.boxIdx+=1,this.boxIdx>=this.level.boxes.length){this.score+=this.timer.leftSec*this.level.scoring.perSecondLeft,this.paintScore(),window.setTimeout(()=>this.settle("win"),420);return}const e=this.level.boxes[this.boxIdx],s=this.root.querySelector(`[data-box="${e.id}"]`);s&&(s.dataset.state="activating"),window.setTimeout(()=>{s&&(s.dataset.state="active");const i=this.level.boxes[this.boxIdx+1];if(i){const n=this.root.querySelector(`[data-box="${i.id}"]`);n&&(n.dataset.state="next")}this.paintBoxCounts()},380)}paintBoxCounts(){this.level.boxes.forEach(e=>{const s=this.root.querySelector(`[data-box="${e.id}"]`);if(!s)return;const i=e.kinds.reduce((c,l)=>c+this.itemsOfKind(l).length,0),n=e.kinds.reduce((c,l)=>c+this.itemsOfKind(l).filter(d=>d.done).length,0),o=s.querySelector(".ec-box__count");o&&(o.textContent=`${n}/${i}`)});const t=this.items.filter(e=>e.done).length;this.foundEl.textContent=String(t)}beginPlay(){this.phase="playing",this.paintBoxCounts(),this.paintHintBtn(),this.timer.start()}onTick(t){this.phase==="playing"&&this.paintTimer(t)}paintTimer(t){const e=this.level.timeLimit*1e3,s=Math.ceil(t/1e3);this.timerEl.textContent=`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;const i=t/e;this.timerEl.dataset.warn=String(i<=.3&&i>0),this.timerEl.dataset.critical=String(t<=1e4)}paintScore(){this.scoreEl.textContent=String(Math.max(0,Math.round(this.score)))}bindTools(){this.q('[data-act="restart"]').addEventListener("click",()=>location.reload()),this.q('[data-act="pause"]').addEventListener("click",()=>this.togglePause()),this.hintBtn.addEventListener("click",()=>this.useHint())}useHint(){if(this.phase!=="playing")return;const t=performance.now();if(t<this.hintCooldownUntil||this.hintsUsed>=this.level.hints.count)return;const e=this.activeBox;if(!e)return;const s=this.items.find(i=>!i.done&&e.kinds.includes(i.item.kind));s&&(this.hintsUsed+=1,this.score-=this.score*this.level.hints.scorePenaltyPct/100,this.paintScore(),s.el.dataset.hinted="true",window.setTimeout(()=>{delete s.el.dataset.hinted},3200),this.toast(`提示：这个要放进${e.label}`),this.hintCooldownUntil=t+this.level.hints.cooldownSec*1e3,this.paintHintBtn(),this.tickCooldown())}tickCooldown(){this.phase!=="settled"&&(this.paintHintBtn(),performance.now()<this.hintCooldownUntil&&window.setTimeout(()=>this.tickCooldown(),200))}paintHintBtn(){const t=this.level.hints.count-this.hintsUsed,e=performance.now()<this.hintCooldownUntil,s=this.hintBtn.querySelector("[data-hint-badge]");s.textContent=e?`${Math.ceil((this.hintCooldownUntil-performance.now())/1e3)}s`:String(t),this.hintBtn.disabled=e||t<=0||this.phase!=="playing"}togglePause(){this.phase==="playing"?(this.phase="paused",this.timer.pause(),this.hud.dataset.state="paused",this.showOverlay(`
        <div class="ec-modal" role="dialog" aria-modal="true">
          <p class="ec-modal__eyebrow">Paused</p>
          <h2 class="ec-modal__title">已暂停</h2>
          <div class="ec-modal__actions">
            <button class="ec-btn ec-btn--primary" data-act="resume">继续</button>
            <button class="ec-btn ec-btn--ghost" data-act="quit">放弃本关</button>
          </div>
        </div>`),this.q('[data-act="resume"]').addEventListener("click",()=>this.togglePause()),this.q('[data-act="quit"]').addEventListener("click",()=>this.settle("lose-quit"))):this.phase==="paused"&&(this.phase="playing",this.timer.resume(),this.hud.dataset.state="default",this.clearOverlay())}bindVisibility(){document.addEventListener("visibilitychange",()=>{document.hidden&&this.phase==="playing"&&this.togglePause()})}settle(t){if(this.phase==="settled")return;this.phase="settled",this.timer.stop(),this.hud.dataset.state="hidden";const e=t==="win",s=e?this.starOf(this.score):0,i="#FFB020",n="#5A6785",o=y=>`<svg viewBox="0 0 24 24" fill="${y?i:n}" aria-hidden="true">
        <path d="M12 2l2.9 6.3 6.9.9-5 4.8 1.2 6.8L12 17.6 6 20.8l1.2-6.8-5-4.8 6.9-.9z"/>
      </svg>`,c=this.items.filter(y=>y.done).length,l=e?"收完了":t==="lose-timeout"?"时间到":"已放弃",d=e?"win":"lose",v=Math.round(this.timer.elapsedMs/1e3),f=q({levelId:this.level.id,stars:s,score:Math.max(0,Math.round(this.score)),timeSec:v,cleared:e});e?F():R();const p=f.newBestScore||f.newBestStars||f.newBestTime?'<p class="ec-modal__ribbon" data-ribbon="new">新纪录</p>':"";this.showOverlay(`
      <div class="ec-modal" role="dialog" aria-modal="true" aria-labelledby="ec-res-title">
        <p class="ec-modal__eyebrow">${this.level.title}</p>
        <h2 class="ec-modal__title" id="ec-res-title" data-tone="${d}">${l}</h2>
        ${p}
        ${e?`<div class="ec-modal__stars">${[0,1,2].map(y=>o(y<s)).join("")}</div>`:""}
        <div class="ec-modal__grid">
          <div class="ec-modal__cell"><span>收纳</span><b>${c}/${this.level.items.length}</b></div>
          <div class="ec-modal__cell"><span>用时</span><b>${v}s</b></div>
          <div class="ec-modal__cell"><span>得分</span><b>${Math.max(0,Math.round(this.score))}</b></div>
        </div>
        <div class="ec-modal__actions">
          <button class="ec-btn ec-btn--primary" data-act="again">再来一次</button>
          <button class="ec-btn ec-btn--ghost" data-act="modes">换个模式</button>
        </div>
      </div>`),this.q('[data-act="again"]').addEventListener("click",()=>location.reload()),this.q('[data-act="modes"]').addEventListener("click",()=>{location.href="./"}),this.root.querySelector(".ec-modal button")?.focus()}starOf(t){const[e,s,i]=this.level.scoring.starThresholds;return t>=e?3:t>=s?2:t>=i?1:0}showOverlay(t){this.clearOverlay();const e=document.createElement("div");e.className="ec-overlay",e.dataset.overlay="1",e.innerHTML=t,document.body.appendChild(e),document.addEventListener("keydown",this.onEsc)}clearOverlay(){document.querySelectorAll("[data-overlay]").forEach(t=>t.remove()),document.removeEventListener("keydown",this.onEsc)}onEsc=t=>{t.key==="Escape"&&this.phase==="paused"&&this.togglePause()};toast(t){document.querySelectorAll(".ec-toast").forEach(s=>s.remove());const e=document.createElement("div");e.className="ec-toast",e.textContent=t,document.body.appendChild(e),window.setTimeout(()=>e.remove(),2100)}bump(t){t.dataset.bump="true",window.setTimeout(()=>{delete t.dataset.bump},320)}shake(t){t.dataset.shake="true",window.setTimeout(()=>{delete t.dataset.shake},380)}}const w=document.getElementById("app");if(!w)throw new Error("#app 缺失");const O=new URLSearchParams(location.search),T=O.get("mode"),Jt=O.get("level");document.body.dataset.mode=T??"launcher";T==="diff"?new Nt(w,Jt).mount():T==="collect"?new Xt(w).mount():Wt(w);function E(a){return`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z" fill="${a?"var(--ec-accent)":"var(--ec-border-default)"}"/></svg>`}function Wt(a){const t=Lt(),e=C(),s=Ft(),i=e*3,n=Pt(),o=t.map(c=>{const l=qt(c.id),d=Array.from({length:5},(f,p)=>`<i data-on="${p<c.difficulty}"></i>`).join(""),v=n===c.id;return`
        <a class="ec-level" href="./?mode=diff&level=${encodeURIComponent(c.id)}"
           data-cleared="${l>0}" aria-label="第 ${c.no} 关 ${c.title}">
          <span class="ec-level__no">第 ${String(c.no).padStart(2,"0")} 关${v?" · 上次":""}</span>
          <h3 class="ec-level__name">${c.title}</h3>
          <span class="ec-level__meta">
            <span class="ec-level__diff" title="难度 ${c.difficulty}/5">${d}</span>
            <span>${l>0?"已通关":"未挑战"}</span>
          </span>
          <span class="ec-level__stars" aria-label="${l} 星">
            ${E(l>=1)}${E(l>=2)}${E(l>=3)}
          </span>
        </a>`}).join("");a.innerHTML=`
    <main class="ec-launcher">
      <p class="ec-launcher__eyebrow">Eye Challenge</p>
      <h1 class="ec-launcher__title">眼力大挑战</h1>
      <p class="ec-launcher__sub">选一个模式开始</p>

      <div class="ec-cards">
        <a class="ec-card" href="./?mode=diff">
          <span class="ec-card__tag">模式一</span>
          <h2 class="ec-card__title">找不同</h2>
          <p class="ec-card__desc">左右两张图，找出全部差异。共 ${e} 关，考验观察与记忆。</p>
          <span class="ec-card__cta">开始 →</span>
        </a>

        <a class="ec-card" href="./?mode=collect">
          <span class="ec-card__tag">模式二</span>
          <h2 class="ec-card__title">收纳大挑战</h2>
          <p class="ec-card__desc">桌上一堆杂物，按箱子的要求把东西拖进去，收齐换下一个箱子。</p>
          <span class="ec-card__cta">开始 →</span>
        </a>
      </div>

      <section class="ec-levels">
        <div class="ec-levels__head">
          <h2 class="ec-levels__title">选关</h2>
          <span class="ec-levels__sum">★ ${s} / ${i}</span>
        </div>
        <div class="ec-levels__grid">${o}</div>
      </section>

      <p class="ec-launcher__foot">共 ${e} 关 · 进度保存在本机浏览器</p>
    </main>
  `}
