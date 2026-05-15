# compose-mp pipeline flow

```
                  /comp-voice:compose-mp [audio|paste] [--with-internal-update] [--preview-html]
                                            │
                                            ▼
                              ┌─────────────────────────┐
                              │ 1. Load .claude/         │
                              │    comp-voice.local.md   │
                              │    → wechat_archive,     │
                              │      feishu_export,      │
                              │      brand_voice,        │
                              │      default_length      │
                              └────────────┬─────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │ 2. Acquire transcript    │
                              │                         │
                              │   audio path?  ─► transcribe-audio skill
                              │   "paste"?     ─► wait for next user turn
                              │   missing?     ─► ask once                │
                              │                                          │
                              │   → .judge/$run_id/transcript.txt        │
                              └────────────┬─────────────────────────────┘
                                           │
                ┌──────────────────────────┼──────────────────────────────┐
                │                          │                              │
                ▼                          ▼                              ▼
    ┌─────────────────────┐    ┌─────────────────────┐         ┌────────────────────┐
    │ 3a. enterprise-     │    │ 3b. slack-search    │         │ 3c. globs:         │
    │     search:search   │    │     (if Slack-y)    │         │   wechat_archive/  │
    │   → enterprise.md   │    │   → slack.md        │         │   feishu_export/   │
    └──────────┬──────────┘    └──────────┬──────────┘         │ → mp-corpus.md     │
               │                          │                     │ → feishu.md        │
               │                          │                     └──────────┬─────────┘
               └──────────────────────────┼────────────────────────────────┘
                                          │
                                          ▼
                              ┌─────────────────────────┐
                              │ 4. Feishu paste prompt   │
                              │    (only if no folder    │
                              │     AND topic involves   │
                              │     Feishu)              │
                              │  → feishu-pasted.md      │
                              └────────────┬─────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │ 5. Synthesize            │
                              │   → synthesis.md         │
                              │   - 核心主题             │
                              │   - 关键事实 (tagged)    │
                              │   - 角度与冲突           │
                              │   - 已发布过的相关题目   │
                              │   - 缺口                 │
                              └────────────┬─────────────┘
                                           │
                                           ▼
                              ┌─────────────────────────┐
                              │ 6. Draft 公众号 article  │
                              │    (load                 │
                              │    wechat-mp-style.md)   │
                              │   → draft.md             │
                              └────────────┬─────────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
   --with-internal-update?           --preview-html?                    │
              │                            │                            │
              ▼                            ▼                            ▼
   ┌─────────────────────┐    ┌─────────────────────┐         ┌────────────────────┐
   │ 7. /internal-comms  │    │ 8. preview-mp skill │         │ 9. emit judge.json │
   │   → internal.md     │    │   → /talk-html      │         │ (machine-readable) │
   │                     │    │   → gist URL        │         │                    │
   └─────────────────────┘    └─────────────────────┘         └────────────────────┘
                                                                       │
                                                                       ▼
                                                          ┌────────────────────┐
                                                          │ 10. 3-5 line user  │
                                                          │     summary        │
                                                          └────────────────────┘
```

## Evidence directory layout

```
.judge/mp-20260515-141200/
├── transcript.txt           # step 2
├── enterprise.md            # step 3a (may be absent)
├── slack.md                 # step 3b (may be absent)
├── mp-corpus.md             # step 3c (may be absent)
├── feishu.md                # step 3c (may be absent)
├── feishu-pasted.md         # step 4 (may be absent)
├── synthesis.md             # step 5
├── draft.md                 # step 6 ← the primary artifact
├── internal.md              # step 7 (only with --with-internal-update)
├── preview-url.txt          # step 8 (only with --preview-html)
└── judge.json               # step 9 ← the verdict input for 3rd-party LLM judge
```

Every file is regenerable by re-running compose-mp on the same transcript. `.judge/` is gitignored.
