#!/usr/bin/env python3
"""SD-3 trial: inlines a thin adapter into its callers, in a tree you name.

Usage: inline.py <root> <recipe-name>...   (recipe names are the keys of RECIPES below)

For each recipe it does the mechanical part only:
  - in each caller: swaps the adapter import for the gateway import, rewrites each call to the
    gateway call shape, and adds the contract import the call shape needs;
  - in each caller proxy: swaps the adapter proxy import for the gateway proxy import (or drops it,
    for a pass-through with no proxy), swaps the compose call, and rewrites a staging call only
    where the recipe maps that adapter-proxy method onto a gateway form.
It never edits a line it cannot translate. It prints every such line as LEFT, with the reason.
It prints one DONE line per edit it made, so the counts can be checked against a typecheck.
"""
import os
import re
import sys

RECIPES = {
    'path-relative': {
        'adapter': 'pathRelativeAdapter',
        'gateway_names': ['relative'],
        'gateway_from': '#gateway/node/path',
        # args read from the adapter's object argument, by key
        'call': lambda a: 'relPathContract.parse(relative(%s, %s))' % (a['from'], a['to']),
        'extra_imports': [('relPathContract', '@assayer/shared/contracts')],
        'gateway_proxy': None,  # pass-through: no proxy to compose
        'proxy_methods': {},
    },
    'stdout-is-tty': {
        'adapter': 'processStdoutIsTtyAdapter',
        'gateway_names': ['stdout'],
        'gateway_from': '#gateway/node/process',
        'call': lambda a: 'stdout.isTTY',
        'extra_imports': [],
        'gateway_proxy': ('stdoutProxy', '#gateway/node/process/stdout/stdout.proxy'),
        # the adapter proxy's own method bodies, inlined at each staging call
        'proxy_methods': {
            'enableTty': ('stdout.isTTY = true', [('stdout', '#gateway/node/process')]),
            'disableTty': ('stdout.isTTY = false', [('stdout', '#gateway/node/process')]),
        },
    },
    'fs-read-file': {
        'adapter': 'fsReadFileAdapter',
        'gateway_names': ['readFile'],
        'gateway_from': '#gateway/node/fs__promises',
        # the call site keeps its own `await`: `await X({path})` -> `await Y(...)` is rewritten as a whole
        'call': lambda a: 'fileContentsContract.parse(await readFile(%s))' % a['path'],
        'await_inside': True,
        'extra_imports': [('fileContentsContract', 'core:src/contracts/file-contents/file-contents-contract')],
        'gateway_proxy': ('readFileProxy', '#gateway/node/fs__promises/read-file/read-file.proxy'),
        'proxy_methods': {},  # every adapter-proxy staging is path-less; the gateway proxy needs a path
    },
}


def scan_balanced(text, i):
    """text[i] is an opening bracket; returns the index just past its match. Skips strings."""
    pairs = {'(': ')', '{': '}', '[': ']'}
    stack = []
    n = len(text)
    while i < n:
        c = text[i]
        if c in '\'"':
            j = i + 1
            while text[j] != c:
                j += 2 if text[j] == '\\' else 1
            i = j + 1
            continue
        if c == '`':
            j = i + 1
            while text[j] != '`':
                if text[j] == '\\':
                    j += 2
                    continue
                if text.startswith('${', j):
                    j = scan_balanced(text, j + 1)
                    continue
                j += 1
            i = j + 1
            continue
        if c in pairs:
            stack.append(pairs[c])
        elif c in ')}]':
            if not stack or stack.pop() != c:
                raise ValueError('unbalanced at %d' % i)
            if not stack:
                return i + 1
        i += 1
    raise ValueError('unterminated')


def split_top(s, sep=','):
    out, depth, cur, i = [], 0, '', 0
    while i < len(s):
        c = s[i]
        if c in '([{':
            j = scan_balanced(s, i)
            cur += s[i:j]
            i = j
            continue
        if c in '\'"`':
            k = i + 1
            while s[k] != c:
                k += 2 if s[k] == '\\' else 1
            cur += s[i:k + 1]
            i = k + 1
            continue
        if c == sep and depth == 0:
            out.append(cur)
            cur = ''
        else:
            cur += c
        i += 1
    if cur.strip():
        out.append(cur)
    return [x.strip() for x in out]


def object_args(inner):
    """'{ path: x, to: y }' -> {'path': 'x', 'to': 'y'}; shorthand '{ path }' -> {'path': 'path'}."""
    inner = inner.strip()
    if not inner:
        return {}
    if not (inner.startswith('{') and inner.endswith('}')):
        raise ValueError('argument is not an object literal: %s' % inner)
    args = {}
    for part in split_top(inner[1:-1]):
        if ':' in part:
            k, v = part.split(':', 1)
            args[k.strip()] = v.strip()
        else:
            args[part] = part
    return args


