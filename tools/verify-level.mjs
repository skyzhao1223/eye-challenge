#!/usr/bin/env node
/* ============================================================
   关卡校验器
   校验 design/levels/*.json 是否符合 design/level.schema.json，
   并额外做 schema 表达不了的语义检查。

   用法：
     node tools/verify-level.mjs                 # 校验全部
     node tools/verify-level.mjs lv-001          # 只校验一个
     node tools/verify-level.mjs --require-published   # CI 模式：非 published 直接失败

   为什么不用 ajv：
   1. 这个 schema 只用到 draft-07 的很小一部分，手写校验 200 行足够
   2. 不想为构建链引入一个运行时依赖
   3. 报错信息可以写得更像人话（指出是第几个 diff 的哪个字段）

   语义检查（schema 做不到的）：
   - diffCount 必须严格等于 diffs.length
   - diffs[].id 必须唯一，且形如 d1..d99
   - 热区不能重叠（归一化距离 < 两者半径之和 → 玩家无法区分）
   - 热区不能超出画面（x±r / y±r 越界）
   - published 必须 verification.passed === true
   - imageA.src 与 imageB.src 不能相同
   ============================================================ */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const LEVELS_DIR = resolve(ROOT, 'design/levels');

const argv = process.argv.slice(2);
const REQUIRE_PUBLISHED = argv.includes('--require-published');
const TARGET = argv.find((a) => !a.startsWith('--'));

/* ---------------- 校验原语 ---------------- */

class Fail extends Error {}
const fail = (msg) => {
  throw new Fail(msg);
};

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}
function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}
function isInt(v) {
  return isNum(v) && Number.isInteger(v);
}

function req(obj, key, where) {
  if (!(key in obj)) fail(`${where}.${key} 缺失（必填）`);
  return obj[key];
}

function str(obj, key, where, { min = 0, max = Infinity, pattern } = {}) {
  const v = req(obj, key, where);
  if (typeof v !== 'string') fail(`${where}.${key} 必须是字符串，实际是 ${typeof v}`);
  if (v.length < min) fail(`${where}.${key} 长度 ${v.length} < 最小值 ${min}`);
  if (v.length > max) fail(`${where}.${key} 长度 ${v.length} > 最大值 ${max}`);
  if (pattern && !pattern.test(v)) fail(`${where}.${key} = "${v}" 不匹配 ${pattern}`);
  return v;
}

function int(obj, key, where, { min = -Infinity, max = Infinity } = {}) {
  const v = req(obj, key, where);
  if (!isInt(v)) fail(`${where}.${key} 必须是整数，实际是 ${JSON.stringify(v)}`);
  if (v < min) fail(`${where}.${key} = ${v} < 最小值 ${min}`);
  if (v > max) fail(`${where}.${key} = ${v} > 最大值 ${max}`);
  return v;
}

function num(obj, key, where, { min = -Infinity, max = Infinity, exclusiveMin } = {}) {
  const v = req(obj, key, where);
  if (!isNum(v)) fail(`${where}.${key} 必须是数字，实际是 ${JSON.stringify(v)}`);
  if (exclusiveMin !== undefined && v <= exclusiveMin) {
    fail(`${where}.${key} = ${v} 必须 > ${exclusiveMin}`);
  }
  if (v < min) fail(`${where}.${key} = ${v} < 最小值 ${min}`);
  if (v > max) fail(`${where}.${key} = ${v} > 最大值 ${max}`);
  return v;
}

function hasOnlyKeys(obj, allowed, where) {
  for (const k of Object.keys(obj)) {
    if (!allowed.includes(k)) fail(`${where} 有未声明的字段 "${k}"（schema additionalProperties=false）`);
  }
}

/* ---------------- 关卡校验 ---------------- */

const DIFF_KINDS = ['added', 'removed', 'moved', 'recolored', 'resized'];
const STATUSES = ['draft', 'review', 'published', 'archived'];

