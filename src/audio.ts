/* ============================================================
   音效 —— WebAudio 合成，零素材文件
   为什么不用 <audio> + mp3：
   1. 每个音效一个文件，加载慢且要处理解码时序
   2. 手机上多路 <audio> 并发会被系统打断
   3. 合成音可以精确控制包络，听起来更「脆」

   硬约束：
   1. AudioContext 必须在用户手势后创建/恢复，否则 iOS/Safari 会挂起
   2. 全部静音开关受 prefers-reduced-motion 影响（无障碍）
   3. 任何异常都吞掉，音效失败绝不能影响游戏
   ============================================================ */

type Ctx = AudioContext & { _ecUnlocked?: boolean };

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let enabled = true;

const MASTER_VOLUME = 0.28;

function reduceMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** 首次用户手势时调用，解锁音频上下文 */
export function unlock(): void {
  if (!enabled) return;
  if (reduceMotion()) {
    enabled = false;
    return;
  }
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) {
        enabled = false;
        return;
      }
      ctx = new AC() as Ctx;
      master = ctx.createGain();
      master.gain.value = MASTER_VOLUME;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    enabled = false;
  }
}

export function setMuted(muted: boolean): void {
  enabled = !muted;
  if (master && ctx) {
    try {
      master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, ctx.currentTime, 0.02);
    } catch {
      /* noop */
    }
  }
}

export function isMuted(): boolean {
  return !enabled;
}

/**
 * 一个音符。
 * @param freq 起始频率 Hz
 * @param dur  时长秒
 * @param type 波形
 * @param gain 峰值音量 0..1
 * @param slideTo 若给出，音高在该时长内滑到这里（扫频）
 */
function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.5,
  slideTo?: number
): void {
  if (!enabled || !ctx || !master) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + dur);
    }

    // 快起慢落，避免爆音
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(gain, now + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(env);
    env.connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  } catch {
    /* noop */
  }
}

/* ---------------- 对外音效 ---------------- */

/** 找对了：两段上行小三度，明亮短促 */
export function sfxHit(): void {
  tone(880, 0.09, 'triangle', 0.55);
  window.setTimeout(() => tone(1320, 0.12, 'triangle', 0.45), 70);
}

/** 点空了：短促下坠，钝而不刺耳 */
export function sfxMiss(): void {
  tone(220, 0.14, 'sawtooth', 0.32, 130);
}

/** 收纳成功：轻快单音，比 diff 的命中低一点，避免两个模式听感雷同 */
export function sfxPlace(): void {
  tone(660, 0.07, 'sine', 0.5);
  window.setTimeout(() => tone(990, 0.09, 'sine', 0.4), 55);
}

/** 放错箱子：低沉短音 */
export function sfxReject(): void {
  tone(180, 0.16, 'square', 0.22, 110);
}

/**
 * 最后 5 秒滴答。
 * 用「秒数」做参数便于调用方去重：同一秒只响一次由调用方保证。
 */
export function sfxTick(secondsLeft: number): void {
  // 越接近 0 频率越高，制造紧迫感
  const base = secondsLeft <= 1 ? 1400 : secondsLeft <= 3 ? 1100 : 900;
  tone(base, 0.045, 'sine', 0.3);
}

/** 通关：琶音上行 */
export function sfxWin(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => {
    window.setTimeout(() => tone(f, 0.18, 'triangle', 0.4), i * 90);
  });
}

/** 失败：下行两音 */
export function sfxLose(): void {
  tone(392, 0.2, 'triangle', 0.35, 330);
  window.setTimeout(() => tone(262, 0.3, 'triangle', 0.3, 196), 160);
}

/** 提示激活：柔和上滑，不抢戏 */
export function sfxHint(): void {
  tone(520, 0.22, 'sine', 0.28, 780);
}

/** UI 点击 */
export function sfxTap(): void {
  tone(600, 0.035, 'sine', 0.18);
}
