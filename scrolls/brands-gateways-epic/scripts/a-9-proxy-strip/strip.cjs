#!/usr/bin/env node
/*
 * A-9: removes child proxy creations whose proxy file lives in a folder type that needs no proxy
 * (transformers, guards, statics, ...), together with their imports.
 *
 *   node scrolls/brands-gateways-epic/scripts/a-9-proxy-strip/strip.cjs [apply] [--root=<repo>]
 *
 * Dry run unless `apply` is given. "Needs no proxy" is read from the dungeonmaster folder config
 * (`requireProxy`), the same table enforce-proxy-child-creation uses. The folder type of an import is the
 * last path segment that names a folder type, as in parse-implementation-imports-transformer.
 * Imports that are not relative or `@scope/pkg/<folder>` (gateways, bare package roots) are left alone.
 * A creation whose returned variable is still read is left in place and reported.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const opt = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const APPLY = process.argv.includes('apply');
const ROOT = path.resolve(opt('root') ?? path.join(__dirname, '..', '..', '..', '..'));
const ts = require(require.resolve('typescript', { paths: [ROOT] }));

const configCandidates = [
  opt('folder-config'),
  '/home/brutus-home/projects/codex-of-consentient-craft/packages/shared/src/statics/folder-config/folder-config-statics.ts',
  path.join(ROOT, 'node_modules/@dungeonmaster/shared/src/statics/folder-config/folder-config-statics.ts'),
].filter(Boolean);
const configPath = configCandidates.find((p) => fs.existsSync(p));
if (!configPath) { console.error('folder-config-statics.ts not found; pass --folder-config=<file>'); process.exit(2); }

const needsProxy = new Map();
{
  const sf = ts.createSourceFile(configPath, fs.readFileSync(configPath, 'utf8'), ts.ScriptTarget.Latest, true);
  const visit = (n) => {
    if (ts.isPropertyAssignment(n) && ts.isObjectLiteralExpression(n.initializer) && ts.isIdentifier(n.name)) {
      const rp = n.initializer.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === 'requireProxy');
      if (rp) needsProxy.set(n.name.text, rp.initializer.kind === ts.SyntaxKind.TrueKeyword);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
if (needsProxy.size === 0) { console.error('no folder types read from ' + configPath); process.exit(2); }

const files = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (['node_modules', 'dist'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.proxy\.tsx?$/.test(e.name)) files.push(p);
  }
};
for (const pkg of fs.readdirSync(path.join(ROOT, 'packages')).sort()) {
  if (pkg.startsWith('@')) continue;
  const src = path.join(ROOT, 'packages', pkg, 'src');
  if (fs.existsSync(src)) walk(src);
}

const folderOf = (spec, file) => {
  const scoped = spec.match(/^@[\w-]+\/[\w-]+\/(\w+)$/);
  if (scoped) return needsProxy.has(scoped[1]) ? scoped[1] : null;
  if (!spec.startsWith('.')) return null;
  const parts = spec.split('/');
  for (let i = parts.length - 1; i >= 0; i--) if (needsProxy.has(parts[i])) return parts[i];
  const abs = path.resolve(path.dirname(file), spec).split(path.sep);
  for (let i = abs.length - 1; i >= 0; i--) if (needsProxy.has(abs[i])) return abs[i];
  return null;
};

let totals = { files: 0, removed: 0, imports: 0, left: 0 };
const report = [];

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  // local name -> { decl, spec, folder }
  const imports = new Map();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue;
    const spec = st.moduleSpecifier.text;
    if (!spec.endsWith('.proxy')) continue;
    const folder = folderOf(spec, file);
    if (folder === null || needsProxy.get(folder)) continue;
    const nb = st.importClause?.namedBindings;
    if (st.importClause?.isTypeOnly) continue;
    if (st.importClause?.name) imports.set(st.importClause.name.text, { decl: st, spec, folder });
    if (nb && ts.isNamedImports(nb)) for (const el of nb.elements) if (!el.isTypeOnly) imports.set(el.name.text, { decl: st, spec, folder });
  }
  if (imports.size === 0) continue;

  const idents = [];
  const collect = (n) => { if (ts.isIdentifier(n)) idents.push(n); ts.forEachChild(n, collect); };
  collect(sf);
  const refsOf = (name, exclude) => idents.filter((i) => i.text === name && !exclude(i));
  const inside = (outer) => (i) => i.getStart() >= outer.getStart() && i.getEnd() <= outer.getEnd();
  const inImport = (i) => ts.isImportSpecifier(i.parent) || ts.isImportClause(i.parent);

  const removals = []; // [start,end)
  const removedCalls = [];
  const left = [];
  const removedNames = new Set();
  const lineStart = (pos) => text.lastIndexOf('\n', pos - 1) + 1;
  const lineEnd = (pos) => { const k = text.indexOf('\n', pos); return k < 0 ? text.length : k + 1; };
  const isCreation = (call) => ts.isCallExpression(call) && ts.isIdentifier(call.expression) && imports.has(call.expression.text) && call.arguments.length === 0;

  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && imports.has(n.expression.text)) {
      const name = n.expression.text;
      const line = sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
      const p = n.parent;
      let stmt = null;
      if (ts.isExpressionStatement(p)) stmt = p;
      else if (ts.isVariableDeclaration(p) && p.initializer === n && ts.isVariableDeclarationList(p.parent) && p.parent.declarations.length === 1 && ts.isVariableStatement(p.parent.parent)) {
        const bindings = [];
        const bn = (b) => { if (ts.isIdentifier(b)) bindings.push(b); else ts.forEachChild(b, bn); };
        bn(p.name);
        const used = bindings.some((b) => refsOf(b.text, (i) => i === b).length > 0);
        if (used) { left.push(`${name}() line ${line}: returned variable is used`); return; }
        stmt = p.parent.parent;
      }
      if (!stmt || !ts.isBlock(stmt.parent)) { left.push(`${name}() line ${line}: not a plain statement`); return; }
      removals.push([lineStart(stmt.getStart()), lineEnd(stmt.getEnd())]);
      removedCalls.push(name);
      removedNames.add(name);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);

  // imports whose every call was removed and which have no other reads
  const importRemovals = [];
  const importEdits = new Map(); // decl -> Set(names to drop)
  for (const name of [...removedNames].sort()) {
    const remaining = refsOf(name, (i) => inImport(i)).filter((i) => !removals.some(([s, e]) => i.getStart() >= s && i.getEnd() <= e));
    if (remaining.length > 0) continue;
    const { decl } = imports.get(name);
    if (!importEdits.has(decl)) importEdits.set(decl, new Set());
    importEdits.get(decl).add(name);
  }
  let importsDropped = 0;
  for (const [decl, names] of importEdits) {
    const clause = decl.importClause;
    const nb = clause.namedBindings;
    const kept = nb && ts.isNamedImports(nb) ? nb.elements.filter((el) => !names.has(el.name.text)) : [];
    const keepDefault = clause.name && !names.has(clause.name.text);
    importsDropped += names.size;
    if (kept.length === 0 && !keepDefault) {
      removals.push([lineStart(decl.getStart()), lineEnd(decl.getEnd())]);
    } else {
      const parts = [];
      if (keepDefault) parts.push(clause.name.text);
      if (kept.length) parts.push(`{ ${kept.map((el) => el.getText()).join(', ')} }`);
      removals.push([decl.getStart(), decl.getEnd(), `import ${parts.join(', ')} from ${decl.moduleSpecifier.getText()};`]);
    }
  }

  if (removals.length === 0 && left.length === 0) continue;
  totals.files++;
  totals.removed += removedCalls.length;
  totals.imports += importsDropped;
  totals.left += left.length;
  report.push(`${path.relative(ROOT, file)}\n` + [
    ...removedCalls.map((c) => `  removed ${c}()`),
    ...[...importEdits.values()].flatMap((s) => [...s].sort().map((c) => `  removed import ${c}`)),
    ...left.map((l) => `  LEFT ${l}`),
  ].join('\n'));

  if (APPLY && removals.length > 0) {
    let out = text;
    for (const [s, e, rep] of removals.sort((a, b) => b[0] - a[0])) out = out.slice(0, s) + (rep ?? '') + out.slice(e);
    fs.writeFileSync(file, out);
  }
}

console.log(report.join('\n'));
console.log(`\n${APPLY ? 'APPLIED' : 'DRY RUN'} root=${ROOT}: ${totals.files} files, ${totals.removed} creations removed, ${totals.imports} imports removed, ${totals.left} creations left`);
