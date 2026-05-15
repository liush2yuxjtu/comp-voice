---
name: compose-mp
description: Compose a 微信公众号 (WeChat Official Account) article from an audio recording plus enterprise context. Orchestrates audio transcription, enterprise-search across Slack/Notion/Atlassian/MS365, pasted Feishu content, and a local 公众号 corpus into a publish-ready draft. Trigger with `/comp-voice:compose-mp`, "draft a 公众号 article", "写一篇公众号", "compose mp article from this recording", or when the user has an audio file and wants a Chinese long-form article out of it.
argument-hint: "[audio-path | 'paste'] [--with-internal-update] [--preview-html]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Skill, AskUserQuestion
---

# compose-mp

Drive the full pipeline: **audio → transcript → enterprise context → synthesis → 公众号 draft → optional internal update → optional HTML preview**. Delegate aggressively. This skill owns only the 公众号 voice and the pipeline glue.

## Invocation contract

User invokes one of:

- `/comp-voice:compose-mp /path/to/recording.m4a`
- `/comp-voice:compose-mp paste` — user will paste a transcript in the next turn
- `/comp-voice:compose-mp /path/to/recording.m4a --with-internal-update` — also produce a `/internal-comms` flavored version
- `/comp-voice:compose-mp ... --preview-html` — also call `/comp-voice:preview-mp` at the end

If the user types `/comp-voice:compose-mp` with no args, ask once: "Audio file path or paste transcript? Also: pair with internal-comms update? HTML preview?"

## Pipeline (run in this order)

### 1. Load run config

Generate a `run_id` = `mp-$(date +%Y%m%d-%H%M%S)`. Create `.judge/$run_id/` for evidence.

Read `.claude/comp-voice.local.md` if present. Expected frontmatter keys (all optional):

```yaml
wechat_archive: ~/comp-voice/wechat-archive   # folder of past 公众号 .md as style corpus
feishu_export:  ~/comp-voice/feishu-export    # folder of recent Feishu doc/chat exports
brand_voice:    "热情但克制，技术细节要准，避免口号"
default_length: 2500
```

If the file is missing, fall back to defaults (no corpus, no feishu folder, neutral voice, 2500字). Do not error.

### 2. Acquire transcript

Three cases:

- **Arg is a readable audio file path** → invoke the `transcribe-audio` skill (auto-routed by description) on that path. Save transcript to `.judge/$run_id/transcript.txt`.
- **Arg is literal "paste"** → tell the user "Paste the transcript now, then send" and wait for next turn. Save the pasted text to `.judge/$run_id/transcript.txt`.
- **Arg is missing** → ask once which mode.

Never invent transcript content. If transcription fails, surface the error and stop.

### 3. Gather enterprise context

Run these in **parallel** (independent calls in one message). Use the **upstream** slash name if loaded, else fall back to the **vendored** copy bundled in this plugin:

