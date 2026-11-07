import type { Level } from './types';

/**
 * 骨架阶段：用程序化 SVG 生成「同一间屋子」的两个版本。
 * 真实素材接入后，只需把 imageA/imageB 换成 assets/lv-xxx/a.webp。
 * 这样做的目的是——先把手感跑通，不被素材卡住。
 */

const W = 1200;
const H = 800;

interface SceneOpts {
  /** d1 窗台绿植 */
  plant: boolean;
  /** d2 画框颜色 */
  frameColor: string;
  /** d3 地板上的猫 */
  cat: boolean;
  /** d4 落地灯尺寸倍率 */
  lampScale: number;
  /** d5 桌上书堆的横向偏移 */
  bookDx: number;
}

function scene(o: SceneOpts): string {
  const lampW = 46 * o.lampScale;
  const lampH = 120 * o.lampScale;
  const lampX = 980 - (lampW - 46) / 2;
  const lampY = 470 - lampH;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a2f3d"/>
      <stop offset="1" stop-color="#1c2130"/>
    </linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#7fb6d9"/>
      <stop offset="1" stop-color="#cfe3ef"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5b4636"/>
      <stop offset="1" stop-color="#422f24"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.35" r="0.7">
      <stop offset="0" stop-color="#ffd98a" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffd98a" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- 墙与地板 -->
  <rect width="${W}" height="${H}" fill="url(#wall)"/>
  <rect y="560" width="${W}" height="${H - 560}" fill="url(#floor)"/>
  <rect y="556" width="${W}" height="6" fill="#3a2b20"/>

  <!-- 窗 -->
  <rect x="120" y="120" width="300" height="260" rx="6" fill="url(#sky)"/>
  <rect x="120" y="120" width="300" height="260" rx="6" fill="none" stroke="#e8eef5" stroke-width="10"/>
  <line x1="270" y1="126" x2="270" y2="374" stroke="#e8eef5" stroke-width="8"/>
  <line x1="126" y1="250" x2="414" y2="250" stroke="#e8eef5" stroke-width="8"/>
  <rect x="110" y="378" width="320" height="16" rx="4" fill="#d9e2ec"/>

  <!-- 桌上的书堆 -->
  <g transform="translate(${o.bookDx} 0)">
    <rect x="520" y="452" width="86" height="16" rx="3" fill="#c2703f"/>
    <rect x="526" y="436" width="74" height="16" rx="3" fill="#3f7ac2"/>
    <rect x="534" y="420" width="60" height="16" rx="3" fill="#c2b03f"/>
  </g>

  <!-- 桌子 -->
  <rect x="380" y="470" width="520" height="26" rx="6" fill="#8a5a34"/>
  <rect x="404" y="496" width="20" height="120" fill="#6e4626"/>
  <rect x="856" y="496" width="20" height="120" fill="#6e4626"/>

  <!-- 杯子 -->
  <ellipse cx="725" cy="470" rx="26" ry="8" fill="#cfd8e3"/>
  <path d="M699 470 L705 442 h40 l6 28 z" fill="#eef3f8"/>
  <path d="M745 448 q14 4 0 16" stroke="#eef3f8" stroke-width="5" fill="none"/>

  <!-- 椅子 -->
  <rect x="760" y="500" width="110" height="14" rx="4" fill="#7a5230"/>
  <rect x="760" y="514" width="12" height="96" fill="#5f3f24"/>
  <rect x="858" y="514" width="12" height="96" fill="#5f3f24"/>
  <rect x="760" y="420" width="12" height="86" fill="#7a5230"/>
  <rect x="760" y="420" width="110" height="14" rx="4" fill="#7a5230"/>

  <!-- 落地灯（d4：尺寸差异） -->
  <rect x="${lampX + lampW / 2 - 4}" y="${lampY + lampH}" width="8" height="${560 - lampY - lampH}" fill="#3d4553"/>
  <ellipse cx="${lampX + lampW / 2}" cy="558" rx="${lampW * 0.5}" ry="8" fill="#3d4553"/>
  <path d="M${lampX} ${lampY + lampH} L${lampX + lampW} ${lampY + lampH} L${lampX + lampW * 0.8} ${lampY} L${lampX + lampW * 0.2} ${lampY} Z" fill="#f2d27a"/>
  <circle cx="${lampX + lampW / 2}" cy="${lampY + lampH}" r="${lampW * 0.9}" fill="url(#glow)"/>

  <!-- 墙上画框（d2：颜色差异） -->
  <rect x="760" y="140" width="160" height="120" rx="4" fill="${o.frameColor}"/>
  <rect x="776" y="156" width="128" height="88" rx="2" fill="#1d2530"/>
  <circle cx="820" cy="190" r="14" fill="#e9c46a"/>
  <path d="M776 244 l40 -36 l32 28 l24 -20 l32 28 v0 h-128 z" fill="#4a9d7f"/>

  <!-- 窗台绿植（d1：有无） -->
  ${o.plant ? `<g>
    <path d="M168 378 h34 l-5 -34 h-24 z" fill="#b5563f"/>
    <path d="M185 344 q-4 -34 -22 -46 q14 22 10 46 z" fill="#3f9d63"/>
    <path d="M185 344 q6 -30 24 -40 q-8 26 -12 40 z" fill="#4bb774"/>
    <path d="M185 344 q0 -38 2 -50 q6 30 4 50 z" fill="#3f9d63"/>
  </g>` : ''}

  <!-- 地板上的猫（d3：有无） -->
  ${o.cat ? `<g>
    <ellipse cx="950" cy="660" rx="62" ry="26" fill="#8b6b4a"/>
    <path d="M890 660 q-6 -50 34 -58 q46 -8 66 22 q28 40 22 36 z" fill="#a37f57"/>
    <circle cx="1010" cy="612" r="26" fill="#a37f57"/>
    <path d="M992 594 l6 -18 l12 14 z" fill="#a37f57"/>
    <path d="M1024 596 l10 -16 l8 16 z" fill="#a37f57"/>
    <circle cx="1002" cy="608" r="3" fill="#2b2b2b"/>
    <circle cx="1018" cy="608" r="3" fill="#2b2b2b"/>
    <path d="M1006 620 q4 4 8 0" stroke="#2b2b2b" stroke-width="2" fill="none"/>
    <path d="M1040 686 q34 -6 22 -46" stroke="#a37f57" stroke-width="12" fill="none" stroke-linecap="round"/>
  </g>` : ''}

  <!-- 地毯 -->
  <ellipse cx="600" cy="700" rx="330" ry="52" fill="#3b4457" opacity="0.55"/>
</svg>`;
}

const toDataUri = (svg: string) =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace(/\s{2,}/g, ' '));

const base: SceneOpts = {
  plant: true,
  frameColor: '#e9c46a',
  cat: false,
  lampScale: 1,
  bookDx: 0,
};

export const mockLevel: Level = {
  id: 'lv-001',
  schemaVersion: '1.0.0',
  title: '街角咖啡店',
  diffCount: 5,
  difficulty: 2,
  timeLimit: 90,
  hints: { count: 3, cooldownSec: 15, scorePenaltyPct: 10 },
  scoring: { base: 250, perSecondLeft: 2, perMissPenalty: 2, starThresholds: [380, 300, 220] },
  assets: { aspectRatio: W / H, width: W, height: H, altText: '午后街角的一家咖啡店' },
  imageA: toDataUri(scene(base)),
  imageB: toDataUri(
    scene({
      ...base,
      plant: false, // d1 绿植消失
      frameColor: '#4fa8c4', // d2 画框由金变蓝
      cat: true, // d3 多出一只猫
      lampScale: 1.42, // d4 灯罩变大
      bookDx: 54, // d5 书堆右移
    })
  ),
  diffs: [
    { id: 'd1', x: 0.1542, y: 0.4375, r: 0.05, hint: '窗台', altText: '窗台的绿植不见了', kind: 'removed' },
    { id: 'd2', x: 0.7, y: 0.25, r: 0.055, hint: '墙上的画', altText: '画框从金色变成了蓝色', kind: 'recolored' },
    { id: 'd3', x: 0.7917, y: 0.805, r: 0.05, hint: '右下角', altText: '地板上多了一只猫', kind: 'added' },
    { id: 'd4', x: 0.836, y: 0.5, r: 0.07, hint: '右侧', altText: '落地灯的灯罩变大了', kind: 'resized' },
    { id: 'd5', x: 0.49, y: 0.556, r: 0.055, hint: '桌面', altText: '桌上的书堆往右挪了', kind: 'moved' },
  ],
};
