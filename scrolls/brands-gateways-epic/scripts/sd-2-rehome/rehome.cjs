#!/usr/bin/env node
/*
 * SD-2 of assayer's brands-and-gateways epic: the re-home script.
 *
 * It reads the `rehome` rows of the A-1 adapter table and, for each selected row:
 *   1. moves the adapter, then its `.proxy`, `.test` and `.stub` companions when they exist, to the target path.
 *      Each move goes through TypeScript's `getEditsForFileRename` in every TypeScript project whose program holds
 *      the file, so every importer's specifier follows. The moves run one at a time against an in-memory copy of
 *      the tree, so two moved files that import each other end up pointing at each other's new paths.
 *   2. renames the exported symbol to the table's target symbol, and `<old>Proxy` to `<target>Proxy`, through
 *      `findRenameLocations` in every project that holds the file.
 *   3. lists every string, comment, identifier, JSON string or doc line that still names an old path, an old file
 *      name, an emptied old folder or an old symbol, in `<out-dir>/leftovers.json`.
 *
 * A tsconfig `paths` entry that points at a moved file without an extension is rewritten by this script, because
 * `getEditsForFileRename` only matches a `paths` entry that carries the extension. An import that uses that path
 * key keeps its specifier.
 *
 * Fences. The script refuses a whole row, and leaves the tree as it was before that row, when any edit would land:
 *   - outside --root, or inside `node_modules/` or `dist/`;
 *   - under `vendored-fixture/` or `eslint-rules/`;
 *   - under `smoke-repo/` in anything but a `*.test.ts(x)` file, or the `paths` entries named in SMOKE_PATH_KEYS of
 *     `smoke-repo/packages/syntax-repository/tsconfig.json` (EPIC concession 15).
 * It also refuses a row whose target breaks the folder rules: the file suffix must match the folder type, a broker
 * sits at `brokers/<domain>/<action>/<domain>-<action>-broker.ts`, any other type at `<type>/<name>/<name>-<type>`,
 * a layer is `<name>-layer-<suffix>` flat beside its parent, and an old layer adapter lands beside its old parent's
 * new home. The script never deletes a file. A moved file leaves its old folder empty, and the folder stays.
 *
 * Usage:
 *   node scrolls/brands-gateways-epic/scripts/sd-2-rehome/rehome.cjs --rows=<filter>[,<filter>...] [--root=<repo>]
 *        [--out-dir=<dir>] [--table=<file>] [--projects=<dir>,...] [--sample-out=<dir>] [apply]
 *
 *   --rows       `all`, a package (`core`), `walk-file` (core's walk-file folder), a path prefix of the adapter or
 *                target path, or a target symbol. Several filters are joined with commas, and a row matching any
 *                one of them runs.
 *   --root       the repo to rewrite (default: the current directory).
 *   --out-dir    reports go here (default: <root>/tmp/sd-2): plan.json, last-run.diff, leftovers.json, moves.json.
 *   --table      the adapter table (default: <root>/scrolls/brands-gateways-epic/items/a-adapter-table.md).
 *   --projects   extra TypeScript project folders beyond every package under packages/ (default:
 *                smoke-repo/packages/syntax-repository).
 *   --sample-out writes every new or changed file under <dir>, laid out by its repo-relative path, for
 *                `verify-sample.cjs`. The old paths of moved files are listed in <out-dir>/moves.json.
 *   apply        writes to --root. Without it the run is a dry run.
 *
 * Exit code: 0 when every selected row ran, 1 when any row was refused, 2 on a usage error.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const args = process.argv.slice(2);
const opt = (n) => {
  const a = args.find((x) => x.startsWith(`--${n}=`));
  return a === undefined ? undefined : a.slice(n.length + 3);
};
const APPLY = args.includes('apply');
const ROOT = path.resolve(opt('root') ?? process.cwd());
const OUT = path.resolve(opt('out-dir') ?? path.join(ROOT, 'tmp', 'sd-2'));
const TABLE = path.resolve(ROOT, opt('table') ?? 'scrolls/brands-gateways-epic/items/a-adapter-table.md');
const SAMPLE = opt('sample-out') === undefined ? null : path.resolve(opt('sample-out'));
const ROW_FILTERS = (opt('rows') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const EXTRA_PROJECTS = (opt('projects') ?? 'smoke-repo/packages/syntax-repository').split(',').map((s) => s.trim()).filter(Boolean);

if (ROW_FILTERS.length === 0 || !fs.existsSync(path.join(ROOT, 'packages')) || !fs.existsSync(TABLE)) {
  console.error('usage: rehome.cjs --rows=<all|package|walk-file|path prefix|symbol>[,...] [--root=<repo>] [--out-dir=<dir>] [--table=<file>] [--projects=<dir>,...] [--sample-out=<dir>] [apply]');
  process.exit(2);
}

const ts = require(path.join(ROOT, 'node_modules', 'typescript'));

// The smoke-repo `paths` keys this script may rewrite (EPIC concession 15).
const SMOKE_PATH_KEYS = new Set(['@assayer/core/walk-file']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'tmp', 'worktrees', 'coverage', 'test-results', 'playwright-report', 'scrolls']);
const COLUMNS = ['package', 'adapter path', 'kind', 'target path', 'target symbol', 'gateway call', 'callers', 'notes'];
const FOLDER_SUFFIX = {
  brokers: 'broker',
  transformers: 'transformer',
  guards: 'guard',
  widgets: 'widget',
  middleware: 'middleware',
  responders: 'responder',
  bindings: 'binding',
};
const COMPANIONS = ['.proxy', '.test', '.integration.test', '.stub'];

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/');
const abs = (r) => path.resolve(ROOT, r);
const noExt = (p) => p.replace(/\.(ts|tsx)$/u, '');
const camel = (kebab) => kebab.replace(/-([a-z0-9])/gu, (_, c) => c.toUpperCase());
const pascal = (kebab) => camel(kebab).replace(/^./u, (c) => c.toUpperCase());
const byString = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// ---------- the table ----------

const readTable = () => {
  const lines = fs.readFileSync(TABLE, 'utf8').split('\n');
  const start = lines.findIndex((l) => /^## Table\s*$/u.test(l));
  if (start === -1) throw new Error(`${rel(TABLE)} has no "## Table" section`);
  const cells = (l) => l.trim().replace(/^\|/u, '').replace(/\|$/u, '').split('|').map((c) => c.trim());
  const headerAt = lines.findIndex((l, i) => i > start && l.startsWith('|'));
  const header = cells(lines[headerAt]);
  if (header.join('|') !== COLUMNS.join('|')) throw new Error(`${rel(TABLE)} header is "${header.join(' | ')}", expected "${COLUMNS.join(' | ')}"`);
  const rows = [];
  for (let i = headerAt + 2; i < lines.length && lines[i].startsWith('|'); i++) {
    const c = cells(lines[i]);
    const clean = (s) => s.replace(/`/gu, '').trim();
    rows.push({
      line: i + 1,
      pkg: clean(c[0]),
      adapter: clean(c[1]),
      kind: clean(c[2]),
      target: clean(c[3]),
      symbol: clean(c[4]),
    });
  }
  return rows;
};

// ---------- the in-memory tree ----------

const vfs = {
  text: new Map(),
  removed: new Set(),
  version: new Map(),
  disk: new Map(),
  epoch: 0,
};
const diskText = (p) => {
  if (!vfs.disk.has(p)) vfs.disk.set(p, fs.existsSync(p) && fs.statSync(p).isFile() ? fs.readFileSync(p, 'utf8') : undefined);
  return vfs.disk.get(p);
};
// Every change to the tree bumps `vfs.epoch`. A language service asks for its project version before each request
// and skips its whole up-to-date check when the version is unchanged, which keeps rename and move requests fast.
const bump = (p) => {
  vfs.version.set(p, (vfs.version.get(p) ?? 0) + 1);
  vfs.epoch += 1;
};
const readText = (p) => (vfs.removed.has(p) ? undefined : vfs.text.has(p) ? vfs.text.get(p) : diskText(p));
const writeText = (p, t) => {
  vfs.text.set(p, t);
  vfs.removed.delete(p);
  bump(p);
};
const removeFile = (p) => {
  vfs.text.delete(p);
  vfs.removed.add(p);
  bump(p);
};
const fileExists = (p) => readText(p) !== undefined;
const dirExists = (d) => {
  if (fs.existsSync(d) && fs.statSync(d).isDirectory()) return true;
  const pre = d + path.sep;
  for (const k of vfs.text.keys()) if (k.startsWith(pre)) return true;
  return false;
};
const snapshot = () => ({ text: new Map(vfs.text), removed: new Set(vfs.removed) });
const restore = (s) => {
  const touched = new Set([...vfs.text.keys(), ...s.text.keys(), ...vfs.removed, ...s.removed]);
  vfs.text = s.text;
  vfs.removed = s.removed;
  for (const p of touched) bump(p);
};

// ---------- TypeScript projects ----------

const parseConfig = (configPath) => {
  const host = {
    useCaseSensitiveFileNames: true,
    readDirectory: ts.sys.readDirectory,
    fileExists: (p) => fileExists(path.resolve(p)),
    readFile: (p) => readText(path.resolve(p)),
    getCurrentDirectory: () => path.dirname(configPath),
    onUnRecoverableConfigFileDiagnostic: (d) => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, ' '));
    },
  };
  return ts.getParsedCommandLineOfConfigFile(configPath, { noEmit: true }, host);
};

const registry = ts.createDocumentRegistry(true, ROOT);
const makeProject = (dir) => {
  const configPath = path.join(dir, 'tsconfig.json');
  const parsed = parseConfig(configPath);
  const p = {
    dir,
    configPath,
    options: parsed.options,
    rootNames: parsed.fileNames.map((f) => path.resolve(f)),
    members: new Set(),
    optionsEpoch: 0,
  };
  p.service = ts.createLanguageService(
    {
      getScriptFileNames: () => p.rootNames,
      getProjectVersion: () => `${vfs.epoch}:${p.optionsEpoch}`,
      getScriptVersion: (f) => String(vfs.version.get(f) ?? 0),
      getScriptSnapshot: (f) => {
        const t = readText(path.resolve(f));
        return t === undefined ? undefined : ts.ScriptSnapshot.fromString(t);
      },
      getCurrentDirectory: () => dir,
      getCompilationSettings: () => p.options,
      getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
      fileExists: (f) => fileExists(path.resolve(f)),
      readFile: (f) => readText(path.resolve(f)),
      directoryExists: (d) => dirExists(path.resolve(d)),
      getDirectories: ts.sys.getDirectories,
      readDirectory: ts.sys.readDirectory,
      realpath: ts.sys.realpath,
      useCaseSensitiveFileNames: () => true,
    },
    registry,
  );
  p.refresh = () => {
    p.members = new Set(p.service.getProgram().getSourceFiles().map((sf) => path.resolve(sf.fileName)));
  };
  p.reloadOptions = () => {
    p.options = parseConfig(configPath).options;
    p.optionsEpoch += 1;
  };
  return p;
};

const projectDirs = () => {
  const out = [];
  const pk = path.join(ROOT, 'packages');
  for (const d of fs.readdirSync(pk).sort(byString)) {
    const full = path.join(pk, d);
    if (d.startsWith('@')) {
      for (const g of fs.readdirSync(full).sort(byString)) out.push(path.join(full, g));
    } else out.push(full);
  }
  for (const e of EXTRA_PROJECTS) out.push(abs(e));
  return out.filter((d) => fs.existsSync(path.join(d, 'tsconfig.json')));
};

// ---------- fences ----------

const isTestFile = (r) => /\.test\.tsx?$/u.test(r);
// Answers null when the edit may land, or the reason it may not.
const fenceOf = (file, { pathsKey } = {}) => {
  const r = rel(file);
  if (r.startsWith('..') || path.isAbsolute(r)) return `edit outside --root: ${file}`;
  if (/(^|\/)(node_modules|dist)\//u.test(r)) return `edit inside node_modules or dist: ${r}`;
  if (/^(vendored-fixture|eslint-rules)\//u.test(r)) return `edit in an off-limits folder: ${r}`;
  if (r.startsWith('smoke-repo/')) {
    if (pathsKey !== undefined) return SMOKE_PATH_KEYS.has(pathsKey) ? null : `smoke-repo paths key ${pathsKey} is not one SD-2 may rewrite (${r})`;
    if (!isTestFile(r)) return `edit to a smoke-repo file that is not a specimen test: ${r}`;
  }
  return null;
};

// ---------- target checks ----------

const checkTarget = (row, allRehome) => {
  const problems = [];
  const m = /^packages\/([^/]+)\/src\/([^/]+)\/(.+)$/u.exec(row.target);
  if (!m) return [`target ${row.target} is not under packages/<pkg>/src/<folder type>/`];
  const [, pkg, ft, restPath] = m;
  if (pkg !== row.pkg) problems.push(`target package ${pkg} differs from the row's package ${row.pkg}`);
  const suffix = FOLDER_SUFFIX[ft];
  if (!suffix) return [...problems, `folder type ${ft} is not one SD-2 knows`];
  const dirs = restPath.split('/');
  const file = dirs.pop();
  const ext = /\.(tsx?)$/u.exec(file)?.[1];
  const base = noExt(file);
  if (!ext) problems.push(`target ${file} is not a .ts or .tsx file`);
  if (!base.endsWith(`-${suffix}`)) problems.push(`target ${file} does not end in -${suffix}, the suffix of ${ft}/`);
  const isLayer = new RegExp(`-layer-${suffix}$`, 'u').test(base);
  const wantSymbol = ft === 'widgets' ? pascal(base) : camel(base);
  if (row.symbol !== wantSymbol) problems.push(`target symbol ${row.symbol} does not match the file name, which gives ${wantSymbol}`);
  const targetDir = path.posix.dirname(row.target);
  if (isLayer) {
    const parentHere = [
      ...allRehome.filter((r) => path.posix.dirname(r.target) === targetDir).map((r) => noExt(path.posix.basename(r.target))),
      ...(fs.existsSync(abs(targetDir)) ? fs.readdirSync(abs(targetDir)).filter((f) => /\.tsx?$/u.test(f) && !/\.(test|proxy|stub)\./u.test(f)).map(noExt) : []),
    ].filter((b) => b.endsWith(`-${suffix}`) && !b.includes('-layer-'));
    if (parentHere.length === 0) problems.push(`layer ${file} has no non-layer -${suffix} parent beside it in ${targetDir}`);
  } else if (ft === 'brokers') {
    if (dirs.length !== 2 || base !== `${dirs[0]}-${dirs[1]}-broker`) problems.push(`broker ${row.target} is not brokers/<domain>/<action>/<domain>-<action>-broker`);
  } else if (dirs.length !== 1 || base !== `${dirs[0]}-${suffix}`) {
    problems.push(`${row.target} is not ${ft}/<name>/<name>-${suffix}`);
  }
  if (/-layer-adapter\.tsx?$/u.test(row.adapter)) {
    if (!isLayer) problems.push(`the adapter is a layer, but its target ${file} is not a -layer-${suffix} file`);
    const oldDir = path.posix.dirname(row.adapter);
    const parents = allRehome.filter((r) => path.posix.dirname(r.adapter) === oldDir && !/-layer-adapter\.tsx?$/u.test(r.adapter));
    if (parents.length !== 1) problems.push(`cannot name the layer's parent: ${parents.length} non-layer rows share ${oldDir}`);
    else if (path.posix.dirname(parents[0].target) !== targetDir) problems.push(`layer target ${targetDir} is not beside its parent's target ${path.posix.dirname(parents[0].target)}`);
  }
  return problems;
};

// ---------- edits ----------

const applyEditsTo = (text, edits) => {
  let out = text;
  for (const e of [...edits].sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
};

// Folds edits per file, dropping exact duplicates. Answers the reason when two edits overlap with different text.
const foldEdits = (edits) => {
  const perFile = new Map();
  for (const e of edits) {
    if (!perFile.has(e.file)) perFile.set(e.file, new Map());
    const k = `${e.start}:${e.end}:${e.text}`;
    perFile.get(e.file).set(k, e);
  }
  for (const [f, m] of perFile) {
    const list = [...m.values()].sort((a, b) => a.start - b.start || a.end - b.end);
    for (let i = 1; i < list.length; i++) {
      if (list[i].start < list[i - 1].end || (list[i].start === list[i - 1].start && list[i].end === list[i - 1].end)) {
        return { conflict: `two edits overlap in ${rel(f)} at ${list[i].start}` };
      }
    }
    perFile.set(f, list);
  }
  return { perFile };
};

const commit = (perFile) => {
  for (const [f, list] of perFile) writeText(f, applyEditsTo(readText(f), list));
};

// The `paths` entries of a project's tsconfig that point at `oldFile`, as edits that point them at `newFile`.
const pathsEditsFor = (p, oldFile, newFile) => {
  const paths = p.options.paths;
  if (!paths) return [];
  const base = p.options.pathsBasePath ?? p.options.baseUrl ?? p.dir;
  const text = readText(p.configPath);
  const json = ts.parseJsonText(p.configPath, text);
  const top = json.statements[0]?.expression;
  const prop = (obj, name) => obj?.properties?.find((x) => x.name && ts.isStringLiteral(x.name) && x.name.text === name)?.initializer;
  const pathsNode = prop(prop(top, 'compilerOptions'), 'paths');
  if (!pathsNode || !ts.isObjectLiteralExpression(pathsNode)) return [];
  const out = [];
  for (const entry of pathsNode.properties) {
    if (!entry.name || !ts.isStringLiteral(entry.name) || !ts.isArrayLiteralExpression(entry.initializer)) continue;
    for (const el of entry.initializer.elements) {
      if (!ts.isStringLiteral(el)) continue;
      const target = path.resolve(base, el.text);
      const hasExt = /\.(ts|tsx)$/u.test(el.text);
      if (!(hasExt ? target === oldFile : target === noExt(oldFile))) continue;
      let next = path.relative(base, hasExt ? newFile : noExt(newFile)).split(path.sep).join('/');
      if (!next.startsWith('.')) next = `./${next}`;
      out.push({ file: p.configPath, start: el.getStart(json) + 1, end: el.end - 1, text: next, pathsKey: entry.name.text });
    }
  }
  return out;
};

const formatSettings = ts.getDefaultFormatCodeSettings('\n');

// Moves one file inside the in-memory tree. Answers { edits } or { refused }.
const moveFile = (projects, oldFile, newFile) => {
  const relevant = projects.filter((p) => p.members.has(oldFile));
  const edits = [];
  const keepSpecifiers = new Set();
  for (const p of relevant) {
    for (const e of pathsEditsFor(p, oldFile, newFile)) {
      edits.push(e);
      keepSpecifiers.add(`${p.dir}\0${e.pathsKey}`);
    }
  }
  for (const p of relevant) {
    const changes = p.service.getEditsForFileRename(oldFile, newFile, formatSettings, {});
    for (const fc of changes) {
      const f = path.resolve(fc.fileName);
      const text = readText(f);
      for (const tc of fc.textChanges) {
        const start = tc.span.start;
        const end = tc.span.start + tc.span.length;
        // A non-relative specifier whose `paths` entry this script rewrites stays as it is.
        if (text !== undefined && keepSpecifiers.has(`${p.dir}\0${text.slice(start, end)}`)) continue;
        if (f === p.configPath) continue;
        edits.push({ file: f, start, end, text: tc.newText });
      }
    }
  }
  for (const e of edits) {
    const why = fenceOf(e.file, { pathsKey: e.pathsKey });
    if (why) return { refused: why };
  }
  const folded = foldEdits(edits);
  if (folded.conflict) return { refused: folded.conflict };
  commit(folded.perFile);
  const moved = readText(oldFile);
  removeFile(oldFile);
  writeText(newFile, moved);
  for (const p of projects) {
    if (p.members.has(oldFile)) {
      p.members.delete(oldFile);
      p.members.add(newFile);
    }
    const i = p.rootNames.indexOf(oldFile);
    if (i !== -1) p.rootNames = [...p.rootNames.slice(0, i), newFile, ...p.rootNames.slice(i + 1)];
    if (folded.perFile.has(p.configPath)) p.reloadOptions();
  }
  for (const p of relevant) p.refresh();
  return { edits: [...folded.perFile.values()].reduce((n, l) => n + l.length, 0), files: folded.perFile.size };
};

const declarationPos = (file, name) => {
  const sf = ts.createSourceFile(file, readText(file), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  for (const st of sf.statements) {
    const exported = ts.canHaveModifiers(st) && (ts.getModifiers(st) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name) && d.name.text === name) return d.name.getStart(sf);
    } else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st)) && st.name?.text === name) return st.name.getStart(sf);
  }
  return null;
};

const identifiersIn = (file) => {
  const t = readText(file);
  const sf = ts.createSourceFile(file, t, ts.ScriptTarget.Latest, true, /\.[jt]sx$/u.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out = new Set();
  const visit = (n) => {
    if (ts.isIdentifier(n)) out.add(n.text);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
};

// Renames one exported symbol inside the in-memory tree. Answers { locations, files } or { refused }.
const renameSymbol = (projects, file, from, to) => {
  const pos = declarationPos(file, from);
  if (pos === null) return { refused: `no exported declaration of ${from} in ${rel(file)}` };
  const locs = [];
  for (const p of projects.filter((x) => x.members.has(file))) {
    const found = p.service.findRenameLocations(file, pos, false, false, { providePrefixAndSuffixTextForRename: false }) ?? [];
    for (const l of found) locs.push({ file: path.resolve(l.fileName), start: l.textSpan.start, end: l.textSpan.start + l.textSpan.length, text: to });
  }
  for (const l of locs) {
    const why = fenceOf(l.file);
    if (why) return { refused: why };
    if (readText(l.file).slice(l.start, l.end) !== from) return { refused: `a rename location in ${rel(l.file)} does not read ${from}` };
  }
  const folded = foldEdits(locs);
  if (folded.conflict) return { refused: folded.conflict };
  for (const f of folded.perFile.keys()) {
    if (identifiersIn(f).has(to)) return { refused: `${to} already names something in ${rel(f)}` };
  }
  commit(folded.perFile);
  for (const p of projects) if ([...folded.perFile.keys()].some((f) => p.members.has(f))) p.refresh();
  return { locations: [...folded.perFile.values()].reduce((n, l) => n + l.length, 0), files: folded.perFile.size };
};

// ---------- leftovers ----------

const walkRepo = () => {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => byString(a.name, b.name))) {
      if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) out.push(p);
    }
  };
  walk(ROOT);
  return out;
};

const lineOf = (text, pos) => {
  let line = 1;
  for (let i = text.indexOf('\n'); i !== -1 && i < pos; i = text.indexOf('\n', i + 1)) line++;
  return line;
};
const lineText = (text, pos) => {
  const s = text.lastIndexOf('\n', pos - 1) + 1;
  const e = text.indexOf('\n', pos);
  return text.slice(s, e === -1 ? text.length : e).trim().slice(0, 200);
};

const scanLeftovers = (needles) => {
  const files = new Set(walkRepo().filter((f) => !vfs.removed.has(f)));
  for (const f of vfs.text.keys()) if (!vfs.removed.has(f) && !rel(f).startsWith('..')) files.add(f);
  const any = new RegExp(needles.map((n) => n.re.source).join('|'), 'u');
  const hits = [];
  const record = (file, text, pos, kind, s) => {
    const matched = needles.filter((n) => n.re.test(s)).map((n) => n.label);
    if (matched.length) hits.push({ file: rel(file), line: lineOf(text, pos), kind, needles: matched, text: lineText(text, pos) });
  };
  for (const file of [...files].sort(byString)) {
    const r = rel(file);
    if (/(^|\/)package-lock\.json$/u.test(r) || /\.tsbuildinfo$/u.test(r)) continue;
    const ext = path.extname(file);
    const isCode = ['.ts', '.tsx', '.js', '.jsx', '.cjs', '.mjs', '.mts', '.cts'].includes(ext);
    if (!isCode && !['.json', '.md'].includes(ext)) continue;
    const text = readText(file);
    if (text === undefined || !any.test(text)) continue;
    if (ext === '.md') {
      text.split('\n').reduce((off, l) => {
        record(file, text, off, 'doc-line', l);
        return off + l.length + 1;
      }, 0);
      continue;
    }
    if (ext === '.json') {
      const json = ts.parseJsonText(file, text);
      const visit = (n) => {
        if (ts.isStringLiteral(n)) record(file, text, n.getStart(json), 'json-string', n.text);
        ts.forEachChild(n, visit);
      };
      visit(json);
      continue;
    }
    const kindOfScript = /x$/u.test(ext) ? ts.ScriptKind.TSX : ['.js', '.cjs', '.mjs'].includes(ext) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kindOfScript);
    const comments = new Map();
    const takeComments = (ranges) => {
      for (const c of ranges ?? []) comments.set(c.pos, text.slice(c.pos, c.end));
    };
    const visit = (n) => {
      takeComments(ts.getLeadingCommentRanges(text, n.pos));
      takeComments(ts.getTrailingCommentRanges(text, n.end));
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) record(file, text, n.getStart(sf), 'string', n.text);
      else if (ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) record(file, text, n.getStart(sf), 'template', n.text);
      else if (ts.isIdentifier(n)) record(file, text, n.getStart(sf), 'identifier', n.text);
      ts.forEachChild(n, visit);
    };
    visit(sf);
    takeComments(ts.getLeadingCommentRanges(text, sf.endOfFileToken.pos));
    for (const [pos, c] of [...comments].sort((a, b) => a[0] - b[0])) {
      c.split('\n').reduce((off, l) => {
        record(file, text, pos + off, 'comment', l);
        return off + l.length + 1;
      }, 0);
    }
  }
  return hits.sort((a, b) => byString(a.file, b.file) || a.line - b.line || byString(a.kind, b.kind) || byString(a.text, b.text));
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\/]/gu, '\\$&');

// ---------- reports ----------

const unifiedDiff = (labelA, labelB, before, after) => {
  const dir = fs.mkdtempSync(path.join(OUT, '.diff-'));
  const a = path.join(dir, 'a');
  const b = path.join(dir, 'b');
  fs.writeFileSync(a, before ?? '');
  fs.writeFileSync(b, after ?? '');
  const r = cp.spawnSync('diff', ['-u', '--label', labelA, '--label', labelB, a, b], { encoding: 'utf8' });
  fs.rmSync(dir, { recursive: true });
  return r.stdout;
};

// ---------- main ----------

const main = () => {
  fs.mkdirSync(OUT, { recursive: true });
  const table = readTable();
  const rehome = table.filter((r) => r.kind === 'rehome');
  const matches = (r) =>
    ROW_FILTERS.some(
      (f) =>
        f === 'all' ||
        f === r.pkg ||
        (f === 'walk-file' && r.adapter.startsWith('packages/core/src/adapters/ts-morph/walk-file/')) ||
        r.adapter.startsWith(f) ||
        r.target.startsWith(f) ||
        r.symbol === f,
    );
  const selected = rehome.filter(matches).sort((a, b) => byString(a.adapter, b.adapter));
  console.log(`table: ${table.length} rows, ${rehome.length} rehome, ${selected.length} selected by --rows=${ROW_FILTERS.join(',')}`);

  const t0 = Date.now();
  const projects = projectDirs().map(makeProject);
  for (const p of projects) p.refresh();
  console.log(`projects: ${projects.map((p) => rel(p.dir)).join(', ')} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);

  const results = [];
  const moves = [];
  const needles = new Map();
  const addNeedle = (label, source) => needles.set(label, { label, re: new RegExp(source, 'u') });

  for (const row of selected) {
    const res = { adapter: row.adapter, target: row.target, symbol: row.symbol, moves: [], renames: [], status: 'done' };
    results.push(res);
    const problems = checkTarget(row, rehome);
    const oldMain = abs(row.adapter);
    const newMain = abs(row.target);
    if (!fileExists(oldMain)) problems.push(fileExists(newMain) ? 'already moved: the target exists and the adapter does not' : `adapter ${row.adapter} does not exist`);
    const oldBase = noExt(oldMain);
    const newBase = noExt(newMain);
    const plan = [[oldMain, newMain]];
    for (const c of COMPANIONS) {
      for (const ext of ['.ts', '.tsx']) {
        if (fileExists(`${oldBase}${c}${ext}`)) plan.push([`${oldBase}${c}${ext}`, `${newBase}${c}${ext}`]);
      }
    }
    for (const [, to] of plan) if (fileExists(to)) problems.push(`target ${rel(to)} already exists`);
    const oldSymbol = camel(path.basename(oldBase));
    if (problems.length === 0 && declarationPos(oldMain, oldSymbol) === null) problems.push(`${row.adapter} does not export ${oldSymbol}`);
    if (problems.length) {
      res.status = 'refused';
      res.refused = problems;
      continue;
    }
    const before = snapshot();
    const refuse = (why) => {
      restore(before);
      for (const p of projects) {
        for (const [from, to] of plan) {
          const i = p.rootNames.indexOf(to);
          if (i !== -1) p.rootNames[i] = from;
          if (p.members.has(to)) {
            p.members.delete(to);
            p.members.add(from);
          }
        }
        p.reloadOptions();
      }
      res.status = 'refused';
      res.refused = [why];
      res.moves = [];
      res.renames = [];
    };
    let failed = false;
    for (const [from, to] of plan) {
      const r = moveFile(projects, from, to);
      if (r.refused) {
        refuse(`moving ${rel(from)}: ${r.refused}`);
        failed = true;
        break;
      }
      res.moves.push({ from: rel(from), to: rel(to), editedFiles: r.files, edits: r.edits });
    }
    if (failed) continue;
    const renames = [[newMain, oldSymbol, row.symbol]];
    const newProxy = plan.find(([, to]) => /\.proxy\.tsx?$/u.test(to))?.[1];
    if (newProxy) renames.push([newProxy, `${oldSymbol}Proxy`, `${row.symbol}Proxy`]);
    for (const [file, from, to] of renames) {
      const r = renameSymbol(projects, file, from, to);
      if (r.refused) {
        refuse(`renaming ${from} to ${to}: ${r.refused}`);
        failed = true;
        break;
      }
      res.renames.push({ from, to, locations: r.locations, files: r.files });
    }
    if (failed) continue;
    for (const [from, to] of plan) moves.push({ from: rel(from), to: rel(to) });
    addNeedle(path.basename(oldBase), `(?<![\\w-])${escapeRe(path.basename(oldBase))}(?![\\w-])`);
    addNeedle(oldSymbol, `\\b${escapeRe(oldSymbol)}\\b`);
    addNeedle(`${oldSymbol}Proxy`, `\\b${escapeRe(oldSymbol)}Proxy\\b`);
    process.stderr.write(`  ${res.status} ${row.adapter} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }

  // An old folder that ends up holding no file names a place that no longer exists.
  const oldDirs = [...new Set(moves.map((m) => path.posix.dirname(m.from)))].sort(byString);
  for (const d of oldDirs) {
    const full = abs(d);
    const onDisk = fs.existsSync(full) ? fs.readdirSync(full).map((f) => path.join(full, f)).filter((f) => fs.statSync(f).isFile() && !vfs.removed.has(f)) : [];
    const added = [...vfs.text.keys()].filter((f) => path.dirname(f) === full && !vfs.removed.has(f));
    if (onDisk.length + added.length > 0) continue;
    const short = d.replace(/^packages\/[^/]+\/src\//u, '');
    addNeedle(`${short}/`, `(?<![\\w-])${escapeRe(short)}(?![\\w-])`);
  }

  // Every file whose final text differs from today's disk, keyed by its final path.
  const movedTo = new Map(moves.map((m) => [abs(m.to), abs(m.from)]));
  const changed = [];
  for (const [f, t] of vfs.text) {
    if (vfs.removed.has(f)) continue;
    const origin = movedTo.get(f) ?? f;
    if (diskText(origin) !== t || origin !== f) changed.push({ file: f, origin, text: t });
  }
  changed.sort((a, b) => byString(a.file, b.file));

  let diff = '';
  for (const c of changed) {
    if (c.origin !== c.file) diff += `rename from ${rel(c.origin)}\nrename to ${rel(c.file)}\n`;
    diff += unifiedDiff(`a/${rel(c.origin)}`, `b/${rel(c.file)}`, diskText(c.origin), c.text);
  }
  fs.writeFileSync(path.join(OUT, 'last-run.diff'), diff);

  const leftovers = scanLeftovers([...needles.values()].sort((a, b) => byString(a.label, b.label)));
  const byKind = {};
  for (const h of leftovers) byKind[h.kind] = (byKind[h.kind] ?? 0) + 1;
  fs.writeFileSync(path.join(OUT, 'leftovers.json'), `${JSON.stringify({ needles: [...needles.keys()].sort(byString), counts: byKind, total: leftovers.length, leftovers }, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT, 'moves.json'), `${JSON.stringify(moves, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT, 'plan.json'), `${JSON.stringify({ root: ROOT, rows: ROW_FILTERS, results, changedFiles: changed.map((c) => rel(c.file)) }, null, 2)}\n`);

  for (const r of results) {
    if (r.status === 'refused') console.log(`REFUSED ${r.adapter}\n  ${r.refused.join('\n  ')}`);
    else console.log(`moved ${r.adapter} -> ${r.target}: ${r.moves.length} files; ${r.renames.map((x) => `${x.from} -> ${x.to} (${x.locations} sites, ${x.files} files)`).join('; ')}`);
  }
  const refusedCount = results.filter((r) => r.status === 'refused').length;
  console.log(`leftovers: ${leftovers.length} (${Object.entries(byKind).sort().map(([k, n]) => `${k} ${n}`).join(', ')}) in ${rel(path.join(OUT, 'leftovers.json'))}`);
  console.log(`${APPLY ? 'APPLIED' : 'DRY RUN'}: ${results.length - refusedCount} rows moved, ${refusedCount} refused, ${moves.length} files moved, ${changed.length} files written; diff in ${rel(path.join(OUT, 'last-run.diff'))} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);

  if (SAMPLE) {
    for (const c of changed) {
      const dest = path.join(SAMPLE, rel(c.file));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, c.text);
    }
    console.log(`SAMPLE: ${changed.length} files under ${SAMPLE}; old paths of moved files in moves.json`);
  }

  if (APPLY) {
    for (const c of changed) {
      const why = fenceOf(c.file);
      if (why) throw new Error(`refusing to write: ${why}`);
    }
    for (const m of moves) {
      fs.mkdirSync(path.dirname(abs(m.to)), { recursive: true });
      fs.renameSync(abs(m.from), abs(m.to));
    }
    for (const c of changed) fs.writeFileSync(c.file, c.text);
  }
  process.exitCode = refusedCount ? 1 : 0;
};

main();
