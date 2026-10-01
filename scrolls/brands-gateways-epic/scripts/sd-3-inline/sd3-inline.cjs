#!/usr/bin/env node
/**
 * SD-3: inlines every thin adapter that A-1's table marks `inline` into its callers, in a tree you name.
 *
 * Usage:
 *   node sd3-inline.cjs <root> [apply] [--rows=<package|adapterName|adapter-file-base>,...] [--out=<dir>]
 *
 * Without `apply` it is a dry run: it prints what it would do and writes only the leftover reports.
 * With `apply` it writes the edited files under <root>.
 *
 * It reads `<root>/scrolls/brands-gateways-epic/items/a-adapter-table.md`, takes every row whose kind is
 * `inline`, and for each adapter:
 *   - reads the adapter's own body and finds the one raw call (or raw `process.<x>` read) it wraps;
 *   - swaps that raw call for the table's gateway call, then inlines the whole body at each call site;
 *   - reads the adapter's proxy and the gateway wrapper's proxy, and maps each adapter-proxy method onto a
 *     gateway-proxy method only where the two method bodies prove the mapping (same mocked function,
 *     same read-back or same staging);
 *   - transplants an adapter proxy that mocks nothing and wraps a pass-through gateway into its caller's
 *     proxy, and an adapter body that cannot become one expression into a caller that only delegates to it.
 * It never writes an edit it cannot prove. Every other site goes to the LEFT list, with file, line and
 * reason, in `<out>/leftovers-<package>.json`. A row whose gateway call is a GAP is skipped and reported.
 * Output order is fixed: rows in table order, files and entries sorted.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SCRIPT_REPO = path.resolve(__dirname, '../../../..');
const ts = require(path.join(SCRIPT_REPO, 'node_modules/typescript'));

const K = ts.SyntaxKind;
const PRIMARY = new Set([
  K.Identifier, K.PropertyAccessExpression, K.ElementAccessExpression, K.CallExpression, K.NewExpression,
  K.StringLiteral, K.NoSubstitutionTemplateLiteral, K.TemplateExpression, K.NumericLiteral, K.TrueKeyword,
  K.FalseKeyword, K.NullKeyword, K.ThisKeyword, K.ArrayLiteralExpression, K.ObjectLiteralExpression,
  K.ParenthesizedExpression, K.NonNullExpression, K.RegularExpressionLiteral,
]);
const SAFE_SLOT_PARENTS = new Set([
  K.VariableDeclaration, K.ReturnStatement, K.ExpressionStatement, K.ArrayLiteralExpression,
  K.ParenthesizedExpression, K.TemplateSpan, K.ArrowFunction, K.PropertyAssignment,
]);
const PH = '\u0001';

// ---------------------------------------------------------------------------------------------------------
// small helpers

const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const readText = (p) => fs.readFileSync(p, 'utf8');
const parse = (file, text) =>
  ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const lineOf = (text, pos) => {
  let n = 1;
  for (let i = 0; i < pos && i < text.length; i += 1) if (text.charCodeAt(i) === 10) n += 1;
  return n;
};
const isRawSpec = (spec) => !spec.startsWith('.') && !spec.startsWith('#gateway/') && !spec.startsWith('@assayer/');
const normSpec = (spec) => spec.replace(/^node:/, '');
const unwrapParens = (n) => (n && ts.isParenthesizedExpression(n) ? unwrapParens(n.expression) : n);
const indentOf = (text, pos) => {
  const ls = text.lastIndexOf('\n', pos - 1) + 1;
  return /^[ \t]*/.exec(text.slice(ls))[0];
};
const reindent = (block, indent) => {
  const lines = block.replace(/\s+$/, '').split('\n');
  const widths = lines.slice(1).filter((l) => l.trim()).map((l) => /^[ \t]*/.exec(l)[0].length);
  const cut = widths.length ? Math.min(...widths) : 0;
  return lines.map((l, i) => (i === 0 ? l.trim() : l.trim() ? indent + l.slice(cut) : '')).join('\n');
};

/** Returns every identifier imported by a source file: name -> { spec, isType }. */
const importsOf = (sf) => {
  const out = new Map();
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const spec = st.moduleSpecifier.text;
    const clauseType = st.importClause.isTypeOnly;
    if (st.importClause.name) out.set(st.importClause.name.text, { spec, isType: clauseType, isDefault: true });
    const nb = st.importClause.namedBindings;
    if (nb && ts.isNamedImports(nb)) {
      for (const el of nb.elements) out.set(el.name.text, { spec, isType: clauseType || el.isTypeOnly, imported: (el.propertyName || el.name).text });
    } else if (nb && ts.isNamespaceImport(nb)) {
      out.set(nb.name.text, { spec, isType: clauseType, isNamespace: true });
    }
  }
  return out;
};

/** Names declared at module level other than imports: name -> node. */
const moduleDeclsOf = (sf) => {
  const out = new Map();
  for (const st of sf.statements) {
    if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) if (ts.isIdentifier(d.name)) out.set(d.name.text, d);
    } else if ((ts.isFunctionDeclaration(st) || ts.isClassDeclaration(st) || ts.isTypeAliasDeclaration(st) || ts.isInterfaceDeclaration(st)) && st.name) {
      out.set(st.name.text, st);
    }
  }
  return out;
};

/** Every name bound anywhere in a node (variables, parameters, functions), for capture checks. */
const boundNamesIn = (node) => {
  const out = new Set();
  const visit = (n) => {
    if ((ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n)) && ts.isIdentifier(n.name)) out.add(n.name.text);
    if ((ts.isFunctionDeclaration(n) || ts.isClassDeclaration(n)) && n.name) out.add(n.name.text);
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
};

const isDeclarationName = (id) => {
  const p = id.parent;
  if (!p) return false;
  if ((ts.isPropertyAccessExpression(p) || ts.isQualifiedName(p)) && p.name === id) return true;
  if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p)) && p.name === id) return true;
  if ((ts.isBindingElement(p) && (p.name === id || p.propertyName === id)) || (ts.isParameter(p) && p.name === id)) return true;
  if (ts.isVariableDeclaration(p) && p.name === id) return true;
  if (ts.isImportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p) || ts.isExportSpecifier(p)) return true;
  if ((ts.isFunctionDeclaration(p) || ts.isClassDeclaration(p) || ts.isTypeAliasDeclaration(p) || ts.isInterfaceDeclaration(p)) && p.name === id) return true;
  if (ts.isJsxAttribute(p) && p.name === id) return true;
  return false;
};

/** Every identifier reference (not declaration, not property name) to `name` inside `root`. */
const refsTo = (root, name) => {
  const out = [];
  const visit = (n) => {
    if (ts.isIdentifier(n) && n.text === name && !isDeclarationName(n)) out.push(n);
    ts.forEachChild(n, visit);
  };
  visit(root);
  return out;
};

const exportedArrow = (sf) => {
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st) || !(st.modifiers || []).some((m) => m.kind === K.ExportKeyword)) continue;
    const d = st.declarationList.declarations[0];
    if (d && ts.isIdentifier(d.name) && d.initializer && ts.isArrowFunction(d.initializer)) {
      return { name: d.name.text, fn: d.initializer, stmt: st };
    }
  }
  return undefined;
};

/** Destructured parameter names of an arrow's first parameter, in order. */
const paramNamesOf = (fn) => {
  const p = fn.parameters[0];
  if (!p) return { names: [], optional: new Set(), ok: true };
  if (!ts.isObjectBindingPattern(p.name)) return { names: [], optional: new Set(), ok: false };
  const names = [];
  const optional = new Set();
  const typeMembers = p.type && ts.isTypeLiteralNode(p.type) ? p.type.members : [];
  for (const el of p.name.elements) {
    if (!ts.isIdentifier(el.name) || el.dotDotDotToken || el.initializer) return { names, optional, ok: false };
    const key = (el.propertyName || el.name).text;
    if (key !== el.name.text) return { names, optional, ok: false };
    names.push(key);
    const member = typeMembers.find((m) => m.name && m.name.text === key);
    if (member && member.questionToken) optional.add(key);
  }
  return { names, optional, ok: true };
};

// ---------------------------------------------------------------------------------------------------------
// the table

