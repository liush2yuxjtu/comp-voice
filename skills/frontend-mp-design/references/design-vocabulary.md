# 公众号设计词汇表 — distinctive but survivable

Visual interest that lives entirely in the inline-CSS subset (`references/mp-css-constraints.md`). Everything here survives the editor clean. Author these in a normal `<style>` block; `inline-and-clean.mjs` inlines them. Containers are `<section>`, not `<div>`.

Pick a 2-color accent system (one strong hue + one warm/neutral). Maximalist *within constraints* = repeated color blocks, borders, radii, generous whitespace — not animation or layered positioning.

## Base shell

```html
<section style="max-width:720px;margin:0 auto;padding:24px 18px;
  background:#FAFAF7;color:#1A1A1A;
  font-family:-apple-system,'PingFang SC','Noto Sans SC','Microsoft YaHei',system-ui,sans-serif;
  font-size:17px;line-height:1.75;">
  ...
</section>
```

## Title + subtitle

```html
<h1 style="font-size:26px;font-weight:800;line-height:1.3;margin:0 0 8px;">标题</h1>
<p style="font-size:15px;color:#888;font-style:italic;margin:0 0 28px;">副标题 / 一句话摘要</p>
```

## Color-block section header (survives — no pseudo-elements)

```html
<section style="margin:32px 0 14px;">
  <span style="display:inline-block;background:#1E40AF;color:#fff;
    font-size:18px;font-weight:700;padding:6px 14px;border-radius:6px;">§1 小标题</span>
</section>
```

## Left-bar blockquote (the 金句 block — ≤2 per article)

```html
<section style="border-left:4px solid #1E40AF;background:#F0F4FF;
  padding:14px 18px;margin:20px 0;border-radius:0 6px 6px 0;">
  <p style="margin:0;font-size:17px;font-style:italic;color:#1E3A8A;">一句反直觉的断言。</p>
</section>
```

## Badge / pill labels (inline-block, no flex needed)

```html
<span style="display:inline-block;background:#FEF3C7;color:#92400E;
  font-size:13px;font-weight:600;padding:3px 10px;border-radius:999px;margin:2px 4px 2px 0;">标签</span>
```

## Bordered card (replaces flex cards)

```html
<section style="border:1px solid #E5E7EB;border-radius:10px;padding:18px;margin:18px 0;
  box-shadow:0 1px 3px rgba(0,0,0,0.06);background:#fff;">
  <p style="margin:0 0 6px;font-weight:700;font-size:16px;">卡片标题</p>
  <p style="margin:0;color:#444;">卡片正文。</p>
</section>
```

## Big number callout (stack with margins, not grid)

```html
<section style="text-align:center;margin:24px 0;">
  <p style="margin:0;font-size:44px;font-weight:800;color:#1E40AF;line-height:1;">30<span style="font-size:18px;color:#888;font-weight:500;"> 天</span></p>
  <p style="margin:6px 0 0;font-size:14px;color:#888;">一句说明</p>
</section>
```

## Divider

```html
<section style="height:1px;background:#E5E7EB;margin:28px 0;"></section>
```

## Image slot (must be 素材库 URL before paste)

```html
<img src="https://mmbiz.qpic.cn/..." width="720" height="405"
  style="display:block;max-width:100%;border-radius:10px;margin:18px auto;" alt="封面" />
<!-- 若无 mmbiz URL：留占位 + 注明"先传素材库再替换 src"。禁 base64 / 外链。 -->
```

## Body paragraph (phone-readable rhythm)

```html
<p style="margin:0 0 1em;">正文段落，≤80字，短句优先。</p>
```

## 不要做 (will be stripped → don't bother)

- flex/grid 布局骨架、`position`/`z-index`、`float` 多栏
- `::before`/`::after` 伪元素、`animation`/`transition`/hover
- CSS 变量 `var()`、`@media` 响应式、外链/自定义字体
- base64 图、外链非 mmbiz 图、SVG 外链
- 把样式留在 `<style>`/`<link>` 里不内联