function verifyLevel(lv, fileLabel) {
  if (!isObj(lv)) fail('顶层必须是对象');

  hasOnlyKeys(
    lv,
    [
      'id', 'schemaVersion', 'title', 'status', 'imageA', 'imageB',
      'diffCount', 'diffs', 'difficulty', 'timeLimit', 'hints', 'scoring',
      'assets', 'verification', 'tags', 'author', 'createdAt', 'updatedAt',
    ],
    'level'
  );

  const id = str(lv, 'id', 'level', { pattern: /^lv-[a-z0-9]{3,16}$/ });
  const sv = str(lv, 'schemaVersion', 'level');
  if (sv !== '1.0.0') fail(`level.schemaVersion 必须为 "1.0.0"，实际 "${sv}"`);

  str(lv, 'title', 'level', { min: 1, max: 40 });

  const status = str(lv, 'status', 'level');
  if (!STATUSES.includes(status)) fail(`level.status = "${status}" 不在 ${STATUSES.join('/')} 内`);

  /* --- 图片 --- */
  for (const key of ['imageA', 'imageB']) {
    const img = req(lv, key, 'level');
    if (!isObj(img)) fail(`level.${key} 必须是对象`);
    hasOnlyKeys(img, ['src', 'hash'], `level.${key}`);
    str(img, 'src', `level.${key}`, { min: 1 });
    if ('hash' in img && !/^[a-f0-9]{64}$/.test(img.hash)) {
      fail(`level.${key}.hash 必须是 64 位小写 hex`);
    }
  }
  if (lv.imageA.src === lv.imageB.src) {
    fail('imageA.src 与 imageB.src 相同 —— 两张图必须是不同的文件');
  }

  /* --- diffs --- */
  const diffs = req(lv, 'diffs', 'level');
  if (!Array.isArray(diffs)) fail('level.diffs 必须是数组');
  if (diffs.length < 3) fail(`level.diffs 至少 3 项，实际 ${diffs.length}`);
  if (diffs.length > 12) fail(`level.diffs 最多 12 项，实际 ${diffs.length}`);

  const seenIds = new Set();
  diffs.forEach((d, i) => {
    const where = `diffs[${i}]`;
    if (!isObj(d)) fail(`${where} 必须是对象`);
    hasOnlyKeys(d, ['id', 'x', 'y', 'r', 'hint', 'altText', 'kind'], where);

    const did = str(d, 'id', where, { pattern: /^d[0-9]{1,2}$/ });
    if (seenIds.has(did)) fail(`${where}.id = "${did}" 重复`);
    seenIds.add(did);

    num(d, 'x', where, { min: 0, max: 1 });
    num(d, 'y', where, { min: 0, max: 1 });
    num(d, 'r', where, { exclusiveMin: 0, max: 0.25 });
    str(d, 'hint', where, { min: 1, max: 20 });
    if ('altText' in d) str(d, 'altText', where, { max: 60 });
    if ('kind' in d && !DIFF_KINDS.includes(d.kind)) {
      fail(`${where}.kind = "${d.kind}" 不在 ${DIFF_KINDS.join('/')} 内`);
    }

    // 热区不能超出画面
    if (d.x - d.r < 0 || d.x + d.r > 1) {
      fail(`${where} 水平越界：x=${d.x} ± r=${d.r} 超出 [0,1]`);
    }
    if (d.y - d.r < 0 || d.y + d.r > 1) {
      fail(`${where} 垂直越界：y=${d.y} ± r=${d.r} 超出 [0,1]`);
    }
  });

  /* --- diffCount === diffs.length --- */
  const diffCount = int(lv, 'diffCount', 'level', { min: 3, max: 12 });
  if (diffCount !== diffs.length) {
    fail(`level.diffCount = ${diffCount} 与 diffs.length = ${diffs.length} 不一致`);
  }

  /* --- 热区重叠检测 --- */
  for (let i = 0; i < diffs.length; i++) {
    for (let j = i + 1; j < diffs.length; j++) {
      const a = diffs[i];
      const b = diffs[j];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      // 两圆相交 = 玩家点中间分不清是哪一个
      if (dist < a.r + b.r) {
        fail(
          `热区重叠：${a.id}(${a.x},${a.y},r=${a.r}) 与 ${b.id}(${b.x},${b.y},r=${b.r}) ` +
            `距离 ${dist.toFixed(3)} < r 之和 ${(a.r + b.r).toFixed(3)}`
        );
      }
    }
  }

  /* --- 难度/时限 --- */
  int(lv, 'difficulty', 'level', { min: 1, max: 5 });
  int(lv, 'timeLimit', 'level', { min: 15, max: 600 });

  /* --- hints --- */
  if ('hints' in lv) {
    const h = lv.hints;
    if (!isObj(h)) fail('level.hints 必须是对象');
    hasOnlyKeys(h, ['count', 'cooldownSec', 'scorePenaltyPct'], 'level.hints');
    if ('count' in h) int(h, 'count', 'level.hints', { min: 0, max: 10 });
    if ('cooldownSec' in h) int(h, 'cooldownSec', 'level.hints', { min: 0, max: 120 });
    if ('scorePenaltyPct' in h) int(h, 'scorePenaltyPct', 'level.hints', { min: 0, max: 100 });
  }

  /* --- scoring --- */
  if ('scoring' in lv) {
    const s = lv.scoring;
    if (!isObj(s)) fail('level.scoring 必须是对象');
    hasOnlyKeys(s, ['base', 'perSecondLeft', 'perMissPenalty', 'starThresholds'], 'level.scoring');
    if ('base' in s) int(s, 'base', 'level.scoring', { min: 0 });
    if ('perSecondLeft' in s) num(s, 'perSecondLeft', 'level.scoring', { min: 0 });
    if ('perMissPenalty' in s) num(s, 'perMissPenalty', 'level.scoring', { min: 0 });
    if ('starThresholds' in s) {
      const st = s.starThresholds;
      if (!Array.isArray(st) || st.length !== 3) {
        fail('level.scoring.starThresholds 必须正好 3 项');
      }
      st.forEach((v, i) => {
        if (!isNum(v)) fail(`level.scoring.starThresholds[${i}] 必须是数字`);
      });
      if (!(st[0] > st[1] && st[1] > st[2])) {
        fail(`starThresholds 必须严格降序，实际 [${st.join(', ')}]`);
      }
    }
  }

  /* --- assets --- */
  if ('assets' in lv) {
    const a = lv.assets;
    if (!isObj(a)) fail('level.assets 必须是对象');
    hasOnlyKeys(a, ['aspectRatio', 'width', 'height', 'altText'], 'level.assets');
    if ('aspectRatio' in a) num(a, 'aspectRatio', 'level.assets', { exclusiveMin: 0 });
    if ('width' in a) int(a, 'width', 'level.assets', { min: 1 });
    if ('height' in a) int(a, 'height', 'level.assets', { min: 1 });
    if ('altText' in a) str(a, 'altText', 'level.assets', { max: 200 });

    // aspectRatio 必须与 width/height 自洽，否则布局会跳
    if (a.aspectRatio && a.width && a.height) {
      const expect = a.width / a.height;
      if (Math.abs(expect - a.aspectRatio) > 0.001) {
        fail(
          `level.assets.aspectRatio = ${a.aspectRatio} 与 width/height = ` +
            `${a.width}/${a.height} = ${expect.toFixed(4)} 不一致`
        );
      }
    }
  }

  /* --- published 硬门槛 --- */
  if (status === 'published') {
    const v = lv.verification;
    if (!isObj(v)) fail('status=published 时必须提供 verification');
    if (v.passed !== true) fail('status=published 要求 verification.passed === true');
    if (!('checkedAt' in v)) fail('status=published 要求 verification.checkedAt');
  }
  if (REQUIRE_PUBLISHED && status !== 'published') {
    fail(`--require-published 模式下 status 必须为 published，实际 "${status}"`);
  }

  return {
    id,
    diffs: diffs.length,
    difficulty: lv.difficulty,
    status,
  };
}

