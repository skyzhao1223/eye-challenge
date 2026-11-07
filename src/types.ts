export type DiffKind = 'added' | 'removed' | 'moved' | 'recolored' | 'resized';

export interface Diff {
  id: string;
  /** 归一化坐标 0..1，相对图片左上角 */
  x: number;
  y: number;
  /** 判定半径，归一化，相对图宽 */
  r: number;
  hint: string;
  altText: string;
  kind: DiffKind;
}

export interface LevelScoring {
  base: number;
  perSecondLeft: number;
  perMissPenalty: number;
  starThresholds: [number, number, number];
}

export interface LevelHints {
  count: number;
  cooldownSec: number;
  scorePenaltyPct: number;
}

export interface Level {
  id: string;
  schemaVersion: string;
  title: string;
  diffCount: number;
  diffs: Diff[];
  difficulty: number;
  timeLimit: number;
  hints: LevelHints;
  scoring: LevelScoring;
  assets: { aspectRatio: number; width: number; height: number; altText: string };
  /** 骨架阶段用运行时生成的假素材，真实关卡换成 src */
  imageA: string;
  imageB: string;
}

export type TileState = 'idle' | 'hit' | 'hinted' | 'revealed' | 'miss';
