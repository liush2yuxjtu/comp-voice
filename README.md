# comp-voice

Turn an audio recording + enterprise context into a **微信公众号** draft (and optional internal-comms update + HTML preview gist) — by orchestrating skills that already exist on your machine.

## What this plugin does (and doesn't)

```
audio (m4a/mp3/wav)               ─┐
+ /enterprise-search results       │
+ /slack:slack-search results      ├──►  公众号 draft (markdown)
+ pasted Feishu content            │     + optional /internal-comms 3P update
+ local 公众号 corpus (style+dedup)│     + optional /talk-html gist preview
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

| Type | Name | Triggered by |
|---|---|---|
| Skill (slash) | `compose-mp` | `/comp-voice:compose-mp <audio-path>` or "draft a 公众号 article from this recording" |
| Skill (auto) | `transcribe-audio` | "transcribe this", "录音转文字", or auto-routed by `compose-mp` |
| Skill (auto) | `preview-mp` | "preview the MP article as HTML", "看看排版", or auto-routed by `compose-mp --preview-html` |

No agents, no hooks, no MCP. Three skills, one pipeline.

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
- One or more of the delegated plugins for richer context:
  - `enterprise-search` plugin (for Slack/Notion/Atlassian/MS365 search)
  - `slack` plugin (for direct Slack search/digest)
  - `internal-comms` skill (for the English internal-update flavor)
  - `talk-html` skill (for the HTML preview/gist)
  - `marketing` plugin (for drafting reference patterns)

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
    └── comp-voice.local.md             # settings template
```

## Roadmap

These are explicitly NOT in v0.1:

- Feishu MCP integration (use paste-or-folder for now)
- 公众号 publishing API (output is markdown — you copy to the editor)
- A pre-built LLM judge (`judge.json` is emitted but the judge is bring-your-own)
- A standalone agent (orchestration fits inside `compose-mp`)