/* ---------------- 主流程 ---------------- */

if (!existsSync(LEVELS_DIR)) {
  console.error(`✗ 关卡目录不存在: ${LEVELS_DIR}`);
  process.exit(1);
}

// *.art.json 是 gen-level-art.py 的中间产物（含 width/height 等额外字段），不是关卡
let files = readdirSync(LEVELS_DIR)
  .filter((f) => f.endsWith('.json') && !f.endsWith('.art.json'))
  .sort();
if (TARGET) {
  files = files.filter((f) => f === `${TARGET}.json` || f === TARGET);
  if (!files.length) {
    console.error(`✗ 找不到关卡: ${TARGET}`);
    process.exit(1);
  }
}

if (!files.length) {
  console.log('（没有关卡文件）');
  process.exit(0);
}

let ok = 0;
const errors = [];

for (const f of files) {
  const path = join(LEVELS_DIR, f);
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`${f}: JSON 解析失败 — ${e.message}`);
    continue;
  }
  try {
    const info = verifyLevel(raw, f);
    console.log(`✓ ${f}  [${info.status}] ${info.id} · ${info.diffs} 处差异 · 难度 ${info.difficulty}`);
    ok += 1;
  } catch (e) {
    if (e instanceof Fail) errors.push(`${f}: ${e.message}`);
    else throw e;
  }
}

console.log('');
if (errors.length) {
  console.error(`✗ ${errors.length} 个关卡校验失败：`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`✓ 全部通过（${ok} 个关卡）`);
