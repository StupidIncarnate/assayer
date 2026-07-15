// The REAL `typescript`, not ts-morph's bundled copy: nodes from two TypeScript instances are not
// interchangeable, and the host compiler always hands us its own module. Passing `ts` in is what
// makes that testable rather than a latent runtime surprise.
import ts from 'typescript';

import { ProbeSiteStub } from '../../../contracts/probe-site/probe-site.stub';
import { jestProbeInjectAdapter } from './jest-probe-inject-adapter';
import { jestProbeInjectAdapterProxy } from './jest-probe-inject-adapter.proxy';

// `if (score > 5) { return 1; }` — `score > 5` occupies [4, 13); the returned `1` occupies [24, 25).
const SOURCE = 'if (score > 5) { return 1; }';

const COND_SITE = ProbeSiteStub({ id: 'f/if:x#leaf', kind: 'cond', start: 4, end: 13 });
const EXIT_SITE = ProbeSiteStub({ id: 'f/return@then', kind: 'exit', start: 24, end: 25 });

describe('jestProbeInjectAdapter', () => {
  describe('wrapping sites', () => {
    it('VALID: {a cond site over the condition} => wraps it in __P.c with its coverage id', () => {
      jestProbeInjectAdapterProxy();
      const sourceFile = ts.createSourceFile('f.ts', SOURCE, ts.ScriptTarget.ES2022, true);

      const result = ts.transform(sourceFile, [
        (context) => (file) => jestProbeInjectAdapter({ ts, context, sourceFile: file, sites: [COND_SITE] }),
      ]);
      const printed = result.transformed.map((out) => ts.createPrinter().printFile(out)).join('');

      expect(printed.trim()).toBe('if (__P.c("f/if:x#leaf", score > 5)) {\n    return 1;\n}');
    });

    it('VALID: {an exit site over the returned expression} => wraps it in __P.x', () => {
      jestProbeInjectAdapterProxy();
      const sourceFile = ts.createSourceFile('f.ts', SOURCE, ts.ScriptTarget.ES2022, true);

      const result = ts.transform(sourceFile, [
        (context) => (file) => jestProbeInjectAdapter({ ts, context, sourceFile: file, sites: [EXIT_SITE] }),
      ]);
      const printed = result.transformed.map((out) => ts.createPrinter().printFile(out)).join('');

      expect(printed.trim()).toBe('if (score > 5) {\n    return __P.x("f/return@then", 1);\n}');
    });

    it('VALID: {both sites} => wraps each independently, nesting the condition inside the if', () => {
      jestProbeInjectAdapterProxy();
      const sourceFile = ts.createSourceFile('f.ts', SOURCE, ts.ScriptTarget.ES2022, true);

      const result = ts.transform(sourceFile, [
        (context) => (file) => jestProbeInjectAdapter({ ts, context, sourceFile: file, sites: [COND_SITE, EXIT_SITE] }),
      ]);
      const printed = result.transformed.map((out) => ts.createPrinter().printFile(out)).join('');

      expect(printed.trim()).toBe(
        'if (__P.c("f/if:x#leaf", score > 5)) {\n    return __P.x("f/return@then", 1);\n}',
      );
    });
  });

  describe('files with nothing to wrap', () => {
    // "Analyzed, no sites" must be a no-op rather than an error: a file can legitimately have no
    // probeable expression, and the instrumenter must leave it byte-for-byte alone.
    it('EMPTY: {no sites} => leaves the file untouched', () => {
      jestProbeInjectAdapterProxy();
      const sourceFile = ts.createSourceFile('f.ts', SOURCE, ts.ScriptTarget.ES2022, true);

      const result = ts.transform(sourceFile, [
        (context) => (file) => jestProbeInjectAdapter({ ts, context, sourceFile: file, sites: [] }),
      ]);
      const printed = result.transformed.map((out) => ts.createPrinter().printFile(out)).join('');

      expect(printed.trim()).toBe('if (score > 5) {\n    return 1;\n}');
    });

    it('EDGE: {a site whose range matches nothing} => leaves the file untouched rather than guessing', () => {
      jestProbeInjectAdapterProxy();
      const sourceFile = ts.createSourceFile('f.ts', SOURCE, ts.ScriptTarget.ES2022, true);

      const result = ts.transform(sourceFile, [
        (context) => (file) =>
          jestProbeInjectAdapter({
            ts,
            context,
            sourceFile: file,
            sites: [ProbeSiteStub({ start: 900, end: 901 })],
          }),
      ]);
      const printed = result.transformed.map((out) => ts.createPrinter().printFile(out)).join('');

      expect(printed.trim()).toBe('if (score > 5) {\n    return 1;\n}');
    });
  });
});
