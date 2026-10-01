#!/usr/bin/env node
/*
 * Copies a repo into a sample folder for proving rehome.cjs, without node_modules, dist, .git, tmp or worktrees.
 *
 * The copy gets its own root `node_modules` folder. Each package entry in it is a symlink to the original repo's
 * entry, except a workspace link (`@assayer/core -> ../../packages/core`), which is copied as the same relative
 * link so that it lands on the COPY's package. A plain symlink of the whole folder would send every
 * `@assayer/*` import back into the original tree. Every nested `node_modules` folder becomes an absolute
 * symlink to the original.
 *
 *   node scrolls/brands-gateways-epic/scripts/sd-2-rehome/make-sample.cjs --from=<repo> --to=<empty or missing dir>
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const opt = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const FROM = path.resolve(opt('from') ?? '');
const TO = path.resolve(opt('to') ?? '');
if (!opt('from') || !opt('to') || !fs.existsSync(path.join(FROM, 'packages'))) {
  console.error('usage: make-sample.cjs --from=<repo> --to=<dir>');
  process.exit(2);
}
if (fs.existsSync(TO) && fs.readdirSync(TO).length > 0) {
  console.error(`${TO} is not empty; pick a fresh folder`);
  process.exit(2);
}
const excludes = ['node_modules', 'dist', '.git', '/tmp', '/worktrees', '*.tsbuildinfo', '.ward'];
const r = cp.spawnSync('rsync', ['-a', ...excludes.flatMap((e) => ['--exclude', e]), `${FROM}/`, `${TO}/`], { stdio: 'inherit' });
if (r.status !== 0) process.exit(r.status ?? 1);

const inside = (p, dir) => p === dir || p.startsWith(dir + path.sep);
const linkEntry = (src, dest) => {
  const st = fs.lstatSync(src);
  if (st.isSymbolicLink()) {
    const target = fs.readlinkSync(src);
    const real = path.resolve(path.dirname(src), target);
    if (!path.isAbsolute(target) && inside(real, FROM) && !inside(real, path.join(FROM, 'node_modules'))) {
      fs.symlinkSync(target, dest);
      return 'workspace';
    }
  }
  fs.symlinkSync(src, dest);
  return 'outside';
};

const counts = { workspace: 0, outside: 0, nested: 0 };
const rootNm = path.join(FROM, 'node_modules');
fs.mkdirSync(path.join(TO, 'node_modules'));
for (const e of fs.readdirSync(rootNm).sort()) {
  const src = path.join(rootNm, e);
  if (e.startsWith('@') && fs.lstatSync(src).isDirectory()) {
    fs.mkdirSync(path.join(TO, 'node_modules', e));
    for (const s of fs.readdirSync(src).sort()) counts[linkEntry(path.join(src, s), path.join(TO, 'node_modules', e, s))]++;
  } else counts[linkEntry(src, path.join(TO, 'node_modules', e))]++;
}

const nested = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || ['.git', '.ward', 'dist', 'tmp', 'worktrees'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.name === 'node_modules') {
      if (p === rootNm) continue;
      fs.symlinkSync(p, path.join(TO, path.relative(FROM, p)));
      counts.nested++;
    } else nested(p);
  }
};
nested(FROM);
console.log(`sample at ${TO}: ${counts.workspace} workspace links into the copy, ${counts.outside} links to the original, ${counts.nested} nested node_modules links`);
