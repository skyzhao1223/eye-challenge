import type { CollectLevel } from './types-collect';

/**
 * 模式二「收纳大挑战」的假素材。
 * 所有物品都是程序化 SVG，接入真素材后整份文件可删。
 */

/** 每个 kind 一个 100x100 的 SVG 片段 */
function art(kind: string): string {
  switch (kind) {
    case 'pen':
      return `<g transform="rotate(-24 50 50)">
        <rect x="43" y="10" width="14" height="58" rx="3" fill="#F2C14E"/>
        <rect x="43" y="10" width="14" height="12" rx="3" fill="#E07A5F"/>
        <path d="M43 68h14l-7 20z" fill="#F0E2C8"/>
        <path d="M46.5 82h7l-3.5 8z" fill="#33322F"/>
        <rect x="43" y="30" width="14" height="4" fill="#D9A93A"/>
      </g>`;

    case 'ruler':
      return `<g transform="rotate(-6 50 50)">
        <rect x="8" y="41" width="84" height="18" rx="3" fill="#F4A259"/>
        <g stroke="#7A4A1E" stroke-width="2" stroke-linecap="round">
          <path d="M18 41v6M26 41v9M34 41v6M42 41v9M50 41v6M58 41v9M66 41v6M74 41v9M82 41v6"/>
        </g>
      </g>`;

    case 'eraser':
      return `<g transform="rotate(9 50 50)">
        <rect x="24" y="36" width="52" height="28" rx="6" fill="#F7C6D9"/>
        <rect x="24" y="36" width="52" height="11" rx="6" fill="#FFF5F8"/>
        <rect x="24" y="56" width="52" height="8" fill="#E9A9C4"/>
      </g>`;

    case 'scissors':
      return `<g transform="rotate(14 50 50)">
        <path d="M30 22 L52 52 L44 58 L24 28 z" fill="#C9D3DE"/>
        <path d="M70 22 L48 52 L56 58 L76 28 z" fill="#AEBAC8"/>
        <circle cx="28" cy="72" r="11" fill="none" stroke="#D94F4F" stroke-width="7"/>
        <circle cx="72" cy="72" r="11" fill="none" stroke="#D94F4F" stroke-width="7"/>
        <circle cx="50" cy="55" r="3.5" fill="#6B7683"/>
      </g>`;

    case 'cookie':
      return `<g>
        <circle cx="50" cy="50" r="30" fill="#C98A4B"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="#A96F36" stroke-width="3"/>
        <g fill="#5A3A1A">
          <circle cx="40" cy="40" r="4"/><circle cx="60" cy="44" r="3.5"/>
          <circle cx="46" cy="60" r="4"/><circle cx="62" cy="62" r="3"/>
          <circle cx="52" cy="50" r="2.5"/>
        </g>
      </g>`;

    case 'candy':
      return `<g transform="rotate(-12 50 50)">
        <ellipse cx="50" cy="50" rx="22" ry="16" fill="#F26D9C"/>
        <path d="M28 50 L10 36 L12 50 L10 64 z" fill="#F7A0BE"/>
        <path d="M72 50 L90 36 L88 50 L90 64 z" fill="#F7A0BE"/>
        <path d="M36 44 q6 6 0 12" stroke="#FFF" stroke-width="3" fill="none" opacity="0.7"/>
      </g>`;

    case 'apple':
      return `<g>
        <circle cx="50" cy="54" r="27" fill="#D64545"/>
        <circle cx="50" cy="54" r="27" fill="none" stroke="#B33333" stroke-width="2"/>
        <path d="M50 27 q2 -10 10 -12 q-2 10 -8 13 z" fill="#3F9D63"/>
        <rect x="48" y="20" width="3" height="10" rx="1.5" fill="#6B4A2B"/>
        <ellipse cx="40" cy="46" rx="7" ry="9" fill="#fff" opacity="0.18"/>
      </g>`;

    case 'carton':
      return `<g>
        <path d="M18 36 L50 24 L82 36 L82 78 L50 90 L18 78 z" fill="#C08552"/>
        <path d="M18 36 L50 48 L82 36" fill="none" stroke="#9C6537" stroke-width="3"/>
        <path d="M50 48 L50 90" stroke="#9C6537" stroke-width="3"/>
        <path d="M18 36 L50 24 L50 40 L18 50 z" fill="#D19A63"/>
        <path d="M82 36 L50 24 L50 40 L82 50 z" fill="#B07545"/>
        <rect x="44" y="60" width="12" height="20" fill="#E8D5B7" opacity="0.75"/>
      </g>`;

    case 'ball':
      return `<g>
        <circle cx="50" cy="50" r="28" fill="#4A90D9"/>
        <path d="M22 50 a28 28 0 0 1 56 0" fill="#6FB1EE"/>
        <path d="M23 44 q27 -14 54 0" stroke="#FFF" stroke-width="3" fill="none" opacity="0.7"/>
        <path d="M23 58 q27 14 54 0" stroke="#FFF" stroke-width="3" fill="none" opacity="0.5"/>
        <ellipse cx="38" cy="36" rx="7" ry="5" fill="#fff" opacity="0.35" transform="rotate(-25 38 36)"/>
      </g>`;

    case 'cup':
      return `<g>
        <path d="M30 32 h36 l-5 46 a6 6 0 0 1 -6 5 h-14 a6 6 0 0 1 -6 -5 z" fill="#EEF3F8"/>
        <path d="M30 32 h36 l-1.5 13 h-33 z" fill="#D8E2EC"/>
        <path d="M66 42 q14 2 12 14 q-2 10 -14 9" fill="none" stroke="#D8E2EC" stroke-width="6" stroke-linecap="round"/>
        <path d="M40 52 q4 6 0 12" stroke="#C9D6E3" stroke-width="3" fill="none"/>
      </g>`;

    default:
      return `<rect x="30" y="30" width="40" height="40" rx="6" fill="#8B97B0"/>`;
  }
}