const readTable = (root) => {
  const file = path.join(root, 'scrolls/brands-gateways-epic/items/a-adapter-table.md');
  const rows = [];
  for (const line of readText(file).split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (cells.length !== 8 || cells[2] !== 'inline') continue;
    rows.push({ pkg: cells[0], adapterPath: cells[1].replace(/`/g, ''), gatewayCell: cells[5], notes: cells[7] });
  }
  return rows;
};

/** Parses the gateway-call column into { gap, specs: [{ spec, items: [{ text, read }] }] }. */
const parseGatewayCell = (cell) => {
  if (/^GAP\b/.test(cell)) return { gap: cell };
  const specs = [];
  const re = /\(read `([^`]+)`\)|`([^`]+)`/g;
  let m;
  while ((m = re.exec(cell))) {
    if (m[1] !== undefined) {
      if (specs.length) specs[specs.length - 1].items.push({ text: m[1], read: true });
    } else if (m[2].startsWith('#gateway/')) {
      specs.push({ spec: m[2], items: [] });
    } else if (specs.length) {
      specs[specs.length - 1].items.push({ text: m[2], read: false });
    }
  }
  return { specs };
};

// ---------------------------------------------------------------------------------------------------------
// gateway sources

const gatewayFile = (root, spec, name, suffix) => {
  const m = /^#gateway\/([^/]+)\/([^/]+)$/.exec(spec);
  if (!m) return undefined;
  const k = kebab(name);
  const p = path.join(root, 'packages/@gateway', m[1], 'src', m[2], k, `${k}${suffix}`);
  return fs.existsSync(p) ? p : undefined;
};

/** Source text of a gateway wrapper plus every sibling wrapper it imports, followed to a fixed depth. */
const gatewaySourceDeep = (file, depth = 3, seen = new Set()) => {
  if (!file || depth < 0 || seen.has(file)) return '';
  seen.add(file);
  const text = readText(file);
  let out = text;
  for (const m of text.matchAll(/from '(\.[^']+)'/g)) {
    const next = path.resolve(path.dirname(file), m[1]) + '.ts';
    if (fs.existsSync(next)) out += '\n' + gatewaySourceDeep(next, depth - 1, seen);
  }
  return out;
};

const gatewayReturnType = (file, name) => {
  const sf = parse(file, readText(file));
  const exp = exportedArrow(sf);
  if (!exp || exp.name !== name || !exp.fn.type) return undefined;
  return { text: exp.fn.type.getText(sf).replace(/\s+/g, ' '), isAsync: (exp.fn.modifiers || []).some((x) => x.kind === K.AsyncKeyword) || /^Promise</.test(exp.fn.type.getText(sf)) };
};

// ---------------------------------------------------------------------------------------------------------
// proxy files: shape and method bodies

const analyzeProxyFile = (file) => {
  const text = readText(file);
  const sf = parse(file, text);
  const exp = exportedArrow(sf);
  const imports = importsOf(sf);
  const decls = moduleDeclsOf(sf);
  const helpers = [...decls.keys()].filter((n) => !exp || n !== exp.name);
  const res = { file, sf, text, exp, imports, helpers, handles: new Map(), defaults: [], methods: new Map(), pre: [], returnObj: undefined, empty: false };
  if (!exp) return res;
  let body = exp.fn.body;
  if (!ts.isBlock(body)) {
    const e = unwrapParens(body);
    if (ts.isObjectLiteralExpression(e)) {
      res.returnObj = e;
      res.empty = e.properties.length === 0;
    }
  } else {
    for (const st of body.statements) {
      if (ts.isReturnStatement(st)) {
        const e = unwrapParens(st.expression);
        if (e && ts.isObjectLiteralExpression(e)) res.returnObj = e;
        break;
      }
      res.pre.push(st);
      if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          const init = d.initializer;
          if (ts.isIdentifier(d.name) && init && ts.isCallExpression(init) && ts.isIdentifier(init.expression) &&
              (init.expression.text === 'registerMock' || init.expression.text === 'registerSpyOn')) {
            const arg = init.arguments[0];
            const fnProp = arg && ts.isObjectLiteralExpression(arg) && arg.properties.find((p) => p.name && p.name.text === 'fn');
            const fnName = fnProp && ts.isPropertyAssignment(fnProp) && ts.isIdentifier(fnProp.initializer) ? fnProp.initializer.text : undefined;
            const imp = fnName && imports.get(fnName);
            res.handles.set(d.name.text, { fn: fnName, spec: imp ? normSpec(imp.spec) : undefined, spy: init.expression.text === 'registerSpyOn' });
          }
        }
      } else if (ts.isExpressionStatement(st)) {
        const t = st.getText(sf);
        if (/\.(calledWith|onceFor)\(/.test(t)) res.defaults.push({ text: t.replace(/\s+/g, ' '), line: lineOf(text, st.getStart(sf)) });
      }
    }
  }
  if (res.returnObj) {
    for (const p of res.returnObj.properties) {
      if (!ts.isPropertyAssignment(p) || !p.name) continue;
      let fn = p.initializer;
      if (ts.isIdentifier(fn) && decls.has(fn.text) && decls.get(fn.text).initializer && ts.isArrowFunction(decls.get(fn.text).initializer)) fn = decls.get(fn.text).initializer;
      if (!ts.isArrowFunction(fn)) continue;
      const params = paramNamesOf(fn);
      let expr;
      if (ts.isBlock(fn.body)) {
        if (fn.body.statements.length === 1 && ts.isExpressionStatement(fn.body.statements[0])) expr = fn.body.statements[0].expression;
      } else expr = unwrapParens(fn.body);
      res.methods.set(p.name.text, { fn, params, expr });
    }
    if (!ts.isBlock(exp.fn.body)) res.empty = res.returnObj.properties.length === 0;
  }
  return res;
};

/** Text of an expression with handle names replaced by H and parameter names by $index, whitespace removed. */
const normalizedBody = (proxy, method) => {
  if (!method.expr) return undefined;
  const sf = proxy.sf;
  const reps = [];
  const visit = (n) => {
    if (ts.isIdentifier(n) && !isDeclarationName(n)) {
      if (proxy.handles.has(n.text)) reps.push([n.getStart(sf), n.getEnd(), 'H']);
      else if (method.params.names.includes(n.text)) reps.push([n.getStart(sf), n.getEnd(), '$' + method.params.names.indexOf(n.text)]);
    }
    ts.forEachChild(n, visit);
  };
  visit(method.expr);
  let t = sf.text.slice(method.expr.getStart(sf), method.expr.getEnd());
  const base = method.expr.getStart(sf);
  for (const [s, e, r] of reps.sort((a, b) => b[0] - a[0])) t = t.slice(0, s - base) + r + t.slice(e - base);
  return t.replace(/\s+/g, '');
};

/** The mocked function behind every handle a method body uses, as `spec:name` strings. */
const handleFnsIn = (proxy, node) => {
  const out = new Set();
  if (!node) return out;
  const visit = (n) => {
    if (ts.isIdentifier(n) && proxy.handles.has(n.text)) {
      const h = proxy.handles.get(n.text);
      out.add(`${h.spec}:${h.fn}`);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
};

/** True when every free identifier in `node` is one of `allowed`, or a global the proxy module never declares. */
const onlyUses = (proxy, node, allowed) => {
  const inner = boundNamesIn(node);
  let ok = true;
  const visit = (n) => {
    if (ts.isIdentifier(n) && !isDeclarationName(n) && !allowed.includes(n.text) && !inner.has(n.text)) {
      if (proxy.imports.has(n.text) || proxy.helpers.includes(n.text) || proxy.handles.has(n.text)) ok = false;
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return ok;
};

/**
 * Maps one adapter-proxy method onto a gateway-proxy form. Returns { build(args) -> {text, kind} } or { reason }.
 * `args` maps the adapter method's parameter names to call-site argument texts.
 */
const mapProxyMethod = (aProxy, aName, gProxy, gwImportName) => {
  const am = aProxy.methods.get(aName);
  if (!am || !am.expr) return { reason: `adapter-proxy method ${aName} has a body the script does not read` };
  if (!gProxy) return { reason: `no gateway proxy to map ${aName} onto` };
  const aFns = handleFnsIn(aProxy, am.expr);
  // M1: the gateway proxy has a method with the same body, over the same mocked function.
  const an = normalizedBody(aProxy, am);
  for (const [gName, gm] of [...gProxy.methods.entries()].sort()) {
    const gn = normalizedBody(gProxy, gm);
    const gFns = handleFnsIn(gProxy, gm.expr);
    if (an && gn === an && aFns.size > 0 && [...aFns].every((f) => gFns.has(f)) && gm.params.names.length === am.params.names.length) {
      return {
        how: `same body as ${gName}`,
        build: (args, gw) => {
          const props = gm.params.names.map((p, i) => {
            const v = args.get(am.params.names[i]);
            return v === p ? p : `${p}: ${v}`;
          });
          return { text: `${gw}.${gName}(${props.length ? `{ ${props.join(', ')} }` : ''})`, kind: K.CallExpression };
        },
      };
    }
  }
  // M2: a read-back `H.callsMatching([a...])<rest>` over a gateway method whose whole body is `H.callsMatching([p...])`.
  const chainRoot = (e) => {
    let n = e;
    for (;;) {
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'callsMatching' &&
          ts.isIdentifier(n.expression.expression) && aProxy.handles.has(n.expression.expression.text)) return n;
      if (ts.isBinaryExpression(n)) n = n.left;
      else if (ts.isCallExpression(n) || ts.isPropertyAccessExpression(n) || ts.isElementAccessExpression(n) || ts.isNonNullExpression(n)) n = n.expression;
      else return undefined;
    }
  };
  const call = chainRoot(am.expr);
  if (call && call.arguments[0] && ts.isArrayLiteralExpression(call.arguments[0]) && call.arguments[0].elements.length > 0) {
    const elems = call.arguments[0].elements;
    for (const [gName, gm] of [...gProxy.methods.entries()].sort()) {
      const e = gm.expr;
      if (!e || !ts.isCallExpression(e) || !ts.isPropertyAccessExpression(e.expression) || e.expression.name.text !== 'callsMatching') continue;
      const arr = e.arguments[0];
      if (!arr || !ts.isArrayLiteralExpression(arr) || arr.elements.length !== elems.length) continue;
      if (!arr.elements.every((x, i) => ts.isIdentifier(x) && x.text === gm.params.names[i])) continue;
      if (gm.params.names.length !== elems.length) continue;
      const gFns = handleFnsIn(gProxy, e);
      if (!([...aFns].every((f) => gFns.has(f)))) continue;
      if (!elems.every((x) => onlyUses(aProxy, x, am.params.names))) {
        return { reason: `${aName} reads back by a predicate the adapter proxy declares at module level; the caller proxy has no such name` };
      }
      const sf = aProxy.sf;
      const rest = sf.text.slice(call.getEnd(), am.expr.getEnd());
      return {
        how: `read-back through ${gName}`,
        build: (args, gw) => {
          const props = elems.map((x, i) => {
            const t = substituteText(sf, x, args);
            const p = gm.params.names[i];
            return t === p ? p : `${p}: ${t}`;
          });
          const text = `${gw}.${gName}({ ${props.join(', ')} })${rest}`;
          return { text, kind: ts.isBinaryExpression(am.expr) ? K.BinaryExpression : K.CallExpression };
        },
      };
    }
  }
  // M4: `<gatewayObject>.<prop> = <value>` over a gateway method `setup<Prop>({ value })`.
  const e = am.expr;
  if (ts.isBinaryExpression(e) && e.operatorToken.kind === K.EqualsToken && ts.isPropertyAccessExpression(e.left) &&
      ts.isIdentifier(e.left.expression) && e.left.expression.text === gwImportName) {
    const prop = e.left.name.text.toLowerCase();
    for (const [gName, gm] of [...gProxy.methods.entries()].sort()) {
      if (gName.toLowerCase() === `setup${prop}` && gm.params.names.length === 1 && gm.params.names[0] === 'value' &&
          onlyUses(aProxy, e.right, am.params.names)) {
        return {
          how: `assignment through ${gName}`,
          build: (args, gw) => ({ text: `${gw}.${gName}({ value: ${substituteText(aProxy.sf, e.right, args)} })`, kind: K.CallExpression }),
        };
      }
    }
  }
  if (call && call.arguments[0] && ts.isArrayLiteralExpression(call.arguments[0]) && call.arguments[0].elements.length === 0) {
    return { reason: `${aName} reads back every call with no path; the gateway proxy reads back by path` };
  }
  if (/\.(onceFor|calledWith)\(\[\]\)/.test(am.expr.getText(aProxy.sf))) {
    return { reason: `${aName} stages with no path; the gateway proxy stages by path, so the caller must name one` };
  }
  return { reason: `no gateway-proxy method provably does what ${aName} does` };
};

/** Text of `node` with identifiers named in `args` replaced by their argument texts. */
const substituteText = (sf, node, args) => {
  const reps = [];
  const inner = boundNamesIn(node);
  const visit = (n) => {
    if (ts.isShorthandPropertyAssignment(n) && args.has(n.name.text) && !inner.has(n.name.text)) {
      const v = args.get(n.name.text);
      if (v !== n.name.text) reps.push([n.getStart(sf), n.getEnd(), `${n.name.text}: ${v}`]);
      return;
    }
    if (ts.isIdentifier(n) && !isDeclarationName(n) && args.has(n.text) && !inner.has(n.text)) {
      reps.push([n.getStart(sf), n.getEnd(), args.get(n.text)]);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  const base = node.getStart(sf);
  let t = sf.text.slice(base, node.getEnd());
  for (const [s, e, r] of reps.sort((a, b) => b[0] - a[0])) t = t.slice(0, s - base) + r + t.slice(e - base);
  return t;
};

// ---------------------------------------------------------------------------------------------------------
// the adapter body: one expression (or void statements, or a block to transplant)

/**
 * Renders `node` from the adapter source: parameters become placeholders, simple locals are substituted,
 * nodes in `ctx.reps` (keyed `start:end`) are swapped. Collects adapter imports the text needs.
 */
const render = (node, ctx) => {
  const sf = ctx.sf;
  const key = `${node.getStart(sf)}:${node.getEnd()}`;
  if (ctx.reps.has(key)) return ctx.reps.get(key);
  const reps = [];
  const visit = (n, slot) => {
    const k = `${n.getStart(sf)}:${n.getEnd()}`;
    if (n !== node && ctx.reps.has(k)) {
      const r = ctx.reps.get(k);
      reps.push([n.getStart(sf), n.getEnd(), wrapFor(r, n)]);
      return;
    }
    if (ts.isShorthandPropertyAssignment(n)) {
      const nm = n.name.text;
      if (ctx.params.has(nm)) { reps.push([n.getStart(sf), n.getEnd(), `${PH}S:${nm}${PH}`]); return; }
      if (ctx.locals && ctx.locals.has(nm)) { reps.push([n.getStart(sf), n.getEnd(), `${nm}: ${renderLocal(nm, ctx).text}`]); return; }
    }
    if (ts.isIdentifier(n) && !isDeclarationName(n)) {
      const nm = n.text;
      if (ctx.params.has(nm) && !ctx.shadowed.has(nm)) { reps.push([n.getStart(sf), n.getEnd(), `${PH}${slotSafe(n) ? 'Q' : 'P'}:${nm}${PH}`]); return; }
      if (ctx.locals && ctx.locals.has(nm)) { reps.push([n.getStart(sf), n.getEnd(), wrapFor(renderLocal(nm, ctx), n)]); return; }
      if (ctx.imports.has(nm)) ctx.usedImports.add(nm);
      else if (ctx.moduleDecls.has(nm) && nm !== ctx.exportName) ctx.errors.add(`the body uses ${nm}, which the adapter declares at module level`);
      if (nm === ctx.exportName) ctx.errors.add('the adapter calls itself');
      if (nm === '__dirname' || nm === '__filename') ctx.dirnameUsed = true;
    }
    ts.forEachChild(n, (c) => visit(c));
  };
  ts.forEachChild(node, (c) => visit(c));
  if (ts.isIdentifier(node)) visit(node);
  const base = node.getStart(sf);
  let t = sf.text.slice(base, node.getEnd());
  for (const [s, e, r] of reps.sort((a, b) => b[0] - a[0])) t = t.slice(0, s - base) + r + t.slice(e - base);
  return { text: t, kind: node.kind };
};

const renderLocal = (nm, ctx) => {
  const l = ctx.locals.get(nm);
  ctx.localUses.set(nm, (ctx.localUses.get(nm) || 0) + 1);
  const r = render(l.init, ctx);
  if (!l.prop) return r;
  return { text: `${PRIMARY.has(r.kind) ? r.text : `(${r.text})`}.${l.prop}`, kind: K.PropertyAccessExpression };
};

/** True when an expression of any precedence can fill this node's place without parentheses. */
const slotSafe = (n) => {
  const p = n.parent;
  if (!p) return true;
  if (ts.isCallExpression(p) || ts.isNewExpression(p)) return p.expression !== n;
  return ts.isVariableDeclaration(p) || ts.isReturnStatement(p) || ts.isExpressionStatement(p) || ts.isArrayLiteralExpression(p) ||
    ts.isParenthesizedExpression(p) || ts.isTemplateSpan(p) || (ts.isArrowFunction(p) && p.body === n) ||
    (ts.isPropertyAssignment(p) && p.initializer === n);
};

/** Parenthesizes a rendered replacement when the slot it fills would bind tighter than its root. */
const wrapFor = (r, slot) => {
  if (PRIMARY.has(r.kind)) return r.text;
  const p = slot.parent;
  if (p && ts.isCallExpression(p) && p.expression !== slot) return r.text;
  if (p && SAFE_SLOT_PARENTS.has(p.kind) && !(ts.isPropertyAccessExpression(p))) return r.text;
  if (r.kind === K.AwaitExpression && p && (ts.isAwaitExpression(p) || ts.isPrefixUnaryExpression(p))) return r.text;
  return `(${r.text})`;
};

/** Collects simple `const` locals from the head of a statement list. Returns { locals, rest } or { error }. */
const takeLocals = (stmts, locals) => {
  let i = 0;
  for (; i < stmts.length; i += 1) {
    const st = stmts[i];
    if (!ts.isVariableStatement(st) || !(st.declarationList.flags & ts.NodeFlags.Const)) break;
    const decls = st.declarationList.declarations;
    if (decls.length !== 1 || !decls[0].initializer) break;
    const d = decls[0];
    if (ts.isIdentifier(d.name)) locals.set(d.name.text, { init: d.initializer });
    else if (ts.isObjectBindingPattern(d.name) && d.name.elements.every((el) => ts.isIdentifier(el.name) && !el.propertyName && !el.initializer && !el.dotDotDotToken)) {
      for (const el of d.name.elements) locals.set(el.name.text, { init: d.initializer, prop: el.name.text });
    } else break;
  }
  return stmts.slice(i);
};

const isSuccessReturn = (st) => {
  if (!ts.isReturnStatement(st) || !st.expression) return false;
  const e = unwrapParens(st.expression);
  if (!ts.isObjectLiteralExpression(e) || e.properties.length !== 1) return false;
  const p = e.properties[0];
  return ts.isPropertyAssignment(p) && p.name.text === 'success';
};
const returnsLiteral = (st, kind) => ts.isReturnStatement(st) && st.expression && (
  (kind === 'undefined' && ts.isIdentifier(st.expression) && st.expression.text === 'undefined') || st.expression.kind === kind);
const awaitedCallStmt = (st) => ts.isExpressionStatement(st) && ts.isAwaitExpression(st.expression) && ts.isCallExpression(st.expression.expression) ? st.expression.expression : undefined;

/** Finds raw calls (callee imported from a raw module) and raw `process.<x>` reads in a node. */
const rawNodesIn = (node, imports, sf) => {
  const out = [];
  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression)) {
      const imp = imports.get(n.expression.text);
      if (imp && isRawSpec(imp.spec)) { out.push({ kind: 'call', node: n, name: n.expression.text, spec: imp.spec }); return; }
    }
    if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'process' && !imports.has('process')) {
      out.push({ kind: 'global', node: n, name: n.name.text });
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
};

/**
 * Builds the recipe for one adapter row: how a call site becomes inline code.
 * Returns { kind: 'expr'|'void'|'transplant'|'left', ... }.
 */
const buildRecipe = (root, row, gw) => {
  const file = path.join(root, row.adapterPath);
  const text = readText(file);
  const sf = parse(file, text);
  const exp = exportedArrow(sf);
  if (!exp) return { kind: 'left', reason: 'the adapter file has no exported arrow function' };
  const params = paramNamesOf(exp.fn);
  const recipe = { name: exp.name, file, sf, fn: exp.fn, params, isAsync: (exp.fn.modifiers || []).some((m) => m.kind === K.AsyncKeyword), imports: importsOf(sf) };
  if (!params.ok) return { ...recipe, kind: 'left', reason: 'the adapter parameter is not a plain destructured object' };
  if (exp.fn.parameters[0] && exp.fn.parameters[0].initializer) return { ...recipe, kind: 'left', reason: 'the adapter parameter has a default value' };
  if (refsTo(exp.fn.body, exp.name).length) return { ...recipe, kind: 'left', reason: 'the adapter calls itself; the gateway call answers a different shape (see the row notes)' };
  const ctx = { sf, params: new Set(params.names), shadowed: new Set(), locals: new Map(), localUses: new Map(), reps: new Map(), imports: recipe.imports,
    moduleDecls: moduleDeclsOf(sf), exportName: exp.name, usedImports: new Set(), errors: new Set(), dirnameUsed: false };
  const inner = boundNamesIn(exp.fn.body);
  for (const p of params.names) if (inner.has(p)) ctx.shadowed.add(p);
  recipe.ctx = ctx;

  // reduce the body
  let shape;
  const body = exp.fn.body;
  if (!ts.isBlock(body)) shape = { kind: 'expr', expr: unwrapParens(body) };
  else {
    let rest = takeLocals([...body.statements], ctx.locals);
    if (rest.length === 1 && ts.isReturnStatement(rest[0]) && rest[0].expression) shape = { kind: 'expr', expr: unwrapParens(rest[0].expression) };
    else if (rest.length >= 2 && isSuccessReturn(rest[rest.length - 1]) && rest.slice(0, -1).every((s) => ts.isExpressionStatement(s))) {
      shape = { kind: 'void', stmts: rest.slice(0, -1) };
    } else if (rest.length >= 1 && ts.isTryStatement(rest[0]) && rest[0].catchClause && !rest[0].finallyBlock) {
      const tr = rest[0];
      const t = tr.tryBlock.statements;
      const c = tr.catchClause.block.statements;
      const call = t.length >= 1 ? awaitedCallStmt(t[0]) : undefined;
      if (rest.length === 1 && call && t.length === 2 && returnsLiteral(t[1], K.TrueKeyword) && c.length === 1 && returnsLiteral(c[0], K.FalseKeyword)) {
        shape = { kind: 'try-bool', call };
      } else if (call && t.length === 1 && c.length === 1 && returnsLiteral(c[0], 'undefined')) {
        const after = takeLocals(rest.slice(1), ctx.locals);
        if (after.length === 1 && ts.isReturnStatement(after[0]) && after[0].expression) shape = { kind: 'try-if-exists', call, expr: unwrapParens(after[0].expression) };
      }
      if (!shape) return { ...recipe, kind: 'left', reason: 'the adapter catches errors in a shape the script does not translate (see the row notes)' };
    } else shape = { kind: 'block' };
  }
  recipe.shape = shape;

  // raw I/O inside the body
  const scope = shape.kind === 'expr' ? [shape.expr] : shape.kind === 'void' ? shape.stmts : shape.kind === 'block' ? [body] : [body];
  const raws = [];
  for (const n of scope) raws.push(...rawNodesIn(n, recipe.imports, sf));
  for (const [, l] of ctx.locals) if (!scope.some((n) => n.pos <= l.init.pos && l.init.end <= n.end)) raws.push(...rawNodesIn(l.init, recipe.imports, sf));
  const seenRaw = new Set();
  const rawList = raws.filter((r) => { const k = `${r.node.pos}`; if (seenRaw.has(k)) return false; seenRaw.add(k); return true; });

  if (shape.kind === 'block') {
    if (rawList.length) return { ...recipe, kind: 'left', reason: 'the adapter body is several statements around a raw call; the script inlines only an expression body' };
    return { ...recipe, kind: 'transplant' };
  }

  if (rawList.length === 0) {
    if (shape.kind === 'try-bool' || shape.kind === 'try-if-exists') return { ...recipe, kind: 'left', reason: 'the adapter catches errors around a call that is not raw I/O' };
    recipe.gatewayUsed = false;
    return finishRecipe(recipe);
  }

  // the gateway call from the table
  const items = gw.specs.flatMap((s) => s.items.map((it) => ({ ...it, spec: s.spec })));
  const templates = items.filter((it) => it.read || /\(/.test(it.text));
  const bareNames = items.filter((it) => !it.read && /^\w+$/.test(it.text));
  if (rawList.length > 1 && shape.kind !== 'try-if-exists') return { ...recipe, kind: 'left', reason: `the adapter makes ${rawList.length} raw calls; the script replaces exactly one` };
  const baseNames = new Set(items.map((it) => /^\w+/.exec(it.text)[0]));
  if (baseNames.size !== 1 || templates.length > 1 || gw.specs.length !== 1) {
    return { ...recipe, kind: 'left', reason: 'the row names several gateway calls; each call site picks its own (see the row notes)' };
  }
  const tItem = templates[0] || bareNames[0];
  const spec = tItem.spec;
  const tsf = parse('template.ts', `(${tItem.text});`);
  const tExpr = unwrapParens(tsf.statements[0].expression);
  recipe.gatewayUsed = true;

  if (shape.kind === 'try-bool' || shape.kind === 'try-if-exists' || rawList[0].kind === 'call') {
    const raw = shape.kind === 'try-bool' || shape.kind === 'try-if-exists' ? { node: shape.call, name: shape.call.expression.text } : rawList[0];
    if (!ts.isCallExpression(tExpr) || !ts.isIdentifier(tExpr.expression)) return { ...recipe, kind: 'left', reason: `the gateway call \`${tItem.text}\` is not a plain call` };
    const gName = tExpr.expression.text;
    const gFile = gatewayFile(root, spec, gName, '.ts');
    const gDeep = gatewaySourceDeep(gFile);
    const gRet = gFile ? gatewayReturnType(gFile, gName) : undefined;
    recipe.gateway = { spec, name: gName, file: gFile, proxyFile: gatewayFile(root, spec, gName, '.proxy.ts'), template: tItem.text };
    // render the template's arguments against the adapter's own names, falling back to the raw call's argument at the same position
    const argTexts = tExpr.arguments.map((a, i) => {
      if (ts.isIdentifier(a)) {
        if (ctx.params.has(a.text)) return { text: `${PH}Q:${a.text}${PH}` };
        if (ctx.locals.has(a.text)) return renderLocal(a.text, ctx);
        if (a.text === '__dirname') { ctx.dirnameUsed = true; return { text: a.text }; }
        if (raw.node.arguments[i]) return render(raw.node.arguments[i], ctx);
        return { error: `the gateway call names \`${a.text}\`, which the adapter does not have` };
      }
      const ids = [];
      const v = (n) => { if (ts.isIdentifier(n) && !isDeclarationName(n)) ids.push(n.text); ts.forEachChild(n, v); };
      v(a);
      const unknown = ids.filter((x) => !ctx.params.has(x) && !ctx.locals.has(x));
      if (unknown.length) return { error: `the gateway call names \`${unknown.join(', ')}\`, which the adapter does not have` };
      return { text: substituteText(tsf, a, new Map([...ctx.params].map((p) => [p, `${PH}Q:${p}${PH}`]))) };
    });
    const bad = argTexts.find((a) => a.error);
    if (bad) return { ...recipe, kind: 'left', reason: bad.error };
    const gCall = `${gName}(${argTexts.map((a) => a.text).join(', ')})`;
    recipe.gatewayImports = [[gName, spec]];
    const gAsync = gRet ? gRet.isAsync : true;

    if (shape.kind === 'try-bool') {
      if (!gRet || !/^Promise<boolean>$/.test(gRet.text)) return { ...recipe, kind: 'left', reason: `the adapter answers true or false around ${raw.name}; ${gName} does not answer Promise<boolean>` };
      recipe.shape = { kind: 'expr', expr: null, text: `await ${gCall}`, textKind: K.AwaitExpression };
      return finishRecipe(recipe);
    }
    if (shape.kind === 'try-if-exists') {
      if (!/return null/.test(gDeep)) return { ...recipe, kind: 'left', reason: `the adapter answers undefined when ${raw.name} fails; ${gName} does not answer null for a missing file` };
      const adapterRet = exp.fn.type ? exp.fn.type.getText(sf).replace(/\s+/g, ' ') : '';
      if (!gRet || !(gRet.text === adapterRet || (/unknown/.test(gRet.text) && /unknown/.test(adapterRet)))) {
        return { ...recipe, kind: 'left', reason: `${gName} answers ${gRet ? gRet.text : 'an unknown type'}, the adapter ${adapterRet}` };
      }
      recipe.shape = { kind: 'expr', expr: null, text: `(await ${gCall}) ?? undefined`, textKind: K.BinaryExpression };
      return finishRecipe(recipe);
    }
    // one raw call inside an expression: grow it through `await`, and through JSON.parse when the gateway parses
    let R = raw.node;
    let awaited = false;
    if (R.parent && ts.isAwaitExpression(R.parent)) { R = R.parent; awaited = true; }
    if (awaited !== gAsync) return { ...recipe, kind: 'left', reason: `${raw.name} is ${awaited ? '' : 'not '}awaited, and ${gName} is ${gAsync ? 'async' : 'sync'}` };
    const absorbs = /JSON\.parse/.test(gDeep);
    const parentThroughLocals = (n) => {
      // a raw node that is a local's whole initializer is used where that local is used
      for (const [nm, l] of ctx.locals) {
        if (l.init === n && !l.prop) {
          const uses = [];
          for (const s of scope) uses.push(...refsTo(s, nm));
          for (const [, l2] of ctx.locals) if (l2.init !== n) uses.push(...refsTo(l2.init, nm));
          return uses.length === 1 ? uses[0] : undefined;
        }
      }
      return n;
    };
    let use = parentThroughLocals(R);
    if (!use) return { ...recipe, kind: 'left', reason: `the adapter uses what ${raw.name} answers more than once` };
    if (absorbs) {
      const p = use.parent;
      if (p && ts.isCallExpression(p) && ts.isPropertyAccessExpression(p.expression) && p.expression.getText(sf) === 'JSON.parse' && p.arguments[0] === use) {
        R = p;
        use = parentThroughLocals(R);
      } else return { ...recipe, kind: 'left', reason: `${gName} parses JSON and the adapter does not` };
    }
    const okUse = (u) => {
      const exprRoot = shape.kind === 'expr' ? shape.expr : undefined;
      if (u === exprRoot) return true;
      if (shape.kind === 'void' && shape.stmts.some((s) => s.expression === u)) return true;
      const p = u.parent;
      if (p && ts.isCallExpression(p) && p.arguments.length === 1 && p.arguments[0] === u) {
        const callee = p.expression.getText(sf);
        if (/Contract\.parse$/.test(callee) || callee === 'String' || callee === 'JSON.parse') return true;
      }
      return false;
    };
    if (!use || !okUse(use)) {
      const ctxText = use && use.parent ? use.parent.getText(sf).replace(/\s+/g, ' ').slice(0, 70) : '?';
      return { ...recipe, kind: 'left', reason: `the adapter reshapes what ${raw.name} answers (\`${ctxText}\`); ${gName} answers its own shape (see the row notes)` };
    }
    ctx.reps.set(`${R.getStart(sf)}:${R.getEnd()}`, { text: `${awaited ? 'await ' : ''}${gCall}`, kind: awaited ? K.AwaitExpression : K.CallExpression });
    return finishRecipe(recipe);
  }

  // a raw global read: `process.<x>` becomes the gateway's `<x>`
  const raw = rawList[0];
  const readBase = ts.isPropertyAccessExpression(tExpr) ? tExpr.expression : tExpr;
  if (!ts.isIdentifier(readBase) || readBase.text !== raw.name || !bareNames.some((b) => b.text === raw.name)) {
    return { ...recipe, kind: 'left', reason: `the adapter reads process.${raw.name}; the gateway column does not name \`${raw.name}\`` };
  }
  recipe.gateway = { spec, name: raw.name, file: gatewayFile(root, spec, raw.name, '.ts'), proxyFile: gatewayFile(root, spec, raw.name, '.proxy.ts'), template: tItem.text };
  recipe.gatewayImports = [[raw.name, spec]];
  recipe.gatewayUsed = true;
  ctx.reps.set(`${raw.node.getStart(sf)}:${raw.node.getEnd()}`, { text: raw.name, kind: K.Identifier });
  return finishRecipe(recipe);
};

const finishRecipe = (recipe) => {
  const { ctx, shape } = recipe;
  if (shape.kind === 'expr' && shape.expr) {
    const r = render(shape.expr, ctx);
    shape.text = r.text;
    shape.textKind = ctx.reps.get(`${shape.expr.getStart(ctx.sf)}:${shape.expr.getEnd()}`) ? ctx.reps.get(`${shape.expr.getStart(ctx.sf)}:${shape.expr.getEnd()}`).kind : r.kind;
  } else if (shape.kind === 'void') {
    shape.texts = shape.stmts.map((s) => render(s.expression, ctx).text);
  }
  for (const [nm, n] of ctx.localUses) if (n > 1 && !PRIMARY.has(ctx.locals.get(nm).init.kind)) ctx.errors.add(`the local ${nm} would be evaluated ${n} times`);
  if (ctx.errors.size) return { ...recipe, kind: 'left', reason: [...ctx.errors].sort().join('; ') };
  recipe.kind = shape.kind === 'void' ? 'void' : 'expr';
  return recipe;
};

// ---------------------------------------------------------------------------------------------------------
// per-file edit plan

const SKIP_DIRS = new Set(['node_modules', 'dist', '.ward', '.assayer', 'coverage']);
const BARRELS = new Set(['packages/core/adapters.ts', 'packages/core/testing.ts']);

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(path.join(dir, e.name), out); }
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(e.name) && !e.name.endsWith('.d.ts')) out.push(path.join(dir, e.name));
  }
  return out;
};

