# comp-voice

Turn an audio recording + enterprise context into a **微信公众号** draft (and optional internal-comms update + HTML preview gist) — by orchestrating skills that already exist on your machine.

## What this plugin does (and doesn't)

```
audio (m4a/mp3/wav)                     ─┐
+ /enterprise-search (or vendored)       │
+ /slack:slack-search (or vendored)      ├──►  公众号 draft (markdown)
+ pasted Feishu content                  │     + optional /internal-comms (or vendored)
+ local 公众号 corpus (style+dedup)      │     + optional /talk-html gist preview
                                        ─┘     + .judge/$run_id/judge.json
```

**This plugin owns** only what's missing on disk:

- The 微信公众号 voice + structure knowledge (no existing skill has it)
- The audio-to-text glue (no whisper skill exists)
- The pipeline orchestration that ties everything together

**This plugin delegates everything else** to skills you already have:

- `/enterprise-search:search` — Slack/Notion/Atlassian/Asana/Guru/MS365
- `/slack:slack-search` — Slack-specific deep search
- `/internal-comms` — English 3P / newsletter / FAQ flavors
- `/marketing:draft-content` — generic drafting patterns (referenced, adapted)
- `/talk-html` — HTML rendering + gist publishing

If you don't have those plugins installed, comp-voice still runs — it just skips the steps that need them and notes the gap in the judge JSON.

## Components

**Own skills** (the unique value of this plugin):

| Type | Name | Triggered by |
|---|---|---|
| Skill (slash) | `compose-mp` | `/comp-voice:compose-mp <audio-path>` or "draft a 公众号 article from this recording" |
| Skill (auto) | `transcribe-audio` | "transcribe this", "录音转文字", or auto-routed by `compose-mp` |
| Skill (auto) | `preview-mp` | "preview the MP article as HTML", "看看排版", or auto-routed by `compose-mp --preview-html` |

**Vendored skills** (verbatim copies of upstream — comp-voice works standalone). See `skills/VENDORED.md` for attribution + update recipes.

| Vendored slash | Upstream source | Role in pipeline |
|---|---|---|
| `/comp-voice:vendored-enterprise-search` | `enterprise-search:search` 1.2.0 | Step 3a fallback |
| `/comp-voice:vendored-slack-search` | `slack:slack-search` 1.0.0 | Step 3b fallback |
| `/comp-voice:vendored-internal-comms` | user-level `internal-comms` | Step 7 fallback (`--with-internal-update`) |
| `/comp-voice:vendored-draft-content` | `marketing:draft-content` 1.2.0 | Content-pattern reference |

Resolution rule: compose-mp **prefers upstream** if loaded, **falls back to vendored** if not. License files preserved alongside each copy.

No agents, no hooks, no MCP.

## Install

```bash
# Local testing
cc --plugin-dir /Users/m1/projects/comp-voice

# Or copy into a project's .claude-plugin/ to test inside a real session
```

Then either restart Claude Code or run `/reload-plugins`.

## Prerequisites

**Required** for full functionality:

- A whisper-family transcriber on PATH (only if you want audio → text):
  - `pip install mlx-whisper` (Apple Silicon, fastest)
  - `pip install openai-whisper` (any platform)
  - `brew install whisper-cpp` (fast CPU)
  - …or paste a transcript and skip transcription entirely
- (Optional) Upstream plugins for fresher / better-maintained versions of the delegated skills — comp-voice prefers these if loaded, otherwise falls back to its bundled vendored copies:
  - `enterprise-search` plugin (Slack/Notion/Atlassian/MS365 search)
  - `slack` plugin (direct Slack search/digest)
  - `internal-comms` skill (English internal-update flavor)
  - `marketing` plugin (drafting reference patterns)
  - `talk-html` skill (HTML preview/gist) — **not vendored**, so HTML preview needs this installed

**Optional** local setup:

- `~/Documents/wechat-archive/*.md` — past 公众号 articles as style corpus + dedup signal
- `~/Documents/feishu-export/*.md` — Feishu doc/chat exports

