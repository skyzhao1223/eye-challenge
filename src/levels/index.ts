/* ============================================================
   关卡注册表 —— 唯一的关卡入口
   为什么要有这一层：
   1. 业务代码不应 import 具体关卡文件，否则加一关就要改玩法代码
   2. 关卡顺序、解锁条件、分组都集中在这里，方便运营调整
   3. 骨架期关卡由程序生成（mock），将来换成 design/levels/*.json 只改这里

   约定：
   - id 必须与 design/level.schema.json 的 pattern 一致：lv-xxx
   - 数组顺序即游玩顺序，index 就是关卡序号
   - 只导出函数，不导出可变数组，防止外部 splice 破坏顺序
   ============================================================ */

import type { Level } from '../types';
import { realLevels } from './real';

export interface LevelMeta {
  id: string;
  /** 数组内序号，从 1 开始，用于展示「第 3 关」 */
  no: number;
  difficulty: number;
  title: string;
}

/** 已发布的关卡，顺序即游玩顺序 */
const REGISTRY: Level[] = [...realLevels];

/** 关卡是否可用（骨架期全部可用；将来接解锁条件改这里） */
export function isUnlocked(_levelId: string): boolean {
  return true;
}

export function allLevels(): Level[] {
  return REGISTRY.slice();
}

export function levelCount(): number {
  return REGISTRY.length;
}

export function levelMetas(): LevelMeta[] {
  return REGISTRY.map((lv, i) => ({
    id: lv.id,
    no: i + 1,
    difficulty: lv.difficulty,
    title: lv.title,
  }));
}

export function hasLevel(levelId: string): boolean {
  return REGISTRY.some((lv) => lv.id === levelId);
}

/** 取关卡；找不到返回第一关而不是抛错，避免 URL 参数错就白屏 */
export function getLevel(levelId?: string | null): Level {
  if (!levelId) return REGISTRY[0];
  return REGISTRY.find((lv) => lv.id === levelId) ?? REGISTRY[0];
}

/** 下一关；已是最后一关返回 null（由调用方决定回大厅还是循环） */
export function nextLevel(levelId: string): Level | null {
  const i = REGISTRY.findIndex((lv) => lv.id === levelId);
  if (i < 0 || i + 1 >= REGISTRY.length) return null;
  return REGISTRY[i + 1];
}

export function prevLevel(levelId: string): Level | null {
  const i = REGISTRY.findIndex((lv) => lv.id === levelId);
  if (i <= 0) return null;
  return REGISTRY[i - 1];
}

/** 关卡序号（1-based）；未知关卡返回 1 */
export function levelNo(levelId: string): number {
  const i = REGISTRY.findIndex((lv) => lv.id === levelId);
  return i < 0 ? 1 : i + 1;
}