const packageRootOf = (root, file) => {
  const rel = path.relative(root, file).split(path.sep);
  if (rel[0] !== 'packages') return undefined;
  return rel[1].startsWith('@') ? path.join(root, rel[0], rel[1], rel[2]) : path.join(root, rel[0], rel[1]);
};

const relSpec = (fromFile, absTarget) => {
  let r = path.relative(path.dirname(fromFile), absTarget).split(path.sep).join('/');
  if (!r.startsWith('.')) r = `./${r}`;
  return r;
};

/** Resolves an adapter-relative import spec to a spec valid from `toFile`. */
const respec = (fromFile, spec, toFile) => (spec.startsWith('.') ? relSpec(toFile, path.resolve(path.dirname(fromFile), spec)) : spec);

class FilePlan {
  constructor(root, file) {
    this.root = root;
    this.file = file;
    this.rel = path.relative(root, file);
    this.text = readText(file);
    this.sf = parse(file, this.text);
    this.imports = importsOf(this.sf);
    this.declared = boundNamesIn(this.sf);
    this.edits = [];
    this.log = [];
    this.removeNames = new Set();
    this.addImports = new Map(); // name -> { spec, isType }
    this.reserved = new Set();
    this.renamedAway = new Set();
  }
  done(adapter, node, what) { this.log.push({ kind: 'DONE', adapter, pos: node ? node.getStart(this.sf) : -1, end: node ? node.getEnd() : -1, what }); }
  left(adapter, node, why) { this.log.push({ kind: 'LEFT', adapter, pos: node ? node.getStart(this.sf) : 0, end: node ? node.getEnd() : 0, what: why }); }
  edit(start, end, text) { this.edits.push({ start, end, text }); }
  /** Plans an import; returns a reason string when the name already means something else here. */
  needImport(name, spec, isType) {
    const have = this.imports.get(name);
    if (have) {
      if (have.spec === spec) {
        if (have.isType && !isType) { const a = this.addImports.get(name); if (!a) this.addImports.set(name, { spec, isType: false, upgrade: true }); }
        return undefined;
      }
      if (this.removeNames.has(name)) { this.addImports.set(name, { spec, isType }); return undefined; }
      return `${name} is already imported here from ${have.spec}`;
    }
    if (this.declared.has(name) && !this.renamedAway.has(name)) return `${name} is already declared in this file`;
    const a = this.addImports.get(name);
    if (a && a.spec !== spec) return `${name} would be imported from two places`;
    if (!a || (a.isType && !isType)) this.addImports.set(name, { spec, isType });
    return undefined;
  }
  /** Builds import edits: drops removed names, merges added ones. */
  importEdits() {
    const out = [];
    const decls = this.sf.statements.filter((s) => ts.isImportDeclaration(s));
    const add = new Map([...this.addImports].sort((a, b) => (a[0] < b[0] ? -1 : 1)));
    const merged = new Set();
    const removed = new Set();
    for (const d of decls) {
      const clause = d.importClause;
      if (!clause || clause.name || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) continue;
      const spec = d.moduleSpecifier.text;
      let names = clause.namedBindings.elements.map((e) => ({ name: e.name.text, text: e.getText(this.sf) }));
      const before = names.length;
      names = names.filter((n) => {
        const a = add.get(n.name);
        if (a && a.spec === spec) {
          if (!!a.isType === !!clause.isTypeOnly) { merged.add(n.name); return true; }
          return false;
        }
        return !this.removeNames.has(n.name);
      });
      let changed = names.length !== before;
      for (const [nm, a] of add) {
        if (merged.has(nm) || a.spec !== spec) continue;
        if (!!a.isType !== !!clause.isTypeOnly) continue;
        if (!names.some((n) => n.name === nm)) { names.push({ name: nm, text: nm }); changed = true; }
        merged.add(nm);
      }
      if (!changed) continue;
      const start = d.getStart(this.sf);
      let end = d.getEnd();
      if (!names.length) {
        removed.add(d);
        if (this.text[end] === '\n') end += 1;
        out.push({ start, end, text: '' });
      } else {
        out.push({ start, end, text: `import ${clause.isTypeOnly ? 'type ' : ''}{ ${names.map((n) => n.text).join(', ')} } from '${spec}';` });
      }
    }
    const fresh = [...add].filter(([nm]) => !merged.has(nm));
    if (fresh.length) {
      const bySpec = new Map();
      for (const [nm, a] of fresh) {
        const k = `${a.isType ? 'type ' : ''}${a.spec}`;
        if (!bySpec.has(k)) bySpec.set(k, { spec: a.spec, isType: a.isType, names: [] });
        bySpec.get(k).names.push(nm);
      }
      // after the last import that stays; before the first import when every import goes
      const staying = decls.filter((d) => !removed.has(d));
      const last = staying[staying.length - 1];
      const pos = last ? last.getEnd() : decls.length ? decls[0].getStart(this.sf) : 0;
      const lines = [...bySpec.values()].sort((a, b) => (a.spec < b.spec ? -1 : a.spec > b.spec ? 1 : a.isType - b.isType))
        .map((b) => `import ${b.isType ? 'type ' : ''}{ ${b.names.join(', ')} } from '${b.spec}';`);
      out.push({ start: pos, end: pos, text: last ? `\n${lines.join('\n')}` : `${lines.join('\n')}\n` });
    }
    return out;
  }
  /** Applies every edit; returns the new text and maps each log entry to its line in the new text. */
  finish() {
    const all = [...this.edits, ...this.importEdits()].sort((a, b) => a.start - b.start || a.end - b.end);
    const kept = [];
    for (const e of all) {
      const prev = kept[kept.length - 1];
      if (prev && e.start < prev.end && !(e.start === e.end && e.start === prev.start)) {
        if (e.start >= prev.start && e.end <= prev.end) continue; // contained in an edit that already rewrote it
        this.log.push({ kind: 'LEFT', adapter: '-', pos: e.start, end: e.end, what: 'two edits overlap here; the second was not made' });
        continue;
      }
      kept.push(e);
    }
    let out = '';
    let at = 0;
    for (const e of kept) { out += this.text.slice(at, e.start) + e.text; at = e.end; }
    out += this.text.slice(at);
    const shift = (pos) => {
      let d = 0;
      for (const e of kept) {
        if (e.end <= pos && !(e.start === e.end && e.start === pos)) d += e.text.length - (e.end - e.start);
        else if (e.start < pos && pos < e.end) return e.start + d;
      }
      return pos + d;
    };
    for (const l of this.log) {
      if (l.pos < 0) { l.line = 0; l.endLine = 0; continue; }
      const a = shift(l.pos);
      const b = shift(l.end);
      l.line = lineOf(out, a);
      l.endLine = Math.max(l.line, lineOf(out, b));
    }
    return out;
  }
}

