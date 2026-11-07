# 组件清单与状态矩阵

> 规则：**不画页面，只定义组件。** 每个组件必须把状态穷举完，AI 才不会临场发挥。
> 所有视觉值一律引用 `tokens.css` 的 `var(--ec-*)`，禁止硬编码。

---

## 1. 组件总览

| 编号 | 组件 | 职责 | 优先级 |
|---|---|---|---|
| C01 | `Hud` 顶部信息条 | 倒计时 / 已找差异数 / 总分 / 暂停 | P0 |
| C02 | `CompareStage` 对照舞台 | 承载双图、缩放平移、点击坐标换算 | P0 |
| C03 | `DiffHotspot` 差异热区 | 判定命中、命中/未命中动画 | P0 |
| C04 | `Timer` 倒计时 | 独立组件，便于单测与无障碍播报 | P0 |
| C05 | `Btn` 按钮 | 主/次/幽灵/图标 四种变体 | P0 |
| C06 | `HintBtn` 提示按钮 | 带冷却与次数限制 | P0 |
| C07 | `LevelCard` 关卡卡片 | 大厅列表项 | P1 |
| C08 | `ResultModal` 结算弹窗 | 通关/失败/星级 | P1 |
| C09 | `PauseOverlay` 暂停层 | 遮罩 + 继续/重开/退出 | P1 |
| C10 | `Toast` 轻提示 | 命中反馈、错误提示 | P1 |
| C11 | `LoadingState` 加载态 | 图片解码进度、骨架屏 | P1 |
| C12 | `EmptyState` 空态 | 无关卡/加载失败 | P2 |
| C13 | `ProgressRing` 环形进度 | 关卡完成度、冷却环 | P2 |

---

## 2. 状态矩阵（逐组件穷举）

### C01 `Hud`

| 状态 | 触发 | 表现 |
|---|---|---|
| `default` | 游戏中 | 半透明毛玻璃底 + 底部 1px 描边 |
| `paused` | 用户暂停 / 切后台 | 整条降透明度到 60%，计时冻结 |
| `critical` | 剩余 ≤ 10s | 计时数字转 `--ec-danger` + 每秒 1 次脉冲 |
| `hidden` | 结算/过场 | 淡出，不占位（避免布局跳动） |

**约束**：`position: fixed`，高度 `var(--ec-hud-height)`，必须带 `env(safe-area-inset-top)`。

---

### C02 `CompareStage`

| 状态 | 触发 | 表现 |
|---|---|---|
| `loading` | 图片未解码完 | 显示 C11，禁用交互 |
| `ready` | 两图就绪 | 启用点击 |
| `zoomed` | 双指/滚轮放大 | 显示当前倍率，禁用页面滚动 |
| `dragging` | 平移中 | `cursor: grabbing`，禁用点击判定（防误触） |
| `locked` | 结算/暂停 | 全部热区失效，`pointer-events: none` |

**关键约束**：
- 双图**必须同一容器同一变换矩阵**，缩放/平移只能有一个 `transform`，否则两图会错位（这是找不同游戏最常见的 bug）。
- 点击坐标换算必须基于 `getBoundingClientRect()` + 当前 `scale`/`translate`，回归到归一化坐标 `(0..1)` 再判定，**不要用屏幕像素直接比**。

---

### C03 `DiffHotspot`

| 状态 | 触发 | 表现 |
|---|---|---|
| `idle` | 未找到 | 完全不可见（无任何视觉暗示） |
| `hover`（桌面） | 指针悬停 | 不提示，保持不可见（防作弊） |
| `hit` | 点中且在半径内 | 画 ✅ 环，`--ec-diff-found`，scale 0.8→1.1→1，`--ec-ease-bounce`，240ms |
| `miss` | 点中但不在任何半径内 | 短暂红叉，`--ec-diff-miss`，160ms 后消失；连续 3 次 miss 触发扣分 |
| `hinted` | 用户用提示 | 该热区脉冲光晕 3 次，`--ec-shadow-glow` |
| `revealed` | 超时/放弃 | 全部热区常亮显示，进入"揭晓"模式 |

**无障碍**：每个热区必须有 `aria-label`（如"已找到：窗口左侧的猫"），命中时通过 `aria-live="polite"` 播报。

---

### C04 `Timer`

| 状态 | 触发 | 表现 |
|---|---|---|
| `running` | 游戏开始 | 每秒递减，`tabular-nums` |
| `warn` | ≤ 30% 剩余 | 转橙 |
| `critical` | ≤ 10s | 转红 + 脉冲 |
| `paused` | 暂停 | 冻结，显示暂停图标 |
| `expired` | 归零 | 停 0，触发失败流程，只触发一次 |

