import type { Diff, Level, TileState } from '../types';
import { Timer } from '../timer';
import { getLevel, nextLevel, levelNo, levelCount } from '../levels/index';
import { recordResult } from '../progress';
import * as sfx from '../audio';

/* ============================================================
   眼力大挑战 · 骨架
   本次目标：一关能完整玩通，手感可验证。
   硬约束（见 design/README.md）：
   1. 双图共用同一个 transform（stage 上唯一变换）
   2. 判定用归一化坐标 + getBoundingClientRect
   3. 计时用 performance.now() 差值
   ============================================================ */

type Phase = 'loading' | 'playing' | 'paused' | 'settled';

interface DiffState {
  diff: Diff;
  state: TileState;
}

export class DiffGame {
  private level: Level;
  private phase: Phase = 'loading';

  private root: HTMLElement;
  private stage!: HTMLElement;
  private paneA!: HTMLElement;
  private paneB!: HTMLElement;
  private hud!: HTMLElement;
  private timerEl!: HTMLElement;
  private foundEl!: HTMLElement;
  private scoreEl!: HTMLElement;
  private hintBtn!: HTMLButtonElement;

  private states: DiffState[] = [];
  private timer!: Timer;
  private score = 0;
  private misses = 0;
  private hintsUsed = 0;
  private hintCooldownUntil = 0;

  /** 唯一变换 */
  private scale = 1;
  private tx = 0;
  private ty = 0;

  private dragging = false;
  private dragMoved = false;
  private dragStart = { x: 0, y: 0, tx: 0, ty: 0 };
  /**
   * setPointerCapture 会把后续事件全部重定向到 stage，
   * 导致 pointerup 的 target 不再是 .ec-pane。
   * 所以必须在 pointerdown 时把命中目标存下来。
   */
  private downTarget: HTMLElement | null = null;

  private imagesReady = 0;
  /** 上一次响过的整秒数，用于最后 5 秒滴答去重 */
  private lastTickSec = -1;

  constructor(root: HTMLElement, levelId?: string | null) {
    this.root = root;
    this.level = getLevel(levelId);
    this.states = this.level.diffs.map((d) => ({ diff: d, state: 'idle' }));
  }

  /* ---------------- 启动 ---------------- */
  mount(): void {
    // iOS/Safari 必须在用户手势内解锁音频，不能等到第一次命中才 unlock
    const unlockOnce = () => {
      sfx.unlock();
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true });
    window.addEventListener('keydown', unlockOnce, { once: true });