/** Reads a call site's object-literal argument into name -> text. Returns { args } or { reason }. */
const siteArgs = (sf, call, recipe) => {
  const params = recipe.params.names;
  if (call.arguments.length === 0) {
    if (params.length && params.some((p) => !recipe.params.optional.has(p))) return { reason: 'the call passes no argument object' };
    return { args: new Map(), nodes: new Map() };
  }
  const a = call.arguments[0];
  if (call.arguments.length !== 1 || !ts.isObjectLiteralExpression(a)) return { reason: 'the argument is not an object literal' };
  const args = new Map();
  const nodes = new Map();
  for (const p of a.properties) {
    if (ts.isShorthandPropertyAssignment(p)) { args.set(p.name.text, p.name.text); nodes.set(p.name.text, p.name); }
    else if (ts.isPropertyAssignment(p) && (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) { args.set(p.name.text, p.initializer.getText(sf)); nodes.set(p.name.text, p.initializer); }
    else return { reason: 'the argument object has a spread or computed key' };
  }
  for (const p of params) if (!args.has(p)) return { reason: `the call does not pass ${p}` };
  for (const k of args.keys()) if (!params.includes(k)) return { reason: `the call passes ${k}, which the adapter does not take` };
  return { args, nodes };
};

/** Fills parameter placeholders with call-site argument texts. */
const instantiate = (template, args, nodes) => {
  let t = template.replace(new RegExp(`\\.\\.\\.${PH}[PQ]:(\\w+)${PH}`, 'g'), (m, nm) => {
    const n = nodes.get(nm);
    if (n && ts.isArrayLiteralExpression(n)) return n.elements.map((e) => e.getText(n.getSourceFile())).join(', ');
    return m;
  });
  t = t.replace(new RegExp(`${PH}S:(\\w+)${PH}`, 'g'), (m, nm) => (args.get(nm) === nm ? nm : `${nm}: ${args.get(nm)}`));
  t = t.replace(new RegExp(`${PH}([PQ]):(\\w+)${PH}`, 'g'), (m, mode, nm) => {
    const n = nodes.get(nm);
    const v = args.get(nm);
    return mode === 'P' && n && !PRIMARY.has(n.kind) ? `(${v})` : v;
  });
  return t;
};

const placeholderCounts = (template) => {
  const c = new Map();
  for (const m of template.matchAll(new RegExp(`${PH}[PQS]:(\\w+)${PH}`, 'g'))) c.set(m[1], (c.get(m[1]) || 0) + 1);
  return c;
};

const isPure = (n) => n && (ts.isIdentifier(n) || ts.isStringLiteral(n) || ts.isNumericLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) ||
  (ts.isPropertyAccessExpression(n) && isPure(n.expression)));

