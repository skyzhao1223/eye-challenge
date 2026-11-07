import { DiffGame } from './modes/diff';
import { CollectGame } from './modes/collect';
import { levelMetas, levelCount } from './levels/index';
import { getStars, totalStars, getLastPlayed } from './progress';

/* ============================================================
   路由：一个 index.html，靠 ?mode= 切换模式
   /             → 模式选择 + 选关
   /?mode=diff   → 找不同
   /?mode=collect→ 收纳大挑战
   ============================================================ */

type Mode = 'diff' | 'collect';

const app = document.getElementById('app');
if (!app) throw new Error('#app 缺失');

const params = new URLSearchParams(location.search);
const mode = params.get('mode') as Mode | null;
const levelId = params.get('level');

document.body.dataset.mode = mode ?? 'launcher';

if (mode === 'diff') {
  new DiffGame(app, levelId).mount();
} else if (mode === 'collect') {
  new CollectGame(app).mount();
} else {
  renderLauncher(app);
}

function starIcon(on: boolean): string {
  const fill = on ? 'var(--ec-accent)' : 'var(--ec-border-default)';
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z" fill="${fill}"/></svg>`;
}

function renderLauncher(root: HTMLElement): void {
  const metas = levelMetas();
  const total = levelCount();
  const stars = totalStars();
  const maxStars = total * 3;
  const last = getLastPlayed();

  const cards = metas
    .map((m) => {
      const s = getStars(m.id);
      const bars = Array.from({ length: 5 }, (_, i) => `<i data-on="${i < m.difficulty}"></i>`).join('');
      const isLast = last === m.id;
      return `
        <a class="ec-level" href="./?mode=diff&level=${encodeURIComponent(m.id)}"
           data-cleared="${s > 0}" aria-label="第 ${m.no} 关 ${m.title}">
          <span class="ec-level__no">第 ${String(m.no).padStart(2, '0')} 关${isLast ? ' · 上次' : ''}</span>
          <h3 class="ec-level__name">${m.title}</h3>
          <span class="ec-level__meta">
            <span class="ec-level__diff" title="难度 ${m.difficulty}/5">${bars}</span>
            <span>${s > 0 ? '已通关' : '未挑战'}</span>
          </span>
          <span class="ec-level__stars" aria-label="${s} 星">
            ${starIcon(s >= 1)}${starIcon(s >= 2)}${starIcon(s >= 3)}
          </span>
        </a>`;
    })
    .join('');

  root.innerHTML = `
    <main class="ec-launcher">
      <p class="ec-launcher__eyebrow">Eye Challenge</p>
      <h1 class="ec-launcher__title">眼力大挑战</h1>
      <p class="ec-launcher__sub">选一个模式开始</p>

      <div class="ec-cards">
        <a class="ec-card" href="./?mode=diff">
          <span class="ec-card__tag">模式一</span>
          <h2 class="ec-card__title">找不同</h2>
          <p class="ec-card__desc">左右两张图，找出全部差异。共 ${total} 关，考验观察与记忆。</p>
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
          <span class="ec-levels__sum">★ ${stars} / ${maxStars}</span>
        </div>
        <div class="ec-levels__grid">${cards}</div>
      </section>

      <p class="ec-launcher__foot">共 ${total} 关 · 进度保存在本机浏览器</p>
    </main>
  `;
}
