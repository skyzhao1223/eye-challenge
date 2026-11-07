#!/usr/bin/env node
/* ============================================================
   tokens.json → tokens.css
   唯一真相源是 design/tokens.json；本脚本负责派生，禁止手改 tokens.css。

   用法：
     node tools/gen-tokens.js            # 生成并写入
     node tools/gen-tokens.js --check    # 只比对，不一致退出码 1（适合 CI）
     node tools/gen-tokens.js --stdout   # 打到标准输出，不落盘

   设计要点：
   1. 只处理 semantic / component / typography / space / radius / shadow /
      motion / zIndex / layout —— color.primitive 是内部调色板，不直接暴露
   2. {a.b.c} 形式的别名递归解析成真实值；解析失败直接报错退出，
      避免生成一堆 var() 断链
   3. 输出顺序固定（按对象键序），保证幂等 —— 同样输入永远同样字节
   4. 变量命名规则：层级用 - 连接，驼峰转 kebab
   ============================================================ */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SRC = resolve(ROOT, 'design/tokens.json');
const OUT = resolve(ROOT, 'design/tokens.css');
const BANNER_MARK = ':root {';

/* ---------------- 工具 ---------------- */

const kebab = (s) =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .toLowerCase();

/** 从 tokens 里按路径取值，同时把 {alias} 解析成真实值 */
function resolveValue(node, root, seen = new Set()) {
  if (node === null || typeof node !== 'object') return node;
  if (typeof node.value !== 'string') return node.value;
  const raw = node.value;
  const m = /^\{([^}]+)\}$/.exec(raw.trim());
  if (!m) return raw;

  const path = m[1];
  if (seen.has(path)) {
    throw new Error(`别名循环引用: ${[...seen, path].join(' -> ')}`);
  }
  seen.add(path);
  const parts = path.split('.');
  let cur = root;
  for (const p of parts) {
    if (cur === null || typeof cur !== 'object' || !(p in cur)) {
      throw new Error(`别名指向不存在的路径: {${path}}`);
    }
    cur = cur[p];
  }
  return resolveValue(cur, root, seen);
}

/** 递归展开成 [name, value] 列表 */
function flatten(obj, root, prefix = [], out = []) {
  for (const [key, node] of Object.entries(obj ?? {})) {
    if (node === null || typeof node !== 'object') continue;
    if ('value' in node) {
      out.push([prefix.concat(key).map(kebab).join('-'), String(resolveValue(node, root))]);
    } else {
      flatten(node, root, prefix.concat(key), out);
    }
  }
  return out;
}

/* ---------------- 分组定义 ---------------- */
/* 分组标题只影响可读性，不影响变量名。顺序即输出顺序。 */