const needsParensAt = (kind, slot) => {
  if (PRIMARY.has(kind)) return false;
  const p = slot.parent;
  if (!p) return false;
  if (kind === K.AwaitExpression) {
    // a unary `await` binds tighter than every binary operator; it needs parentheses only as the object of a member access or call
    return (ts.isPropertyAccessExpression(p) || ts.isElementAccessExpression(p) || ts.isCallExpression(p) || ts.isNonNullExpression(p) ||
      ts.isTaggedTemplateExpression(p)) && p.expression === slot;
  }
  if (ts.isIfStatement(p) || ts.isWhileStatement(p) || ts.isDoStatement(p) || ts.isSwitchStatement(p) || ts.isThrowStatement(p)) return false;
  if (ts.isCallExpression(p) && p.expression !== slot) return false;
  if (ts.isVariableDeclaration(p) || ts.isReturnStatement(p) || ts.isExpressionStatement(p) || ts.isArrayLiteralExpression(p) ||
      ts.isParenthesizedExpression(p) || ts.isTemplateSpan(p) || (ts.isArrowFunction(p) && p.body === slot) ||
      (ts.isPropertyAssignment(p) && p.initializer === slot)) return false;
  if (kind === K.AwaitExpression && (ts.isAwaitExpression(p) || ts.isPrefixUnaryExpression(p))) return false;
  return true;
};

