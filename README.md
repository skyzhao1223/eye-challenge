# 眼力大挑战 · Eye Challenge

找不同（Spot the Difference）H5 游戏。当前是**可跑骨架**，一关能完整玩通。

## 快速开始

```bash
cd /Users/skyzhao/eye-challenge
npm run dev          # 开发，http://127.0.0.1:5173
npm run build        # 产出 dist/
```

改完 `dist/` 不用重启 nginx（静态目录直读），刷新页面即可。

## 线上

| 入口 | 地址 | 状态 |
|---|---|---|
| **公网（GitHub Pages）** | **https://skyzhao1223.github.io/eye-challenge/** | ✅ |
| 本机 | http://127.0.0.1:8890/ | ✅ |
| 局域网（手机同 WiFi） | http://192.168.1.20:8890/ | ✅ |
| `zhaodian.cn` | — | ⛔ 域名无任何 A/CNAME 记录，需先配 DNS |

nginx 配置：`/opt/homebrew/etc/nginx/servers/eye-challenge.conf`
日志：`/opt/homebrew/var/log/nginx/eye-challenge.{access,error}.log`

重载：`/opt/homebrew/bin/nginx -t && /opt/homebrew/bin/nginx -s reload`

### 发布到公网

```bash
npm run deploy       # 构建 dist/ 并推送到 gh-pages 分支
```

GitHub Pages 源已设为 `gh-pages` 分支（legacy 构建，**不经过 GitHub Actions**）。

> ⚠️ 为什么不用 Actions：账号 `skyzhao1223` 因 billing issue 被锁定，所有 job
> 在 4~5 秒内失败且 `steps` 为空、日志接口返回 `BlobNotFound`，check-run 注解为
> `The job was not started because your account is locked due to a billing issue.`
> 在账单结清前 Actions 无法使用；Pages 的分支构建不受影响，所以走这条路。
> 原 `.github/workflows/*.yml` 已删除，避免每次 push 产生失败记录。

## 目录

```
design/                 设计规范（唯一真相源）
  tokens.json           变量三层：primitive → semantic → component
  tokens.css            派生 CSS 变量，业务只许用 var(--ec-*)
  components.md         13 个组件 + 状态矩阵 + 交互契约
  level.schema.json     关卡数据契约（JSON Schema draft-07）
  levels/lv-001.json    样板关卡
src/
  main.ts               游戏主控：舞台、判定、HUD、暂停、结算
  timer.ts              performance.now() 差值计时
  mock-level.ts         程序化 SVG 假素材（接入真素材后删掉）
  app.css               全部样式
  types.ts              类型
```

## 已实现

- 双图同屏对照（**共用一个 transform**，缩放不会错位）
- 归一化坐标判定（与分辨率、缩放无关）
- 倒计时：30% 转橙、10s 转红脉冲、切后台自动暂停
- 提示：3 次 / 15s 冷却 / 扣 10% 分
- 点空红叉 + 连续点空提示
- 暂停层（Esc 可退）、结算弹窗（星级、用时、得分）
- 滚轮/双指缩放 1–3 倍，拖拽平移
- `prefers-reduced-motion` 降级、44px 最小触控区

## 接线真素材

1. 把 `a.webp` / `b.webp` 放进 `src/assets/lv-xxx/`
2. 关卡 JSON 按 `design/level.schema.json` 填，坐标是 0..1 归一化
3. `src/main.ts` 里把 `mockLevel` 换成 `import lv from './levels/lv-001.json'`
4. 删掉 `mock-level.ts`

## 待办

- [ ] `tools/verify-level.mjs`：schema 校验 + `diffCount === diffs.length` + 热区不重叠
- [ ] `tools/diff-assets.py`：OpenCV 自动产出候选 diffs 并回填 `verification`
- [ ] 大厅 / 关卡列表 / 本地存档（最佳成绩、星级）
- [ ] 音效（命中、点空、倒计时最后 5 秒）
