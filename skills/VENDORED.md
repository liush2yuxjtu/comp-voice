# Vendored skills — attribution & provenance

comp-voice ships verbatim copies of four upstream skills so the pipeline works without requiring the upstream plugins to be installed. The body of every vendored SKILL.md is **unmodified** from upstream. Only the YAML frontmatter was adjusted to (a) match the new directory name (loader requirement) and (b) note vendoring + fallback semantics. License files are preserved alongside each copy.

## What's vendored

| Vendored copy | Upstream source | Upstream version | License path |
|---|---|---|---|
| `vendored-enterprise-search/SKILL.md` | `knowledge-work-plugins/enterprise-search` → `skills/search/SKILL.md` | 1.2.0 | `vendored-enterprise-search/LICENSE` |
| `vendored-internal-comms/SKILL.md` (+ `examples/*.md`) | user-level skill at `~/.claude/skills/internal-comms/` | — | `vendored-internal-comms/LICENSE.txt` |
| `vendored-slack-search/SKILL.md` | `claude-plugins-official/slack` → `skills/slack-search/SKILL.md` | 1.0.0 | `vendored-slack-search/LICENSE` |
| `vendored-draft-content/SKILL.md` | `knowledge-work-plugins/marketing` → `skills/draft-content/SKILL.md` | 1.2.0 | `vendored-draft-content/LICENSE` |

The shared `CONNECTORS.md` (referenced by `vendored-enterprise-search` and `vendored-draft-content` via `../../CONNECTORS.md`) lives at the repo root: `comp-voice/CONNECTORS.md`. It was copied from the enterprise-search 1.2.0 plugin root.

## How compose-mp uses them

`skills/compose-mp/SKILL.md` invokes each as **"prefer upstream, fallback vendored"**:

```
prefer:    /enterprise-search:search        fallback:  /comp-voice:vendored-enterprise-search
prefer:    /slack:slack-search              fallback:  /comp-voice:vendored-slack-search
prefer:    /internal-comms                  fallback:  /comp-voice:vendored-internal-comms
prefer:    /marketing:draft-content         fallback:  /comp-voice:vendored-draft-content
```

If the user has the upstream plugin loaded, Claude routes to that one (better-maintained, newer triggers). If not, the vendored copy answers. Either way, compose-mp doesn't break.

## Trigger overlap

When both upstream and vendored copies are loaded, Claude's skill router will see two skills with similar descriptions. The vendored descriptions explicitly say "If the upstream … is also installed, prefer that one" — Claude reads this and routes accordingly. In practice the upstream version usually has a sharper, more recent description, so it wins on relevance ranking too.

If you find vendored copies firing on prompts that should hit upstream, narrow the vendored descriptions further (add "only via /comp-voice:" prefix to the trigger phrases).

## Updating vendored copies

Vendored copies do not auto-update. When upstream releases a new version, re-vendor:

```bash
# enterprise-search:search
cp ~/.claude/plugins/cache/knowledge-work-plugins/enterprise-search/<ver>/skills/search/SKILL.md \
   skills/vendored-enterprise-search/SKILL.md
# re-apply the frontmatter banner: name + 'Vendored copy of …' description + HTML comment

# internal-comms
cp ~/.claude/skills/internal-comms/SKILL.md skills/vendored-internal-comms/SKILL.md
cp ~/.claude/skills/internal-comms/examples/*.md skills/vendored-internal-comms/examples/
# re-apply banner

# slack-search
cp ~/.claude/plugins/cache/claude-plugins-official/slack/<ver>/skills/slack-search/SKILL.md \
   skills/vendored-slack-search/SKILL.md
# re-apply banner

# draft-content
cp ~/.claude/plugins/cache/knowledge-work-plugins/marketing/<ver>/skills/draft-content/SKILL.md \
   skills/vendored-draft-content/SKILL.md
# re-apply banner

# also refresh CONNECTORS.md if upstream changed
cp ~/.claude/plugins/cache/knowledge-work-plugins/enterprise-search/<ver>/CONNECTORS.md ./CONNECTORS.md
```

Banner template to re-apply after each `cp`:

```yaml
---
name: vendored-<dir-name>
description: <upstream description verbatim> Vendored copy of the upstream `<original/slash>` skill — comp-voice's compose-mp pipeline calls this in step <N>. If the upstream `/<original>` is also installed, prefer that one.
<other upstream frontmatter keys verbatim>
---

<!-- VENDORED COPY — body verbatim from upstream.
     Source: <upstream-path>
     License: see ./<LICENSE-filename> in this directory
     Vendored into comp-voice on <date>. -->
```

## Licenses

Each upstream's license file is preserved alongside the vendored copy. Read them — they govern redistribution of that skill's content. comp-voice's own code is independent of those licenses.

- `vendored-enterprise-search/LICENSE` — enterprise-search 1.2.0 license
- `vendored-internal-comms/LICENSE.txt` — internal-comms upstream license
- `vendored-slack-search/LICENSE` — slack plugin 1.0.0 license
- `vendored-draft-content/LICENSE` — marketing plugin 1.2.0 license