const GROUPS = [
  {
    title: '背景',
    pick: (t) => flatten(t.color?.semantic?.bg ?? {}, t, ['bg']),
    stripPrefix: 'bg-',
  },
  {
    title: '描边',
    pick: (t) => flatten(t.color?.semantic?.border ?? {}, t, ['border']),
    stripPrefix: 'border-',
  },
  {
    title: '文字',
    pick: (t) => flatten(t.color?.semantic?.text ?? {}, t, ['text']),
    stripPrefix: 'text-',
  },
  {
    title: '主色（琥珀金）',
    pick: (t) => {
      // accent.default -> --ec-accent（不是 --ec-accent-default），其余保留后缀
      const map = {
        default: 'accent',
        hover: 'accent-hover',
        pressed: 'accent-pressed',
        onAccent: 'accent-on',
        subtleBg: 'accent-subtle-bg',
      };
      const rows = [];
      for (const [k, node] of Object.entries(t.color?.semantic?.accent ?? {})) {
        const name = map[k];
        if (!name) continue;
        rows.push([name, String(resolveValue(node, t))]);
      }
      return rows;
    },
  },
  {
    title: '状态色',
    pick: (t) => {
      const s = t.color?.semantic?.state ?? {};
      const rows = flatten(s, t);
      const focus = t.color?.semantic?.focus?.ring;
      if (focus) rows.push(['focus-ring', String(resolveValue(focus, t))]);
      return rows;
    },
  },
  {
    title: '游戏专用',
    pick: (t) => {
      const rows = [];
      // diff.foundRing -> --ec-diff-found（去掉冗余的 ring/pulse/glow 后缀）
      const diffMap = {
        foundRing: 'diff-found',
        missRing: 'diff-miss',
        hintPulse: 'diff-hint',
        unfoundGlow: 'diff-unfound',
      };
      for (const [k, node] of Object.entries(t.color?.component?.diff ?? {})) {
        const name = diffMap[k];
        if (!name) continue;
        rows.push([name, String(resolveValue(node, t))]);
      }
      const hud = t.color?.component?.hud ?? {};
      for (const [k, node] of Object.entries(hud)) {
        // timerOk / timerWarn / timerCrit 不进 CSS 变量：实际由 [data-warn] 选择器表达
        if (k.startsWith('timer')) continue;
        rows.push([`hud-${kebab(k)}`, String(resolveValue(node, t))]);
      }
      const scrim = t.color?.component?.overlay?.scrim;
      if (scrim) rows.push(['scrim', String(resolveValue(scrim, t))]);
      // 按钮色补齐（现有 CSS 用 --ec-btn-*）
      const btn = t.color?.component?.btn ?? {};
      const btnMap = {
        primaryBg: 'btn-primary-bg',
        primaryBgHover: 'btn-primary-bg-hover',
        primaryBgActive: 'btn-primary-bg-active',
        primaryFg: 'btn-primary-fg',
        ghostFg: 'btn-ghost-fg',
        ghostBgHover: 'btn-ghost-bg-hover',
      };
      for (const [k, name] of Object.entries(btnMap)) {
        if (btn[k]) rows.push([name, String(resolveValue(btn[k], t))]);
      }
      return rows;
    },
  },
  {
    title: '字体',
    pick: (t) => {
      const ty = t.typography ?? {};
      const rows = [];
      const ff = ty.fontFamily ?? {};
      if (ff.sans) rows.push(['font-sans', String(resolveValue(ff.sans, t))]);
      if (ff.numeric) rows.push(['font-mono', String(resolveValue(ff.numeric, t))]);
      for (const [k, node] of Object.entries(ty.fontSize ?? {})) {
        rows.push([`fs-${kebab(k)}`, String(resolveValue(node, t))]);
        if (node.lineHeight) rows.push([`lh-${kebab(k)}`, String(node.lineHeight)]);
      }
      for (const [k, node] of Object.entries(ty.letterSpacing ?? {})) {
        rows.push([`letter-${kebab(k)}`, String(resolveValue(node, t))]);
      }
      for (const [k, node] of Object.entries(ty.fontWeight ?? {})) {
        rows.push([`fw-${kebab(k)}`, String(resolveValue(node, t))]);
      }
      return rows;
    },
  },
  {
    title: '间距（4 的倍数）',
    pick: (t) => flatten(t.space ?? {}, t, ['space']),
  },
  {
    title: '圆角',
    pick: (t) => flatten(t.radius ?? {}, t, ['radius']),
  },
  {
    title: '阴影',
    pick: (t) => flatten(t.shadow ?? {}, t, ['shadow']),
  },
  {
    title: '动效',
    pick: (t) => {
      const mo = t.motion ?? {};
      const rows = [];
      for (const [k, node] of Object.entries(mo.duration ?? {})) {
        rows.push([`dur-${kebab(k)}`, String(resolveValue(node, t))]);
      }
      for (const [k, node] of Object.entries(mo.easing ?? {})) {
        rows.push([`ease-${kebab(k)}`, String(resolveValue(node, t))]);
      }
      return rows;
    },
  },
  {
    title: '层级',
    pick: (t) => {
      const rows = [];
      for (const [k, node] of Object.entries(t.zIndex ?? {})) {
        if (k === 'base') continue; // base=0 不产出变量，等于默认值
        rows.push([`z-${kebab(k)}`, String(resolveValue(node, t))]);
      }
      return rows;
    },
  },
  {
    title: '布局',
    pick: (t) => {
      const la = t.layout ?? {};
      const rows = [];
      const map = {
        touchTargetMin: 'touch-min',
        contentMaxWidth: 'content-max',
        hudHeight: 'hud-height',
      };
      for (const [k, name] of Object.entries(map)) {
        if (la[k]) rows.push([name, String(resolveValue(la[k], t))]);
      }
      return rows;
    },
  },
];