    this.renderShell();
    this.preloadImages();
  }

  private renderShell(): void {
    this.root.innerHTML = `
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
    `;

    this.stage = this.q('.ec-stage');
    this.paneA = this.q('[data-pane="a"]');
    this.paneB = this.q('[data-pane="b"]');
    this.hud = this.q('.ec-hud');
    this.timerEl = this.q('[data-timer]');
    this.foundEl = this.q('[data-found]');
    this.scoreEl = this.q('[data-score]');

    const imgs = Array.from(this.root.querySelectorAll<HTMLImageElement>('.ec-pane img'));
    imgs[0].src = this.level.imageA;
    imgs[1].src = this.level.imageB;

    // 用 aspectRatio 占位，避免加载完成后布局跳动
    const ratio = `${this.level.assets.aspectRatio}`;
    this.paneA.style.aspectRatio = ratio;
    this.paneB.style.aspectRatio = ratio;

    this.hintBtn = this.root.querySelector<HTMLButtonElement>('[data-act="hint"]')!;

    this.bindStage();
    this.bindTools();
    this.bindVisibility();
  }

  private q<T extends HTMLElement = HTMLElement>(sel: string): T {
    const el = this.root.querySelector<T>(sel);
    if (!el) throw new Error(`缺少节点: ${sel}`);
    return el;
  }

  private preloadImages(): void {
    // ⚠️ 必须先建 Timer 再挂图片回调：
    // 图片命中缓存时 load 会在 forEach 内同步触发，
    // 若 Timer 尚未初始化，beginPlay() 会拿 undefined 直接抛错。
    this.timer = new Timer(
      this.level.timeLimit,
      (leftMs) => this.onTick(leftMs),
      () => this.settle('lose-timeout')
    );
    this.paintTimer(this.level.timeLimit * 1000);

    const imgs = Array.from(this.root.querySelectorAll<HTMLImageElement>('.ec-pane img'));
    imgs.forEach((img) => {
      const done = () => {
        if (img.dataset.ready === '1') return;
        img.dataset.ready = '1';
        this.imagesReady += 1;
        const pane = img.parentElement!;
        pane.querySelector('.ec-loading')?.remove();
        if (this.imagesReady >= 2) this.beginPlay();
      };
      if (img.complete) done();
      else {
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      }
    });
  }

  private beginPlay(): void {
    this.phase = 'playing';
    this.stage.dataset.locked = 'false';
    this.paintHintBtn();
    this.timer.start();
  }

  /* ---------------- 计时 / HUD ---------------- */
  private onTick(leftMs: number): void {
    if (this.phase !== 'playing') return;
    this.paintTimer(leftMs);
  }

  private paintTimer(leftMs: number): void {
    const totalMs = this.level.timeLimit * 1000;
    const leftSec = Math.ceil(leftMs / 1000);
    const mm = String(Math.floor(leftSec / 60)).padStart(2, '0');
    const ss = String(leftSec % 60).padStart(2, '0');
    this.timerEl.textContent = `${mm}:${ss}`;
    const ratio = leftMs / totalMs;
    this.timerEl.dataset.warn = String(ratio <= 0.3 && ratio > 0);
    this.timerEl.dataset.critical = String(leftMs <= 10_000);

    // 最后 5 秒每秒滴一声，同一秒只响一次
    if (leftSec > 0 && leftSec <= 5 && leftSec !== this.lastTickSec) {
      this.lastTickSec = leftSec;
      sfx.sfxTick(leftSec);
    }
  }

  private paintScore(): void {
    const found = this.states.filter((s) => s.state === 'hit').length;
    this.foundEl.textContent = String(found);
    this.scoreEl.textContent = String(Math.max(0, Math.round(this.score)));
  }

  /* ---------------- 点击判定 ---------------- */
  private bindStage(): void {
    this.stage.addEventListener('pointerdown', (e: PointerEvent) => {
      if (this.phase !== 'playing') return;
      this.dragging = true;
      this.dragMoved = false;
      this.downTarget = e.target as HTMLElement;
      this.dragStart = { x: e.clientX, y: e.clientY, tx: this.tx, ty: this.ty };
      this.stage.setPointerCapture(e.pointerId);
    });

    this.stage.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.dragging) return;
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      if (Math.hypot(dx, dy) > 6) {
        this.dragMoved = true;
        this.stage.dataset.dragging = 'true';
      }
      if (this.scale > 1) {
        this.tx = this.dragStart.tx + dx;
        this.ty = this.dragStart.ty + dy;
        this.applyTransform();
      }
    });

    const endDrag = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      this.stage.dataset.dragging = 'false';
      if (!this.dragMoved) this.handleClick(e.clientX, e.clientY);
      this.downTarget = null;
    };
    this.stage.addEventListener('pointerup', endDrag);
    this.stage.addEventListener('pointercancel', () => {
      this.dragging = false;
      this.stage.dataset.dragging = 'false';
    });

    this.stage.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        if (this.phase !== 'playing') return;
        e.preventDefault();
        const next = clamp(this.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 1, 3);
        this.zoomAt(next, e.clientX, e.clientY);
      },
      { passive: false }
    );
  }

  /** 点在哪张图上都能判定；坐标归一化后与分辨率无关 */
  private handleClick(clientX: number, clientY: number): void {
    const el = this.downTarget;
    if (!el) return;
    const pane = el.closest<HTMLElement>('.ec-pane');
    if (!pane) return;

    const rect = pane.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;

    const hit = this.states.find((s) => {
      if (s.state === 'hit') return false;
      const dx = nx - s.diff.x;
      // y 方向换算到「图宽单位」，才能和 r 直接比
      const dy = (ny - s.diff.y) * this.level.assets.aspectRatio;
      return Math.hypot(dx, dy) <= s.diff.r;
    });

    if (hit) this.onHit(hit);
    else this.onMiss(pane, clientX - rect.left, clientY - rect.top);
  }

  private onHit(s: DiffState): void {
    s.state = 'hit';
    this.score += this.perDiffScore();
    this.paintScore();
    this.paintHotspot(s);
    sfx.sfxHit();
    this.toast(`找到了 · ${s.diff.altText}`);

    // 加剩余时间奖励后要重算一次，否则 HUD 停在奖励前的分数
    this.score += this.timer.leftSec * this.level.scoring.perSecondLeft;
    this.paintScore();

    const found = this.states.filter((x) => x.state === 'hit').length;
    if (found === this.level.diffCount) {
      this.settle('win');
    }
  }

  private onMiss(pane: HTMLElement, localX: number, localY: number): void {
    this.misses += 1;
    this.score -= this.level.scoring.perMissPenalty;
    sfx.sfxMiss();

    const cross = document.createElement('div');
    cross.className = 'ec-miss';
    cross.style.left = `${localX}px`;
    cross.style.top = `${localY}px`;
    pane.appendChild(cross);
    window.setTimeout(() => cross.remove(), 560);

    if (this.misses % 3 === 0) this.toast(`连续点空 ${this.misses} 次，别乱戳`);
    this.paintScore();
  }

  private perDiffScore(): number {
    return Math.round(this.level.scoring.base / this.level.diffCount);
  }

  /* ---------------- 热区渲染 ---------------- */
  private paintHotspot(s: DiffState): void {
    for (const key of ['a', 'b'] as const) {
      const layer = this.root.querySelector<HTMLElement>(`[data-hotspots="${key}"]`);
      if (!layer) continue;
      let el = layer.querySelector<HTMLElement>(`[data-diff="${s.diff.id}"]`);
      if (!el) {
        el = document.createElement('div');
        el.className = 'ec-hotspot';
        el.dataset.diff = s.diff.id;
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', `${s.diff.altText}`);
        layer.appendChild(el);
      }
      // r 相对图宽 → 直径 = 2r * 图宽；用百分比定位后，宽高都用 %
      const dPct = s.diff.r * 2 * 100;
      el.style.left = `${s.diff.x * 100}%`;
      el.style.top = `${s.diff.y * 100}%`;
      el.style.width = `${dPct}%`;
      el.style.height = `${dPct * this.level.assets.aspectRatio}%`;
      el.dataset.state = s.state;
    }
  }

  /* ---------------- 提示 ---------------- */
  private bindTools(): void {
    this.root.querySelector('[data-act="restart"]')!.addEventListener('click', () => location.reload());
    this.root.querySelector('[data-act="pause"]')!.addEventListener('click', () => this.togglePause());
    this.root.querySelector('[data-act="zoom"]')!.addEventListener('click', () => {
      this.zoomAt(this.scale >= 2 ? 1 : 2, window.innerWidth / 2, window.innerHeight / 2);
    });
    this.hintBtn.addEventListener('click', () => this.useHint());
    this.paintHintBtn();
  }

  private useHint(): void {
    if (this.phase !== 'playing') return;
    const now = performance.now();
    if (now < this.hintCooldownUntil) return;
    if (this.hintsUsed >= this.level.hints.count) return;

    const target = this.states.find((s) => s.state === 'idle');
    if (!target) return;

    this.hintsUsed += 1;
    this.score -= (this.score * this.level.hints.scorePenaltyPct) / 100;
    target.state = 'hinted';
    this.paintHotspot(target);
    this.paintScore();
    sfx.sfxHint();
    this.toast(`提示：${target.diff.hint}`);

    // 提示态 4.8s 后回 idle（3 次脉冲 1.6s）
    window.setTimeout(() => {
      if (target.state === 'hinted') {
        target.state = 'idle';
        this.paintHotspot(target);
      }
    }, 4800);

    this.hintCooldownUntil = now + this.level.hints.cooldownSec * 1000;
    this.paintHintBtn();
    this.tickCooldown();
  }

  private tickCooldown(): void {
    if (this.phase === 'settled') return;
    this.paintHintBtn();
    if (performance.now() < this.hintCooldownUntil) {
      window.setTimeout(() => this.tickCooldown(), 200);
    }
  }

  private paintHintBtn(): void {
    const left = this.level.hints.count - this.hintsUsed;
    const cooling = performance.now() < this.hintCooldownUntil;
    const badge = this.hintBtn.querySelector<HTMLElement>('[data-hint-badge]')!;
    badge.textContent = cooling ? `${Math.ceil((this.hintCooldownUntil - performance.now()) / 1000)}s` : String(left);
    this.hintBtn.disabled = cooling || left <= 0 || this.phase !== 'playing';
  }

  /* ---------------- 暂停 ---------------- */
  private togglePause(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.timer.pause();
      this.hud.dataset.state = 'paused';
      this.stage.dataset.locked = 'true';
      this.showOverlay(`
        <div class="ec-modal" role="dialog" aria-modal="true">
          <p class="ec-modal__eyebrow">Paused</p>
          <h2 class="ec-modal__title">已暂停</h2>
          <div class="ec-modal__actions">
            <button class="ec-btn ec-btn--primary" data-act="resume">继续</button>
            <button class="ec-btn ec-btn--ghost" data-act="quit">放弃本关</button>
          </div>
        </div>
      `);
      this.q('[data-act="resume"]').addEventListener('click', () => this.togglePause());
      this.q('[data-act="quit"]').addEventListener('click', () => this.settle('lose-quit'));
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.timer.resume();
      this.hud.dataset.state = 'default';
      this.stage.dataset.locked = 'false';
      this.clearOverlay();
    }
  }

  private bindVisibility(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.phase === 'playing') this.togglePause();
    });
  }

  /* ---------------- 结算 ---------------- */
  private settle(reason: 'win' | 'lose-timeout' | 'lose-quit'): void {
    if (this.phase === 'settled') return;
    this.phase = 'settled';
    this.timer.stop();
    this.stage.dataset.locked = 'true';
    this.hud.dataset.state = 'hidden';

    const found = this.states.filter((s) => s.state === 'hit').length;
    const win = reason === 'win';

    if (!win) {
      this.states.forEach((s) => {
        if (s.state !== 'hit') {
          s.state = 'revealed';
          this.paintHotspot(s);
        }
      });
    }

    const stars = win ? this.starOf(this.score) : 0;
    // SVG 的 fill 属性不解析 CSS 变量，必须用真实颜色值
    const STAR_ON = '#FFB020';
    const STAR_OFF = '#5A6785';
    const starSvg = (on: boolean) =>
      `<svg viewBox="0 0 24 24" fill="${on ? STAR_ON : STAR_OFF}" aria-hidden="true">
        <path d="M12 2l2.9 6.3 6.9.9-5 4.8 1.2 6.8L12 17.6 6 20.8l1.2-6.8-5-4.8 6.9-.9z"/>
      </svg>`;

    const title = win ? '通关' : reason === 'lose-timeout' ? '时间到' : '已放弃';
    const tone = win ? 'win' : 'lose';
    const elapsed = Math.round(this.timer.elapsedMs / 1000);

    // 写存档：失败不覆盖已有好成绩，只增不减
    const rec = recordResult({
      levelId: this.level.id,
      stars,
      score: Math.max(0, Math.round(this.score)),
      timeSec: elapsed,
      cleared: win,
    });

    if (win) sfx.sfxWin();
    else sfx.sfxLose();

    const next = win ? nextLevel(this.level.id) : null;
    const isLast = win && next === null;
    const no = levelNo(this.level.id);
    const total = levelCount();

    // 新纪录缎带：只在本局刷新了任一纪录时出现
    const ribbon =
      rec.newBestScore || rec.newBestStars || rec.newBestTime
        ? `<p class="ec-modal__ribbon" data-ribbon="new">新纪录</p>`
        : '';

    this.showOverlay(`
      <div class="ec-modal" role="dialog" aria-modal="true" aria-labelledby="ec-res-title">
        <p class="ec-modal__eyebrow">第 ${no} / ${total} 关 · ${this.level.title}</p>
        <h2 class="ec-modal__title" id="ec-res-title" data-tone="${tone}">${title}</h2>
        ${ribbon}
        ${win ? `<div class="ec-modal__stars">${[0, 1, 2].map((i) => starSvg(i < stars)).join('')}</div>` : ''}
        <div class="ec-modal__grid">
          <div class="ec-modal__cell"><span>找到</span><b>${found}/${this.level.diffCount}</b></div>
          <div class="ec-modal__cell"><span>用时</span><b>${elapsed}s</b></div>
          <div class="ec-modal__cell"><span>得分</span><b>${Math.max(0, Math.round(this.score))}</b></div>
        </div>
        <div class="ec-modal__actions">
          ${win && next ? `<button class="ec-btn ec-btn--primary" data-act="next">下一关 →</button>` : ''}
          ${isLast ? `<button class="ec-btn ec-btn--primary" data-act="hall">完成全部关卡 · 回大厅</button>` : ''}
          <button class="ec-btn ${win && next ? 'ec-btn--ghost' : 'ec-btn--primary'}" data-act="again">重玩本关</button>
          ${win && next ? `<button class="ec-btn ec-btn--ghost" data-act="hall">回大厅</button>` : ''}
        </div>
      </div>
    `);

    // 通关闭环：真正进下一关，不再 reload 困在原地
    this.q('[data-act="again"]').addEventListener('click', () => {
      const url = new URL(location.href);
      url.searchParams.set('mode', 'diff');
      url.searchParams.set('level', this.level.id);
      location.href = url.toString();
    });

    const nextBtn = this.root.querySelector<HTMLElement>('[data-act="next"]');
    nextBtn?.addEventListener('click', () => {
      if (!next) return;
      const url = new URL(location.href);
      url.searchParams.set('mode', 'diff');
      url.searchParams.set('level', next.id);
      location.href = url.toString();
    });

    this.root.querySelector<HTMLElement>('[data-act="hall"]')?.addEventListener('click', () => {
      location.href = './';
    });

    // 焦点陷阱（最小实现）
    const modal = this.root.querySelector<HTMLElement>('.ec-modal');
    modal?.querySelector<HTMLElement>('button')?.focus();
  }

  private starOf(score: number): number {
    const [s3, s2, s1] = this.level.scoring.starThresholds;
    if (score >= s3) return 3;
    if (score >= s2) return 2;
    if (score >= s1) return 1;
    return 0;
  }

  /* ---------------- 遮罩 / Toast ---------------- */
  private showOverlay(html: string): void {
    this.clearOverlay();
    const o = document.createElement('div');
    o.className = 'ec-overlay';
    o.dataset.overlay = '1';
    o.innerHTML = html;
    document.body.appendChild(o);
    document.addEventListener('keydown', this.onEsc);
  }

  private clearOverlay(): void {
    document.querySelectorAll('[data-overlay]').forEach((n) => n.remove());
    document.removeEventListener('keydown', this.onEsc);
  }

  private onEsc = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.phase === 'paused') this.togglePause();
  };

  private toast(msg: string): void {
    document.querySelectorAll('.ec-toast').forEach((n) => n.remove());
    const t = document.createElement('div');
    t.className = 'ec-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    window.setTimeout(() => t.remove(), 2100);
  }

  /* ---------------- 缩放 ---------------- */
  private zoomAt(next: number, cx: number, cy: number): void {
    const rect = this.stage.getBoundingClientRect();
    const px = (cx - rect.left) / this.scale;
    const py = (cy - rect.top) / this.scale;
    this.tx += px * (this.scale - next);
    this.ty += py * (this.scale - next);
    this.scale = next;
    if (this.scale === 1) { this.tx = 0; this.ty = 0; }
    this.applyTransform();
  }

  private applyTransform(): void {
    this.stage.style.transform = `translate(${this.tx}px, ${this.ty}px) scale(${this.scale})`;
    const btn = this.root.querySelector<HTMLElement>('[data-act="zoom"]');
    if (btn) btn.textContent = `${Math.round(this.scale * 100)}%`;
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// 由 src/main.ts 路由挂载