/** Plans the imports the inlined text needs in the caller. Returns a reason when one cannot be added. */
const planRecipeImports = (plan, recipe, names, extra) => {
  for (const nm of [...names].sort()) {
    const imp = recipe.imports.get(nm);
    if (!imp || imp.isDefault || imp.isNamespace) return `the body uses ${nm}, which the adapter imports in a form the script does not copy`;
    const spec = respec(recipe.file, imp.spec, plan.file);
    if (imp.spec.startsWith('.') && packageRootOf(plan.root, recipe.file) !== packageRootOf(plan.root, plan.file)) return `the body imports ${nm} by a relative path, and this caller sits in another package`;
    const r = plan.needImport(nm, spec, imp.isType);
    if (r) return r;
  }
  for (const [nm, spec] of extra || []) {
    const r = plan.needImport(nm, spec, false);
    if (r) return r;
  }
  return undefined;
};

const handleCallSite = (plan, recipe, ref) => {
  const sf = plan.sf;
  const call = ref.parent;
  const name = recipe.name;
  if (call.typeArguments) { plan.left(name, call, 'call: the call passes type arguments'); return false; }
  const site = siteArgs(sf, call, recipe);
  if (site.reason) { plan.left(name, call, `call: ${site.reason}`); return false; }
  if (recipe.ctx.dirnameUsed) {
    const depth = (f) => path.relative(packageRootOf(plan.root, f), path.dirname(f)).split(path.sep).length;
    if (depth(plan.file) !== depth(recipe.file)) { plan.left(name, call, 'call: the body counts folders from __dirname, and this caller sits at another depth'); return false; }
  }
  if (recipe.kind === 'transplant') return transplantSite(plan, recipe, call, site);
  const template = recipe.kind === 'void' ? recipe.shape.texts.join(';\n') : recipe.shape.text;
  const counts = placeholderCounts(template);
  for (const [nm, n] of counts) if (n > 1 && !isPure(site.nodes.get(nm))) { plan.left(name, call, `call: ${nm} is used ${n} times in the body and its argument is not a plain name`); return false; }
  const captured = boundNamesIn(recipe.fn.body);
  for (const nm of recipe.ctx.locals.keys()) captured.delete(nm);
  for (const [, n] of site.nodes) {
    const ids = [];
    const v = (x) => { if (ts.isIdentifier(x)) ids.push(x.text); ts.forEachChild(x, v); };
    v(n);
    const hit = ids.find((x) => captured.has(x));
    if (hit) { plan.left(name, call, `call: the argument names ${hit}, which the inlined body binds itself`); return false; }
  }
  const text = instantiate(template, site.args, site.nodes);
  let target = call;
  if (recipe.kind === 'void') {
    let st = call.parent;
    if (ts.isAwaitExpression(st)) st = st.parent;
    if (!ts.isExpressionStatement(st)) { plan.left(name, call, 'call: the caller uses the AdapterResult this adapter returns; the gateway call returns nothing'); return false; }
    if (recipe.isAsync && !ts.isAwaitExpression(call.parent)) { plan.left(name, call, 'call: the call is not awaited where it stands'); return false; }
    const ind = indentOf(plan.text, st.getStart(sf));
    const body = recipe.shape.texts.map((t) => reindent(instantiate(t, site.args, site.nodes), ind) + ';').join(`\n${ind}`);
    const reason = planRecipeImports(plan, recipe, recipe.ctx.usedImports, recipe.gatewayUsed ? recipe.gatewayImports : []);
    if (reason) { plan.left(name, call, `call: ${reason}`); return false; }
    plan.edit(st.getStart(sf), st.getEnd(), body);
    plan.done(name, call, 'call');
    return true;
  }
  let kind = recipe.shape.textKind;
  let out = text;
  if (recipe.isAsync) {
    if (ts.isAwaitExpression(call.parent)) target = call.parent;
    else if (/^await /.test(text) && kind === K.AwaitExpression && !/\bawait\b/.test(text.slice(6))) { out = text.slice(6); kind = K.CallExpression; }
    else { plan.left(name, call, 'call: the call is not awaited where it stands'); return false; }
  }
  const reason = planRecipeImports(plan, recipe, recipe.ctx.usedImports, recipe.gatewayUsed ? recipe.gatewayImports : []);
  if (reason) { plan.left(name, call, `call: ${reason}`); return false; }
  if (needsParensAt(kind, target)) out = `(${out})`;
  plan.edit(target.getStart(sf), target.getEnd(), reindent(out, indentOf(plan.text, target.getStart(sf))));
  plan.done(name, call, 'call');
  return true;
};