**约束**：必须用 `performance.now()` 差值累加，**不要用 `setInterval` 计数**——切后台会被节流，导致计时变慢（作弊漏洞）。

---

### C05 `Btn`

| 变体 | 底色 | 文字色 | 用途 |
|---|---|---|---|
| `primary` | `--ec-accent` | `--ec-accent-on` | 主行动（开始/继续） |
| `secondary` | `--ec-bg-sunken` | `--ec-text-primary` | 次要行动 |
| `ghost` | 透明 | `--ec-text-secondary` | 轻量（返回/关闭） |
| `icon` | 透明 | `--ec-text-secondary` | 图标按钮，正方形 |

| 状态 | 表现 |
|---|---|
| `default` | 基础样式 |
| `hover` | primary→`--ec-accent-hover`；ghost/secondary→`--ec-bg-sunken` |
| `active` | primary→`--ec-accent-pressed`，scale 0.97 |
| `focus-visible` | 2px `--ec-focus-ring` ring，offset 2px |
| `disabled` | opacity 0.4，`pointer-events: none`，`aria-disabled="true"` |
| `loading` | 文字替换为 spinner，宽度锁定不跳动，`aria-busy="true"` |

**尺寸**：`sm` 32px / `md` 40px / `lg` 48px。**移动端任何可点元素 ≥ `--ec-touch-min`(44px)**。

---

### C06 `HintBtn`

| 状态 | 条件 | 表现 |
|---|---|---|
| `available` | 还有次数且冷却结束 | 可点，显示剩余次数徽标 |
| `cooling` | 冷却中 | 环形进度倒计时（C13），禁用 |
| `exhausted` | 次数用尽 | 灰化，文案改"提示已用完" |
| `using` | 已触发 | 光晕扩散动画 320ms |

**规则**：默认每关 3 次，冷却 15s；用一次提示扣该关总分 10%。数值必须来自关卡配置，不写死。

---

### C07 `LevelCard`

| 状态 | 表现 |
|---|---|
| `locked` | 灰化 + 锁图标，不可点，`aria-disabled` |
| `available` | 正常，显示关卡序号与难度点 |
| `playing` | 高亮边框 + "继续"角标 |
| `completed` | 显示星级（0–3 星）与最佳用时 |

**约束**：星级用独立 SVG，不要用 emoji（跨平台渲染不一致）。

---

### C08 `ResultModal`

| 状态 | 触发 | 内容 |
|---|---|---|
| `win` | 找齐全部差异 | 星级 + 用时 + 得分 + 下一关 |
| `lose-timeout` | 时间耗尽 | 已找/总数 + 重试 + 看答案 |
| `lose-quit` | 中途退出 | 确认放弃 + 继续 |
| `newRecord` | 破纪录 | 额外"新纪录"缎带 + 撒花（可 `prefers-reduced-motion` 关闭） |

**约束**：弹窗必须**焦点陷阱**（Tab 循环在弹窗内），Esc 关闭，背后内容 `aria-hidden="true"`。

---

### C09 `PauseOverlay` / C10 `Toast` / C11 `LoadingState` / C12 `EmptyState` / C13 `ProgressRing`

| 组件 | 状态 |
|---|---|
| `PauseOverlay` | `paused` / `resuming`（淡出中） |
| `Toast` | `enter` → `visible`(2s) → `exit`；同时最多 1 条，新覆盖旧 |
| `LoadingState` | `indeterminate` / `determinate`(0–100) / `error`(带重试) |
| `EmptyState` | `no-data` / `network-error` / `permission-denied` |
| `ProgressRing` | `idle` / `running` / `complete` |

---

## 3. 交互契约（跨组件）

| 场景 | 规定 |
|---|---|
| 命中判定 | 以点击点与差异中心距离 ≤ `diff.r × 图宽` 为准，归一化坐标下计算 |
| 连续 miss 惩罚 | 3 次 miss 扣 1% 分，Toast 提示一次，不叠加动画 |
| 切后台 | 自动暂停 + 计时冻结；返回需用户点"继续"（防偷看） |
| 双击缩放 | 只允许在舞台区域，倍率循环 1.0 → 2.0 → 1.0 |
| 键盘操作 | Tab 遍历热区，Enter 触发判定；方向键平移；`+/-` 缩放 |

---

## 4. 响应式规则

| 断点 | 布局 |
|---|---|
| `< 480px` | 上下叠放？**不**。仍是左右并排（找不同必须同屏对照），改为支持左右滑动切换单图 + 记忆位移 |
| `480–1024px` | 左右并排，各占 50% |
| `> 1024px` | 居中，最大宽 `var(--ec-content-max)`，两侧留白 |
