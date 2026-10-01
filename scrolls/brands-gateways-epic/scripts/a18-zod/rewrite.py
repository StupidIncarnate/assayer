import os, re, sys
pkg = sys.argv[1]; apply = len(sys.argv) > 2 and sys.argv[2] == 'apply'
root = os.path.join('packages', pkg)
FROM = re.compile(r"^((?:import|export)\b[^\n]*|[ \t]*\}[^\n]*?)\bfrom\s+(['\"])([^'\"]+)\2", re.M)
OTHER = re.compile(r"\b(?:require|import)\(\s*['\"]([^'\"]+)['\"]")
SIDE = re.compile(r"^import\s+(['\"])([^'\"]+)\1", re.M)
def raw(s): return not (s.startswith('.') or s.startswith('#') or s.startswith('@dungeonmaster/'))
changed, skipped = [], []
for d, dirs, files in os.walk(root):
    dirs[:] = [x for x in dirs if x not in ('node_modules', 'dist', 'coverage')]
    for f in files:
        if not f.endswith(('.ts', '.tsx')): continue
        p = os.path.join(d, f); t = open(p).read()
        specs = [m.group(3) for m in FROM.finditer(t)] + OTHER.findall(t) + [m.group(2) for m in SIDE.finditer(t)]
        if 'zod' not in specs: continue
        others = sorted({s for s in specs if raw(s) and s != 'zod'})
        if others: skipped.append((p, others)); continue
        new = FROM.sub(lambda m: m.group(0) if m.group(3) != 'zod' else m.group(0)[:m.start(2)-m.start(0)] + "'#gateway/npm/zod'", t)
        if new != t:
            changed.append(p)
            if apply: open(p, 'w').write(new)
print(pkg, 'changed', len(changed), 'skipped-other-raw', len(skipped))
for p in changed: print(' C', p)
for p, o in skipped: print(' S', p, o)
