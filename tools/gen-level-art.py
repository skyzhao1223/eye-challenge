#!/usr/bin/env python3
"""
gen-level-art.py —— 从一张 AI 底图生成「找不同」关卡的双图 + 热区数据。

设计原则（为什么这么做）：
  seedream 无法复现同一张图（实测同 seed 两次生成差异 67%），
  所以不能「让 AI 出两张」，只能「AI 出一张底图 → 程序做局部编辑」。
  这样差异数量、位置、热区半径全部可控，且两图共用同一 transform。

用法：
  python3 tools/gen-level-art.py --base base.jpg --out public/assets/lv-002 \
      --count 5 --seed 7 --report design/levels/lv-002.art.json

产出：
  a.webp / b.webp   两张同尺寸图（b 是 a 的局部修改版）
  <report>          JSON：每处差异的归一化坐标、半径、类型、说明
"""

import argparse
import json
import random
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


# ---------------- 基础工具 ----------------

def scissor(img: Image.Image, cx: float, cy: float, w: float, h: float):
    """按归一化中心与尺寸裁出区域，返回 (box, crop)。box 用像素。"""
    W, H = img.size
    x0 = int(round((cx - w / 2) * W))
    y0 = int(round((cy - h / 2) * H))
    x1 = int(round((cx + w / 2) * W))
    y1 = int(round((cy + h / 2) * H))
    x0 = max(0, min(x0, W - 2))
    y0 = max(0, min(y0, H - 2))
    x1 = max(x0 + 2, min(x1, W))
    y1 = max(y0 + 2, min(y1, H))
    return (x0, y0, x1, y1), img.crop((x0, y0, x1, y1))


def shift_hue(crop: Image.Image, deg: float) -> Image.Image:
    """只改色相，保留明暗结构，视觉上像「换了颜色的同一个物体」。"""
    hsv = crop.convert("HSV")
    arr = np.asarray(hsv, dtype=np.int16).copy()
    arr[..., 0] = (arr[..., 0] + int(deg)) % 256
    return Image.fromarray(arr.astype(np.uint8), "HSV").convert("RGB")


