# 眼力大挑战 · 设计规范 v1.0

> 本目录是**唯一真相源**。任何代码、AI 生成、外包产出，都必须从这里的规范派生。
> 改视觉 → 改 `tokens.json` → 重新生成 `tokens.css`。**禁止在业务代码里写死颜色和尺寸。**

## 文件清单

| 文件 | 作用 | 谁消费 |
|---|---|---|
| `tokens.json` | 设计变量唯一真相源（primitive → semantic → component 三层） | 设计、构建脚本 |
| `tokens.css` | 由 tokens.json 派生的 CSS 变量，直接引 | 所有前端代码 |
| `components.md` | 组件清单 + **状态矩阵**（穷举） + 交互契约 + 响应式规则 | 前端、AI |
| `level.schema.json` | 关卡数据契约（JSON Schema draft-07） | 素材流水线、前端、后端 |
| `levels/lv-001.json` | 样板关卡，用作填充示例与测试夹具 | 开发、测试 |

## 三条硬规矩

1. **只用语义变量。** 写 `var(--ec-text-primary)`，不写 `#EDF1F8`。
2. **坐标永远归一化。** 关卡里所有 `x/y/r` 都是 0..1，跟分辨率解耦。渲染时再乘实际尺寸。
3. **状态必须穷举。** 组件只要出现第 6 种状态，先补进 `components.md` 再写代码。

## 设计决策速查

| 项 | 决定 | 理由 |
|---|---|---|
| 主色 | 琥珀金 `#FFB020` | 找不同需要"找到"的正反馈，暖色比冷色更有成就感；且不与红/绿状态色冲突 |
| 底色 | 深墨 `#0B0E14` | 深底能让图片本身成为视觉焦点，图片边缘不发灰 |
| 倒计时字体 | `tabular-nums` 等宽数字 | 数字跳动会导致 HUD 抖动，必须等宽 |
| 最小触控区 | 44px | iOS HIG / Material 一致要求，找不同误触代价高 |
| 动效 | 全部走 `--ec-dur-*` | 统一节奏；并提供 `prefers-reduced-motion` 降级 |

## 已知容易翻车的点（写进验收清单）

- [ ] 双图**共用同一个 transform**，否则缩放后错位
- [ ] 判定用归一化坐标 + `getBoundingClientRect()` 换算，不用屏幕像素
- [ ] 计时用 `performance.now()` 差值，不用 `setInterval` 计数（切后台会变慢，等于作弊）
- [ ] 图片必须带 `aspectRatio`，否则加载后布局跳动
- [ ] 移动端 < 480px 仍要同屏对照，不能改成上下堆叠
- [ ] 弹窗焦点陷阱 + Esc 关闭 + 背景 `aria-hidden`
- [ ] 连续 3 次 miss 要有惩罚与提示，否则玩家乱点通关

## 下一步（待办）

- [ ] `tools/gen-tokens.js`：tokens.json → tokens.css 自动生成（避免两处手改失同步）
- [ ] `tools/verify-level.mjs`：按 schema 校验 + 断言 `diffCount === diffs.length` + 差异半径不重叠
- [ ] `tools/diff-assets.py`：OpenCV 比对 a/b 两图，自动产出候选 `diffs[]` 并回填 `verification`
- [ ] 素材生产 sop（inpaint 局部修改的具体参数与常见坑）
