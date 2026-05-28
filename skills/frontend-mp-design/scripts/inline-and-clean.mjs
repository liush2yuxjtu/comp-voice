#!/usr/bin/env node
// inline-and-clean.mjs — make designed HTML survive the 微信公众号 editor paste.
//
//   node inline-and-clean.mjs <input.html> <output.html> [--sections]
//
// Steps: (1) inline all CSS with `juice` (programmatic if installed, else
// `npx --yes juice`), (2) strip everything the WeChat editor deletes on paste
// (<style>/<script>/<iframe>/<form>/<input>/<link>, id, on* handlers, banned
// inline CSS props), (3) optionally rewrite <div>→<section>, (4) audit images,
// (5) emit a machine-readable report to stdout AND clean-report.json.
//
// The producing code does not rate itself — feed clean-report.json to a
// separate LLM judge (see references/judge-criteria.md).

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const [input, output] = args.filter((a) => !a.startsWith('--'));

if (!input || !output) {
  console.error('usage: node inline-and-clean.mjs <input.html> <output.html> [--sections]');
  process.exit(2);
}

const raw = readFileSync(input, 'utf8');
const authoredStyleBlocks = (raw.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) || []).length;

// ---- 1. inline CSS via juice ------------------------------------------------
async function inline(html) {
  try {
    const juice = (await import('juice')).default;
    return { html: juice(html, { removeStyleTags: true }), via: 'juice(programmatic)' };
  } catch {
    const dir = mkdtempSync(join(tmpdir(), 'mpd-'));
    const tin = join(dir, 'in.html');
    const tout = join(dir, 'out.html');
    writeFileSync(tin, html);
    const r = spawnSync('npx', ['--yes', 'juice', tin, tout], { encoding: 'utf8' });
    if (r.status !== 0) {
      rmSync(dir, { recursive: true, force: true });
      console.error(
        JSON.stringify(
          { exit_code: 3, error: 'juice unavailable (no local install and `npx --yes juice` failed — check network)', stderr: (r.stderr || '').slice(0, 400) },
          null, 2
        )
      );
      process.exit(3);
    }
    const out = readFileSync(tout, 'utf8');
    rmSync(dir, { recursive: true, force: true });
    return { html: out, via: 'npx juice' };
  }
}

// ---- 2. clean ---------------------------------------------------------------
const BANNED_PROP = (p) =>
  ['position', 'z-index', 'float'].includes(p) ||
  /^(-webkit-)?(animation|transition)/.test(p);

let bannedPropsRemoved = 0;
function scrubStyleAttr(html) {
  return html.replace(/style=("|')([\s\S]*?)\1/gi, (m, q, body) => {
    const kept = body
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .filter((d) => {
        const prop = d.split(':')[0].trim().toLowerCase();
        if (BANNED_PROP(prop)) { bannedPropsRemoved++; return false; }
        return true;
      });
    return `style=${q}${kept.join('; ')}${kept.length ? ';' : ''}${q}`;
  });
}

const removed = { style_blocks: 0, script: 0, iframe: 0, form: 0, input: 0, link: 0, object: 0, embed: 0, noscript: 0, id_attrs: 0, event_handlers: 0 };

const { html: inlined, via } = await inline(raw);
let html = inlined;
const drop = (re, key) => {
  html = html.replace(re, () => { removed[key]++; return ''; });
};

drop(/<style\b[^>]*>[\s\S]*?<\/style>/gi, 'style_blocks');
drop(/<script\b[^>]*>[\s\S]*?<\/script>/gi, 'script');
drop(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, 'noscript');
drop(/<iframe\b[\s\S]*?<\/iframe>/gi, 'iframe');
drop(/<iframe\b[^>]*\/?>/gi, 'iframe');
drop(/<form\b[\s\S]*?<\/form>/gi, 'form');
drop(/<object\b[\s\S]*?<\/object>/gi, 'object');
drop(/<input\b[^>]*\/?>/gi, 'input');
drop(/<embed\b[^>]*\/?>/gi, 'embed');
drop(/<link\b[^>]*>/gi, 'link');
html = html.replace(/\sid=("|')[\s\S]*?\1/gi, () => { removed.id_attrs++; return ''; });
html = html.replace(/\son[a-z]+=("|')[\s\S]*?\1/gi, () => { removed.event_handlers++; return ''; });
html = scrubStyleAttr(html);

// ---- 3. optional div→section ------------------------------------------------
let divConverted = 0;
if (flags.has('--sections')) {
  html = html
    .replace(/<div(\s|>)/gi, (m, t) => { divConverted++; return `<section${t}`; })
    .replace(/<\/div>/gi, '</section>');
}

// ---- 4. image audit ---------------------------------------------------------
const imgs = html.match(/<img\b[^>]*>/gi) || [];
const images = { total: imgs.length, base64: 0, mmbiz: 0, non_mmbiz: 0, no_src: 0 };
for (const tag of imgs) {
  const m = tag.match(/\bsrc=("|')([\s\S]*?)\1/i);
  if (!m) { images.no_src++; continue; }
  const src = m[2];
  if (/^data:/i.test(src)) images.base64++;
  else if (/mmbiz\.qpic\.cn/i.test(src)) images.mmbiz++;
  else images.non_mmbiz++;
}

// ---- 5. residual scan (post-clean; should all be 0) -------------------------
const residual = {
  style_blocks: (html.match(/<style\b/gi) || []).length,
  id_attrs: (html.match(/\sid=("|')/gi) || []).length,
  event_handlers: (html.match(/\son[a-z]+=("|')/gi) || []).length,
  script: (html.match(/<script\b/gi) || []).length,
  iframe: (html.match(/<iframe\b/gi) || []).length,
  form: (html.match(/<form\b/gi) || []).length,
  input: (html.match(/<input\b/gi) || []).length,
  div_tags: (html.match(/<div\b/gi) || []).length,
  banned_css_props: 0,
};
for (const m of html.matchAll(/style=("|')([\s\S]*?)\1/gi)) {
  for (const d of m[2].split(';')) {
    const prop = d.split(':')[0].trim().toLowerCase();
    if (prop && BANNED_PROP(prop)) residual.banned_css_props++;
  }
}

const inlinedStyleAttrs = (html.match(/style=("|')/gi) || []).length;

writeFileSync(output, html);

const report = {
  run: { input, output, sections_mode: flags.has('--sections'), inliner: via },
  exit_code: 0,
  metrics: {
    authored_style_blocks: authoredStyleBlocks,
    inlined_style_attrs: inlinedStyleAttrs,
    removed: { ...removed, banned_css_props: bannedPropsRemoved, div_converted: divConverted },
    residual,
    images,
  },
  paste_safe:
    residual.style_blocks === 0 && residual.id_attrs === 0 && residual.event_handlers === 0 &&
    residual.script === 0 && residual.iframe === 0 && residual.form === 0 && residual.input === 0 &&
    residual.banned_css_props === 0 && images.base64 === 0 &&
    (!flags.has('--sections') || residual.div_tags === 0),
  action_items: [
    ...(images.non_mmbiz ? [`${images.non_mmbiz} 张图非 mmbiz 域名 — 先传公众号素材库再替换 src`] : []),
    ...(images.base64 ? [`${images.base64} 张 base64 图会被删 — 必须改为素材库 URL`] : []),
    ...(images.total === 0 ? ['无图片 — 公众号至少需要 1 张 16:9 封面'] : []),
  ],
};

const reportPath = join(dirname(output), 'clean-report.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