1. Enterprise search — prefer `/enterprise-search:search`, fallback `/comp-voice:vendored-enterprise-search`. Query derived from transcript's main topic. Save to `.judge/$run_id/enterprise.md`.
2. Slack search — prefer `/slack:slack-search`, fallback `/comp-voice:vendored-slack-search`. Use only if Slack-specific channels are mentioned. Save to `.judge/$run_id/slack.md`.
3. Glob `$wechat_archive/*.md` if configured. Read up to 5 most recent. Save concatenated to `.judge/$run_id/mp-corpus.md` — used for **style** and **topic-dedup** (don't rewrite something already published).
4. Glob `$feishu_export/*.md` if configured. Read all. Save to `.judge/$run_id/feishu.md`.

If enterprise search returns "no MCP sources connected", continue without enterprise context — do not block. Note the gap in the judge JSON.

### 4. Ask the user for pasted Feishu content (only if not in folder)

If `$feishu_export` is not configured and the topic clearly involves Feishu discussions (e.g., user mentions 飞书 / Feishu in transcript), ask once: "粘贴相关飞书讨论/文档内容，或回复 'skip' 跳过". Save to `.judge/$run_id/feishu-pasted.md`.

Do not loop. One ask, then proceed.

### 5. Synthesize

Read all gathered evidence files. Produce `.judge/$run_id/synthesis.md` with sections:

- `## 核心主题` — single-sentence thesis the article will argue
- `## 关键事实` — bulleted facts cited from sources, each tagged `[transcript]` / `[enterprise]` / `[slack]` / `[feishu]`
- `## 角度与冲突` — what tensions / surprising contrasts emerge
- `## 已发布过的相关题目` — from mp-corpus, listing topics to avoid re-treading
- `## 缺口` — what's missing and would need user clarification (do not invent)

If `## 核心主题` is empty (transcript was too thin), stop and report the gap. Do not draft from a vacuum.

### 6. Draft the 公众号 article

Load `references/wechat-mp-style.md` for the voice/structure rules.

Write the draft to `.judge/$run_id/draft.md` with this exact structure:

```markdown
# {标题 — 12-22字, 钩子型}

> {副标题 / 一句话摘要 — 30-50字}

## 引言
{100-300字, 钩子段, 制造痛点或意外}

## 正文 §1 — {小标题}
{300-600字}

## 正文 §2 — {小标题}
{300-600字}

## 正文 §3 — {小标题, 可选}
{300-600字}

## 结语
{100-200字, 行动号召或反思}

---

**配图建议**
- 封面: {图片 prompt 描述}
- §1: {图片 prompt 描述}
- §2: {图片 prompt 描述}
```

Target length: `$default_length` ± 20%. Honor `$brand_voice`. Cite no source attribution markers in the body (公众号 readers don't want `[1]` references) — keep facts grounded in the synthesis.

### 7. Optional: internal-comms version

If `--with-internal-update` was passed, after the draft, invoke internal-comms — prefer `/internal-comms`, fallback `/comp-voice:vendored-internal-comms`. Frame it as:

> "Write a 3P-update style internal note summarizing the same topic for English-speaking colleagues. Source: the transcript and synthesis in `.judge/$run_id/`. Length: ~250 words."

Save to `.judge/$run_id/internal.md`.

### 8. Optional: HTML preview

If `--preview-html` was passed, invoke the `preview-mp` skill (auto-routed) with the draft file path. It will call `/talk-html` to render and publish.

### 9. Emit judge.json

Write `.judge/$run_id/judge.json` (machine-readable, for a 3rd-party LLM judge):

```json
{
  "run_id": "mp-20260515-141200",
  "exit_code": 0,
  "metrics": {
    "transcript_chars": 12453,
    "sources_found": {
      "enterprise": 4,
      "slack": 7,
      "feishu": 2,
      "mp_corpus": 5
    },
    "draft_word_count_cn": 2487,
    "sections_present": ["引言", "正文 §1", "正文 §2", "正文 §3", "结语"],
    "missing_sections": [],
    "image_prompts": 4,
    "internal_update_generated": false,
    "html_preview_generated": false
  },
  "evidence_dir": ".judge/mp-20260515-141200/",
  "stdout_path": ".judge/mp-20260515-141200/draft.md"
}
```

The user's CLAUDE.md mandates: **the code does not evaluate itself**. The judge JSON is for a separate LLM to read and rate. Do not write a "looks good!" verdict in this skill. Just emit facts.

### 10. Final output to user

Tell the user in 3-5 lines:

- Draft path: `.judge/$run_id/draft.md`
- Word count, sections, image-prompt count
- What was used (transcript chars, enterprise hits, slack hits, feishu pasted/folder, mp-corpus hits)
- Any gaps from the `## 缺口` section that need their attention
- If `--preview-html`: the gist URL from preview-mp

Do not summarize the article content itself — the user can read the file.

## Hard rules

- **Never** fabricate transcript content. If transcription fails or transcript is empty, stop.
- **Never** invent Slack messages, Feishu quotes, or enterprise-search hits. Cite only what the gather step actually returned.
- **Never** ship a draft that re-treads a topic listed in `## 已发布过的相关题目` without explicitly asking the user first.
- **Always** write to `.judge/$run_id/` — these files are the evidence trail.
- **Always** keep the SKILL.md instructions FOR Claude. The user only sees the final 3-5 line summary in step 10.

## Related skills (do not re-implement)

Own: `transcribe-audio` (audio glue), `preview-mp` (wraps `/talk-html`). Delegated — prefer upstream, fallback vendored (`/comp-voice:vendored-*`): enterprise-search:search · slack:slack-search · internal-comms · marketing:draft-content. See `skills/VENDORED.md` for full attribution table. Also useful if loaded: `/enterprise-search:knowledge-synthesis`, `/talk-html`.

## References

- `references/wechat-mp-style.md` — voice, structure, length, image-prompt slots
- `references/pipeline-flow.md` — full data-flow diagram
- `references/judge-criteria.md` — what a 3rd-party LLM judge should check in judge.json + draft.md
- `examples/full-run.md` — annotated worked example
