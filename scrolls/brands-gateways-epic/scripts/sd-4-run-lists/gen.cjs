#!/usr/bin/env node
// SD-4: writes the run lists that bigbang/run-all.sh reads, into tmp/lists/.
// Inputs: items/b-brand-decisions.md (tables 2.2, 2.4, 2.6, 2.8) and the B-1 census CSV tmp/brand-census/standalone-brands.csv.
// The decision file decides which brand goes in which wave. The CSV only supplies the contract const name.
// Output is sorted by fanOut (largest first), then by brand name, so a rerun writes identical bytes.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const DECISIONS = path.join(ROOT, 'scrolls/brands-gateways-epic/items/b-brand-decisions.md');
const CSV = path.join(ROOT, 'tmp/brand-census/standalone-brands.csv');
const OUT = path.join(ROOT, 'tmp/lists');
const W5_TRIALS = ['SymbolName', 'RelPath', 'FilePath', 'LineNumber', 'TypeText'];
const W5_SKIPPED = { ContentHash: 'its regex check would be dropped, and W5 runs without --allow-drop-validation' };

const lines = fs.readFileSync(DECISIONS, 'utf8').split('\n');

const section = (from, to) => {
  const a = lines.findIndex((l) => l.startsWith(from));
  const b = lines.findIndex((l, i) => i > a && l.startsWith(to));
  if (a < 0 || b < 0) throw new Error(`decision file: no section ${from} .. ${to}`);
  return lines.slice(a, b);
};

const rows = (sec) => {
  const t = sec.filter((l) => l.startsWith('|'));
  if (t.length < 2) return [];
  const cells = (l) => l.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  const head = cells(t[0]);
  return t.slice(2).map((l) => {
    const c = cells(l);
    if (c.length !== head.length) throw new Error(`column count ${c.length} != ${head.length}: ${l.slice(0, 80)}`);
    return Object.fromEntries(head.map((h, i) => [h, c[i]]));
  });
};

const csvRows = () => {
  const [h, ...rest] = fs.readFileSync(CSV, 'utf8').trim().split('\n');
  const head = h.split(',');
  return rest.map((l) => {
    const c = l.match(/("[^"]*"|[^,]*)(,|$)/g).map((x) => x.replace(/,$/, '').replace(/^"|"$/g, ''));
    return Object.fromEntries(head.map((k, i) => [k, c[i]]));
  });
};

const census = csvRows();
const find = (pkg, brand) => {
  const r = census.find((x) => x.pkg === pkg && x.brand === brand);
  if (!r) throw new Error(`census has no ${pkg} ${brand}`);
  if (!fs.existsSync(path.join(ROOT, r.file))) throw new Error(`file missing: ${r.file}`);
  return r;
};
const sortRows = (a, b) => b.fanOut - a.fanOut || (a.brand < b.brand ? -1 : 1);

const plain = rows(section('#### 2.8', '### Item 3')).filter((r) => r['W1 verdict'] === 'plain')
  .map((r) => ({ ...r, ...find(r.pkg, r.brand), fanOut: Number(r.fanOut) }));
const value = rows(section('#### 2.6', '#### 2.7'))
  .map((r) => ({ ...r, ...find(r.pkg, r.brand), fanOut: Number(r.fanOut) }));
const ownerless = rows(section('#### 2.4', '#### 2.5'));
const owned = rows(section('#### 2.2', '#### 2.3'));

const w1 = plain.sort(sortRows).map((r) => `${r.contract} ${r.file}`);

const skipped = value.filter((r) => W5_SKIPPED[r.brand]);
const runnable = value.filter((r) => !W5_SKIPPED[r.brand]);
for (const t of W5_TRIALS) if (!runnable.some((r) => r.brand === t)) throw new Error(`trial ${t} is not a runnable value brand`);
const trials = W5_TRIALS.map((t) => runnable.find((r) => r.brand === t));
const rest = runnable.filter((r) => !W5_TRIALS.includes(r.brand)).sort(sortRows);
const w5 = [...trials, ...rest].map((r) => `${r.contract} ${r.file}`);

const dupBrand = (rs, r) => rs.filter((x) => x.brand === r.brand).length > 1;
const idArgs = (rs) => rs.map((r) => (dupBrand(rs, r) ? `${r.brand} --pkg=${r.pkg}` : r.brand));
const w3 = idArgs(owned);
const w4 = idArgs(ownerless);

const write = (name, header, body) => fs.writeFileSync(path.join(OUT, name), header.map((h) => `# ${h}\n`).join('') + body.map((b) => `${b}\n`).join(''));
fs.mkdirSync(OUT, { recursive: true });

write('w1-runs.txt', ['W1: one standalone never-a-field brand per line, "<const> <contract file>", run order. Source: table 2.8 of items/b-brand-decisions.md (verdict plain), largest fanOut first.'], w1);
write('w5-runs.txt', [
  'W5: one value brand per line, "<const> <contract file>", run order. Source: table 2.6 of items/b-brand-decisions.md. The first five lines are the trials.',
  'No brand name occurs in two packages, so no line needs --no-group.',
  ...skipped.map((r) => `Skipped ${r.brand} (${r.file}): ${W5_SKIPPED[r.brand]}.`),
], w5);
write('w3-runs.txt', ['W3: b15-id-brands --brand args, one run per line. Table 2.2 of items/b-brand-decisions.md has no rows, so this wave has no runs.'], w3);
write('w4-runs.txt', ['W4: b15-id-brands --brand args, one run per line. Source: table 2.4 of items/b-brand-decisions.md.'], w4);
for (const f of fs.readdirSync(OUT)) if (/^w2-.*\.json$/.test(f)) fs.unlinkSync(path.join(OUT, f));

console.log(JSON.stringify({ w1: w1.length, w5: w5.length, w5Skipped: skipped.map((r) => r.brand), w3: w3.length, w4: w4.length, w2: 0 }));