def recolor_patch(img, box, mode, rng):
    """局部改色：在物体自身范围内做色相旋转 + 轻微饱和变化。"""
    x0, y0, x1, y1 = box
    crop = img.crop(box)
    if mode == "hue":
        out = shift_hue(crop, rng.choice([60, 96, 140, 176, 208]))
    else:
        out = ImageEnhance.Color(crop).enhance(rng.uniform(1.5, 2.1))
        out = ImageEnhance.Brightness(out).enhance(rng.uniform(0.78, 1.22))
    # 羽化边缘，避免出现生硬方块
    mask = Image.new("L", crop.size, 0)
    d = ImageDraw.Draw(mask)
    inset = max(2, int(min(crop.size) * 0.12))
    d.rounded_rectangle(
        [inset, inset, crop.size[0] - inset, crop.size[1] - inset],
        radius=max(3, inset // 2), fill=255,
    )
    mask = mask.filter(ImageFilter.GaussianBlur(max(2, inset // 3)))
    base = img.crop(box)
    merged = Image.composite(out, base, mask)
    img.paste(merged, (x0, y0))


def remove_patch(img, box, rng):
    """去掉物体：用四周像素向内插值填充（content-aware 的简化版）。"""
    x0, y0, x1, y1 = box
    W, H = img.size
    pad = max(6, int(min(x1 - x0, y1 - y0) * 0.55))
    sx0, sy0 = max(0, x0 - pad), max(0, y0 - pad)
    sx1, sy1 = min(W, x1 + pad), min(H, y1 + pad)
    ctx = np.asarray(img.crop((sx0, sy0, sx1, sy1)).convert("RGB"), dtype=np.float32)

    # 用八邻域反复向内平均，把空洞「淹没」成周围环境色
    h, w = ctx.shape[:2]
    ox0, oy0 = x0 - sx0, y0 - sy0
    ox1, oy1 = ox0 + (x1 - x0), oy0 + (y1 - y0)
    hole = np.zeros((h, w), dtype=bool)
    hole[oy0:oy1, ox0:ox1] = True

    filled = ctx.copy()
    known = ~hole
    for _ in range(200):
        if known.all():
            break
        acc = np.zeros_like(filled)
        cnt = np.zeros((h, w), dtype=np.float32)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)):
            shifted = np.roll(np.roll(filled, dy, axis=0), dx, axis=1)
            mask = np.roll(np.roll(known, dy, axis=0), dx, axis=1)
            acc += shifted * mask[..., None]
            cnt += mask
        grow = (~known) & (cnt > 0)
        if not grow.any():
            break
        filled[grow] = acc[grow] / cnt[grow][..., None]
        known |= grow

    patch = Image.fromarray(np.clip(filled, 0, 255).astype(np.uint8), "RGB")
    patch = patch.filter(ImageFilter.GaussianBlur(2))
    img.paste(patch.crop((ox0, oy0, ox1, oy1)), (x0, y0))


def resize_patch(img, box, rng):
    """放大/缩小物体：裁剪后缩放再贴回，露出的一圈用邻近色补。"""
    x0, y0, x1, y1 = box
    crop = img.crop(box)
    scale = rng.choice([0.62, 0.70, 1.36, 1.48])
    nw, nh = max(4, int(crop.width * scale)), max(4, int(crop.height * scale))
    scaled = crop.resize((nw, nh), Image.LANCZOS)
    # 先用周围环境填掉原位置
    remove_patch(img, box, rng)
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    px, py = cx - nw // 2, cy - nh // 2
    px = max(0, min(px, img.width - nw))
    py = max(0, min(py, img.height - nh))
    mask = Image.new("L", (nw, nh), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, nw - 1, nh - 1], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    img.paste(scaled, (px, py), mask)


def move_patch(img, box, rng):
    """位置挪动：原位置补背景，物体平移到附近。"""
    x0, y0, x1, y1 = box
    crop = img.crop(box)
    dx = int(rng.choice([-1, 1]) * crop.width * rng.uniform(0.55, 0.95))
    dy = int(rng.choice([-1, 1]) * crop.height * rng.uniform(0.45, 0.85))
    remove_patch(img, box, rng)
    px = max(0, min(x0 + dx, img.width - crop.width))
    py = max(0, min(y0 + dy, img.height - crop.height))
    mask = Image.new("L", crop.size, 0)
    ImageDraw.Draw(mask).ellipse([0, 0, crop.width - 1, crop.height - 1], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    img.paste(crop, (px, py), mask)


# ---------------- 候选区域挑选 ----------------

def saliency_map(img: Image.Image) -> np.ndarray:
    """用局部对比度 + 边缘密度当作「这里有东西」的权重，挑物体而不是挑天空。"""
    small = img.convert("RGB").resize((240, 160), Image.LANCZOS)
    arr = np.asarray(small, dtype=np.float32)
    gray = arr.mean(axis=2)

    gx = np.abs(np.diff(gray, axis=1, prepend=gray[:, :1]))
    gy = np.abs(np.diff(gray, axis=0, prepend=gray[:1, :]))
    edge = gx + gy

    local_mean = np.asarray(
        Image.fromarray(gray.astype(np.uint8)).filter(ImageFilter.GaussianBlur(12)),
        dtype=np.float32,
    )
    contrast = np.abs(gray - local_mean)

    score = edge * 0.6 + contrast * 0.4
    score = np.asarray(
        Image.fromarray((score / (score.max() + 1e-6) * 255).astype(np.uint8))
        .filter(ImageFilter.GaussianBlur(3)),
        dtype=np.float32,
    )
    return score


def pick_regions(img: Image.Image, count: int, rng: random.Random,
                 w_range=(0.055, 0.115), margin=0.05):
    """在显著区域上撒点，保证互不重叠且不贴边。

    要紧的是「要多少给多少」：候选池必须比需求多，后面才能淘汰弱改动。
    所以间距从 1.7 倍半径和逐步放宽到 1.05，直到凑够为止。
    """
    sal = saliency_map(img)
    H, W = sal.shape
    picks = []

    for spacing in (1.7, 1.45, 1.25, 1.1, 1.02):
        tries = 0
        while len(picks) < count and tries < 12000:
            tries += 1
            w = rng.uniform(*w_range)
            h = w * img.height / img.width / rng.uniform(0.8, 1.25)
            cx = rng.uniform(margin + w / 2, 1 - margin - w / 2)
            cy = rng.uniform(margin + h / 2, 1 - margin - h / 2)

            # 显著度加权：低显著区随机丢弃，避免把差异放在空墙/天空
            sx = min(W - 1, int(cx * W))
            sy = min(H - 1, int(cy * H))
            weight = sal[sy, sx] / 255.0
            if rng.random() > weight * 1.8 + 0.18:
                continue

            ok = True
            for p in picks:
                dx = abs(cx - p["cx"])
                dy = abs(cy - p["cy"]) * img.height / img.width
                if (dx * dx + dy * dy) ** 0.5 < (w + p["w"]) * 0.5 * spacing:
                    ok = False
                    break
            if not ok:
                continue
            picks.append({"cx": cx, "cy": cy, "w": w, "h": h})
        if len(picks) >= count:
            break

    if len(picks) < count:
        raise RuntimeError(f"只挑到 {len(picks)} 个区域，要求 {count}；请放宽 w_range 或降低 count")
    return picks[:count]


# ---------------- 主流程 ----------------

KIND_LABEL = {
    "removed":   ("少了一样东西", "这个位置的东西不见了"),
    "added":     ("多了一样东西", "这个位置多了一样东西"),
    "recolored": ("颜色变了", "这里颜色变了"),
    "resized":   ("大小变了", "这里大小变了"),
    "moved":     ("位置挪了", "这里位置挪动了"),
}


def measure(a, b, box) -> float:
    """区域内平均绝对差异（三通道求和）。判定这处改动够不够显眼。"""
    da = np.asarray(a.crop(box), dtype=np.int16)
    db = np.asarray(b.crop(box), dtype=np.int16)
    return float(np.abs(da - db).sum(axis=2).mean())


def apply_edit(img, box, kind, rng, src_img):
    """在原图上做一次局部编辑。返回 (说明文字, 强度)。"""
    x0, y0, x1, y1 = box
    if kind == "recolored":
        recolor_patch(img, box, "hue", rng)
        alt = "这里颜色变了"
    elif kind == "removed":
        remove_patch(img, box, rng)
        alt = "这个位置的东西不见了"
    elif kind == "resized":
        resize_patch(img, box, rng)
        alt = "这里大小变了"
    elif kind == "moved":
        move_patch(img, box, rng)
        alt = "这里位置挪动了"
    else:
        patch = Image.new("RGB", (x1 - x0, y1 - y0))
        base_color = np.asarray(src_img.crop(box), dtype=np.int16).reshape(-1, 3).mean(axis=0)
        tint = np.clip(base_color + np.array([rng.randint(-115, 115),
                                              rng.randint(-115, 115),
                                              rng.randint(-115, 115)]), 0, 255)
        ImageDraw.Draw(patch).ellipse([0, 0, patch.width - 1, patch.height - 1],
                                      fill=tuple(int(v) for v in tint))
        patch = patch.filter(ImageFilter.GaussianBlur(2))
        m = Image.new("L", patch.size, 0)
        ImageDraw.Draw(m).ellipse([0, 0, patch.width - 1, patch.height - 1], fill=235)
        img.paste(patch, (x0, y0), m)
        alt = "这个位置多了一样东西"
    return alt, measure(src_img, img, box)


def build(base_path: Path, out_dir: Path, count: int, seed: int, title: str):
    rng = random.Random(seed)
    a = Image.open(base_path).convert("RGB")
    W, H = a.size

    MIN_DELTA = 42.0   # 低于此值肉眼基本看不出，直接弃用
    KINDS = ["removed", "recolored", "resized", "moved", "added", "recolored"]

    # 多挑候选（每处备 5 个），弱的可以淘汰
    candidates = pick_regions(a, count * 5, rng, w_range=(0.065, 0.13))

    b = a.copy()
    diffs = []
    used_idx = set()

    for n in range(count):
        placed = False
        # 每处先指定想做的类型（按序号轮转），避免全是「东西不见了」显得单调。
        # 指定类型做不出效果时才退回到其它类型。
        preferred = KINDS[n % len(KINDS)]
        order = [preferred] + [k for k in KINDS if k != preferred]

        for ci, cand in enumerate(candidates):
            if ci in used_idx:
                continue
            cx, cy, w, h = cand["cx"], cand["cy"], cand["w"], cand["h"]
            box, _ = scissor(a, cx, cy, w, h)

            for kind in order:
                trial = b.copy()
                try:
                    alt, strength = apply_edit(trial, box, kind, rng, a)
                except Exception:
                    continue
                if strength < MIN_DELTA:
                    continue

                r = ((w * W) ** 2 + (h * H) ** 2) ** 0.5 / 2 / W * 1.3
                diffs.append({
                    "id": f"d{n + 1}",
                    "x": round(cx, 4), "y": round(cy, 4), "r": round(r, 4),
                    "hint": f"第 {n + 1} 处", "altText": alt, "kind": kind,
                    "strength": round(strength, 1),
                })
                b = trial
                used_idx.add(ci)
                placed = True
                break
            if placed:
                break

        if not placed:
            raise RuntimeError(
                f"第 {n + 1} 处找不到强度 > {MIN_DELTA} 的改法；请加候选数或降低门槛")

    # ---- 按真实差异像素反算半径（moved/resized 会超出原框）----
    da0 = np.asarray(a, np.int16)
    db0 = np.asarray(b, np.int16)
    changed = np.abs(da0 - db0).sum(axis=2) > 30
    if changed.any():
        ys, xs = np.nonzero(changed)
        centers = np.array([[d["x"] * W, d["y"] * H] for d in diffs], dtype=np.float64)
        flat = np.stack([xs.astype(np.float64), ys.astype(np.float64) * (W / H)], axis=1)
        cf = np.stack([centers[:, 0], centers[:, 1] * (W / H)], axis=1)
        d2 = ((flat[:, None, :] - cf[None, :, :]) ** 2).sum(axis=2)
        nearest = d2.argmin(axis=1)
        for i, d in enumerate(diffs):
            sel = nearest == i
            if not sel.any():
                continue
            far = np.sqrt(d2[sel, i].max()) / W
            d["r"] = round(max(d["r"], far * 1.15), 4)

    # ---- 去重叠：moved/resized 反算出的半径可能互相压住 ----
    # 逐步缩小较大的那个，直到所有热区两两不相交。
    # 判定距离用「归一化后等尺度」的公式，与前端判定保持一致。
    def pair_dist(d1, d2):
        dx = d1["x"] - d2["x"]
        dy = (d1["y"] - d2["y"]) * (H / W)
        return (dx * dx + dy * dy) ** 0.5

    for _ in range(200):
        worst = None
        for i in range(len(diffs)):
            for j in range(i + 1, len(diffs)):
                a1, a2 = diffs[i], diffs[j]
                gap = pair_dist(a1, a2) - (a1["r"] + a2["r"])
                if gap < 0 and (worst is None or gap < worst[0]):
                    worst = (gap, i, j)
        if worst is None:
            break
        _, i, j = worst
        # 缩较大的那个；相等时缩后者
        k = i if diffs[i]["r"] >= diffs[j]["r"] else j
        diffs[k]["r"] = round(diffs[k]["r"] * 0.94, 4)

    out_dir.mkdir(parents=True, exist_ok=True)
    a.save(out_dir / "a.webp", "WEBP", quality=90, method=6)
    b.save(out_dir / "b.webp", "WEBP", quality=90, method=6)

    # 自检
    da = np.asarray(a, dtype=np.int16)
    db = np.asarray(b, dtype=np.int16)
    delta = np.abs(da - db).sum(axis=2) > 36
    total = int(delta.sum())
    yy, xx = np.nonzero(delta)
    covered = 0
    for d in diffs:
        cx, cy = d["x"] * W, d["y"] * H
        rr = d["r"] * W
        covered += int((((xx - cx) ** 2 + ((yy - cy) / (H / W)) ** 2) <= rr * rr).sum())
    coverage = covered / total if total else 0
    weakest = min(d["strength"] for d in diffs)

    return {
        "title": title,
        "width": W, "height": H,
        "aspectRatio": round(W / H, 4),
        "diffCount": len(diffs),
        "diffs": diffs,
        "selfCheck": {
            "changedPixels": total,
            "changedPct": round(100 * total / (W * H), 3),
            "hotspotCoveragePct": round(100 * coverage, 2),
            "weakestStrength": weakest,
        },
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--count", type=int, default=5)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--title", default="未命名关卡")
    ap.add_argument("--report", required=True)
    args = ap.parse_args()

    result = build(Path(args.base), Path(args.out), args.count, args.seed, args.title)
    rep = Path(args.report)
    rep.parent.mkdir(parents=True, exist_ok=True)
    rep.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    sc = result["selfCheck"]
    print(f"✓ {args.out}  {result['width']}x{result['height']}  "
          f"{result['diffCount']} 处差异")
    print(f"  改动像素 {sc['changedPct']}%  热区覆盖 {sc['hotspotCoveragePct']}%")
    if sc["hotspotCoveragePct"] < 90:
        print("  ⚠️ 覆盖不足 90%，有改动落在热区外，请调大 r")


if __name__ == "__main__":
    sys.exit(main())
