---
name: preview-mp
description: Render a 微信公众号 draft (markdown) as a polished zh-CN HTML preview page and publish it as a GitHub gist for review/sharing. Wraps the user's existing /talk-html skill with comp-voice-specific framing (公众号 reading-environment styling, no nav, real content only). Trigger when a user wants to "preview the MP article", "render as HTML", "publish a preview gist", "看看排版", or when `compose-mp` is invoked with `--preview-html`.
argument-hint: "[draft-path] [--no-publish]"
allowed-tools: Read, Write, Bash, Skill
---

# preview-mp

Take a 公众号 draft markdown file and turn it into a polished HTML preview, optionally published to a gist. This skill is a **thin wrapper** around `/talk-html` — it does not re-implement HTML generation. Its job is to feed `/talk-html` the right framing.

## Inputs

- `draft_path` (required): path to the 公众号 draft markdown. Typically `.judge/$run_id/draft.md` from `compose-mp`.
- `--no-publish` (optional flag): generate the HTML locally only, do not push to gist.

If `draft_path` is missing, ask once. If the path doesn't resolve, stop.

## Steps

### 1. Read the draft

Read the full markdown file. Extract:
- Title (first `# ` line)
- Subtitle (first `> ` line, if any)
- Body sections
- Image-prompt block (the `**配图建议**` block at the end — preserve as a styled aside, do not render as part of the article body)

### 2. Sanity-check

Refuse to proceed if:
- File doesn't exist or is empty
- No `# ` title found
- Body is < 500 字 (likely incomplete)

Surface the issue, stop.

### 3. Call /talk-html with comp-voice framing

Invoke the `/talk-html` skill via the Skill tool. Pass these instructions:

> Render `<draft_path>` as a zh-CN HTML page styled for **公众号 reading environment**:
>
> - Single-column, max-width 720px, centered
> - Body font: PingFang SC, Noto Sans SC, system-ui (Chinese-first stack)
> - Body size: 17px, line-height 1.75, paragraph spacing 1em
> - Title: 28px bold, top of page
> - Subtitle: 16px gray italic
> - Section headers: 20px bold, no underline, top margin 2em
> - No nav, no footer, no sidebar — this is a **preview**, not a site
> - Mobile-first (the eventual reader is on phone)
> - Soft warm-white background `#FAFAF7`, body text `#1A1A1A`
> - Block-quotes: left border 3px solid `#1E40AF`, bg `#F0F4FF`, italic, padding 1em
> - The `**配图建议**` block at the end: render as a separate styled aside with a faint border, label "配图建议 (Image prompts for the editor)", monospace font for the prompt text
>
> Real content only — every paragraph in the draft must appear verbatim. Do not summarize, do not "improve" the writing. If the draft has placeholder text like `{...}`, render it literally so the user notices.
>
> Title of the gist: `comp-voice 预览: <article-title>`
>
> If `--no-publish` was set on preview-mp, write the HTML to `<draft_dir>/preview.html` and stop (do not push to gist).

### 4. Save the preview URL

After `/talk-html` returns, save the gist URL (or local file path if `--no-publish`) to `<draft_dir>/preview-url.txt`.

### 5. Report to caller

Return one line: the gist URL or local HTML path. The caller (`compose-mp` or the user directly) will include this in its summary.

## Hard rules

- **Never** modify the draft content. preview-mp is read-only on `draft.md`.
- **Never** generate fake content if the draft is missing — fail loudly.
- **Always** delegate to `/talk-html`. Do not write HTML/CSS inline in this skill.
- The user's `/talk-html` rule says any **interactive / live / animation** content must carry a real video or GIF — but a 公众号 preview is **static text**, so no media is needed. If you ever extend this skill to include live data, that rule re-engages.

## Why this is a wrapper, not a re-implementation

The user has `/talk-html` as a general "render conversation/file → HTML → gist" skill. preview-mp's value is **framing**: telling /talk-html that this is a phone-first reading-room preview with specific typographic constraints (公众号 conventions, not a landing page). Without this framing, /talk-html would default to a richer layout that distorts the reading experience.
