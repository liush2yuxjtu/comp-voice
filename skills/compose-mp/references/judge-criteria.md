# Judge criteria — what a 3rd-party LLM should check

This file is **not** consumed by `compose-mp` itself. It is documentation for the human user (or for a separate evaluator LLM) explaining what `.judge/$run_id/judge.json` + `draft.md` should be rated against.

Per the user's `testing-judge-harness` rule: **the code that produced the draft must not also evaluate it**. Feed `judge.json` + `draft.md` to a separate LLM (Claude Haiku via `claudefast -p`, or a different session) with these criteria.

## Tier 1 — pipeline integrity (deterministic checks, can be scripted)

| Check | Pass condition | Where to read |
|---|---|---|
| transcript present | `metrics.transcript_chars > 200` | judge.json |
| sources gathered | `sum(sources_found.values()) >= 1` (something was pulled) | judge.json |
| all sections present | `len(missing_sections) == 0` | judge.json |
| word count in band | `2000 ≤ draft_word_count_cn ≤ 3500` (unless user overrode) | judge.json |
| image prompts present | `image_prompts >= 4` | judge.json |
| evidence files exist | every file in `pipeline-flow.md` "Evidence directory layout" is present (or marked optional and skipped legitimately) | filesystem |

## Tier 2 — draft quality (LLM judge required)

The judge LLM reads `draft.md` and rates 0-10 on each:

1. **钩子强度 (0-10)** — does the first 100 字 make a phone-screen reader keep scrolling?
2. **论点清晰度 (0-10)** — can you state the article's thesis in one sentence after reading?
3. **证据落地 (0-10)** — are claims grounded in specific examples / facts (not generic "在 ____ 上, 我们看到了")?
4. **公众号声音 (0-10)** — does it read like a human 公众号 writer, or like translated English / AI slop?
5. **结构节奏 (0-10)** — paragraphs ≤ 80 字? short-sentence rhythm? 2-3 §s not 5?
6. **题目避撞 (0-10)** — does the intro acknowledge prior coverage of overlapping topics from `mp-corpus.md` if applicable?

**Pass threshold**: average ≥ 7, no single score < 5.

## Tier 3 — content correctness (cannot be auto-judged)

These need human eyes:

- Are factual claims correct? (LLM can hallucinate)
- Does the brand voice match the user's intent?
- Is the topic worth publishing at all? (LLM can polish bad ideas)
- Are image prompts safe/appropriate for the brand?

Surface in the final user summary that Tier 3 is the user's responsibility.

## How to invoke the judge

In a separate session or via Haiku:

```bash
claudefast -p "Read .judge/mp-20260515-141200/judge.json and .judge/mp-20260515-141200/draft.md.
Apply criteria from ~/projects/comp-voice/skills/compose-mp/references/judge-criteria.md.
Output JSON: {tier1_pass: bool, tier2_scores: {hook, thesis, evidence, voice, structure, dedup}, tier2_avg, tier2_min, overall_verdict: 'pass'|'fail'|'revise', notes: string}.
Do not rewrite the article. Do not invent facts. Just rate."
```

The output of this judge LLM is what determines ship/revise. `compose-mp` itself never decides.
