#!/usr/bin/env python3
"""Counts the hand edits inlining one adapter needs, in a repo tree.

Usage: count-edits.py <root> <adapterName>

An edit is one changed line. It counts:
  impl   - in a caller file: the adapter import line, and every line calling the adapter.
  proxy  - in a caller proxy: every line naming the adapter or its proxy (import, compose,
           registerMock), and every line staging or reading through the handle bound to either.
  test   - in a test file: every line naming the adapter, and every line calling a caller-proxy
           method whose body stages or reads through that handle.
"""
import os, re, sys

root, name = sys.argv[1], sys.argv[2]
adapter_re = re.compile(r'\b(%s|%sProxy)\b' % (name, name))


def walk():
    for dp, dns, fns in os.walk(os.path.join(root, 'packages')):
        dns[:] = [d for d in dns if d not in ('node_modules', 'dist', '.ward', '.assayer')]
        for fn in fns:
            if fn.endswith(('.ts', '.tsx')):
                p = os.path.join(dp, fn)
                if '/src/adapters/' in p:
                    continue
                yield p


def handle_vars(text):
    """Names bound to the adapter proxy or to registerMock({ fn: adapter })."""
    out = set()
    for m in re.finditer(r'const\s+(\w+)\s*=\s*(?:%sProxy\(\)|registerMock\(\{\s*fn:\s*%s\s*\}\))' % (name, name), text):
        out.add(m.group(1))
    return out


def method_spans(lines):
    """Returned-object methods of a proxy: name -> (start, end) line indexes, by indentation."""
    spans = {}
    for i, l in enumerate(lines):
        m = re.match(r'^(\s+)(\w+):\s*(?:\([^)]*\)|\(\{[^}]*\}[^)]*\))\s*(?::[^=]*)?=>', l)
        if not m or l.rstrip().endswith(';'):
            continue
        ind = len(m.group(1))
        j = i + 1
        if l.rstrip().endswith(('{', '(')):
            while j < len(lines) and not (lines[j].strip() in ('},', '}', '),', ')') and len(lines[j]) - len(lines[j].lstrip()) == ind):
                j += 1
        else:
            while j < len(lines) and (len(lines[j]) - len(lines[j].lstrip()) > ind) and lines[j].strip():
                j += 1
            j -= 1
        spans[m.group(2)] = (i, j)
    return spans


files = list(walk())
counts = {'impl': 0, 'proxy': 0, 'test': 0}
detail = []
proxy_methods = {}  # proxy export name -> set of staging methods
for p in files:
    text = open(p).read()
    if not adapter_re.search(text):
        continue
    lines = text.splitlines()
    rel = os.path.relpath(p, root)
    if p.endswith('.proxy.ts'):
        hv = handle_vars(text)
        hit = set()
        for i, l in enumerate(lines):
            code = l.split('//')[0]
            if adapter_re.search(code) or any(re.search(r'\b%s\.' % v, code) for v in hv):
                hit.add(i)
        spans = method_spans(lines)
        staged = {m for m, (a, b) in spans.items() if any(a <= i <= b for i in hit)}
        exp = re.search(r'export const (\w+)\s*=', text)
        if exp:
            proxy_methods[exp.group(1)] = staged
        counts['proxy'] += len(hit)
        detail.append((rel, 'proxy', len(hit), sorted(staged)))
    elif p.endswith('.test.ts') or p.endswith('.test.tsx'):
        pass
    else:
        n = sum(1 for l in lines if adapter_re.search(l.split('//')[0]) and not l.lstrip().startswith(('*', '/*')))
        counts['impl'] += n
        detail.append((rel, 'impl', n, []))

for p in files:
    if not (p.endswith('.test.ts') or p.endswith('.test.tsx')):
        continue
    text = open(p).read()
    lines = text.splitlines()
    n = sum(1 for l in lines if adapter_re.search(l))
    for prox, methods in proxy_methods.items():
        if not methods or not re.search(r'\b%s\b' % prox, text):
            continue
        n += sum(1 for l in lines if re.search(r'\.(%s)\(' % '|'.join(methods), l))
    if n:
        counts['test'] += n
        detail.append((os.path.relpath(p, root), 'test', n, []))

for d in sorted(detail):
    print('  %-6s %3d  %s %s' % (d[1], d[2], d[0], ('staging methods: ' + ','.join(d[3])) if d[3] else ''))
print('TOTAL', name, counts, sum(counts.values()))