/** A caller that only delegates to a block-bodied adapter takes the adapter's body as its own. */
const transplantSite = (plan, recipe, call, site) => {
  const sf = plan.sf;
  const name = recipe.name;
  let expr = call;
  if (ts.isAwaitExpression(expr.parent)) expr = expr.parent;
  let fn = expr.parent;
  if (fn && ts.isReturnStatement(fn) && ts.isBlock(fn.parent) && fn.parent.statements.length === 1) fn = fn.parent.parent;
  else if (!(fn && ts.isArrowFunction(fn) && fn.body === expr)) fn = undefined;
  if (!fn || !ts.isArrowFunction(fn)) { plan.left(name, call, 'call: the adapter body is several statements, and this caller does more than delegate to it'); return false; }
  for (const [nm, n] of site.nodes) if (!ts.isIdentifier(n)) { plan.left(name, call, `call: ${nm} is not passed as a plain name`); return false; }
  const ctx = { ...recipe.ctx, locals: null, reps: new Map(), usedImports: new Set(), errors: new Set() };
  const body = recipe.fn.body;
  const rendered = render(body, ctx);
  if (ctx.errors.size) { plan.left(name, call, `call: ${[...ctx.errors].join('; ')}`); return false; }
  const callerParams = boundNamesIn(fn);
  const innerNames = boundNamesIn(body);
  const clash = [...innerNames].find((n) => callerParams.has(n) && !site.args.has(n));
  if (clash) { plan.left(name, call, `call: the adapter body declares ${clash}, which the caller already binds`); return false; }
  const text = instantiate(rendered.text, site.args, site.nodes);
  const reason = planRecipeImports(plan, recipe, ctx.usedImports, []);
  if (reason) { plan.left(name, call, `call: ${reason}`); return false; }
  const ind = indentOf(plan.text, fn.getStart(sf));
  plan.edit(fn.equalsGreaterThanToken.getEnd(), fn.body.getEnd(), ` ${reindent(text, ind)}`);
  const isAsync = (fn.modifiers || []).some((m) => m.kind === K.AsyncKeyword);
  if (!isAsync && /\bawait\b/.test(text)) plan.edit(fn.getStart(sf), fn.getStart(sf), 'async ');
  plan.done(name, call, 'call: the caller takes the adapter body');
  return true;
};

/** Plans the caller-proxy edits for one composition of the adapter proxy. */
const handleProxyCompose = (plan, recipe, pr, ref) => {
  const sf = plan.sf;
  const name = recipe.name;
  const call = ref.parent;
  let stmt;
  let bound;
  if (ts.isVariableDeclaration(call.parent) && call.parent.initializer === call && ts.isIdentifier(call.parent.name) &&
      ts.isVariableDeclarationList(call.parent.parent) && call.parent.parent.declarations.length === 1) {
    stmt = call.parent.parent.parent;
    bound = call.parent.name.text;
  } else if (ts.isExpressionStatement(call.parent)) stmt = call.parent;
  if (!stmt) { plan.left(name, call, 'proxy: the adapter proxy is composed inside an expression'); return false; }
  const scope = stmt.parent;
  const uses = bound ? refsTo(scope, bound).filter((r) => r !== call.parent.name) : [];
  const ind = indentOf(plan.text, stmt.getStart(sf));

  if (pr.kind === 'drop') {
    if (uses.length) { plan.left(name, uses[0], `proxy: ${bound} is used, but the adapter proxy is empty and has no gateway proxy to replace it`); return false; }
    let end = stmt.getEnd();
    if (plan.text[end] === '\n') end += 1;
    const start = plan.text.lastIndexOf('\n', stmt.getStart(sf) - 1) + 1;
    plan.edit(start, end, '');
    plan.done(name, stmt, 'proxy: compose dropped (pass-through, no gateway proxy)');
    return true;
  }
  if (pr.kind === 'left') { plan.left(name, stmt, `proxy: ${pr.reason}`); return false; }

  if (pr.kind === 'transplant') {
    const a = pr.aProxy;
    const declaredHere = new Set();
    for (const st of a.pre) if (ts.isVariableStatement(st)) for (const d of st.declarationList.declarations) for (const nm of boundNamesIn(d.name.parent)) if (!d.initializer || !boundNamesIn(d.initializer).has(nm)) declaredHere.add(nm);
    const clash = [...declaredHere].find((n) => plan.declared.has(n) || plan.reserved.has(n));
    if (clash) { plan.left(name, stmt, `proxy: the adapter proxy's ${clash} would clash with a name already in this file`); return false; }
    const usedImports = new Set();
    const visit = (n) => { if (ts.isIdentifier(n) && !isDeclarationName(n) && a.imports.has(n.text)) usedImports.add(n.text); ts.forEachChild(n, visit); };
    visit(a.exp.fn.body);
    for (const nm of [...usedImports].sort()) {
      const imp = a.imports.get(nm);
      const r = plan.needImport(nm, respec(a.file, imp.spec, plan.file), imp.isType);
      if (r) { plan.left(name, stmt, `proxy: ${r}`); return false; }
    }
    for (const n of declaredHere) plan.reserved.add(n);
    const parts = a.pre.map((s) => reindent(a.sf.text.slice(s.getStart(a.sf), s.getEnd()), ind));
    if (bound) parts.push(`const ${bound} = ${reindent(a.sf.text.slice(a.returnObj.getStart(a.sf), a.returnObj.getEnd()), ind)};`);
    plan.edit(stmt.getStart(sf), stmt.getEnd(), parts.join(`\n${ind}`));
    plan.done(name, stmt, 'proxy: adapter proxy body moved into the caller proxy');
    return true;
  }

  // compose the gateway proxy in place of the adapter proxy
  const gpName = pr.gProxyName;
  if (bound === gpName) plan.renamedAway.add(bound);
  const r = plan.needImport(gpName, pr.gProxySpec, false);
  if (r) { plan.left(name, stmt, `proxy: ${r}`); return false; }
  let local = bound;
  if (bound && (bound === gpName || plan.reserved.has(bound))) {
    local = `${pr.gwName}Gateway`;
    if (plan.declared.has(local) || plan.reserved.has(local)) { plan.left(name, stmt, `proxy: no free name for the gateway proxy handle (${local} is taken)`); return false; }
  }
  if (local) plan.reserved.add(local);
  const live = uses.length > 0;
  plan.edit(stmt.getStart(sf), stmt.getEnd(), live ? `const ${local} = ${gpName}();` : `${gpName}();`);
  plan.done(name, stmt, 'proxy: compose swap');
  for (const d of pr.aProxy.defaults) {
    plan.left(name, stmt, `proxy: the adapter proxy answered by default (${d.text}); ${gpName} stages nothing until asked, so stage what this caller reads`);
  }
  for (const u of uses) {
    const p = u.parent;
    if (ts.isPropertyAccessExpression(p) && p.expression === u && ts.isCallExpression(p.parent) && p.parent.expression === p) {
      const mcall = p.parent;
      const m = pr.mapping.get(p.name.text);
      if (!m || !m.build) {
        if (local !== bound) plan.edit(u.getStart(sf), u.getEnd(), local);
        plan.left(name, mcall, `proxy: ${bound}.${p.name.text}(...): ${m ? m.reason : 'the adapter proxy has no such method'}`);
        continue;
      }
      const am = pr.aProxy.methods.get(p.name.text);
      const fake = { params: am.params };
      const sa = siteArgs(sf, mcall, fake);
      if (sa.reason) {
        if (local !== bound) plan.edit(u.getStart(sf), u.getEnd(), local);
        plan.left(name, mcall, `proxy: ${bound}.${p.name.text}(...): ${sa.reason}`);
        continue;
      }
      const built = m.build(sa.args, local);
      const out = needsParensAt(built.kind, mcall) ? `(${built.text})` : built.text;
      plan.edit(mcall.getStart(sf), mcall.getEnd(), out);
      plan.done(name, mcall, `proxy: ${p.name.text} -> ${m.how}`);
    } else {
      if (local !== bound) plan.edit(u.getStart(sf), u.getEnd(), local);
      plan.left(name, u, `proxy: ${bound} is used other than by calling one of its methods`);
    }
  }
  return true;
};

/** Decides how a row's adapter proxy turns into its callers' proxies. */
const proxyRecipe = (root, recipe) => {
  const pFile = recipe.file.replace(/\.ts$/, '.proxy.ts');
  if (!fs.existsSync(pFile)) return { kind: 'none' };
  const aProxy = analyzeProxyFile(pFile);
  const out = { aProxy, name: aProxy.exp ? aProxy.exp.name : undefined };
  const gwProxyFile = recipe.gatewayUsed && recipe.gateway ? recipe.gateway.proxyFile : undefined;
  if (gwProxyFile) {
    const gProxy = analyzeProxyFile(gwProxyFile);
    const gw = recipe.gateway;
    const m = /^#gateway\/([^/]+)\/([^/]+)$/.exec(gw.spec);
    out.kind = 'compose';
    out.gProxyName = gProxy.exp.name;
    out.gwName = gw.name;
    out.gProxySpec = `#gateway/${m[1]}/${m[2]}/${kebab(gw.name)}/${kebab(gw.name)}.proxy`;
    out.mapping = new Map();
    for (const mn of [...aProxy.methods.keys()].sort()) out.mapping.set(mn, mapProxyMethod(aProxy, mn, gProxy, gw.name));
    return out;
  }
  if (aProxy.empty) return { ...out, kind: 'drop' };
  if (aProxy.handles.size) return { ...out, kind: 'left', reason: 'the adapter proxy mocks a function and the gateway call has no proxy to compose' };
  if (aProxy.helpers.length) return { ...out, kind: 'left', reason: `the adapter proxy declares ${aProxy.helpers.join(', ')} at module level` };
  if (!aProxy.returnObj) return { ...out, kind: 'left', reason: 'the adapter proxy returns something other than an object literal' };
  return { ...out, kind: 'transplant' };
};

