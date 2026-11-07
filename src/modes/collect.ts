import type { CollectItem, CollectLevel } from '../types-collect';
import { Timer } from '../timer';
import { mockCollect, itemSvg } from '../mock-collect';
import { recordResult } from '../progress';
import * as sfx from '../audio';

/* ============================================================
   模式二 · 收纳大挑战
   场景里散落一堆东西，顶部按顺序排箱子。
   把属于当前箱子的物品拖进去 → 箱子消失 → 换下一个。
   所有箱子清空 = 通关。

   硬约束：
   1. 拖拽用 Pointer Events，不用 HTML5 DnD（移动端 DnD 是残废的）
   2. 命中判定用「物品中心 到 箱子矩形」的最短距离，不要求完全落入
   3. 物品与箱子都用归一化坐标，与屏幕尺寸解耦
   4. 放错不消失，回弹原位，避免玩家误触就丢东西
   ============================================================ */

type Phase = 'loading' | 'playing' | 'paused' | 'settled';

interface ItemState {
  item: CollectItem;
  el: HTMLButtonElement;
  /** 已归位（进箱子了） */
  done: boolean;
}

export class CollectGame {
  private level: CollectLevel = mockCollect;
  private phase: Phase = 'loading';

  private root: HTMLElement;
  private itemLayer!: HTMLElement;
  private boxRow!: HTMLElement;
  private hud!: HTMLElement;
  private timerEl!: HTMLElement;
  private foundEl!: HTMLElement;
  private scoreEl!: HTMLElement;
  private hintBtn!: HTMLButtonElement;

  private items: ItemState[] = [];
  private boxIdx = 0;
  private score = 0;
  private wrongs = 0;
  private hintsUsed = 0;
  private hintCooldownUntil = 0;
  private timer!: Timer;



  constructor(root: HTMLElement) {
    this.root = root;
  }

  mount(): void {
    // iOS/Safari 必须在用户手势内解锁音频
    const unlockOnce = () => {
      sfx.unlock();
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true });
    window.addEventListener('keydown', unlockOnce, { once: true });