/* ---------------- 渲染 ---------------- */

function pad(s, n) {
  return s.length >= n ? s + ' ' : s + ' '.repeat(n - s.length);
}

function render(tokens) {
  const lines = [];
  lines.push('/* ============================================================');
  lines.push('   Eye Challenge — Design Tokens (CSS Custom Properties)');
  lines.push('   ⚠️ 本文件由 tokens.json 派生，唯一真相源是 tokens.json。');
  lines.push('   重新生成：node tools/gen-tokens.js');
  lines.push('   业务样式只允许 var(--ec-*)，禁止硬编码颜色/尺寸。');
  lines.push('   ============================================================ */');
  lines.push('');
  lines.push(BANNER_MARK);

  for (const g of GROUPS) {
    const rows = g.pick(tokens);
    if (!rows.length) continue;

    // 同一组里变量名对齐，方便肉眼 diff
    const names = rows.map(([n]) => `--ec-${n}`);
    const width = Math.max(...names.map((n) => n.length)) + 1;

    lines.push(`  /* ---------- ${g.title} ---------- */`);
    rows.forEach(([n, v], i) => {
      lines.push(`  ${pad(names[i] + ':', width)} ${v};`);
    });
    lines.push('');
  }

  // 去掉最后一个空行，换成闭合
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/** tokens.css 尾部有一段手写的基础重置，生成时不能丢 */
function readStaticTail() {
  try {
    const cur = readFileSync(OUT, 'utf8');
    const idx = cur.indexOf('\n}\n');
    if (idx < 0) return '';
    return cur.slice(idx + 2);
  } catch {
    return '';
  }
}

/* ---------------- 主流程 ---------------- */

const args = new Set(process.argv.slice(2));

let tokens;
try {
  tokens = JSON.parse(readFileSync(SRC, 'utf8'));
} catch (e) {
  console.error(`✗ 读取 ${SRC} 失败: ${e.message}`);
  process.exit(1);
}

let css;
try {
  css = render(tokens) + readStaticTail();
} catch (e) {
  console.error(`✗ 生成失败: ${e.message}`);
  process.exit(1);
}

if (args.has('--stdout')) {
  process.stdout.write(css);
  process.exit(0);
}

if (args.has('--check')) {
  let cur = '';
  try {
    cur = readFileSync(OUT, 'utf8');
  } catch {
    console.error(`✗ ${OUT} 不存在，请先运行 node tools/gen-tokens.js`);
    process.exit(1);
  }
  // 忽略尾随空白差异
  const norm = (s) => s.replace(/\s+$/gm, '').trim();
  if (norm(cur) !== norm(css)) {
    console.error('✗ tokens.css 与 tokens.json 不一致，请运行 node tools/gen-tokens.js');
    process.exit(1);
  }
  console.log('✓ tokens.css 与 tokens.json 一致');
  process.exit(0);
}

writeFileSync(OUT, css, 'utf8');
const varCount = (css.match(/--ec-[a-z0-9-]+:/g) ?? []).length;
console.log(`✓ 已生成 ${OUT}`);
console.log(`  ${varCount} 个变量，${css.split('\n').length} 行`);