// ---------------------------------------------------------------------------------------------------------
// main

const main = () => {
  const argv = process.argv.slice(2);
  const root = path.resolve(argv.find((a) => !a.startsWith('--') && a !== 'apply') || '');
  const apply = argv.includes('apply');
  const rowsArg = (argv.find((a) => a.startsWith('--rows=')) || '').slice('--rows='.length);
  const outDir = path.resolve((argv.find((a) => a.startsWith('--out=')) || '').slice('--out='.length) || path.join(SCRIPT_REPO, 'tmp/sd-3'));
  if (!root || !fs.existsSync(path.join(root, 'packages'))) {
    console.error('usage: node sd3-inline.cjs <root> [apply] [--rows=<package|adapterName|file-base>,...] [--out=<dir>]');
    process.exit(2);
  }
  const filters = rowsArg ? rowsArg.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const allRows = readTable(root);
  const rows = allRows.filter((r) => {
    if (!filters.length) return true;
    const base = path.basename(r.adapterPath, '.ts');
    const m = /^export const (\w+)/m.exec(readText(path.join(root, r.adapterPath)));
    return filters.some((f) => f === r.pkg || f === base || (m && f === m[1]));
  });

  const recipes = [];
  const skipped = [];
  for (const row of rows) {
    const gw = parseGatewayCell(row.gatewayCell);
    const m = /^export const (\w+)/m.exec(readText(path.join(root, row.adapterPath)));
    if (gw.gap) { skipped.push({ pkg: row.pkg, adapter: m ? m[1] : row.adapterPath, adapterPath: row.adapterPath, reason: `gateway gap: ${gw.gap.replace(/`/g, '')}` }); continue; }
    const recipe = buildRecipe(root, row, gw);
    recipe.row = row;
    recipe.name = recipe.name || (m && m[1]);
    recipe.proxy = recipe.kind === 'left' ? { kind: 'left', reason: recipe.reason } : proxyRecipe(root, recipe);
    recipe.proxyName = recipe.proxy.name || `${recipe.name}Proxy`;
    recipes.push(recipe);
  }

  const files = walk(path.join(root, 'packages'));
  const nameRe = new RegExp(`\\b(${recipes.map((r) => r.name).join('|')})(Proxy)?\\b`);
  const plans = [];
  for (const file of files) {
    const rel = path.relative(root, file);
    let text;
    try { text = readText(file); } catch { continue; }
    if (!recipes.length || !nameRe.test(text)) continue;
    const plan = new FilePlan(root, file);
    for (const recipe of recipes) {
      const own = path.dirname(recipe.file) + path.sep;
      if (file.startsWith(own)) continue;
      const mentions = new RegExp(`\\b${recipe.name}(Proxy)?\\b`);
      if (!mentions.test(text)) continue;
      if (BARRELS.has(rel)) { plan.left(recipe.name, null, 'barrel re-export (A-7 removes the barrel)'); continue; }
      if (!/\.tsx?$/.test(file)) { plan.left(recipe.name, null, 'a plain JavaScript file names the adapter'); continue; }
      planFileForRecipe(plan, recipe);
    }
    plans.push(plan);
  }

  // apply and collect
  const byPkg = new Map();
  const pkgOf = (p) => (p.startsWith('packages/') ? p.split('/')[1] : '-');
  const ensure = (pkg) => {
    if (!byPkg.has(pkg)) byPkg.set(pkg, { package: pkg, adapters: [], skipped: [], done: [], left: [] });
    return byPkg.get(pkg);
  };
  for (const r of recipes) ensure(r.row.pkg).adapters.push({ adapter: r.name, path: r.row.adapterPath, recipe: r.kind, proxy: r.proxy.kind, reason: r.reason || r.proxy.reason || undefined, notes: r.row.notes || undefined });
  for (const s of skipped) ensure(s.pkg).skipped.push(s);
  for (const plan of plans) {
    const out = plan.finish();
    const changed = out !== plan.text;
    if (apply && changed) fs.writeFileSync(plan.file, out);
    for (const l of plan.log) {
      const recipe = recipes.find((r) => r.name === l.adapter);
      const pkg = recipe ? recipe.row.pkg : pkgOf(plan.rel);
      const entry = { file: plan.rel, line: l.line, endLine: l.endLine, adapter: l.adapter, what: l.what };
      ensure(pkg)[l.kind === 'DONE' ? 'done' : 'left'].push(entry);
    }
  }
  const cmp = (a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line || (a.adapter < b.adapter ? -1 : a.adapter > b.adapter ? 1 : a.what < b.what ? -1 : a.what > b.what ? 1 : 0));
  fs.mkdirSync(outDir, { recursive: true });
  for (const [pkg, rep] of [...byPkg].sort()) {
    rep.done.sort(cmp);
    rep.left.sort(cmp);
    const inlined = rep.adapters.filter((a) => a.recipe !== 'left').map((a) => a.adapter);
    const summary = { package: pkg, mode: apply ? 'apply' : 'dry-run', root, adaptersInlined: inlined.length, adaptersLeft: rep.adapters.length - inlined.length, skipped: rep.skipped.length, editsDone: rep.done.length, editsLeft: rep.left.length };
    fs.writeFileSync(path.join(outDir, `leftovers-${pkg}.json`), `${JSON.stringify({ summary, adapters: rep.adapters, skipped: rep.skipped, left: rep.left, done: rep.done }, null, 2)}\n`);
    console.log(`===== ${pkg}`);
    for (const a of rep.adapters) console.log(`ROW  ${a.adapter}: body ${a.recipe}, proxy ${a.proxy}${a.reason ? ` (${a.reason})` : ''}`);
    for (const s of rep.skipped) console.log(`SKIP ${s.adapter}: ${s.reason.slice(0, 160)}`);
    for (const d of rep.done) console.log(`DONE ${d.file}:${d.line} ${d.adapter} ${d.what}`);
    for (const d of rep.left) console.log(`LEFT ${d.file}:${d.line} ${d.adapter} ${d.what}`);
    console.log(`SUMMARY ${pkg} inlined=${summary.adaptersInlined} rowsLeft=${summary.adaptersLeft} skipped=${summary.skipped} done=${summary.editsDone} left=${summary.editsLeft}`);
  }
};

/** Plans every edit one adapter needs in one file. */
const planFileForRecipe = (plan, recipe) => {
  const sf = plan.sf;
  const name = recipe.name;
  const pName = recipe.proxyName;
  const nameRefs = refsTo(sf, name).filter((r) => !ts.isImportSpecifier(r.parent));
  const proxyRefs = refsTo(sf, pName).filter((r) => !ts.isImportSpecifier(r.parent));
  let handled = 0;
  let pHandled = 0;
  for (const ref of nameRefs) {
    const p = ref.parent;
    if (ts.isCallExpression(p) && p.expression === ref) {
      if (recipe.kind === 'left') { plan.left(name, p, `call: ${recipe.reason}`); continue; }
      if (handleCallSite(plan, recipe, ref)) handled += 1;
    } else if (ts.isPropertyAssignment(p) && p.initializer === ref && p.name.getText(sf) === 'fn') {
      plan.left(name, p, 'proxy: registerMock on the adapter itself; compose the gateway proxy and stage by path');
    } else if (ts.isTypeQueryNode(p)) {
      plan.left(name, p, 'a type names the adapter (typeof)');
    } else {
      plan.left(name, ref, 'the adapter is named other than by a call');
    }
  }
  for (const ref of proxyRefs) {
    const p = ref.parent;
    if (ts.isCallExpression(p) && p.expression === ref && p.arguments.length === 0) {
      if (recipe.proxy.kind === 'none') { plan.left(name, p, 'proxy: the adapter has no proxy file'); continue; }
      if (handleProxyCompose(plan, recipe, recipe.proxy, ref)) pHandled += 1;
    } else plan.left(name, ref, 'proxy: the adapter proxy is named other than by a bare compose call');
  }
  // imports: drop a name only when nothing else here still uses it
  if (plan.imports.has(name)) {
    if (handled === nameRefs.length) { plan.removeNames.add(name); plan.done(name, null, 'import of the adapter dropped'); }
    else if (nameRefs.length) plan.left(name, importNode(sf, name), 'import of the adapter kept: the file still names it');
  }
  if (plan.imports.has(pName)) {
    if (pHandled === proxyRefs.length) { plan.removeNames.add(pName); plan.done(name, null, 'import of the adapter proxy dropped'); }
    else plan.left(name, importNode(sf, pName), 'import of the adapter proxy kept: the file still names it');
  }
  // the adapter named in text: test titles and comments
  const reName = new RegExp(`\\b${name}(Proxy)?\\b`, 'g');
  const visitStr = (n) => {
    if ((ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) && reName.test(n.text)) plan.left(name, n, 'a string names the adapter (a test title or message)');
    reName.lastIndex = 0;
    ts.forEachChild(n, visitStr);
  };
  visitStr(sf);
  const comments = [];
  const seen = new Set();
  const scanComments = (n) => {
    for (const r of ts.getLeadingCommentRanges(plan.text, n.getFullStart()) || []) {
      if (seen.has(r.pos)) continue;
      seen.add(r.pos);
      const t = plan.text.slice(r.pos, r.end);
      reName.lastIndex = 0;
      if (reName.test(t)) comments.push(r);
    }
    ts.forEachChild(n, scanComments);
  };
  scanComments(sf);
  for (const r of comments.sort((a, b) => a.pos - b.pos)) {
    plan.log.push({ kind: 'LEFT', adapter: name, pos: r.pos, end: r.end, what: 'a comment names the adapter' });
  }
};

const importNode = (sf, name) => {
  for (const st of sf.statements) if (ts.isImportDeclaration(st) && st.getText(sf).includes(name)) return st;
  return null;
};

main();
