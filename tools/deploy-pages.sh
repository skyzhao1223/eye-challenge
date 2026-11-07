#!/usr/bin/env bash
# 免 GitHub Actions 的 GitHub Pages 发布：把 dist/ 推到 gh-pages 分支。
#
# 背景：账号 skyzhao1223 因 billing issue 被锁定，Actions job 无法被 runner
# 领取（4~5 秒失败、steps 为空、日志接口返回 BlobNotFound）。而 Pages 的
# legacy 分支构建不经过 Actions，因此改走「gh-pages 分支 + Pages 源」。
#
# 用法：npm run deploy
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-gh-pages}"
WT="$ROOT/.tmp/gh-pages"
PAGES_URL="https://skyzhao1223.github.io/eye-challenge/"

echo "▶ 构建 dist/"
npm run build

echo "▶ 准备 $BRANCH 工作树"
git worktree prune
rm -rf "$WT"
git worktree add -f --detach "$WT" >/dev/null

pushd "$WT" >/dev/null
# 本地可能已存在 gh-pages 引用，先删掉再建孤儿分支，否则 checkout 会失败、
# 后续 push 推的还是旧引用（表现为 Everything up-to-date）。
git branch -D "$BRANCH" >/dev/null 2>&1 || true
git checkout --orphan "$BRANCH" >/dev/null
git rm -rf . >/dev/null 2>&1 || true
cp -R "$ROOT/dist/." .
touch .nojekyll
git add -A

NAME="$(git -C "$ROOT" config user.name || true)"
EMAIL="$(git -C "$ROOT" config user.email || true)"
git -c "user.name=${NAME:-deploy}" \
    -c "user.email=${EMAIL:-deploy@localhost}" \
    commit -m "deploy: publish dist ($(date -u +%Y-%m-%dT%H:%M:%SZ))" >/dev/null

echo "▶ 推送 $BRANCH"
git push -f "$REMOTE" "$BRANCH"
popd >/dev/null

git worktree remove --force "$WT" 2>/dev/null || true

echo "✅ 已发布：$PAGES_URL"
echo "   （Pages 构建约需 10~30 秒，可用下面的命令查看状态）"
echo "   gh api repos/skyzhao1223/eye-challenge/pages/builds/latest"
