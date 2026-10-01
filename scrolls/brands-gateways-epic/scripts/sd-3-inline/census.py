#!/usr/bin/env python3
"""Lists every file and line naming an adapter or its proxy, by kind. Usage: census.py <root> <adapterName>..."""
import os, re, sys
root = sys.argv[1]
for name in sys.argv[2:]:
    pat = re.compile(r'\b(%s|%sProxy)\b' % (name, name))
    print('=====', name)
    for dp, dns, fns in os.walk(os.path.join(root, 'packages')):
        dns[:] = [d for d in dns if d not in ('node_modules', 'dist', '.ward', '.assayer')]
        for fn in sorted(fns):
            if not fn.endswith(('.ts', '.tsx', '.js')): continue
            p = os.path.join(dp, fn)
            try: lines = open(p).read().splitlines()
            except Exception: continue
            hits = [(i + 1, l.strip()) for i, l in enumerate(lines) if pat.search(l)]
            if hits and '/adapters/' not in p.replace(root, ''):
                print(' ', os.path.relpath(p, root), len(hits))
                for i, l in hits: print('     %d: %s' % (i, l[:150]))
