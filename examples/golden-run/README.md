# Golden run — what `compose-mp` actually produces

A complete, hand-curated example of every artifact the comp-voice pipeline
writes to disk. Use this folder when:

- You want to see the **shape** of compose-mp output before installing anything.
- You are wiring up a third-party LLM judge and need a fixture to test against.
- You are reviewing the project and want to know what "evidence trail" means
  in practice.

## Scenario

A 5-minute internal meeting clip between two engineers (`小韦`, `阿亮`) about
why they rolled out Anthropic prompt caching and what it cost / saved. They
agreed to write it up as a 微信公众号 article. comp-voice took the recording
plus their company's existing context (Notion, Confluence, Slack, past public
posts) and produced the artifacts in this folder.

> **This is not a live run.** The transcript is hand-written to model a
> plausible 30-min discussion. The enterprise/slack hits are hand-written
> to model what those MCP servers would have returned. The `judge.json` is
> structurally identical to what `compose-mp` emits on real runs. See the
> `notes` field inside `judge.json`.

## Evidence tree

```text
examples/golden-run/
├── input-transcript.txt   ← what transcribe-audio produces
├── enterprise.md          ← what enterprise-search returns (4 hits)
├── slack.md               ← what slack-search returns (6 messages, 3 channels)
├── synthesis.md           ← compose-mp's "think before drafting" stage
├── draft.md               ← the final 公众号 markdown draft
├── preview.html           ← talk-html rendered preview (open in browser)
├── preview-url.txt        ← where a real run would publish the preview
├── judge.json             ← machine-readable evidence record for LLM judge
└── README.md              ← this file
```

## Quick tour

| Stage | File | What to look for |
|---|---|---|
| 1. Transcribe | `input-transcript.txt` | Timestamped speaker turns, raw. |
| 2. Pull enterprise context | `enterprise.md` | 4 hits, each with author / date / excerpt / **how this hit gets used downstream**. |
| 3. Pull Slack context | `slack.md` | 6 messages across `#eng-llm` / `#cost-watch` / `#content-内容池`. |
| 4. Synthesize | `synthesis.md` | Angle, data anchors, 7-section structure, image slots, compliance checklist, skip list. |
| 5. Draft | `draft.md` | The actual 2389-token 公众号 draft. |
| 6. Preview | `preview.html` | What the draft looks like rendered in a 公众号-style frame. |
| 7. Judge | `judge.json` | Exit code, metrics, cross-source grounding map, tier 1/2/3 verdicts. |

## How a third-party judge would use this

```bash
# Pretend we just ran compose-mp on a real recording.
RUN_DIR=examples/golden-run

# Give the raw JSON + draft to a separate LLM. It is NOT allowed to "vibe-check"
# — it only reads files on disk and reports.
claude -p "Read $RUN_DIR/judge.json and $RUN_DIR/draft.md. \
Verify: (a) every metric in judge.json is consistent with the draft, \
(b) every claim in tier_2 sections_present actually exists in draft.md, \
(c) any tier_3 deferred items are genuinely outside what an LLM can verify \
without external sources. Return JSON: {pass: bool, findings: [...]}"
```

The point is: comp-voice never grades itself. It dumps a record so something
else can.

## What's deliberately *not* here

- A real audio file. We don't ship 5 MB of voice data in the repo.
- A real gist URL in `preview-url.txt`. The static HTML file is what reviewers
  open.
- Anything customer-identifying. The "我们的一个企业客户" phrasing in the
  draft is the same phrasing the synthesis compliance check enforces.

## Re-running this end-to-end

Once you have comp-voice installed:

```bash
/comp-voice:compose-mp <your-audio>.m4a --preview-html --emit-judge
```

The output will land in `.judge/mp-<timestamp>/` with the same file shapes as
this folder.
