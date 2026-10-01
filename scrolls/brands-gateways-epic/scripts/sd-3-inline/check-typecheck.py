#!/usr/bin/env python3
"""Checks a typecheck run of an inlined tree against the inliner's LEFT list.

Usage: check-typecheck.py <root> <leftovers-dir> <package>=<tsc-output-file>...

For each package it reads `tsc --noEmit` output and `leftovers-<package>.json`, and reports every
error whose file and line fall inside a LEFT entry's line range (expected: the script left that site
for an agent) and every error that does not (a fault in an edit the script made). LEFT entries from
every package are used, because a core edit can surface an error in a core file a desktop row touched.
Exit code 1 when any error sits outside a LEFT line.
"""
import json
import os
import re
import sys

root = os.path.abspath(sys.argv[1])
left_dir = sys.argv[2]
runs = [a.split('=', 1) for a in sys.argv[3:]]

left = {}
for fn in sorted(os.listdir(left_dir)):
    if fn.startswith('leftovers-') and fn.endswith('.json'):
        for e in json.load(open(os.path.join(left_dir, fn)))['left']:
            left.setdefault(e['file'], []).append((e['line'], e['endLine'], e['what']))

err_re = re.compile(r'^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$')
bad_total = 0
for pkg, out in runs:
    on_left, off_left = [], []
    for line in open(out):
        m = err_re.match(line.rstrip('\n'))
        if not m:
            continue
        path = os.path.relpath(os.path.abspath(m.group(1)), root)
        ln = int(m.group(2))
        hits = [w for (a, b, w) in left.get(path, []) if a <= ln <= b]
        (on_left if hits else off_left).append((path, ln, m.group(4), m.group(5)[:140], hits[:1]))
    print('===== %s: %d errors, %d on a LEFT line, %d not' % (pkg, len(on_left) + len(off_left), len(on_left), len(off_left)))
    for p, ln, code, msg, _ in off_left:
        print('  OFF  %s:%d %s %s' % (p, ln, code, msg))
    bad_total += len(off_left)
sys.exit(1 if bad_total else 0)
