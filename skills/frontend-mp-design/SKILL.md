---
name: frontend-mp-design
description: Design a 微信公众号 (WeChat Official Account) article as distinctive HTML that SURVIVES being pasted into the 公众号 editor. Beautiful frontend design breaks on paste because the editor deletes `<style>` blocks, `id`, positioning, scripts and external CSS — this skill designs within the MP-safe subset, then inlines + cleans the HTML and produces a one-click "copy into 公众号" helper. Trigger with `/comp-voice:frontend-mp-design`, "排版复制到公众号就乱了/失效", "make this design survive the WeChat editor", "公众号 HTML 排版", "把这页做成能粘进公众号的", or when `compose-mp` output needs editor-ready styling (not just a preview).
argument-hint: "[content-path: draft.md | design.html] [--from-design <html>] [--sections] [--no-clipboard]"
allowed-tools: Read, Write, Edit, Bash, Glob, Skill
---

# frontend-mp-design

Turn content (a `compose-mp` draft, or an existing designed HTML page) into **editor-ready 公众号 HTML**: visually distinctive *within the constraints the WeChat editor actually honors*, fully inlined, cleaned of everything the editor strips, and packaged so the user can paste it into the 公众号 图文编辑器 with the styling intact.

## Where this sits (do not confuse with preview-mp)

| Skill | Output | Audience |
|---|---|---|
| `preview-mp` | a reading-room HTML preview, gist link | a human *reviewing* the article |
| **`frontend-mp-design`** | **paste-into-编辑器 HTML + clipboard helper** | **the 公众号 editor itself** |

`preview-mp` answers "看看排版对不对". This skill answers "为什么粘进公众号就崩了 / 怎么让它不崩". They are complementary; a `--preview-html` run can still happen first.

## Why beautiful design breaks on paste (root causes)

The editor runs a security + normalization clean on paste. It **deletes**: `<style>` blocks and external CSS (all class/`:root var()`/`@media`/`@keyframes`/`@font-face` rules vanish), `id` attributes, `<script>`/`<iframe>`/`<form>`, all `position`/`z-index`/`float`, and event handlers. It also rewrites DOM (`<p><span>x</span></p>` → `<p>x</p>`) and blocks external/base64 images. Full cited table: `references/mp-css-constraints.md`.

So the fix is three things: **(1) design only in the surviving subset, (2) inline every style, (3) paste as `text/html`** with images already on WeChat's CDN.

## Workflow

### 1. Acquire the content

- Arg is a `*.md` (e.g. `.judge/$run_id/draft.md` from `compose-mp`) → read it; you will lay it out.
- Arg is a `*.html` (or `--from-design <html>`) → read it; you will constrain + inline it.
- No arg → ask once: "公众号草稿 .md 还是已有设计 .html？给个路径。"

Set `run_id = mpd-$(date +%Y%m%d-%H%M%S)` and create `.judge/$run_id/` for the evidence trail (same convention as `compose-mp`).

### 2. (Optional) get a distinctive base design

If the user wants strong visual design and gave only markdown, delegate the *creative* pass to `/frontend-design` (auto-routed; canonical at `~/.claude/.agents/skills/frontend-design`), but **hand it the constraints up front**: pass `references/mp-css-constraints.md` and `references/design-vocabulary.md` so it composes in the survivable subset (single-column, `<section>` containers, inline-friendly, no flex/grid skeleton, system fonts, solid colors + borders + radius + shadow, no animation). Then continue to step 3 to enforce + inline.

If the user just wants it to *work* (not award-winning), skip delegation and lay it out yourself from `references/design-vocabulary.md`.

### 3. Compose MP-safe HTML

Write `.judge/$run_id/design.html` — a self-contained page with a `<style>` block (you author normally; it gets inlined in step 4). Obey **every** rule in `references/mp-css-constraints.md`. Use the patterns in `references/design-vocabulary.md` for visual interest that survives: color-block headers, left-bar blockquotes, badge/pill `inline-block` labels, divider rules, bordered cards, number callouts. Containers: `<section>`, not `<div>`. Title/subtitle/section-header/body sizing per 公众号 reading conventions (17px body, 1.75 line-height, ~720px max-width).

Image rule: reference images by their **WeChat 素材库** URL (`mmbiz.qpic.cn`) if known; otherwise leave a clearly-marked placeholder + a note that the user must upload to 素材库 first (external/base64 will be stripped). Never embed base64.

### 4. Inline + clean (the load-bearing step)

Run the export harness:

```bash
node skills/frontend-mp-design/scripts/inline-and-clean.mjs \
  .judge/$run_id/design.html .judge/$run_id/mp.html [--sections]
```

It: inlines all CSS via `juice` (fetched through `npx --yes` on first run, needs network once), strips `<script>`/`<style>`/`<iframe>`/`<form>`/`<input>`/`id`/`on*` handlers, removes disallowed inline CSS props (`position`/`z-index`/`float`/`animation`/`transition`/...), optionally rewrites `<div>`→`<section>` with `--sections`, audits images (flags base64 + non-`mmbiz` URLs), and writes a **machine-readable report to stdout + `.judge/$run_id/clean-report.json`**. The skill must not judge its own output — that JSON is for a separate evaluator (see `references/judge-criteria.md`).

### 5. Package for paste

Unless `--no-clipboard`: copy `scripts/copy-helper.html` template into `.judge/$run_id/copy-helper.html` pointed at `mp.html`, and tell the user to open it and click **复制到公众号** (it writes `text/html` to the clipboard so the 编辑器 keeps inline styles). Direct browser Ctrl+C often drops to `text/plain` and loses everything — the helper is the reliable path.

### 6. Emit judge.json + report to user

Write `.judge/$run_id/judge.json` merging the clean-report metrics. Then tell the user in ≤5 lines: the `mp.html` path, the copy-helper path, what got stripped (counts), any image placeholders still needing 素材库 upload, and the single instruction "open copy-helper.html → 复制到公众号 → paste into 图文编辑器". Do not paste the article content back.

## Hard rules

- **Never** ship HTML with a surviving `<style>` block, `id`, `position`, `<script>`, or base64 image and call it editor-ready — those are the exact things that break on paste. The clean step must run.
- **Never** invent image URLs. Unknown image → placeholder + 素材库 upload note.
- **Never** edit the source `compose-mp` `draft.md`. This skill reads it; layout output goes to `.judge/$run_id/`.
- **Always** write the evidence trail to `.judge/$run_id/` and emit `clean-report.json`. The producing code does not rate itself.
- **Always** keep SKILL.md instructions FOR Claude; the user sees only the ≤5-line summary in step 6.

## Related (do not re-implement)

`compose-mp` (produces the draft this consumes) · `preview-mp` (reading preview, different output) · `/frontend-design` (creative pass, delegate the *look*, then constrain here) · `/talk-html` (general HTML→gist, used by preview-mp).

## References

- `references/mp-css-constraints.md` — cited allow/deny table: CSS props, tags, layout, fonts, images
- `references/design-vocabulary.md` — distinctive visual patterns that survive the editor clean
- `references/judge-criteria.md` — what a 3rd-party LLM judge checks in `clean-report.json` + `mp.html`