    this.renderShell();
    this.placeItems();
    this.beginPlay();
  }

  /* ---------------- 骨架 ---------------- */
  private renderShell(): void {
    this.root.innerHTML = `
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
    `;

    this.itemLayer = this.q('[data-items]');
    this.boxRow = this.q('[data-boxrow]');
    this.hud = this.q('.ec-hud');
    this.timerEl = this.q('[data-timer]');
    this.foundEl = this.q('[data-done]');
    this.scoreEl = this.q('[data-score]');
    this.hintBtn = this.q<HTMLButtonElement>('[data-act="hint"]');

    // Timer 必须在任何可能同步触发的流程之前构造
    this.timer = new Timer(
      this.level.timeLimit,
      (leftMs) => this.onTick(leftMs),
      () => this.settle('lose-timeout')
    );
    this.paintTimer(this.level.timeLimit * 1000);

    this.renderBoxes();
    this.bindTools();
    this.bindVisibility();
  }

  private q<T extends HTMLElement = HTMLElement>(sel: string): T {
    const el = this.root.querySelector<T>(sel);
    if (!el) throw new Error(`缺少节点: ${sel}`);
    return el;
  }

  /* ---------------- 箱子队列 ---------------- */
  private renderBoxes(): void {
    this.boxRow.innerHTML = '';
    this.level.boxes.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = 'ec-box';
      el.dataset.box = b.id;
      el.dataset.state = i === 0 ? 'active' : i === 1 ? 'next' : 'pending';
      el.style.setProperty('--box-hue', b.color ?? '#FFB020');
      el.innerHTML = `
        <div class="ec-box__lid"></div>
        <div class="ec-box__body">
          <span class="ec-box__label">${b.label}</span>
          <span class="ec-box__count">0/${b.kinds.reduce((n, k) => n + this.itemsOfKind(k).length, 0)}</span>
        </div>
      `;
      this.boxRow.appendChild(el);
    });
  }

  private itemsOfKind(kind: string): ItemState[] {
    return this.items.filter((s) => s.item.kind === kind);
  }

  private get activeBox() {
    return this.level.boxes[this.boxIdx];
  }

  private activeBoxEl(): HTMLElement | null {
    const b = this.activeBox;
    return b ? this.root.querySelector<HTMLElement>(`[data-box="${b.id}"]`) : null;
  }

  /* ---------------- 摆放物品 ---------------- */
  private placeItems(): void {
    this.items = this.level.items.map((item) => {
      const el = document.createElement('button');      el.className = 'ec-item';
      el.type = 'button';
      el.dataset.item = item.id;
      el.dataset.kind = item.kind;
      el.setAttribute('aria-label', `物品 ${item.kind}`);
      el.style.left = `${item.x * 100}%`;
      el.style.top = `${item.y * 100}%`;
      el.style.width = `${item.w * 100}%`;
      el.style.zIndex = String(item.z ?? 1);
      el.style.setProperty('--rot', `${item.rot ?? 0}deg`);
      el.innerHTML = itemSvg(item.kind);
      this.itemLayer.appendChild(el);

      el.addEventListener('click', (e) => this.onTap(e, st));
      const st: ItemState = { item, el, done: false };
      return st;
    });
  }

    /* ---------------- 点击即收纳 ---------------- */
    private onTap(e: MouseEvent, st: ItemState): void {
      if (this.phase !== 'playing' || st.done) return;
      e.preventDefault();
      const box = this.activeBox;
      const boxEl = this.activeBoxEl();
      if (!box || !boxEl) return;

      // 点对了：直接收进当前箱子
      if (box.kinds.includes(st.item.kind)) {
        this.acceptItem(st, boxEl);
        return;
      }

      // 点错了：抖动 + 扣分，不告诉答案
      this.wrongs += 1;
      this.score -= this.level.scoring.wrongPenalty;
      this.paintScore();
      this.shake(st.el);
      this.shake(boxEl);
      this.toast('这个不属于当前箱子');
    }


  /* 拖拽实现已移除（改为点击即收纳）。需要回退时：
     取回 onDown / bindDrag / hitBox / highlightTarget / clearHighlight，
     并把物品上的 click 监听换回 pointerdown。 */





  /* ---------------- 收下物品 ---------------- */
  private acceptItem(st: ItemState, boxEl: HTMLElement): void {
    const box = this.activeBox;
    if (!box.kinds.includes(st.item.kind)) {
      // 种类不匹配
      st.el.style.transform = '';
      this.wrongs += 1;
      this.score -= this.level.scoring.wrongPenalty;
      this.paintScore();
      sfx.sfxReject();
      this.toast(`${box.label}不收这个东西`);
      this.shake(boxEl);
      return;
    }

    st.done = true;
    st.el.dataset.done = 'true';
    st.el.disabled = true;
    st.el.style.pointerEvents = 'none';
    st.el.style.transform = '';

    // 飞向箱子
    const itemR = st.el.getBoundingClientRect();
    const boxR = boxEl.getBoundingClientRect();
    const dx = boxR.left + boxR.width / 2 - (itemR.left + itemR.width / 2);
    const dy = boxR.top + boxR.height / 2 - (itemR.top + itemR.height / 2);
    st.el.style.transform = `translate(${dx}px, ${dy}px) scale(0.25) rotate(var(--rot))`;
    st.el.style.opacity = '0';
    window.setTimeout(() => { st.el.style.visibility = 'hidden'; }, 340);

    this.score += this.level.scoring.perItem;
    this.paintScore();
    sfx.sfxPlace();
    this.bump(boxEl);
    this.paintBoxCounts();

    if (this.boxComplete()) this.completeBox();
  }

  private boxComplete(): boolean {
    const box = this.activeBox;
    if (!box) return false;
    return box.kinds.every((k) => this.itemsOfKind(k).every((s) => s.done));
  }

  private completeBox(): void {
    const boxEl = this.activeBoxEl();
    if (boxEl) {
      boxEl.dataset.state = 'clearing';
      window.setTimeout(() => {
        boxEl.dataset.state = 'gone';
      }, 380);
    }
    this.score += this.level.scoring.boxClearBonus;
    this.paintScore();
    this.toast('箱子收好了');

    this.boxIdx += 1;

    if (this.boxIdx >= this.level.boxes.length) {
      this.score += this.timer.leftSec * this.level.scoring.perSecondLeft;
      this.paintScore();
      window.setTimeout(() => this.settle('win'), 420);
      return;
    }

    // 下一个箱子激活
    const next = this.level.boxes[this.boxIdx];
    const nextEl = this.root.querySelector<HTMLElement>(`[data-box="${next.id}"]`);
    if (nextEl) nextEl.dataset.state = 'activating';
    window.setTimeout(() => {
      if (nextEl) nextEl.dataset.state = 'active';
      const after = this.level.boxes[this.boxIdx + 1];
      if (after) {
        const afterEl = this.root.querySelector<HTMLElement>(`[data-box="${after.id}"]`);
        if (afterEl) afterEl.dataset.state = 'next';
      }
      this.paintBoxCounts();
    }, 380);
  }

  private paintBoxCounts(): void {
    this.level.boxes.forEach((b) => {
      const el = this.root.querySelector<HTMLElement>(`[data-box="${b.id}"]`);
      if (!el) return;
      const total = b.kinds.reduce((n, k) => n + this.itemsOfKind(k).length, 0);
      const got = b.kinds.reduce((n, k) => n + this.itemsOfKind(k).filter((s) => s.done).length, 0);
      const c = el.querySelector<HTMLElement>('.ec-box__count');
      if (c) c.textContent = `${got}/${total}`;
    });
    const done = this.items.filter((s) => s.done).length;
    this.foundEl.textContent = String(done);
  }

  /* ---------------- 计时 / HUD ---------------- */
  private beginPlay(): void {
    this.phase = 'playing';
    // 点击即收纳已取代拖拽；如需恢复长按拖拽，取消下一行注释
    // this.bindDrag();
    this.paintBoxCounts();
    this.paintHintBtn();
    this.timer.start();
  }

  private onTick(leftMs: number): void {
    if (this.phase !== 'playing') return;
    this.paintTimer(leftMs);
  }

  private paintTimer(leftMs: number): void {
    const total = this.level.timeLimit * 1000;
    const s = Math.ceil(leftMs / 1000);
    this.timerEl.textContent =
      `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    const r = leftMs / total;
    this.timerEl.dataset.warn = String(r <= 0.3 && r > 0);
    this.timerEl.dataset.critical = String(leftMs <= 10_000);
  }

  private paintScore(): void {
    this.scoreEl.textContent = String(Math.max(0, Math.round(this.score)));
  }

  /* ---------------- 提示 ---------------- */
  private bindTools(): void {
    this.q('[data-act="restart"]').addEventListener('click', () => location.reload());
    this.q('[data-act="pause"]').addEventListener('click', () => this.togglePause());
    this.hintBtn.addEventListener('click', () => this.useHint());
  }

  private useHint(): void {
    if (this.phase !== 'playing') return;
    const now = performance.now();
    if (now < this.hintCooldownUntil) return;
    if (this.hintsUsed >= this.level.hints.count) return;

    const box = this.activeBox;
    if (!box) return;
    const target = this.items.find((s) => !s.done && box.kinds.includes(s.item.kind));
    if (!target) return;

    this.hintsUsed += 1;
    this.score -= (this.score * this.level.hints.scorePenaltyPct) / 100;
    this.paintScore();

    target.el.dataset.hinted = 'true';
    window.setTimeout(() => { delete target.el.dataset.hinted; }, 3200);
    this.toast(`提示：这个要放进${box.label}`);

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
    badge.textContent = cooling
      ? `${Math.ceil((this.hintCooldownUntil - performance.now()) / 1000)}s`
      : String(left);
    this.hintBtn.disabled = cooling || left <= 0 || this.phase !== 'playing';
  }

  /* ---------------- 暂停 ---------------- */
  private togglePause(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.timer.pause();
      this.hud.dataset.state = 'paused';
      this.showOverlay(`
        <div class="ec-modal" role="dialog" aria-modal="true">
          <p class="ec-modal__eyebrow">Paused</p>
          <h2 class="ec-modal__title">已暂停</h2>
          <div class="ec-modal__actions">
            <button class="ec-btn ec-btn--primary" data-act="resume">继续</button>
            <button class="ec-btn ec-btn--ghost" data-act="quit">放弃本关</button>
          </div>
        </div>`);
      this.q('[data-act="resume"]').addEventListener('click', () => this.togglePause());
      this.q('[data-act="quit"]').addEventListener('click', () => this.settle('lose-quit'));
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.timer.resume();
      this.hud.dataset.state = 'default';
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
    this.hud.dataset.state = 'hidden';

    const win = reason === 'win';
    const stars = win ? this.starOf(this.score) : 0;
    const STAR_ON = '#FFB020';
    const STAR_OFF = '#5A6785';
    const starSvg = (on: boolean) =>
      `<svg viewBox="0 0 24 24" fill="${on ? STAR_ON : STAR_OFF}" aria-hidden="true">
        <path d="M12 2l2.9 6.3 6.9.9-5 4.8 1.2 6.8L12 17.6 6 20.8l1.2-6.8-5-4.8 6.9-.9z"/>
      </svg>`;

    const done = this.items.filter((s) => s.done).length;
    const title = win ? '收完了' : reason === 'lose-timeout' ? '时间到' : '已放弃';
    const tone = win ? 'win' : 'lose';
    const elapsed = Math.round(this.timer.elapsedMs / 1000);

    // 写存档：失败不覆盖已有好成绩
    const rec = recordResult({
      levelId: this.level.id,
      stars,
      score: Math.max(0, Math.round(this.score)),
      timeSec: elapsed,
      cleared: win,
    });

    if (win) sfx.sfxWin();
    else sfx.sfxLose();

    const ribbon =
      rec.newBestScore || rec.newBestStars || rec.newBestTime
        ? `<p class="ec-modal__ribbon" data-ribbon="new">新纪录</p>`
        : '';

    this.showOverlay(`
      <div class="ec-modal" role="dialog" aria-modal="true" aria-labelledby="ec-res-title">
        <p class="ec-modal__eyebrow">${this.level.title}</p>
        <h2 class="ec-modal__title" id="ec-res-title" data-tone="${tone}">${title}</h2>
        ${ribbon}
        ${win ? `<div class="ec-modal__stars">${[0, 1, 2].map((i) => starSvg(i < stars)).join('')}</div>` : ''}
        <div class="ec-modal__grid">
          <div class="ec-modal__cell"><span>收纳</span><b>${done}/${this.level.items.length}</b></div>
          <div class="ec-modal__cell"><span>用时</span><b>${elapsed}s</b></div>
          <div class="ec-modal__cell"><span>得分</span><b>${Math.max(0, Math.round(this.score))}</b></div>
        </div>
        <div class="ec-modal__actions">
          <button class="ec-btn ec-btn--primary" data-act="again">再来一次</button>
          <button class="ec-btn ec-btn--ghost" data-act="modes">换个模式</button>
        </div>
      </div>`);

    // reload 保留当前 URL（含 mode 参数），不会回到大厅
    this.q('[data-act="again"]').addEventListener('click', () => location.reload());
    this.q('[data-act="modes"]').addEventListener('click', () => {
      // 回大厅：根路径，不是 index.html（两者在子路径部署时行为不同）
      location.href = './';
    });
    this.root.querySelector<HTMLElement>('.ec-modal button')?.focus();
  }

  private starOf(score: number): number {
    const [s3, s2, s1] = this.level.scoring.starThresholds;
    if (score >= s3) return 3;
    if (score >= s2) return 2;
    if (score >= s1) return 1;
    return 0;
  }

  /* ---------------- 反馈 ---------------- */
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

  private bump(el: HTMLElement): void {
    el.dataset.bump = 'true';
    window.setTimeout(() => { delete el.dataset.bump; }, 320);
  }

  private shake(el: HTMLElement): void {
    el.dataset.shake = 'true';
    window.setTimeout(() => { delete el.dataset.shake; }, 380);
  }
}
