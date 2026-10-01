#!/usr/bin/env node
/*
 * A18 codemod: moves mechanical raw outside calls onto the #gateway/* exports.
 *
 *   node tmp/a18-codemod/run.cjs <pkg> [--apply] [--files a,b,c] [--reuse-census] [--no-verify]
 *                                      [--env-writes] [--crypto-webcrypto]
 *
 * Run from the repo root. Dry run by default; --apply writes. Every run re-censuses the package
 * (ESLint with tmp/a18-census.config.js) unless --reuse-census, transforms in memory, then VERIFIES
 * each changed file: the package tsconfig typecheck and the full repo ESLint config must report no
 * new problem (prettier excluded: ward's lint --fix owns formatting), otherwise that file is left
 * untouched and reported as REJECTED. Report goes to stdout and tmp/a18-codemod/<dry|apply>-<pkg>.txt.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const ROOT = process.cwd();
if (!fs.existsSync(path.join(ROOT, 'packages/@gateway'))) {
  console.error('run from the repo root');
  process.exit(2);
}
const args = process.argv.slice(2);
const PKG = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--files');
if (!PKG) {
  console.error('usage: node tmp/a18-codemod/run.cjs <pkg> [--apply] [--files a,b] [--reuse-census] [--no-verify]');
  process.exit(2);
}
const APPLY = args.includes('--apply');
const REUSE = args.includes('--reuse-census');
const NOVERIFY = args.includes('--no-verify');
// Opt-in: exact-fit env writes. `process.env.X = v;` -> setEnv('X', v); `delete process.env.X;` and
// `Reflect.deleteProperty(process.env, K);` -> deleteEnv(K). Off by default (A18 leaves writes to hand work).
const ENV_WRITES = args.includes('--env-writes');
// Opt-in: node-side global `crypto` -> `webcrypto` from #gateway/node/crypto. In Node (and jest's node
// environment, which copies the outer global's descriptor) globalThis.crypto IS require('crypto').webcrypto,
// so a spy on crypto.randomUUID keeps working. Without it, only unspied crypto.randomUUID() moves (to randomUUID).
const CRYPTO_WEBCRYPTO = args.includes('--crypto-webcrypto');
const FILES = (() => {
  const i = args.indexOf('--files');
  return i >= 0 ? args[i + 1].split(',').map((f) => path.resolve(ROOT, f)) : null;
})();
const PKG_DIR = path.join(ROOT, 'packages', PKG);
const OUT_DIR = path.join(ROOT, 'tmp/a18-codemod');
const GW_ROOT = path.join(ROOT, 'packages/@gateway');
const rel = (f) => path.relative(ROOT, f);

// ---------------------------------------------------------------------------------------------
// Gateway index: every barrel's exports, resolved through the checker, so a raw name is swapped
// only when the barrel hands back the very same symbol the raw module does.
// ---------------------------------------------------------------------------------------------
const barrelFile = (gp) => {
  const m = /^#gateway\/(node|browser|npm|bin)\/(.+)$/u.exec(gp);
  if (!m) return null;
  const f = path.join(GW_ROOT, m[1], 'src', m[2], `${m[2]}.ts`);
  return fs.existsSync(f) ? f : null;
};

const buildGatewayIndex = () => {
  const barrels = [];
  for (const kind of ['node', 'browser', 'npm']) {
    for (const d of fs.readdirSync(path.join(GW_ROOT, kind, 'src'))) {
      const f = path.join(GW_ROOT, kind, 'src', d, `${d}.ts`);
      if (fs.existsSync(f)) barrels.push({ gp: `#gateway/${kind}/${d}`, f });
    }
  }
  const cfg = ts.getParsedCommandLineOfConfigFile(path.join(ROOT, 'tsconfig.json'), {}, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: () => {},
  });
  const options = {
    ...cfg.options,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
    jsx: ts.JsxEmit.ReactJSX,
    noEmit: true,
  };
  const program = ts.createProgram(
    barrels.map((b) => b.f),
    options,
  );
  const checker = program.getTypeChecker();
  const resolveAlias = (s) => (s && s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s);
  const exportEqualsOf = (msym) => {
    if (!msym) return undefined;
    if (typeof checker.resolveExternalModuleSymbol === 'function') {
      const r = checker.resolveExternalModuleSymbol(msym);
      return r === msym ? undefined : r;
    }
    const e = msym.exports && msym.exports.get('export=');
    return e ? resolveAlias(e) : undefined;
  };
  const exportsMap = (msym) => {
    const m = new Map();
    if (msym) for (const e of checker.getExportsOfModule(msym)) m.set(e.name, e);
    return m;
  };
  const byGp = new Map();
  const rawMods = new Map();
  for (const { gp, f } of barrels) {
    const sf = program.getSourceFile(f);
    const msym = sf && checker.getSymbolAtLocation(sf);
    let typeOnly = true;
    const localWrappers = [];
    for (const st of sf ? sf.statements : []) {
      if (ts.isExportDeclaration(st)) {
        if (!st.isTypeOnly) typeOnly = false;
        if (st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
          const spec = st.moduleSpecifier.text;
          if (!spec.startsWith('.')) {
            const ms = checker.getSymbolAtLocation(st.moduleSpecifier);
            if (ms && !rawMods.has(spec)) rawMods.set(spec, ms);
          } else if (st.exportClause && ts.isNamedExports(st.exportClause)) {
            for (const el of st.exportClause.elements) localWrappers.push(el.name.text);
          }
        }
      } else if (ts.isImportEqualsDeclaration(st) && ts.isExternalModuleReference(st.moduleReference)) {
        typeOnly = false;
        const spec = st.moduleReference.expression.text;
        const ms = checker.getSymbolAtLocation(st.moduleReference.expression);
        if (ms && !rawMods.has(spec)) rawMods.set(spec, ms);
      } else if (!ts.isImportDeclaration(st)) {
        typeOnly = false;
      }
    }
    byGp.set(gp, { gp, f, msym, exports: exportsMap(msym), exportEquals: exportEqualsOf(msym), typeOnly, localWrappers });
  }
  const ambient = new Map(checker.getAmbientModules().map((s) => [s.name.replace(/^"|"$/gu, ''), s]));
  const rawCache = new Map();
  const rawModule = (spec) => {
    const bare = spec.replace(/^node:/u, '');
    if (!rawCache.has(spec)) {
      const msym = rawMods.get(bare) || rawMods.get(spec) || ambient.get(bare) || ambient.get(spec);
      rawCache.set(spec, msym ? { msym, exports: exportsMap(msym), exportEquals: exportEqualsOf(msym) } : null);
    }
    return rawCache.get(spec);
  };
  // Returns undefined when identical, else the reason the name cannot move.
  const sameExport = (spec, gp, name) => {
    const b = byGp.get(gp);
    const r = rawModule(spec);
    if (!b) return 'no barrel';
    if (!r) return `raw module '${spec}' not resolvable from the gateway`;
    if (name === 'default') {
      const g = resolveAlias(b.exports.get('default')) || b.exportEquals;
      const r1 = resolveAlias(r.exports.get('default'));
      const sameDecl = (x, y) => !!(x && y && (x === y || (x.declarations && y.declarations && x.declarations.length && x.declarations[0] === y.declarations[0])));
      if (g && (sameDecl(g, r1) || sameDecl(g, r.exportEquals))) return undefined;
      return g ? 'default export differs' : 'barrel has no default export';
    }
    const gRaw = b.exports.get(name);
    if (!gRaw) return `barrel does not export '${name}'`;
    const g = resolveAlias(gRaw);
    const eq = r.exportEquals;
    const rs = resolveAlias(r.exports.get(name)) || (eq && ((eq.exports && eq.exports.get(name)) || checker.getPropertyOfType(checker.getTypeOfSymbol(eq), name)));
    if (g && rs && (g === rs || (g.declarations && rs.declarations && g.declarations.length && g.declarations[0] === rs.declarations[0]))) return undefined;
    return b.localWrappers.includes(name) ? `'${name}' is a gateway wrapper, not the raw function` : `'${name}' differs from the raw export`;
  };
  const hasExport = (gp, name) => {
    const b = byGp.get(gp);
    return !!(b && b.exports.has(name));
  };
  // A wrapper is re-exported from a folder beside the barrel (read at call time); anything else the
  // barrel defines itself (`export const { X } = globalThis`) is a load-time capture.
  const isWrapper = (gp, name) => {
    const b = byGp.get(gp);
    return !!(b && b.localWrappers.includes(name));
  };
  const maxArgs = (gp, name) => {
    const b = byGp.get(gp);
    const s = b && resolveAlias(b.exports.get(name));
    if (!s) return undefined;
    const sigs = checker.getTypeOfSymbol(s).getCallSignatures();
    if (!sigs.length) return undefined;
    let mx = 0;
    for (const sig of sigs) {
      const ps = sig.getParameters();
      const last = ps[ps.length - 1];
      if (last && last.valueDeclaration && ts.isParameter(last.valueDeclaration) && last.valueDeclaration.dotDotDotToken) return Infinity;
      mx = Math.max(mx, ps.length);
    }
    return mx;
  };
  return { byGp, sameExport, hasExport, isWrapper, maxArgs };
};

// ---------------------------------------------------------------------------------------------
// Package files, import graph, staging sets (hazard scope).
// ---------------------------------------------------------------------------------------------
const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', 'coverage', '.ward'].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/u.test(e.name) && !e.name.endsWith('.d.ts')) acc.push(p);
  }
  return acc;
};
const pkgFiles = walk(PKG_DIR);
const pkgFileSet = new Set(pkgFiles);
const textCache = new Map();
const readText = (f) => {
  if (!textCache.has(f)) textCache.set(f, fs.readFileSync(f, 'utf8'));
  return textCache.get(f);
};
const resolveRel = (from, spec) => {
  const base = path.resolve(path.dirname(from), spec.replace(/\.js$/u, ''));
  for (const c of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    if (pkgFileSet.has(c)) return c;
  }
  return null;
};
const importers = new Map();
const importsOf = new Map();
for (const f of pkgFiles) {
  const t = readText(f);
  const outs = new Set();
  for (const m of t.matchAll(/(?:from\s+|import\s*\(\s*|require\s*\(\s*|requireActual\s*\(\s*|module:\s*)['"](\.[^'"]+)['"]/gu)) {
    const r = resolveRel(f, m[1]);
    if (r) outs.add(r);
  }
  importsOf.set(f, outs);
  for (const o of outs) {
    if (!importers.has(o)) importers.set(o, new Set());
    importers.get(o).add(f);
  }
}
const stemOf = (f) => path.basename(f).replace(/(\.integration)?(\.test|\.proxy|\.stub|\.e2e)?\.tsx?$/u, '');
const companions = (f) => {
  const dir = path.dirname(f);
  const stem = stemOf(f);
  return ['.ts', '.tsx', '.proxy.ts', '.proxy.tsx', '.test.ts', '.test.tsx', '.integration.test.ts', '.integration.test.tsx']
    .map((s) => path.join(dir, stem + s))
    .filter((c) => pkgFileSet.has(c));
};
const stagingCache = new Map();
const stagingSet = (f) => {
  if (stagingCache.has(f)) return stagingCache.get(f);
  const seen = new Set([f]);
  const queue = [f];
  while (queue.length) {
    const x = queue.pop();
    for (const i of importers.get(x) || []) if (!seen.has(i)) { seen.add(i); queue.push(i); }
  }
  const set = new Set();
  for (const x of seen) for (const c of [x, ...companions(x)]) set.add(c);
  // proxies compose child proxies: a spy set up two proxies down still reaches this file's code
  const pq = [...set].filter((x) => /\.proxy\.tsx?$/u.test(x));
  while (pq.length) {
    const p = pq.pop();
    for (const i of importsOf.get(p) || []) if (/\.proxy\.tsx?$/u.test(i) && !set.has(i)) { set.add(i); pq.push(i); }
  }
  stagingCache.set(f, set);
  return set;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
// Returns the first staging file (relative) whose text matches, else undefined.
const hazardIn = (f, test) => {
  for (const s of stagingSet(f)) if (test(readText(s))) return rel(s);
  return undefined;
};
const GLOBAL_OBJ = '(?:globalThis|window|global)';
const hazards = {
  rawModule: (spec) => (t) => {
    const bare = spec.replace(/^node:/u, '');
    const specRe = `['"](?:node:)?${esc(bare)}['"]`;
    if (new RegExp(`(?:jest\\.mock|jest\\.requireActual|jest\\.doMock)\\(\\s*${specRe}`, 'u').test(t)) return true;
    if (new RegExp(`registerModuleMock\\(\\s*\\{[^}]*module:\\s*${specRe}`, 'u').test(t)) return true;
    const names = [];
    for (const m of t.matchAll(new RegExp(`import\\s+(?:type\\s+)?([^;]*?)\\s+from\\s+${specRe}`, 'gu'))) {
      for (const n of m[1].matchAll(/(?:\bas\s+)?(\b[A-Za-z_$][\w$]*\b)(?=\s*(?:,|\}|$))/gu)) names.push(n[1]);
      const ns = /\*\s+as\s+([\w$]+)/u.exec(m[1]);
      if (ns) names.push(ns[1]);
      const def = /^\s*([\w$]+)/u.exec(m[1]);
      if (def) names.push(def[1]);
    }
    return names.some((n) =>
      new RegExp(`(?:registerMock\\(\\s*\\{\\s*fn:\\s*|registerSpyOn\\(\\s*\\{\\s*object:\\s*|jest\\.spyOn\\(\\s*)${esc(n)}\\b`, 'u').test(t),
    );
  },
  processProp: (prop) => (t) =>
    new RegExp(
      [
        `Object\\.defineProperty\\(\\s*process\\s*,\\s*['"]${prop}['"]`,
        `Object\\.getOwnPropertyDescriptor\\(\\s*process\\s*,\\s*['"]${prop}['"]`,
        `\\bprocess\\.${prop}\\s*=(?!=)`,
        `delete\\s+process\\.${prop}\\b`,
        `(?:registerSpyOn\\(\\s*\\{\\s*object:\\s*process\\s*,\\s*method:|jest\\.spyOn\\(\\s*process\\s*,)\\s*['"]${prop}['"]`,
      ].join('|'),
      'u',
    ).test(t),
  global: (name, fakeTimers) => (t) =>
    new RegExp(
      [
        `Object\\.defineProperty\\(\\s*${GLOBAL_OBJ}\\s*,\\s*['"]${name}['"]`,
        `\\b${GLOBAL_OBJ}\\.${name}\\s*=(?!=)`,
        `delete\\s+${GLOBAL_OBJ}\\.${name}\\b`,
        `(?:registerSpyOn\\(\\s*\\{\\s*object:\\s*${GLOBAL_OBJ}\\s*,\\s*method:|jest\\.spyOn\\(\\s*${GLOBAL_OBJ}\\s*,)\\s*['"]${name}['"]`,
        ...(fakeTimers ? ['useFakeTimers'] : []),
      ].join('|'),
      'u',
    ).test(t),
  nodeCrypto: () => (t) =>
    /(?:registerSpyOn\(\s*\{\s*object:\s*|jest\.spyOn\(\s*)(?:globalThis\.)?crypto\b/u.test(t) ||
    /Object\.defineProperty\(\s*(?:globalThis|global)\s*,\s*['"]crypto['"]/u.test(t),
};

// ---------------------------------------------------------------------------------------------
// Tables.
// ---------------------------------------------------------------------------------------------
const PROCESS_GP = '#gateway/node/process';
// process.<member> -> how it moves. call: only as a callee, max args; capture: load-time value.
const PROCESS_MEMBERS = {
  cwd: { name: 'cwd', kind: 'callOrValue' },
  exit: { name: 'exit', kind: 'call', max: 1 },
  on: { name: 'on', kind: 'call', min: 2, max: 2 },
  kill: { name: 'kill', kind: 'call', min: 1, max: 2 },
  chdir: { name: 'chdir', kind: 'call', min: 1, max: 1 },
  emit: { name: 'emit', kind: 'call', min: 1 },
  removeAllListeners: { name: 'removeAllListeners', kind: 'call', max: 1 },
  nextTick: { name: 'nextTick', kind: 'call', min: 1, max: 1 },
  pid: { name: 'pid', kind: 'capture' },
  argv: { name: 'argv', kind: 'capture' },
  platform: { name: 'platform', kind: 'capture' },
  execPath: { name: 'execPath', kind: 'capture' },
  stdout: { name: 'stdout', kind: 'capture' },
  stderr: { name: 'stderr', kind: 'capture' },
  stdin: { name: 'getStdin', kind: 'readCall' },
};
// A load-time captured timer is bypassed by jest fake timers installed after module load.
const TIMER_NAME = /^(set|clear)(Timeout|Interval|Immediate)$/u;
const EVAL_CALLEES = new Set(['evaluate', 'evaluateHandle', '$eval', '$$eval', 'waitForFunction', 'addInitScript', 'evaluateAll']);

// ---------------------------------------------------------------------------------------------
// Per-file transform.
// ---------------------------------------------------------------------------------------------
const sideOf = (f) => {
  const r = rel(f);
  return r.startsWith('packages/web/src/') && !r.endsWith('.e2e.ts') ? 'browser' : 'node';
};
const isTestLike = (f) => /\.(test|proxy|stub|e2e)\.tsx?$|\.harness\.tsx?$|\/test\//u.test(f);

const declaredNamesOf = (sf) => {
  const names = new Set();
  const addBinding = (n) => {
    if (!n) return;
    if (ts.isIdentifier(n)) names.add(n.text);
    else if (ts.isObjectBindingPattern(n) || ts.isArrayBindingPattern(n)) for (const el of n.elements) if (!ts.isOmittedExpression(el)) addBinding(el.name);
  };
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) || ts.isParameter(n)) addBinding(n.name);
    else if ((ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isClassDeclaration(n) || ts.isClassExpression(n) || ts.isEnumDeclaration(n) || ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isModuleDeclaration(n)) && n.name && ts.isIdentifier(n.name)) names.add(n.name.text);
    else if (ts.isImportClause(n) && n.name) names.add(n.name.text);
    else if (ts.isImportSpecifier(n) || ts.isNamespaceImport(n) || ts.isImportEqualsDeclaration(n)) names.add(n.name.text);
    else if (ts.isTypeParameterDeclaration(n)) names.add(n.name.text);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return names;
};

const evalRangesOf = (sf) => {
  const ranges = [];
  const visit = (n) => {
    if (ts.isCallExpression(n)) {
      const c = n.expression;
      const nm = ts.isPropertyAccessExpression(c) ? c.name.text : ts.isIdentifier(c) ? c.text : '';
      if (EVAL_CALLEES.has(nm)) for (const a of n.arguments) if (ts.isArrowFunction(a) || ts.isFunctionExpression(a)) ranges.push([a.pos, a.end]);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return ranges;
};

const nodeAt = (sf, pos) => {
  let found;
  const visit = (n) => {
    if (n.getStart(sf) <= pos && pos < n.end) {
      found = n;
      ts.forEachChild(n, visit);
    }
  };
  ts.forEachChild(sf, visit);
  return found;
};

const isWriteTarget = (e) => {
  const p = e.parent;
  if (!p) return false;
  if (ts.isBinaryExpression(p) && p.left === e && p.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && p.operatorToken.kind <= ts.SyntaxKind.LastAssignment) return true;
  if ((ts.isPrefixUnaryExpression(p) || ts.isPostfixUnaryExpression(p)) && (p.operator === ts.SyntaxKind.PlusPlusToken || p.operator === ts.SyntaxKind.MinusMinusToken)) return true;
  if (ts.isDeleteExpression(p)) return true;
  if ((ts.isForInStatement(p) || ts.isForOfStatement(p)) && p.initializer === e) return true;
  if (ts.isShorthandPropertyAssignment(p) || ts.isArrayLiteralExpression(p) || ts.isSpreadElement(p)) {
    // destructuring-assignment targets
    let q = p;
    while (q && (ts.isArrayLiteralExpression(q) || ts.isObjectLiteralExpression(q) || ts.isPropertyAssignment(q) || ts.isShorthandPropertyAssignment(q) || ts.isSpreadElement(q))) q = q.parent;
    if (q && ts.isBinaryExpression(q) && q.operatorToken.kind === ts.SyntaxKind.EqualsToken) return true;
  }
  return false;
};

const transformFile = (f, messages, gw, excluded = new Map()) => {
  const text = readText(f);
  const sf = ts.createSourceFile(f, text, ts.ScriptTarget.Latest, true, f.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const side = sideOf(f);
  const declared = declaredNamesOf(sf);
  const evalRanges = evalRangesOf(sf);
  const inEval = (n) => evalRanges.some(([a, b]) => n.pos >= a && n.end <= b);
  const edits = [];
  const notes = [];
  const skips = [];
  const gaps = [];
  const needed = new Map(); // gp -> Set(names)
  const swapped = new Map(); // importDecl -> gp
  const handledImportDecls = new Set();
  const keyNodes = new Map(); // key -> [[start,end]] in the original text
  const gpKeys = new Map(); // gp -> Set(keys) that need it
  const track = (key, n) => {
    if (!keyNodes.has(key)) keyNodes.set(key, []);
    keyNodes.get(key).push([n.getStart(sf), n.end]);
  };
  const need = (gp, name, key) => {
    if (!needed.has(gp)) needed.set(gp, new Set());
    needed.get(gp).add(name);
    if (!gpKeys.has(gp)) gpKeys.set(gp, new Set());
    gpKeys.get(gp).add(key);
  };
  const isExcluded = (key, line) => {
    if (!excluded.has(key)) return false;
    skip(line, `dropped after verification: ${excluded.get(key)}`);
    return true;
  };
  const posOf = (m) => {
    const starts = sf.getLineStarts();
    if (m.line - 1 >= starts.length) return -1;
    return starts[m.line - 1] + m.column - 1;
  };
  const lineOf = (n) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
  const skip = (line, reason, what) => skips.push({ line, reason, what });
  const gap = (line, what) => gaps.push({ line, what });
  const replace = (n, textNew, note) => {
    edits.push({ start: n.getStart(sf), end: n.end, text: textNew });
    if (note) notes.push(`L${lineOf(n)}: ${note}`);
  };
  const nameFree = (name) => !declared.has(name);
  // enforce-proxy-child-creation: once an implementation imports a gateway WRAPPER, its own proxy must
  // import and create that wrapper's proxy. That is proxy work, so such a construct is left for hand work.
  const companionProxy = ['.proxy.ts', '.proxy.tsx'].map((s) => f.replace(/\.tsx?$/u, s)).find((c) => !/\.(test|proxy|stub|e2e|harness)\.tsx?$/u.test(f) && fs.existsSync(c));
  const proxyBlock = (gp, name) => {
    if (!companionProxy) return undefined;
    const b = gw.byGp.get(gp);
    if (!b || !b.localWrappers.includes(name)) return undefined;
    if (new RegExp(`\\b${name}Proxy\\b`, 'u').test(readText(companionProxy))) return undefined;
    return `'${name}' is a gateway wrapper; ${rel(companionProxy)} must then compose ${name}Proxy (proxy work)`;
  };
  // names already imported from a gateway path (so adding them again is a no-op)
  const existingGatewayImport = (gp) =>
    sf.statements.find((st) => ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier) && st.moduleSpecifier.text === gp && st.importClause && !st.importClause.isTypeOnly);
  const alreadyImported = (gp, name) => {
    const d = existingGatewayImport(gp);
    return !!(d && d.importClause.namedBindings && ts.isNamedImports(d.importClause.namedBindings) && d.importClause.namedBindings.elements.some((e) => e.name.text === name && !e.propertyName));
  };

  // ---- A. raw imports
  const rawMsgs = messages.filter((m) => m.ruleId === '@dungeonmaster/raw-import-ban');
  for (const m of rawMsgs) {
    const pos = posOf(m);
    let n = nodeAt(sf, pos);
    while (n && !ts.isImportDeclaration(n) && !ts.isExportDeclaration(n) && !ts.isCallExpression(n) && !ts.isImportEqualsDeclaration(n)) n = n.parent;
    const gpm = /through the gateway: "([^"]+)"/u.exec(m.message);
    const gp = gpm && gpm[1];
    const specM = /Import "([^"]+)"/u.exec(m.message);
    const spec = specM && specM[1];
    if (!n || !gp) { skip(m.line, 'could not locate the import node', spec); continue; }
    if (!ts.isImportDeclaration(n) && !ts.isExportDeclaration(n)) { skip(m.line, 'require()/import()/import= of a raw module', spec); continue; }
    if (ts.isImportDeclaration(n) && !n.importClause) { skip(m.line, 'side-effect import (stays raw or needs hand work)', spec); continue; }
    if (!barrelFile(gp)) { gap(m.line, `import '${spec}': no barrel ${gp}`); continue; }
    const b = gw.byGp.get(gp);
    const haz = hazardIn(f, hazards.rawModule(spec));
    if (haz) { skip(m.line, `raw module '${spec}' is mocked/spied in the staging set`, haz); continue; }
    const problems = [];
    const typeOnlyDecl = ts.isImportDeclaration(n) ? n.importClause.isTypeOnly : n.isTypeOnly;
    if (ts.isImportDeclaration(n)) {
      const ic = n.importClause;
      const locals = [];
      if (ic.name) {
        const why = gw.sameExport(spec, gp, 'default');
        if (why) problems.push(`default: ${why}`);
        locals.push(ic.name.text);
      }
      if (ic.namedBindings && ts.isNamedImports(ic.namedBindings)) {
        for (const el of ic.namedBindings.elements) {
          const imported = (el.propertyName || el.name).text;
          if (b.typeOnly && !typeOnlyDecl && !el.isTypeOnly) problems.push(`'${imported}': ${gp} is type-only`);
          const why = gw.sameExport(spec, gp, imported);
          if (why) problems.push(why);
          locals.push(el.name.text);
        }
      }
      if (ic.namedBindings && ts.isNamespaceImport(ic.namedBindings)) {
        const ns = ic.namedBindings.name.text;
        locals.push(ns);
        const members = new Set();
        let wholeUse = false;
        const visit = (x) => {
          if (ts.isIdentifier(x) && x.text === ns && x !== ic.namedBindings.name) {
            const p = x.parent;
            if (ts.isPropertyAccessExpression(p) && p.expression === x) members.add(p.name.text);
            else if (ts.isQualifiedName(p) && p.left === x) members.add(p.right.text);
            else if (!(ts.isPropertyAccessExpression(p) && p.name === x) && !(ts.isPropertyAssignment(p) && p.name === x)) wholeUse = true;
          }
          ts.forEachChild(x, visit);
        };
        visit(sf);
        if (wholeUse) problems.push(`namespace '${ns}' used as a whole value`);
        if (b.typeOnly && !typeOnlyDecl) problems.push(`${gp} is type-only`);
        for (const mem of members) {
          const why = gw.sameExport(spec, gp, mem);
          if (why) problems.push(`${ns}.${why}`);
        }
      }
      if (locals.some((l) => {
        let hit = false;
        const visit = (x) => {
          if (hit) return;
          if (ts.isIdentifier(x) && x.text === l && inEval(x)) hit = true;
          ts.forEachChild(x, visit);
        };
        visit(sf);
        return hit;
      })) problems.push('an imported name is used inside a page.evaluate-style callback');
    } else {
      if (!n.exportClause || !ts.isNamedExports(n.exportClause)) { skip(m.line, `export * from '${spec}'`, spec); continue; }
      for (const el of n.exportClause.elements) {
        const why = gw.sameExport(spec, gp, (el.propertyName || el.name).text);
        if (why) problems.push(why);
      }
    }
    if (problems.length) { skip(m.line, `import '${spec}' -> ${gp}: ${[...new Set(problems)].join('; ')}`, spec); continue; }
    const ikey = `import:${spec}@${m.line}`;
    if (isExcluded(ikey, m.line)) continue;
    track(ikey, n);
    if (ts.isImportDeclaration(n)) {
      const ic = n.importClause;
      const locals = new Set([ic.name && ic.name.text, ...(ic.namedBindings ? (ts.isNamespaceImport(ic.namedBindings) ? [ic.namedBindings.name.text] : ic.namedBindings.elements.map((e) => e.name.text)) : [])].filter(Boolean));
      const visit = (x) => {
        if (ts.isIdentifier(x) && locals.has(x.text)) track(ikey, x);
        ts.forEachChild(x, visit);
      };
      visit(sf);
    }
    const q = n.moduleSpecifier.getText(sf)[0];
    replace(n.moduleSpecifier, `${q}${gp}${q}`, `'${spec}' -> '${gp}'`);
    swapped.set(n, gp);
    if (!gpKeys.has(gp)) gpKeys.set(gp, new Set());
    gpKeys.get(gp).add(ikey);
    handledImportDecls.add(n);
  }

  // ---- B. platform globals
  const globalMsgs = messages.filter((m) => m.ruleId === '@dungeonmaster/platform-globals-ban');
  const globalDecision = new Map(); // name -> {ok, gp} decided once per file
  const decideGlobal = (name, line) => {
    if (globalDecision.has(name)) return globalDecision.get(name);
    // Node spells some globals' module lowercase (URL -> url, Buffer -> buffer), as the rule's own
    // suggestion does; a few live in a differently named builtin.
    const NODE_MODULE_OF = { URLSearchParams: 'url', TextEncoder: 'util', TextDecoder: 'util' };
    const gp = (() => {
      if (name === 'Buffer') return '#gateway/node/buffer';
      if (side === 'browser') return `#gateway/browser/${name}`;
      for (const sub of [name, NODE_MODULE_OF[name], name.toLowerCase()]) if (sub && barrelFile(`#gateway/node/${sub}`) && gw.hasExport(`#gateway/node/${sub}`, name)) return `#gateway/node/${sub}`;
      return `#gateway/node/${name}`;
    })();
    const decide = (() => {
      if (name === 'Buffer' && side === 'browser' && !isTestLike(f)) return { skip: 'Buffer in browser runtime code' };
      if (name === 'localStorage') return { gap: `${name}: gateway API differs (readItem/writeItem/removeItem)` };
      if (!barrelFile(gp)) return { gap: side === 'node' && barrelFile(`#gateway/browser/${name}`) ? `browser global ${name} on the node side (no #gateway/node/${name}; code run in a driven browser is A19)` : `global ${name}: no barrel ${gp}` };
      if (!gw.hasExport(gp, name)) return { gap: `global ${name}: ${gp} exports no '${name}'` };
      if (!nameFree(name)) return { skip: `'${name}' is declared in this file (import would shadow/clash)` };
      if (proxyBlock(gp, name)) return { skip: proxyBlock(gp, name) };
      // every reference to the global in this file
      const refs = [];
      const visit = (x) => {
        if (ts.isIdentifier(x) && x.text === name) {
          const p = x.parent;
          const isProp = (ts.isPropertyAccessExpression(p) && p.name === x && !(ts.isIdentifier(p.expression) && p.expression.text === 'globalThis')) || (ts.isPropertyAssignment(p) && p.name === x) || (ts.isQualifiedName(p) && p.right === x) || ts.isTypeReferenceNode(p) || (ts.isImportSpecifier(p)) || ts.isPropertySignature(p) || ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p);
          if (!isProp) refs.push(x);
        }
        ts.forEachChild(x, visit);
      };
      visit(sf);
      if (refs.some(inEval)) return { skip: `'${name}' used inside a page.evaluate-style callback` };
      const maxArgs = gw.isWrapper(gp, name) ? gw.maxArgs(gp, name) : undefined;
      if (maxArgs !== undefined) {
        for (const r of refs) {
          const target = ts.isPropertyAccessExpression(r.parent) && r.parent.name === r ? r.parent : r;
          const c = target.parent;
          if (ts.isCallExpression(c) && c.expression === target && c.arguments.length > maxArgs) return { skip: `${name}(...) called with ${c.arguments.length} args; gateway wrapper takes ${maxArgs}` };
          if (ts.isCallExpression(c) && c.expression === target && c.arguments.some((a) => ts.isSpreadElement(a))) return { skip: `${name}(...) called with a spread` };
        }
      }
      const captured = maxArgs === undefined;
      const fake = captured && TIMER_NAME.test(name);
      const haz = hazardIn(f, hazards.global(name, fake));
      if (haz) {
        // A call-time wrapper still reaches a spy or replacement on the global, and hands it the
        // same arguments when every use is a call with the wrapper's full argument list.
        const fullArity = !captured && refs.every((r) => {
          const target = ts.isPropertyAccessExpression(r.parent) && r.parent.name === r ? r.parent : r;
          const c = target.parent;
          return ts.isCallExpression(c) && c.expression === target && (maxArgs === Infinity || c.arguments.length === maxArgs);
        });
        if (!fullArity) return { skip: `global '${name}' replaced/spied${fake ? '/fake-timed' : ''} in the staging set${captured ? ' (load-time capture)' : ' and a use is not a full-arity call'}`, where: haz };
      }
      return { ok: true, gp, refs };
    })();
    globalDecision.set(name, decide);
    return decide;
  };

  const needOuter = need;
  const handleProcess = (id, line) => {
    const p = id.parent;
    if (side === 'browser') { gap(line, 'process on the browser side'); return; }
    if (inEval(id)) { skip(line, 'process inside a page.evaluate-style callback'); return; }
    if (!ts.isPropertyAccessExpression(p) || p.expression !== id) {
      skip(line, 'process used as a whole value (defineProperty / spy target / destructure / pass-through)');
      return;
    }
    const member = p.name.text;
    const gp = PROCESS_GP;
    const gpp = p.parent;
    const pkey = `process:${member}`;
    if (isExcluded(pkey, line)) return;
    track(pkey, p);
    const need = (g, nm) => needOuter(g, nm, pkey);
    if (member === 'env') {
      let target;
      let key;
      if (ts.isPropertyAccessExpression(gpp) && gpp.expression === p) { target = gpp; key = `'${gpp.name.text}'`; }
      else if (ts.isElementAccessExpression(gpp) && gpp.expression === p) { target = gpp; key = gpp.argumentExpression.getText(sf); }
      else if (ts.isSpreadAssignment(gpp) && gpp.expression === p) {
        if (!nameFree('envSnapshot')) { skip(line, "'envSnapshot' declared in this file"); return; }
        if (proxyBlock(gp, 'envSnapshot')) { skip(line, proxyBlock(gp, 'envSnapshot')); return; }
        replace(p, 'envSnapshot()', '...process.env -> ...envSnapshot()');
        need(gp, 'envSnapshot');
        return;
      } else if (
        ts.isCallExpression(gpp) && gpp.arguments.length === 2 && gpp.arguments[0] === p &&
        ts.isPropertyAccessExpression(gpp.expression) && gpp.expression.getText(sf) === 'Reflect.deleteProperty' &&
        ts.isExpressionStatement(gpp.parent)
      ) {
        if (!ENV_WRITES || !nameFree('deleteEnv') || proxyBlock(gp, 'deleteEnv')) { skip(line, 'Reflect.deleteProperty(process.env, K) (deleteEnv by hand, or --env-writes)'); return; }
        replace(gpp, `deleteEnv(${gpp.arguments[1].getText(sf)})`, 'Reflect.deleteProperty(process.env, K) -> deleteEnv(K)');
        need(gp, 'deleteEnv');
        return;
      } else { skip(line, 'process.env as a whole value'); return; }
      if (isWriteTarget(target)) {
        const w = target.parent;
        if (ENV_WRITES && ts.isBinaryExpression(w) && w.left === target && w.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isExpressionStatement(w.parent) && nameFree('setEnv') && !proxyBlock(gp, 'setEnv')) {
          replace(w, `setEnv(${key}, ${w.right.getText(sf)})`, `process.env[${key}] = v -> setEnv(${key}, v)`);
          need(gp, 'setEnv');
          return;
        }
        if (ENV_WRITES && ts.isDeleteExpression(w) && ts.isExpressionStatement(w.parent) && nameFree('deleteEnv') && !proxyBlock(gp, 'deleteEnv')) {
          replace(w, `deleteEnv(${key})`, `delete process.env[${key}] -> deleteEnv(${key})`);
          need(gp, 'deleteEnv');
          return;
        }
        skip(line, 'process.env write/delete (setEnv/deleteEnv by hand)');
        return;
      }
      if (ts.isCallExpression(target.parent) && target.parent.expression === target) { skip(line, 'process.env.X called'); return; }
      if (!nameFree('getEnv')) { skip(line, "'getEnv' declared in this file"); return; }
      if (proxyBlock(gp, 'getEnv')) { skip(line, proxyBlock(gp, 'getEnv')); return; }
      replace(target, `getEnv(${key})`, `${target.getText(sf)} -> getEnv(${key})`);
      need(gp, 'getEnv');
      return;
    }
    if (member === 'exitCode') {
      if (ts.isBinaryExpression(gpp) && gpp.left === p && gpp.operatorToken.kind === ts.SyntaxKind.EqualsToken && ts.isExpressionStatement(gpp.parent)) {
        if (!nameFree('setExitCode')) { skip(line, "'setExitCode' declared in this file"); return; }
        if (proxyBlock(gp, 'setExitCode')) { skip(line, proxyBlock(gp, 'setExitCode')); return; }
        replace(gpp, `setExitCode(${gpp.right.getText(sf)})`, 'process.exitCode = v -> setExitCode(v)');
        need(gp, 'setExitCode');
        return;
      }
      if (isWriteTarget(p)) { skip(line, 'process.exitCode compound write'); return; }
      if (!nameFree('getExitCode')) { skip(line, "'getExitCode' declared in this file"); return; }
      if (proxyBlock(gp, 'getExitCode')) { skip(line, proxyBlock(gp, 'getExitCode')); return; }
      replace(p, 'getExitCode()', 'process.exitCode -> getExitCode()');
      need(gp, 'getExitCode');
      return;
    }
    const spec = PROCESS_MEMBERS[member];
    if (!spec) { gap(line, `process.${member}: no #gateway/node/process export`); return; }
    if (!gw.hasExport(gp, spec.name)) { gap(line, `process.${member}: ${gp} exports no '${spec.name}'`); return; }
    if (isWriteTarget(p)) { skip(line, `process.${member} write`); return; }
    if (!nameFree(spec.name)) { skip(line, `'${spec.name}' is declared in this file (import would shadow/clash)`); return; }
    const isCallee = ts.isCallExpression(gpp) && gpp.expression === p;
    if (spec.kind === 'call') {
      if (!isCallee) { skip(line, `process.${member} used as a value`); return; }
      const n = gpp.arguments.length;
      if ((spec.max !== undefined && n > spec.max) || (spec.min !== undefined && n < spec.min) || gpp.arguments.some(ts.isSpreadElement)) { skip(line, `process.${member}(${n} args) does not fit ${spec.name}()`); return; }
    }
    let useName = spec.name;
    let useKind = spec.kind;
    if (spec.kind === 'capture') {
      const haz = hazardIn(f, hazards.processProp(member));
      if (haz) {
        // a call-time getter reaches a redefined/spied property; the load-time capture would not
        const getter = `get${member[0].toUpperCase()}${member.slice(1)}`;
        if (!gw.hasExport(gp, getter) || !nameFree(getter)) { skip(line, `process.${member} is redefined/reassigned/spied in the staging set (load-time capture would miss it; no call-time getter)`, haz); return; }
        useName = getter;
        useKind = 'readCall';
      }
    }
    const pb = proxyBlock(gp, useName);
    if (pb) { skip(line, pb); return; }
    if (useKind === 'readCall') {
      replace(p, `${useName}()`, `process.${member} -> ${useName}()`);
    } else {
      replace(p, useName, `process.${member} -> ${useName}`);
    }
    need(gp, useName);
  };

  for (const m of globalMsgs) {
    const name = (/global "([^"]+)"/u.exec(m.message) || [])[1];
    const pos = posOf(m);
    const id = nodeAt(sf, pos);
    if (!id || !ts.isIdentifier(id) || id.text !== name) { skip(m.line, `could not locate identifier ${name}`); continue; }
    // `import { join as x } from 'path'` — cleared by the import swap itself
    if (ts.isImportSpecifier(id.parent)) {
      const decl = id.parent.parent.parent.parent;
      if (!handledImportDecls.has(decl)) skip(m.line, `${name}: raw import specifier (import not swapped)`);
      continue;
    }
    if (name === 'process') { handleProcess(id, m.line); continue; }
    if (name === 'crypto' && side === 'node') {
      const p = id.parent;
      if (isExcluded('crypto', m.line)) continue;
      track('crypto', id);
      if (inEval(id)) { skip(m.line, 'crypto inside a page.evaluate-style callback'); continue; }
      const isRandomUuidCall = ts.isPropertyAccessExpression(p) && p.expression === id && p.name.text === 'randomUUID' && ts.isCallExpression(p.parent) && p.parent.expression === p && p.parent.arguments.length === 0;
      const cryptoHaz = hazardIn(f, hazards.nodeCrypto());
      if (CRYPTO_WEBCRYPTO && (!isRandomUuidCall || cryptoHaz)) {
        if (!nameFree('webcrypto')) { skip(m.line, "'webcrypto' declared in this file"); continue; }
        if (ts.isShorthandPropertyAssignment(p)) { skip(m.line, 'crypto in a shorthand property'); continue; }
        replace(id, 'webcrypto', 'crypto -> webcrypto (same object as the global)');
        need('#gateway/node/crypto', 'webcrypto', 'crypto');
        continue;
      }
      if (ts.isPropertyAccessExpression(p) && p.expression === id && p.name.text === 'randomUUID' && ts.isCallExpression(p.parent) && p.parent.expression === p && p.parent.arguments.length === 0) {
        if (!nameFree('randomUUID')) { skip(m.line, "'randomUUID' declared in this file"); continue; }
        if (cryptoHaz) { skip(m.line, 'global crypto spied/replaced in the staging set (node randomUUID would bypass it; --crypto-webcrypto keeps it)', cryptoHaz); continue; }
        replace(p, 'randomUUID', 'crypto.randomUUID() -> randomUUID()');
        need('#gateway/node/crypto', 'randomUUID', 'crypto');
      } else {
        skip(m.line, `node-side crypto.${ts.isPropertyAccessExpression(p) && p.expression === id ? p.name.text : '<value>'} (only crypto.randomUUID() is mechanical; --crypto-webcrypto moves it)`);
      }
      continue;
    }
    const gkey = `global:${name}`;
    if (isExcluded(gkey, m.line)) continue;
    const d = decideGlobal(name, m.line);
    if (d.gap) { gap(m.line, d.gap); continue; }
    if (d.skip) { skip(m.line, d.skip, d.where); continue; }
    for (const r of d.refs) track(gkey, r);
    const p = id.parent;
    if (ts.isPropertyAccessExpression(p) && p.name === id && ts.isIdentifier(p.expression) && p.expression.text === 'globalThis') {
      if (isWriteTarget(p)) { skip(m.line, `globalThis.${name} write`); continue; }
      replace(p, name, `globalThis.${name} -> ${name}`);
    }
    need(d.gp, name, gkey);
  }

  // ---- imports for added names
  const importEdits = [];
  const declFor = (gp) => {
    for (const [decl, g] of swapped) if (g === gp && !decl.importClause.isTypeOnly && ts.isImportDeclaration(decl)) return decl;
    return existingGatewayImport(gp);
  };
  const lastImport = [...sf.statements].reverse().find((s) => ts.isImportDeclaration(s) || ts.isImportEqualsDeclaration(s));
  const newLines = [];
  const newGps = [];
  for (const [gp, names] of needed) {
    const add = [...names].filter((n) => !alreadyImported(gp, n)).sort();
    if (!add.length) continue;
    const decl = declFor(gp);
    if (decl && decl.importClause.namedBindings && ts.isNamedImports(decl.importClause.namedBindings)) {
      const nb = decl.importClause.namedBindings;
      const existing = nb.elements.map((e) => e.getText(sf));
      importEdits.push({ start: nb.getStart(sf), end: nb.end, text: `{ ${[...existing, ...add].join(', ')} }`, gps: [gp] });
    } else if (decl && !decl.importClause.namedBindings) {
      importEdits.push({ start: decl.importClause.name.end, end: decl.importClause.name.end, text: `, { ${add.join(', ')} }`, gps: [gp] });
    } else {
      newLines.push(`import { ${add.join(', ')} } from '${gp}';`);
      newGps.push(gp);
    }
    notes.push(`IMPORT { ${add.join(', ')} } from '${gp}'`);
  }
  if (newLines.length) {
    if (lastImport) importEdits.push({ start: lastImport.end, end: lastImport.end, text: `\n${newLines.join('\n')}`, gps: newGps });
    else {
      const first = sf.statements[0];
      const at = first ? first.getStart(sf) : text.length;
      importEdits.push({ start: at, end: at, text: `${newLines.join('\n')}\n\n`, gps: newGps });
    }
  }
  const all = [...edits, ...importEdits].sort((a, b) => b.start - a.start || b.end - a.end);
  for (let i = 1; i < all.length; i++) {
    if (all[i].end > all[i - 1].start && !(all[i].start === all[i].end && all[i - 1].start === all[i - 1].end)) {
      return { newText: text, notes: [], skips: [{ line: 0, reason: 'overlapping edits (script bug) - file untouched' }, ...skips], gaps };
    }
  }
  let newText = text;
  for (const e of all) newText = newText.slice(0, e.start) + e.text + newText.slice(e.end);
  // key -> lines in the NEW text, so a verification problem can be pinned on the construct behind it
  const asc = [...all].sort((a, b) => a.start - b.start);
  const lineStarts = [0];
  for (let i = 0; i < newText.length; i++) if (newText[i] === '\n') lineStarts.push(i + 1);
  const lineAt = (pos) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= pos) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
  const mapPos = (pos) => {
    let delta = 0;
    for (const e of asc) {
      if (e.end <= pos && !(e.start === e.end && e.start === pos)) delta += e.text.length - (e.end - e.start);
      else if (e.start <= pos && pos < e.end) return e.start + delta;
    }
    return pos + delta;
  };
  const keyLines = new Map();
  const addLine = (k, l) => {
    if (!keyLines.has(k)) keyLines.set(k, new Set());
    keyLines.get(k).add(l);
  };
  for (const [k, ranges] of keyNodes) for (const [s, e] of ranges) for (let l = lineAt(mapPos(s)); l <= lineAt(Math.max(mapPos(s), mapPos(e) - 1)); l++) addLine(k, l);
  for (const e of importEdits) {
    const ns = mapPos(e.start);
    for (let l = lineAt(ns); l <= lineAt(ns + Math.max(0, e.text.length - 1)); l++) for (const gp of e.gps || []) for (const k of gpKeys.get(gp) || []) addLine(k, l);
  }
  return { newText, notes, skips, gaps, keyLines };
};

// ---------------------------------------------------------------------------------------------
// Verification: typecheck (package tsconfig) and full ESLint, before vs after, per changed file.
// ---------------------------------------------------------------------------------------------
const typecheckRegressions = (changed) => {
  const cfgPath = path.join(PKG_DIR, 'tsconfig.json');
  const cfg = ts.getParsedCommandLineOfConfigFile(cfgPath, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} });
  const host = ts.createCompilerHost(cfg.options, true);
  const before = ts.createProgram({ rootNames: cfg.fileNames, options: cfg.options, host });
  const afterHost = { ...host };
  const newTexts = new Map([...changed].map(([f, t]) => [path.resolve(f), t]));
  afterHost.getSourceFile = (fileName, lang, onErr, shouldCreate) => {
    const t = newTexts.get(path.resolve(fileName));
    if (t !== undefined) return ts.createSourceFile(fileName, t, lang, true);
    return host.getSourceFile(fileName, lang, onErr, shouldCreate);
  };
  afterHost.readFile = (fileName) => {
    const t = newTexts.get(path.resolve(fileName));
    return t !== undefined ? t : host.readFile(fileName);
  };
  const after = ts.createProgram({ rootNames: cfg.fileNames, options: cfg.options, host: afterHost, oldProgram: before });
  const diagKey = (d) => `TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
  const result = new Map();
  for (const f of changed.keys()) {
    const sb = before.getSourceFile(f);
    const sa = after.getSourceFile(f);
    if (!sb || !sa) { result.set(f, null); continue; }
    const cnt = new Map();
    for (const d of [...before.getSyntacticDiagnostics(sb), ...before.getSemanticDiagnostics(sb)]) cnt.set(diagKey(d), (cnt.get(diagKey(d)) || 0) + 1);
    const fresh = [];
    for (const d of [...after.getSyntacticDiagnostics(sa), ...after.getSemanticDiagnostics(sa)]) {
      const k = diagKey(d);
      if (cnt.get(k)) cnt.set(k, cnt.get(k) - 1);
      else fresh.push({ line: sa.getLineAndCharacterOfPosition(d.start || 0).line + 1, text: `typecheck L${sa.getLineAndCharacterOfPosition(d.start || 0).line + 1} ${k}`.slice(0, 220) });
    }
    result.set(f, fresh);
  }
  return result;
};

const CENSUS_RULES = new Set(['@dungeonmaster/raw-import-ban', '@dungeonmaster/platform-globals-ban', '@dungeonmaster/bin-program-spawn-ban']);
const IGNORED_FULL_RULES = new Set(['prettier/prettier', ...CENSUS_RULES]);

const main = async () => {
  const { ESLint } = require('eslint');
  const censusEslint = new ESLint({ overrideConfigFile: 'tmp/a18-census.config.js', cwd: ROOT, errorOnUnmatchedPattern: false });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const censusPath = path.join(OUT_DIR, `census-${PKG}.json`);
  let census;
  const t0 = Date.now();
  if (REUSE && fs.existsSync(censusPath)) census = JSON.parse(fs.readFileSync(censusPath, 'utf8'));
  else {
    const results = await censusEslint.lintFiles(FILES ? FILES.map(rel) : [`packages/${PKG}`]);
    census = results
      .filter((r) => r.messages.length)
      .map((r) => ({ filePath: rel(r.filePath), messages: r.messages.map((m) => ({ ruleId: m.ruleId, line: m.line, column: m.column, message: m.message, fatal: m.fatal })) }));
    if (!FILES) {
      fs.writeFileSync(censusPath, JSON.stringify(census, null, 1));
      fs.writeFileSync(path.join(ROOT, 'tmp/a18-census', `${PKG}.json`), JSON.stringify(census.map((r) => ({ filePath: r.filePath, messages: r.messages.map(({ column, ...rest }) => rest) })), null, 1));
    }
  }
  const tCensus = Date.now() - t0;
  const gw = buildGatewayIndex();

  const lines = [];
  const say = (s) => lines.push(s);
  const skipCounts = new Map();
  const gapCounts = new Map();
  const changed = new Map();
  const perFile = new Map();
  let totalMsgs = 0;
  for (const r of census) {
    const f = path.join(ROOT, r.filePath);
    const msgs = r.messages.filter((m) => m.ruleId && m.line);
    totalMsgs += r.messages.length;
    if (!msgs.length || !fs.existsSync(f)) { perFile.set(f, { census: r.messages.length, skips: [], gaps: [], notes: [], fatal: true }); continue; }
    const res = transformFile(f, msgs, gw);
    perFile.set(f, { census: r.messages.length, ...res });
    if (res.newText !== readText(f)) changed.set(f, res.newText);
  }

  // verification, with attribution: a new problem on a line only one moved construct touches drops
  // that construct and retries the file; a problem nothing can be pinned on rejects the whole file.
  const rejected = new Map();
  const remaining = new Map();
  const excludedByFile = new Map();
  if (!NOVERIFY && changed.size) {
    const fullEslint = new ESLint({ cwd: ROOT });
    const baseLint = new Map();
    let pending = new Map(changed);
    for (let round = 1; pending.size && round <= 5; round++) {
      const problems = new Map();
      const tc = typecheckRegressions(pending);
      for (const [f, fresh] of tc) if (fresh && fresh.length) problems.set(f, fresh);
      for (const [f, newText] of pending) {
        if (problems.has(f)) continue;
        if (!baseLint.has(f)) {
          const [b] = await fullEslint.lintText(readText(f), { filePath: f });
          baseLint.set(f, b.messages);
        }
        const [a] = await fullEslint.lintText(newText, { filePath: f });
        const cnt = new Map();
        for (const m of baseLint.get(f)) if (!IGNORED_FULL_RULES.has(m.ruleId)) cnt.set(`${m.ruleId}|${m.message}`, (cnt.get(`${m.ruleId}|${m.message}`) || 0) + 1);
        const fresh = [];
        for (const m of a.messages) {
          if (IGNORED_FULL_RULES.has(m.ruleId)) continue;
          const k = `${m.ruleId}|${m.message}`;
          if (cnt.get(k)) cnt.set(k, cnt.get(k) - 1);
          else fresh.push({ line: m.line, text: `lint L${m.line} ${m.ruleId || 'fatal'}: ${m.message}`.slice(0, 220) });
        }
        if (fresh.length) problems.set(f, fresh);
      }
      const next = new Map();
      for (const [f, fresh] of problems) {
        const info = perFile.get(f);
        const excl = excludedByFile.get(f) || new Map();
        let pinnedAll = true;
        for (const pr of fresh) {
          const keys = [...info.keyLines].filter(([, ls]) => ls.has(pr.line)).map(([k]) => k);
          if (!keys.length) { pinnedAll = false; break; }
          for (const k of keys) if (!excl.has(k)) excl.set(k, pr.text.replace(/ L\d+ /u, ' '));
        }
        if (!pinnedAll) { rejected.set(f, fresh.map((x) => x.text)); changed.delete(f); continue; }
        excludedByFile.set(f, excl);
        const census1 = census.find((r) => path.join(ROOT, r.filePath) === f);
        const res = transformFile(f, census1.messages.filter((m) => m.ruleId && m.line), gw, excl);
        perFile.set(f, { census: info.census, ...res });
        if (res.newText === readText(f)) changed.delete(f);
        else { changed.set(f, res.newText); next.set(f, res.newText); }
      }
      pending = next;
      if (round === 5) for (const f of pending.keys()) { rejected.set(f, ['still failing after 5 verification rounds']); changed.delete(f); }
    }
    for (const [f, newText] of changed) {
      const [c] = await censusEslint.lintText(newText, { filePath: f });
      remaining.set(f, c.messages.filter((m) => CENSUS_RULES.has(m.ruleId)).length);
    }
  }

  let cleared = 0;
  let fullyCleared = 0;
  let filesChanged = 0;
  for (const [f, info] of perFile) {
    const isChanged = changed.has(f);
    const rem = isChanged ? (NOVERIFY ? undefined : remaining.get(f)) : info.census;
    if (isChanged) {
      filesChanged++;
      if (rem !== undefined) { cleared += info.census - rem; if (rem === 0) fullyCleared++; }
    }
    say(`== ${rel(f)}  census=${info.census}${isChanged ? ` after=${rem === undefined ? '?' : rem}` : ''}${rejected.has(f) ? '  REJECTED' : ''}${info.fatal ? '  (parse error / no located messages)' : ''}`);
    for (const n of info.notes || []) say(`   CHANGE ${n}`);
    for (const s of info.skips) {
      say(`   SKIP L${s.line}: ${s.reason}${s.what ? ` [${s.what}]` : ''}`);
      const key = s.reason.replace(/L\d+/gu, '').replace(/\d+ args/gu, 'N args');
      skipCounts.set(key, (skipCounts.get(key) || []).concat(`${rel(f)}:${s.line}`));
    }
    for (const g of info.gaps) {
      say(`   GAP L${g.line}: ${g.what}`);
      gapCounts.set(g.what, (gapCounts.get(g.what) || []).concat(`${rel(f)}:${g.line}`));
    }
    for (const r of rejected.get(f) || []) say(`   REJECT ${r}`);
  }
  say('');
  const fatalMsgs = census.reduce((a, r) => a + r.messages.filter((m) => !m.ruleId).length, 0);
  say(`SUMMARY ${PKG}: census messages=${totalMsgs} (parse errors ${fatalMsgs}) in ${census.length} files; files changed=${filesChanged} (rejected ${rejected.size}); messages cleared=${NOVERIFY ? '?' : cleared}; left=${NOVERIFY ? '?' : totalMsgs - cleared}; files fully cleared=${NOVERIFY ? '?' : fullyCleared}; census ${Math.round(tCensus / 1000)}s`);
  say('SKIPS by reason:');
  for (const [k, v] of [...skipCounts].sort((a, b) => b[1].length - a[1].length)) say(`  ${v.length}  ${k}  e.g. ${v.slice(0, 3).join(', ')}`);
  say('GAPS:');
  const gapByKind = new Map();
  for (const [k, v] of gapCounts) {
    const kind = k.replace(/ L\d+.*$/u, '');
    gapByKind.set(kind, (gapByKind.get(kind) || []).concat(v));
  }
  for (const [k, v] of [...gapByKind].sort((a, b) => b[1].length - a[1].length)) say(`  ${v.length}  ${k}  e.g. ${v.slice(0, 3).join(', ')}`);

  say('REJECTED (file left untouched) by first new problem:');
  const rejCounts = new Map();
  for (const [f, rs] of rejected) {
    const k = rs[0].replace(/^(typecheck|lint) L\d+ /u, '$1 ').replace(/"[^"]*"|'[^']*'/gu, '…').slice(0, 140);
    rejCounts.set(k, (rejCounts.get(k) || []).concat(rel(f)));
  }
  for (const [k, v] of [...rejCounts].sort((a, b) => b[1].length - a[1].length)) say(`  ${v.length}  ${k}  e.g. ${v.slice(0, 2).join(', ')}`);
  if (APPLY) {
    for (const [f, t] of changed) fs.writeFileSync(f, t);
    say(`APPLIED ${filesChanged} files`);
  }
  const report = lines.join('\n');
  const flagTag = [ENV_WRITES && 'env-writes', CRYPTO_WEBCRYPTO && 'crypto-webcrypto'].filter(Boolean).join('+');
  fs.writeFileSync(path.join(OUT_DIR, `${APPLY ? 'apply' : 'dry'}-${PKG}${flagTag ? `.${flagTag}` : ''}${FILES ? '.files' : ''}.txt`), `${report}\n`);
  console.log(report.split('\n').filter((l) => /^(SUMMARY|APPLIED)/u.test(l)).join('\n'));
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
