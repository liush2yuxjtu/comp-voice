# Annotated example run

A worked example to show what compose-mp produces end-to-end. This file is reference only — not executed.

## Input

```
/comp-voice:compose-mp ~/Recordings/2026-05-14-team-retro.m4a --with-internal-update --preview-html
```

The recording: 23-minute team retro about why the Q1 ad-spend dashboard project shipped late.

## Settings (`.claude/comp-voice.local.md`)

```yaml
---
wechat_archive: ~/Documents/wechat-archive
feishu_export:  ~/Documents/feishu-export
brand_voice:    "诚实但不悲观, 偏技术读者, 避免心灵鸡汤"
default_length: 2500
---
```

## What compose-mp does

### Step 1 — run_id

```
run_id = mp-20260514-153022
mkdir -p .judge/mp-20260514-153022
```

### Step 2 — transcript

Calls `transcribe-audio` on the .m4a. It detects `mlx_whisper` on PATH, transcribes locally in 2 minutes, writes:

```
.judge/mp-20260514-153022/transcript.txt   (14,200 字)
```

### Step 3 — gather (in parallel)

Three calls fire at once:

- `/enterprise-search:search` with query "ad spend dashboard Q1 delay" → 6 hits in Notion (PRD, post-mortem doc, 2 retros), 2 in Atlassian (Jira tickets)
- `/slack:slack-search` with same query → 14 messages in `#data-platform`, `#growth-eng`
- Globs:
  - `~/Documents/wechat-archive/*.md` → 5 most recent past articles (one is about "数据看板项目延期常见原因", 2 weeks ago — **dedup signal**)
  - `~/Documents/feishu-export/*.md` → 0 files matching topic

Saved:
```
.judge/mp-20260514-153022/enterprise.md   (8 source excerpts)
.judge/mp-20260514-153022/slack.md        (14 messages)
.judge/mp-20260514-153022/mp-corpus.md    (5 articles)
.judge/mp-20260514-153022/feishu.md       (empty — no hits)
```

### Step 4 — Feishu paste

Topic doesn't mention 飞书. Skip.

### Step 5 — synthesize

Writes `.judge/.../synthesis.md`:

```markdown
## 核心主题
**数据看板项目延迟的真实根因不是技术债, 而是 PRD 阶段的需求模糊。** 这次 retro 的反直觉发现: 团队三个月里改了 11 次"什么算 'spend'", 每次都让前端重做。

## 关键事实
- 项目预期 6 周, 实际 13 周 [transcript]
- "spend" 定义改了 11 次 [transcript, slack:#data-platform-2026-04-12]
- 前端返工 4 次, 每次 ~1 周 [enterprise:retro-doc-page-3]
- PM 在第 7 周才引入 Looker 验证 [transcript, slack:#growth-eng-2026-04-20]
- post-mortem 列出 17 个 action item, 实际只跟进 3 个 [enterprise:postmortem-section-5]

## 角度与冲突
- 工程团队归咎于 PM 反复改需求
- PM 归咎于业务方对"广告花费"理解不一致
- 真实矛盾: **没人在第 1 周做"指标对齐 workshop"** —— 双方都假设对方理解

## 已发布过的相关题目
- mp-corpus 里 4 月 28 日发过《数据看板项目延期常见原因》—— 通用清单型, 这次可以从"指标对齐"这一个具体子题切入, 不会重复

## 缺口
- 不知道这个 retro 之后团队是否真的开了对齐 workshop, 需要用户补充结果
```

### Step 6 — draft

Reads `wechat-mp-style.md` rules. Writes `.judge/.../draft.md`:

```markdown
# 我们以为是工程延期, 结果发现连"花费"是什么都没对齐

> 一个 6 周项目拖到 13 周, 真正的瓶颈不在代码

## 引言
你有没有遇到过这种事 —— 一个看起来很清楚的项目, 做着做着所有人都开始问"等等, 我们到底在做什么"。

上个季度我们的广告花费数据看板就是这样。预期 6 周, 实际 13 周。post-mortem 的 17 条 action item 里, 真正决定结局的, 只有第 1 条没人愿意承认的事。

## 正文 §1 — 11 次定义变更

"spend" 这个词, 三个月里我们改了 11 次定义。
...

## 正文 §2 — 谁都没错, 但谁都错了
...

## 正文 §3 — 不是流程问题, 是开局问题
...

## 结语
项目延期的复盘, 我们习惯找"流程哪里漏了"。但有时候答案更朴素 —— 第一周的那个 workshop, 没人开。

那你的项目, 第一周开了吗?

---

**配图建议**
- 封面 (16:9): 一个会议室白板上写着 "spend = ?" 旁边贴满便利贴, 极简插画风, 主色 #1E40AF, 不要文字
- §1 (4:3): 11 张便利贴排成一列, 每张上面是 "spend" 的不同定义, 涂改痕迹
- §2 (4:3): 工程师和 PM 隔着一张桌子, 中间是一个"指标对齐"的问号
- §3 (4:3): 一个空会议室, 一张被画了一半的流程图
```

Word count: 2,487 字. ✓ in band.

### Step 7 — internal version

`--with-internal-update` was set, so invokes `/internal-comms` with the 3P-update flavor on the same source. Saves `.judge/.../internal.md`:

```markdown
## 3P Update — Q1 Ad-Spend Dashboard Retro

**Progress**: Shipped 7 weeks late. Underlying root cause identified in retro.

**Plans**: Run a "metric alignment workshop" template for the next 2 dashboard projects before any engineering work begins.

**Problems**: The 17-item post-mortem only had 3 followed up. Need a tighter retro→action pipeline.
```

### Step 8 — preview-html

`--preview-html` was set, so invokes `preview-mp` skill → calls `/talk-html` on `draft.md`. Result:

```
https://gist.github.com/.../comp-voice-mp-20260514-153022.html
```

URL saved to `.judge/.../preview-url.txt`.

### Step 9 — judge.json

```json
{
  "run_id": "mp-20260514-153022",
  "exit_code": 0,
  "metrics": {
    "transcript_chars": 14200,
    "sources_found": {
      "enterprise": 8,
      "slack": 14,
      "feishu": 0,
      "mp_corpus": 5
    },
    "draft_word_count_cn": 2487,
    "sections_present": ["引言", "正文 §1", "正文 §2", "正文 §3", "结语"],
    "missing_sections": [],
    "image_prompts": 4,
    "internal_update_generated": true,
    "html_preview_generated": true
  },
  "evidence_dir": ".judge/mp-20260514-153022/",
  "stdout_path": ".judge/mp-20260514-153022/draft.md"
}
```

### Step 10 — user-facing summary

```
✓ Draft: .judge/mp-20260514-153022/draft.md (2,487 字, 5 sections, 4 image prompts)
✓ Pulled: transcript 14,200字 · enterprise 8 hits · slack 14 msgs · mp-corpus 5 articles
✓ Internal update: .judge/mp-20260514-153022/internal.md
✓ HTML preview: https://gist.github.com/.../comp-voice-mp-20260514-153022.html

Gaps to fill yourself:
- Did the team actually run the alignment workshop after the retro? (mentioned in §3 — confirm before publishing)

To rate, run a separate judge:
  claudefast -p "..." (see references/judge-criteria.md)
```
