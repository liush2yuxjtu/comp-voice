# Judge criteria — MP paste-survival

This file is **not** consumed by `frontend-mp-design`. Per the user's `testing-judge-harness` rule: the code that produced `mp.html` must not also rate it. Feed `.judge/$run_id/clean-report.json` + `mp.html` to a separate LLM (e.g. `claudefast -p`) with these criteria.

## Tier 1 — paste-survival (deterministic; `clean-report.json`)

| Check | Pass condition |
|---|---|
| no surviving `<style>` | `metrics.removed.style_blocks` accounts for every authored block AND `metrics.residual.style_blocks == 0` |
| no `id` left | `metrics.residual.id_attrs == 0` |
| no script/iframe/form | `metrics.residual.script + iframe + form + input == 0` |
| no `on*` handlers | `metrics.residual.event_handlers == 0` |
| no banned inline props | `metrics.residual.banned_css_props == 0` (position/z-index/float/animation/transition) |
| CSS was inlined | `metrics.inlined_style_attrs > 0` (juice ran and produced inline styles) |
| no base64 images | `metrics.images.base64 == 0` |
| all images on CDN | `metrics.images.non_mmbiz == 0` (else: action item, upload to 素材库) |
| containers are section | if `--sections` passed: `metrics.residual.div_tags == 0` |

`exit_code == 0` AND every residual count `== 0` ⇒ Tier-1 PASS (safe to paste).

## Tier 2 — design quality (LLM judge; reads `mp.html`)

Rate 0-10 each:

1. **视觉层次 (0-10)** — 标题/小标题/正文/引用 是否有清晰的尺寸与颜色层级？
2. **约束内的设计感 (0-10)** — 在"无 flex/无动画/无定位"的限制下，是否仍用色块/边框/卡片/留白做出了不平庸的版式？还是退化成纯文本？
3. **公众号阅读体验 (0-10)** — 720px 单列、17px/1.75、段落 ≤80字、手机竖屏友好？
4. **配色克制 (0-10)** — 是否守住 2 色 accent 系统，没有花哨堆砌？
5. **图片合规 (0-10)** — 图片位是 mmbiz URL 或明确标注待传素材库，无 base64/外链？

**Pass**: 平均 ≥ 7，且 #2 与 #3 均 ≥ 6。

## 为什么分两层

Tier 1 是"粘进去会不会崩"——可脚本化、零容忍。Tier 2 是"崩不崩之外好不好看"——需要 LLM 主观判断。一个 mp.html 可以 Tier-1 全过（绝对粘得进）但 Tier-2 很丑（退化成白纸黑字）。两层都要看。
