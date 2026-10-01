import sys,re,glob
apply='apply' in sys.argv
files=['package.json']+sorted(glob.glob('packages/*/package.json')+glob.glob('packages/@gateway/*/package.json'))
total=0
for p in files:
    t=open(p).read()
    n=re.sub(r'"name": "assayer-monorepo"','"name": "@assayer/monorepo"',t)
    n=n.replace('@assayer-monorepo/','@assayer/')
    if n!=t:
        diff=[(a,b) for a,b in zip(t.splitlines(),n.splitlines()) if a!=b]
        total+=len(diff)
        print('==',p)
        for a,b in diff: print('  -',a.strip()); print('  +',b.strip())
        if apply: open(p,'w').write(n)
print('changed lines:',total,'applied' if apply else 'dry run')