export const itemSvg = (kind: string): string =>
  `<svg viewBox="0 0 100 100" aria-hidden="true">${art(kind)}</svg>`;

export const mockCollect: CollectLevel = {
  id: 'lv-c01',
  mode: 'collect',
  schemaVersion: '1.0.0',
  title: '收拾桌面',
  boxes: [
    { id: 'b1', label: '文具盒', kinds: ['pen', 'ruler', 'eraser', 'scissors'], color: '#FFB020' },
    { id: 'b2', label: '零食盒', kinds: ['cookie', 'candy', 'apple'], color: '#3DD68C' },
    { id: 'b3', label: '杂物箱', kinds: ['carton', 'ball', 'cup'], color: '#35D0E0' },
  ],
  items: [
    { id: 'i1', kind: 'pen', x: 0.13, y: 0.20, w: 0.095, rot: -18, z: 3 },
    { id: 'i2', kind: 'ruler', x: 0.31, y: 0.13, w: 0.135, rot: 7, z: 2 },
    { id: 'i3', kind: 'eraser', x: 0.20, y: 0.44, w: 0.085, rot: 11, z: 4 },
    { id: 'i4', kind: 'scissors', x: 0.44, y: 0.31, w: 0.115, rot: -9, z: 5 },
    { id: 'i5', kind: 'cookie', x: 0.66, y: 0.17, w: 0.10, rot: 0, z: 2 },
    { id: 'i6', kind: 'candy', x: 0.82, y: 0.31, w: 0.10, rot: 16, z: 3 },
    { id: 'i7', kind: 'apple', x: 0.73, y: 0.63, w: 0.105, rot: -6, z: 3 },
    { id: 'i8', kind: 'carton', x: 0.24, y: 0.72, w: 0.175, rot: 5, z: 1 },
    { id: 'i9', kind: 'ball', x: 0.50, y: 0.74, w: 0.125, rot: 0, z: 2 },
    { id: 'i10', kind: 'cup', x: 0.87, y: 0.77, w: 0.095, rot: -10, z: 3 },
  ],
  timeLimit: 75,
  hints: { count: 3, cooldownSec: 10, scorePenaltyPct: 8 },
  scoring: {
    perItem: 20,
    boxClearBonus: 60,
    perSecondLeft: 2,
    wrongPenalty: 8,
    starThresholds: [520, 420, 320],
  },
  scene: { background: 'table', altText: '一张堆满文具、零食和杂物的大木桌' },
};
