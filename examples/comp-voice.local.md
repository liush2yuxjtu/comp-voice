---
# Example .claude/comp-voice.local.md
#
# Copy this file to .claude/comp-voice.local.md in your project (NOT this plugin's repo),
# or to ~/.claude/comp-voice.local.md for a global default. The plugin's .gitignore
# ensures these never get committed.
#
# All keys are optional. Missing keys fall back to safe defaults.

# Folder of past 公众号 articles (.md files) used for style corpus + topic dedup
wechat_archive: ~/Documents/wechat-archive

# Folder of exported Feishu doc/chat markdown — read whenever topic mentions 飞书
feishu_export: ~/Documents/feishu-export

# Brand voice — passed to the drafting step. Be specific. Examples:
#   "热情但克制, 技术细节要准, 避免口号"
#   "对话感, 偏年轻读者, 多用比喻少用数据"
#   "严肃学术, 偏长句, 论点优先"
brand_voice: "诚实但不悲观, 偏技术读者, 避免心灵鸡汤"

# Default target length in 汉字 (will be honored ± 20%)
default_length: 2500
---

# comp-voice settings

This file is documentation only. The plugin reads only the YAML frontmatter above; the markdown body is for your own notes.

## What each setting does

- **wechat_archive** — If set and exists, compose-mp globs `*.md` here and uses the 5 most-recent files as (a) style corpus and (b) topic-dedup signal. Missing folder = silently skip.
- **feishu_export** — If set and the transcript topic involves Feishu, compose-mp globs `*.md` here. Missing folder = compose-mp will ask you to paste Feishu content inline instead.
- **brand_voice** — Free-form Chinese string. Injected verbatim into the drafting prompt. Be specific.
- **default_length** — Target word count (汉字). Compose-mp aims for ±20% of this.

## Per-project overrides

You can have project-specific settings by dropping this file at `.claude/comp-voice.local.md` inside any project directory. Project-level overrides any user-global file.
