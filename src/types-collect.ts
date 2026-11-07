export interface CollectBox {
  id: string;
  label: string;
  kinds: string[];
  color?: string;
}

export interface CollectItem {
  id: string;
  kind: string;
  /** 归一化中心坐标 0..1 */
  x: number;
  y: number;
  /** 宽度，相对场景宽度 */
  w: number;
  rot?: number;
  z?: number;
}

export interface CollectLevel {
  id: string;
  mode: 'collect';
  schemaVersion: string;
  title: string;
  boxes: CollectBox[];
  items: CollectItem[];
  timeLimit: number;
  hints: { count: number; cooldownSec: number; scorePenaltyPct: number };
  scoring: {
    perItem: number;
    boxClearBonus: number;
    perSecondLeft: number;
    wrongPenalty: number;
    starThresholds: [number, number, number];
  };
  scene: { background: 'table' | 'floor' | 'desk' | 'shelf'; altText: string };
}
