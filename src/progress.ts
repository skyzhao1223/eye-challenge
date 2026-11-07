/* ============================================================
   进度存档 —— localStorage
   key: ec.progress.v1
   结构：
   {
     version: 1,
     levels: {
       "lv-001": { stars: 3, bestScore: 412, bestTimeSec: 45, plays: 7, clearedAt: 1699... }
     },
     lastPlayed: "lv-001"
   }

   硬约束：
   1. 读写全部 try/catch —— 隐私模式、配额满、被禁都会抛
   2. 未知字段不动（向前兼容），版本号不匹配直接重置而不是崩
   3. 只在「通关」时写 stars，失败不覆盖已有好成绩（best 只增不减）
   ============================================================ */

const KEY = 'ec.progress.v1';
const VERSION = 1;

export interface LevelRecord {
  stars: number;
  bestScore: number;
  bestTimeSec: number;
  plays: number;
  clearedAt: number | null;
}

interface Store {
  version: number;
  levels: Record<string, LevelRecord>;
  lastPlayed: string | null;
}

const emptyRecord = (): LevelRecord => ({
  stars: 0,
  bestScore: 0,
  bestTimeSec: 0,
  plays: 0,
  clearedAt: null,
});

function emptyStore(): Store {
  return { version: VERSION, levels: {}, lastPlayed: null };
}

/** 全局缓存，避免每次读都 parse 一遍 JSON */
let cache: Store | null = null;

function load(): Store {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      cache = emptyStore();
      return cache;
    }
    const parsed = JSON.parse(raw) as Partial<Store>;
    if (!parsed || parsed.version !== VERSION || typeof parsed.levels !== 'object' || !parsed.levels) {
      // 版本不匹配 / 结构损坏 → 重置，不抛错
      cache = emptyStore();
      return cache;
    }
    cache = {
      version: VERSION,
      levels: parsed.levels as Record<string, LevelRecord>,
      lastPlayed: typeof parsed.lastPlayed === 'string' ? parsed.lastPlayed : null,
    };
    return cache;
  } catch {
    cache = emptyStore();
    return cache;
  }
}

function save(store: Store): void {
  cache = store;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* 隐私模式 / 配额满：静默降级为仅内存 */
  }
}

/* ---------------- 读 ---------------- */

export function getRecord(levelId: string): LevelRecord {
  const r = load().levels[levelId];
  return r ? { ...emptyRecord(), ...r } : emptyRecord();
}

export function getStars(levelId: string): number {
  return getRecord(levelId).stars;
}

export function getLastPlayed(): string | null {
  return load().lastPlayed;
}

/** 总星数，用于大厅展示 */
export function totalStars(): number {
  const lv = load().levels;
  return Object.keys(lv).reduce((sum, k) => sum + (lv[k].stars || 0), 0);
}

/* ---------------- 写 ---------------- */

export interface ResultInput {
  levelId: string;
  /** 0..3，失败传 0 */
  stars: number;
  score: number;
  timeSec: number;
  /** 是否通关（只有通关才累加 stars / clearedAt） */
  cleared: boolean;
}

/**
 * 记录一次结果。返回本次是否刷新了纪录，便于结算页展示「新纪录」缎带。
 * 只增不减：bestScore / bestTimeSec / stars 都不会被更差的成绩覆盖。
 */
export function recordResult(input: ResultInput): {
  newBestScore: boolean;
  newBestTime: boolean;
  newBestStars: boolean;
} {
  const store = load();
  const prev = store.levels[input.levelId] ?? emptyRecord();
  const next: LevelRecord = { ...prev };

  next.plays = prev.plays + 1;

  const newBestScore = input.score > prev.bestScore;
  if (newBestScore) next.bestScore = input.score;

  // 用时只在通关时比较（失败/放弃的用时没有意义）
  const newBestTime =
    input.cleared && (prev.bestTimeSec === 0 || input.timeSec < prev.bestTimeSec);
  if (newBestTime) next.bestTimeSec = input.timeSec;

  const newBestStars = input.cleared && input.stars > prev.stars;
  if (newBestStars) next.stars = input.stars;

  if (input.cleared && prev.clearedAt === null) next.clearedAt = Date.now();

  store.levels[input.levelId] = next;
  store.lastPlayed = input.levelId;
  save(store);

  return { newBestScore, newBestTime, newBestStars };
}

export function setLastPlayed(levelId: string): void {
  const store = load();
  store.lastPlayed = levelId;
  save(store);
}

/* ---------------- 维护 ---------------- */

export function resetAll(): void {
  save(emptyStore());
}

/** 导出成纯文本，方便用户自己备份 */
export function exportJson(): string {
  return JSON.stringify(load(), null, 2);
}
