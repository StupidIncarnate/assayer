#!/usr/bin/env node
// Counts enforce-proxy-child-creation hits with ESLint's API (no fix) over every proxy file under packages/*/src.
//   node count-hits.cjs --root=<repo>
const fs = require('fs'), path = require('path');
const root = path.resolve(process.argv.find((a) => a.startsWith('--root='))?.slice(7) ?? '.');
const { ESLint } = require(require.resolve('eslint', { paths: [root] }));
const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (['node_modules', 'dist'].includes(e.name)) continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.proxy\.tsx?$/.test(e.name)) files.push(p); } };
for (const k of ['core', 'cli', 'desktop', 'app']) { const s = path.join(root, 'packages', k, 'src'); if (fs.existsSync(s)) walk(s); }
(async () => {
  const eslint = new ESLint({ cwd: root, fix: false });
  const res = await eslint.lintFiles(files.sort());
  let n = 0; const per = {};
  for (const r of res) for (const m of r.messages) if ((m.ruleId ?? '').includes('enforce-proxy-child-creation')) { n++; per[path.relative(root, r.filePath)] = (per[path.relative(root, r.filePath)] ?? 0) + 1; }
  const other = res.flatMap((r) => r.messages).filter((m) => m.fatal).length;
  console.log(JSON.stringify(per, null, 1)); console.log(`enforce-proxy-child-creation hits: ${n} over ${files.length} proxy files (fatal parse errors: ${other})`);
})();