def line_of(text, idx):
    return text.count('\n', 0, idx) + 1


def resolve_spec(spec, file_path, root):
    if spec.startswith('core:'):
        target = os.path.join(root, 'packages/core', spec[len('core:'):])
        rel = os.path.relpath(target, os.path.dirname(file_path))
        return rel if rel.startswith('.') else './' + rel
    return spec


IMPORT_RE = re.compile(r'^import\s+(type\s+)?\{([^}]*)\}\s+from\s+\'([^\']+)\';[ \t]*\n', re.M)


def ensure_import(text, name, spec):
    """Adds `name` to a value import from `spec`, merging into an existing one. Returns (text, added)."""
    for m in IMPORT_RE.finditer(text):
        if m.group(1) or m.group(3) != spec:
            continue
        names = [x.strip() for x in m.group(2).split(',') if x.strip()]
        if name in names:
            return text, False
        names.append(name)
        new = "import { %s } from '%s';\n" % (', '.join(names), spec)
        return text[:m.start()] + new + text[m.end():], True
    # insert after the last import
    last = None
    for m in IMPORT_RE.finditer(text):
        last = m
    pos = last.end() if last else 0
    return text[:pos] + "import { %s } from '%s';\n" % (name, spec) + text[pos:], True


def drop_import_name(text, name):
    """Removes `name` from its import; drops the whole line if it was the only name. Returns (text, spec)."""
    for m in IMPORT_RE.finditer(text):
        names = [x.strip() for x in m.group(2).split(',') if x.strip()]
        if name not in names:
            continue
        names.remove(name)
        if names:
            new = "import %s{ %s } from '%s';\n" % (m.group(1) or '', ', '.join(names), m.group(3))
        else:
            new = ''
        return text[:m.start()] + new + text[m.end():], m.group(3)
    return text, None


def code_mentions(text, name):
    """True when `name` appears outside a comment line."""
    for l in text.splitlines():
        s = l.strip()
        if s.startswith(('//', '*', '/*')):
            continue
        if re.search(r'\b%s\b' % name, l.split('//')[0]):
            return True
    return False


def files_under(root):
    for dp, dns, fns in os.walk(os.path.join(root, 'packages')):
        dns[:] = [d for d in dns if d not in ('node_modules', 'dist', '.ward', '.assayer')]
        for fn in fns:
            p = os.path.join(dp, fn)
            if fn.endswith(('.ts', '.tsx')) and '/src/adapters/' not in p:
                yield p


def rewrite_caller(path, r, root, log):
    text = open(path).read()
    adapter = r['adapter']
    rel = os.path.relpath(path, root)
    out, i, calls = '', 0, 0
    pat = re.compile(r'(await\s+)?\b%s\s*\(' % adapter)
    while True:
        m = pat.search(text, i)
        if not m:
            out += text[i:]
            break
        # skip comment lines and the import line
        ls = text.rfind('\n', 0, m.start()) + 1
        prefix = text[ls:m.start()].strip()
        if prefix.startswith(('//', '*', '/*', 'import')):
            out += text[i:m.end()]
            i = m.end()
            continue
        open_idx = m.end() - 1
        close = scan_balanced(text, open_idx)
        try:
            args = object_args(text[open_idx + 1:close - 1])
            if r.get('await_inside') and not m.group(1):
                raise ValueError('call is not awaited where it stands')
            new = r['call'](args)
        except (ValueError, KeyError) as e:
            log.append(('LEFT', rel, line_of(text, m.start()), 'call: %s' % e))
            out += text[i:close]
            i = close
            continue
        out += text[i:m.start()] + new
        log.append(('DONE', rel, line_of(text, m.start()), 'call'))
        calls += 1
        i = close
    text = out
    if not code_mentions_after_import(text, adapter):
        text, _ = drop_import_name(text, adapter)
        log.append(('DONE', rel, 0, 'import swap'))
        for g in r['gateway_names']:
            text, _ = ensure_import(text, g, r['gateway_from'])
        for name, spec in r['extra_imports']:
            text, _ = ensure_import(text, name, resolve_spec(spec, path, root))
    else:
        for g in r['gateway_names']:
            text, _ = ensure_import(text, g, r['gateway_from'])
        for name, spec in r['extra_imports']:
            text, _ = ensure_import(text, name, resolve_spec(spec, path, root))
        log.append(('LEFT', rel, 0, 'import kept: the adapter is still named in code'))
    open(path, 'w').write(text)


def code_mentions_after_import(text, name):
    body = IMPORT_RE.sub('', text)
    return code_mentions(body, name)


