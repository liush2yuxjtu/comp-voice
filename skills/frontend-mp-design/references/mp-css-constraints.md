# 微信公众号 HTML/CSS 约束表 (paste-survival)

What the 公众号 图文编辑器 keeps vs deletes when you paste. The editor runs a security + normalization clean on paste; design only in the "keeps" column, then inline everything.

Sources: [axtonliu — HTML/CSS 支持情况解析](https://www.axtonliu.ai/newsletters/ai-2/posts/wechat-article-html-css-support) · [腾讯云 — 样式内联化与富文本粘贴](https://cloud.tencent.com.cn/developer/article/2436347) · [CSDN — CSS 样式常见问题](https://blog.csdn.net/tjjucheng/article/details/81126118) · [CSDN — css 布局与 SVG 的坑](https://blog.csdn.net/liixnhai/article/details/111693575) · [Automattic/juice](https://github.com/Automattic/juice).

## 三个根因 (why design breaks on paste)

1. **`<style>` 块 + 外链 CSS 整段被删** — class 选择器、`:root`/`var()` 变量、`@media`、`@keyframes`、`@font-face` 全部蒸发。class 还在 DOM 上但无规则匹配。← 头号杀手。
2. **`position` 全系列 + `id` + `<script>`/`<iframe>` 被删**，DOM 被改写（`<p><span>x</span></p>`→`<p>x</p>`）。
3. **复制方式**：浏览器直接 Ctrl+C 常只带 `text/plain`，样式不进编辑器 → 必须写 `text/html` 剪贴板。

## CSS 属性

| ✅ 保留（必须内联在 `style=""`） | ❌ 删除 / 不可靠 |
|---|---|
| `color` `font-size` `font-weight` `font-style` | `position` (absolute/fixed/relative) |
| `line-height` `letter-spacing` `text-align` `text-decoration` | `z-index` `float` |
| `margin` `padding` `vertical-align` | `@media`（无响应式，固定 ~677–720px 视口） |
| `display: block` / `inline-block` | `@keyframes` `animation` `transition` |
| `background-color` `border` `border-radius` | `@font-face` / 外链字体（只能系统字体） |
| `box-shadow` `opacity` | `var()` CSS 变量（随 `<style>` 一起没） |
| `width`/`height`（用 `px`） | `%` 百分比不稳；优先 `px` |
| 简单 `linear-gradient`（慎用） | 复杂 gradient / 复杂 `transform`（不可靠） |

注意：`font-size` 是行内级属性，放在块级标签（如 `<p>`）上可能失效 → 字号落到 `<span>`/文本节点更稳。

## 标签

| ✅ 保留 | ❌ 删除 |
|---|---|
| `<p> <h1>–<h6> <strong> <b> <em> <i> <u> <br>` | `<script> <iframe> <form> <input> <object> <embed>` |
| `<ul> <ol> <li> <a>`（外链触发安全提示） | `<style> <link rel=stylesheet> <noscript>` |
| `<section>`（编辑器规范容器，优先于 `<div>`） | 所有 `id` 属性 · 所有 `on*` 事件处理器 |
| `<img>`（自动 `max-width:100%`） | — |

## 布局

- 单列、文档流（document flow）。**禁** flex/grid 作骨架、禁 `position`、禁 `float`。
- 无响应式（`@media` 无效）→ 按固定宽度设计，~720px max-width 居中。
- 复杂排布用嵌套 `margin`/`padding` 或表格，不要定位。

## 字体

- 只用系统字体栈：`-apple-system, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif`。
- `@font-face` / Google Fonts 无效。

## 图片

- 外链 `<img src>` 会被拦截或失效；**Base64 一律不行**；SVG 外链不行。
- 图片必须先传 **公众号素材库**，用返回的 `mmbiz.qpic.cn` 域名 URL。
- iOS 上 `<img>` 需显式 `width`/`height`。
- 不推荐 1:1 方图；封面 16:9，内文 4:3。

## 修复三件套

1. **CSS 内联化** — 用 [`juice`](https://github.com/Automattic/juice) 把 `<style>` 规则编译进每个元素的 `style=""`。元素自带样式 → 无可剥离。
2. **以 `text/html` 写剪贴板** — `clipboardData.setData('text/html', html)`（+ `text/plain` 兜底），或 `navigator.clipboard.write([new ClipboardItem({'text/html': blob})])`。
3. **图片走素材库** — 粘贴前确保所有 `<img src>` 是 `mmbiz.qpic.cn`。

`scripts/inline-and-clean.mjs` 自动做 1 + 清洗删除项；`scripts/copy-helper.html` 做 2；图片需用户手动传素材库（脚本会审计并标红非 mmbiz / base64）。
