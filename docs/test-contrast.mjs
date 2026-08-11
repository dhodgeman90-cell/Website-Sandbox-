// Self-check for muted-text contrast (WCAG 1.4.3, AA).
//
// Run:  node "docs/test-contrast.mjs"
//
// --color-foreground-muted is the scheme foreground drawn at reduced opacity over the
// scheme background (snippets/color-schemes.liquid). At the original 60% it composited
// to 3.5:1 in the footer/filters/sorting UI, which fails AA for text under 24px.
//
// This reads the live opacity out of color-schemes.liquid and the real scheme colors out
// of config/settings_data.json, so it fails if either is changed back.

import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const stripJsonComments = (s) => s.replace(/^\s*\/\*[\s\S]*?\*\//, '');

// --- which opacity token does --color-foreground-muted use, and what is it worth? ---
const schemesLiquid = read('snippets/color-schemes.liquid');
const tokenMatch = schemesLiquid.match(
  /--color-foreground-muted:\s*rgb\(var\(--color-foreground-rgb\)\s*\/\s*var\(--opacity-(\d+)\)\)/
);
assert.ok(tokenMatch, '--color-foreground-muted is no longer defined as an opacity of the foreground');
const step = tokenMatch[1];

const varsLiquid = read('snippets/theme-styles-variables.liquid');
const opacityMatch = varsLiquid.match(new RegExp(`--opacity-${step}:\\s*([\\d.]+)`));
assert.ok(opacityMatch, `--opacity-${step} is not defined in theme-styles-variables.liquid`);
const alpha = Number(opacityMatch[1]);

// --- colour maths ---
const hex = (h) => {
  const s = h.replace('#', '');
  const full = s.length === 3 ? [...s].map((c) => c + c).join('') : s.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const lum = (rgb) =>
  rgb
    .map((v) => v / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((a, c, i) => a + [0.2126, 0.7152, 0.0722][i] * c, 0);
const over = (fg, bg, a) => fg.map((c, i) => c * a + bg[i] * (1 - a));
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// --- check every opaque scheme ---
const settings = JSON.parse(stripJsonComments(read('config/settings_data.json')));
const schemes = settings.current.color_schemes;

const MIN = 4.5; // AA, text smaller than 24px / 18.66px bold — the footer runs at 12px
let checked = 0;
const rows = [];

for (const [id, def] of Object.entries(schemes)) {
  const { background, foreground } = def.settings ?? {};
  // Skip transparent/overlay schemes — their real backdrop is whatever sits behind them.
  if (!background || !foreground || background.startsWith('rgba') || background.length > 7) continue;
  if (foreground.length > 7) continue; // foreground carries its own alpha; out of scope here

  const bg = hex(background);
  const composited = over(hex(foreground), bg, alpha);
  const r = ratio(composited, bg);
  rows.push({ id, background, foreground, ratio: r.toFixed(2), pass: r >= MIN });
  checked++;
}

assert.ok(checked >= 3, `expected to check several schemes, only checked ${checked}`);
console.table(rows);

const failing = rows.filter((r) => !r.pass);
assert.equal(
  failing.length,
  0,
  `muted text fails WCAG AA (${MIN}:1) in: ${failing.map((f) => `${f.id} @ ${f.ratio}:1`).join(', ')}`
);

console.log(`ok — muted text at --opacity-${step} (${alpha}) passes ${MIN}:1 in all ${checked} opaque schemes`);

// ---------------------------------------------------------------------------
// Part 2: the configurator sections hardcode their own colours against a fixed
// #1c1c1c panel, so the colour-scheme tokens above do not protect them.
// .cab-atc-note shipped at #555 (2.29:1) until 2026-08-10.
// ---------------------------------------------------------------------------
const PANEL_BG = '#1c1c1c';
const SECTIONS = ['sections/cabinet-configurator.liquid', 'sections/cabinet-configurator-3d.liquid'];
const RULES = ['.cab-atc-note', '.cab-spec-row dt', '.cab-option-label'];

const bad = [];
let looked = 0;

for (const file of SECTIONS) {
  const css = read(file);
  for (const rule of RULES) {
    // Grab the colour declared inside this rule block.
    const re = new RegExp(rule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\{[^}]*?color:\\s*(#[0-9a-fA-F]{3,6})', 's');
    const m = css.match(re);
    if (!m) continue;
    looked++;
    const r = ratio(hex(m[1]), hex(PANEL_BG));
    if (r < MIN) bad.push(`${file} ${rule} ${m[1]} = ${r.toFixed(2)}:1`);
  }
}

assert.ok(looked >= 3, `expected to find several hardcoded colours, found ${looked}`);
assert.equal(bad.length, 0, `configurator text fails WCAG AA on ${PANEL_BG}:\n  ${bad.join('\n  ')}`);
console.log(`ok — ${looked} hardcoded configurator colours all pass ${MIN}:1 on ${PANEL_BG}`);

// ---------------------------------------------------------------------------
// Part 3: a <dl> may only contain <dt>, <dd>, or a <div> wrapping a dt/dd pair.
// A bare <div class="cab-spec-subhead"> inside the list broke this (WCAG 1.3.1).
// ---------------------------------------------------------------------------
// Checked line-by-line rather than by parsing HTML with a regex: walk the file, track
// whether we are inside a <dl>, and flag any single-line <div>...</div> in that region
// that carries no <dt>. That is exactly the shape of the bug that shipped.
let dlLinesChecked = 0;
for (const file of SECTIONS.concat('sections/cem-cabinet-configurator.liquid')) {
  let src;
  try { src = read(file); } catch { continue; }
  // Strip Liquid comments first — prose about <dl>/<div> would otherwise trip the scan.
  src = src.replace(/\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}/g, '');
  let depth = 0;
  for (const line of src.split('\n')) {
    const opens = (line.match(/<dl[\s>]/g) ?? []).length;
    const closes = (line.match(/<\/dl>/g) ?? []).length;
    if (depth > 0 && /<div[\s>]/.test(line)) {
      dlLinesChecked++;
      assert.ok(
        /<dt[\s>]/.test(line),
        `${file}: "${line.trim().slice(0, 60)}" is a bare <div> inside <dl> — invalid, breaks screen-reader list semantics`
      );
    }
    depth += opens - closes;
  }
}
assert.ok(dlLinesChecked >= 6, `expected to inspect several <dl> rows, inspected ${dlLinesChecked}`);
console.log(`ok — all ${dlLinesChecked} <div> rows inside a <dl> carry a <dt>`);