def rewrite_proxy(path, r, root, log):
    text = open(path).read()
    adapter = r['adapter']
    aproxy = adapter + 'Proxy'
    rel = os.path.relpath(path, root)
    lines = text.split('\n')
    gp = r['gateway_proxy']

    # names bound to the adapter proxy
    bound = re.findall(r'const\s+(\w+)\s*=\s*%s\(\)' % aproxy, text)

    # a local name that would shadow the gateway proxy import gets a new name
    if gp and re.search(r'\bconst\s+%s\b' % gp[0], text):
        newname = gp[0].replace('Proxy', 'Gateway')
        text = re.sub(r'\b%s\b' % gp[0], newname, text)
        bound = [newname if b == gp[0] else b for b in bound]
        log.append(('DONE', rel, 0, 'rename local %s -> %s' % (gp[0], newname)))

    # staging calls on a bound handle
    for b in bound:
        pending_imports = []
        new = ''
        i = 0
        for m in re.finditer(r'\b%s\.(\w+)\(' % b, text):
            close = scan_balanced(text, m.end() - 1)
            seg = text[m.start():close]
            method = m.group(1)
            ln = line_of(text, m.start())
            if method in r['proxy_methods']:
                expr, imports = r['proxy_methods'][method]
                pending_imports.extend(imports)
                new += text[i:m.start()] + expr
                log.append(('DONE', rel, ln, 'staging %s.%s' % (b, method)))
            else:
                new += text[i:close]
                log.append(('LEFT', rel, ln, 'staging %s.%s(...): no gateway form for a path-less stage' % (b, method)))
            i = close
        text = new + text[i:]
        for name, spec in pending_imports:
            text, _ = ensure_import(text, name, spec)

    # compose call: `const x = aProxy();` or bare `aProxy();`
    def compose(m):
        ln = line_of(text, m.start())
        if gp is None:
            log.append(('DONE', rel, ln, 'compose dropped (pass-through)'))
            return ''
        var = m.group(1)
        still_used = var and re.search(r'\b%s\.' % var, text)
        log.append(('DONE', rel, ln, 'compose swap'))
        if var and still_used:
            return '%sconst %s = %s();\n' % (m.group(0)[:len(m.group(0)) - len(m.group(0).lstrip())], var, gp[0])
        return '%s%s();\n' % (m.group(0)[:len(m.group(0)) - len(m.group(0).lstrip())], gp[0])
    text = re.sub(r'^[ \t]*(?:const\s+(\w+)\s*=\s*)?%s\(\);[ \t]*\n' % aproxy, compose, text, flags=re.M)

    # import swap
    text, spec = drop_import_name(text, aproxy)
    if spec:
        log.append(('DONE', rel, 0, 'proxy import swap' if gp else 'proxy import dropped'))
        if gp:
            text, _ = ensure_import(text, gp[0], gp[1])

    # the adapter itself, mocked directly (registerMock({ fn: adapter })) — never translated
    for m in re.finditer(r'registerMock\(\{\s*fn:\s*%s\s*\}\)' % adapter, text):
        log.append(('LEFT', rel, line_of(text, m.start()),
                    'registerMock on the adapter: the gateway wrapper has a real body, so compose its proxy and restage by path'))
    hv = re.findall(r'const\s+(\w+)\s*=\s*registerMock\(\{\s*fn:\s*%s\s*\}\)' % adapter, text)
    for h in hv:
        for m in re.finditer(r'\b%s\.(calledWith|onceFor|callsMatching)\(' % h, text):
            log.append(('LEFT', rel, line_of(text, m.start()), 'staging on the adapter mock %s.%s' % (h, m.group(1))))
    if hv:
        log.append(('LEFT', rel, 0, 'import of %s kept for its direct mock' % adapter))
    open(path, 'w').write(text)


def main():
    root = sys.argv[1]
    for key in sys.argv[2:]:
        r = RECIPES[key]
        adapter = r['adapter']
        log = []
        for p in sorted(files_under(root)):
            text = open(p).read()
            if not re.search(r'\b%s(Proxy)?\b' % adapter, text):
                continue
            if p.endswith('.proxy.ts'):
                rewrite_proxy(p, r, root, log)
            elif re.search(r'\.test\.tsx?$', p):
                for i, l in enumerate(text.splitlines()):
                    if re.search(r'\b%s\b' % adapter, l):
                        log.append(('LEFT', os.path.relpath(p, root), i + 1, 'test text names the adapter'))
            elif code_mentions(text, adapter):
                rewrite_caller(p, r, root, log)
        print('=====', key)
        for kind, rel, ln, what in log:
            print('%-4s %s:%s %s' % (kind, rel, ln, what))
        print('SUMMARY %s done=%d left=%d' % (key, sum(1 for x in log if x[0] == 'DONE'), sum(1 for x in log if x[0] == 'LEFT')))


if __name__ == '__main__':
    main()