## Usage

```
/comp-voice:compose-mp ~/Recordings/meeting.m4a
/comp-voice:compose-mp paste
/comp-voice:compose-mp ~/Recordings/meeting.m4a --with-internal-update
/comp-voice:compose-mp ~/Recordings/meeting.m4a --preview-html
/comp-voice:compose-mp ~/Recordings/meeting.m4a --with-internal-update --preview-html
```

The pipeline writes everything to `.judge/<run_id>/`:

```
.judge/mp-20260515-141200/
├── transcript.txt           # from transcribe-audio
├── enterprise.md            # /enterprise-search:search output
├── slack.md                 # /slack:slack-search output
├── mp-corpus.md             # globbed from wechat_archive
├── feishu.md or feishu-pasted.md
├── synthesis.md             # core thesis + facts + gaps
├── draft.md                 # ← the publish-ready 公众号 article
├── internal.md              # optional, with --with-internal-update
├── preview-url.txt          # optional, with --preview-html
└── judge.json               # machine-readable evidence for a 3rd-party LLM judge
```

## Configuration

Drop a file at `.claude/comp-voice.local.md` (project-local) or `~/.claude/comp-voice.local.md` (user-global). See `examples/comp-voice.local.md` for the template. All keys optional.

```yaml
---
wechat_archive: ~/Documents/wechat-archive
feishu_export:  ~/Documents/feishu-export
brand_voice:    "诚实但不悲观, 偏技术读者, 避免心灵鸡汤"
default_length: 2500
---
```

These files are gitignored by default (`.claude/*.local.md`).

## Evaluating the output

Per the `testing-judge-harness` rule (`~/.claude/docs/rules/testing-judge-harness.md`): **comp-voice does not evaluate its own output**. The `judge.json` file is machine-readable evidence for a separate LLM judge. To rate a draft:

```bash
claudefast -p "Read .judge/<run_id>/judge.json and .judge/<run_id>/draft.md.
Apply criteria from ~/.claude/plugins/comp-voice/skills/compose-mp/references/judge-criteria.md.
Output JSON: {tier1_pass: bool, tier2_scores: {...}, overall_verdict: 'pass'|'fail'|'revise'}."
```

See `skills/compose-mp/references/judge-criteria.md` for the rubric.

## Layout

```
comp-voice/
├── .claude-plugin/
│   └── plugin.json
├── README.md
├── .gitignore
├── skills/
│   ├── compose-mp/
│   │   ├── SKILL.md
│   │   ├── references/
│   │   │   ├── wechat-mp-style.md      # 公众号 voice/structure rules
│   │   │   ├── pipeline-flow.md        # full data-flow diagram
│   │   │   └── judge-criteria.md       # what a 3rd-party LLM judge checks
│   │   ├── examples/
│   │   │   └── full-run.md             # annotated worked example
│   │   └── scripts/
│   │       └── transcribe.sh           # CLI convenience wrapper
│   ├── transcribe-audio/
│   │   └── SKILL.md
│   └── preview-mp/
│       └── SKILL.md
└── examples/
    ├── comp-voice.local.md             # settings template
    └── website/
        ├── ctx.json                    # ProductContext used by /pitchkit
        └── index.html                  # generated landing page (editorial style)
```

## Landing page

A polished editorial-style landing page ships under `examples/website/index.html`, generated by [pitchkit](https://github.com/EricSun0218/pitchkit) `landing-page` from `examples/website/ctx.json`. Open the HTML directly in a browser, or host it on GitHub Pages / Vercel — single self-contained file, Tailwind via CDN, Fraunces + Geist via Google Fonts. Regenerate with:

```bash
pitchkit landing-page examples/website/ctx.json examples/website/index.html
```

## Roadmap

These are explicitly NOT in v0.1:

- Feishu MCP integration (use paste-or-folder for now)
- 公众号 publishing API (output is markdown — you copy to the editor)
- A pre-built LLM judge (`judge.json` is emitted but the judge is bring-your-own)
- A standalone agent (orchestration fits inside `compose-mp`)
