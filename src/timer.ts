/**
 * Timer —— 必须用 performance.now() 差值累加。
 * 绝对禁止 setInterval 计数：切后台会被浏览器节流到 1s/次甚至冻结，等于作弊。
 */
export class Timer {
  private startedAt = 0;
  private accumulated = 0;
  private running = false;
  private raf = 0;
  private limitMs: number;
  private readonly onTick: (leftMs: number) => void;
  private readonly onExpire: () => void;
  private fired = false;

  constructor(limitSec: number, onTick: (leftMs: number) => void, onExpire: () => void) {
    this.limitMs = limitSec * 1000;
    this.onTick = onTick;
    this.onExpire = onExpire;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startedAt = performance.now();
    this.loop();
  }

  pause(): void {
    if (!this.running) return;
    this.accumulated += performance.now() - this.startedAt;
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resume(): void {
    if (this.running) return;
    this.running = true;
    this.startedAt = performance.now();
    this.loop();
  }

  /** 命中也走 pause，保证结算后计时不再跳动 */
  stop(): void {
    this.pause();
  }

  get elapsedMs(): number {
    return this.accumulated + (this.running ? performance.now() - this.startedAt : 0);
  }

  get leftMs(): number {
    return Math.max(0, this.limitMs - this.elapsedMs);
  }

  get leftSec(): number {
    return Math.ceil(this.leftMs / 1000);
  }

  private loop = (): void => {
    const left = this.leftMs;
    this.onTick(left);
    if (left <= 0) {
      if (!this.fired) {
        this.fired = true;
        this.pause();
        this.onExpire();
      }
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };
}
