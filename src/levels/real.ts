/* ============================================================
   把 design/levels/*.json 转成运行时 Level
   为什么需要这一层：
   JSON 里 imageA 是 { src, hash }（带校验信息，给工具链用），
   运行时只关心 src，所以要拍平成 string，并补上 mock 关卡没有的字段。
   ============================================================ */

import type { Level, Diff } from '../types';
import lv001 from '../../design/levels/lv-001.json';
import lv002 from '../../design/levels/lv-002.json';
import lv003 from '../../design/levels/lv-003.json';

interface RawLevel {
  id: string;
  schemaVersion: string;
  title: string;
  imageA: { src: string; hash?: string };
  imageB: { src: string; hash?: string };
  diffCount: number;
  diffs: Diff[];
  difficulty: number;
  timeLimit: number;
  hints: Level['hints'];
  scoring: Level['scoring'];
  assets: Level['assets'];
}

/** public/ 下的资源，相对 index.html 解析（base 为 './' 时子路径部署也安全） */
const toUrl = (src: string): string => './' + src.replace(/^\.?\//, '');

function adapt(raw: RawLevel): Level {
  return {
    id: raw.id,
    schemaVersion: raw.schemaVersion,
    title: raw.title,
    diffCount: raw.diffCount,
    diffs: raw.diffs,
    difficulty: raw.difficulty,
    timeLimit: raw.timeLimit,
    hints: raw.hints,
    scoring: raw.scoring,
    assets: raw.assets,
    imageA: toUrl(raw.imageA.src),
    imageB: toUrl(raw.imageB.src),
  };
}

export const realLevels: Level[] = [
  adapt(lv001 as unknown as RawLevel),
  adapt(lv002 as unknown as RawLevel),
  adapt(lv003 as unknown as RawLevel),
];
