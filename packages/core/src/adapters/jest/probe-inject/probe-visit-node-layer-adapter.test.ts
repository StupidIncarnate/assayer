import ts from 'typescript';

import { ProbeSiteStub } from '../../../contracts/probe-site/probe-site.stub';
import { probeVisitNodeLayerAdapter } from './probe-visit-node-layer-adapter';
import { probeVisitNodeLayerAdapterProxy } from './probe-visit-node-layer-adapter.proxy';

// `const x = a && b;` — `a` occupies [10, 11), `b` occupies [15, 16).
const SOURCE = 'const x = a && b;';

const LEAF_A = ProbeSiteStub({ id: 'f#leaf.0', kind: 'cond', start: 10, end: 11 });
const LEAF_B = ProbeSiteStub({ id: 'f#leaf.1', kind: 'cond', start: 15, end: 16 });

describe('probeVisitNodeLayerAdapter', () => {
  describe('recursing into children', () => {
    // Wrapping each operand IN PLACE is the whole short-circuit story: `__P.c(b)` sits on the right
    // of `&&`, so the language skips it exactly when it would have skipped `b`.
    it('VALID: {both operands of an &&} => each is wrapped where it stood, preserving short-circuit', () => {
      probeVisitNodeLayerAdapterProxy();
      const sourceFile = ts.createSourceFile('f.ts', SOURCE, ts.ScriptTarget.ES2022, true);

      const result = ts.transform(sourceFile, [
        (context) => (file) =>
          ts.visitEachChild(
            file,
            (child) =>
              probeVisitNodeLayerAdapter({ ts, context, sourceFile: file, sites: [LEAF_A, LEAF_B], node: child }),
            context,
          ),
      ]);
      const printed = result.transformed.map((out) => ts.createPrinter().printFile(out)).join('');

      expect(printed.trim()).toBe('const x = __P.c("f#leaf.0", a) && __P.c("f#leaf.1", b);');
    });

    it('VALID: {only the right operand} => the left is left alone', () => {
      probeVisitNodeLayerAdapterProxy();
      const sourceFile = ts.createSourceFile('f.ts', SOURCE, ts.ScriptTarget.ES2022, true);

      const result = ts.transform(sourceFile, [
        (context) => (file) =>
          ts.visitEachChild(
            file,
            (child) => probeVisitNodeLayerAdapter({ ts, context, sourceFile: file, sites: [LEAF_B], node: child }),
            context,
          ),
      ]);
      const printed = result.transformed.map((out) => ts.createPrinter().printFile(out)).join('');

      expect(printed.trim()).toBe('const x = a && __P.c("f#leaf.1", b);');
    });
  });

  describe('nodes that are not expressions', () => {
    it('EDGE: {a site whose range covers a statement} => not wrapped, since a statement is not an expression', () => {
      probeVisitNodeLayerAdapterProxy();
      const sourceFile = ts.createSourceFile('f.ts', SOURCE, ts.ScriptTarget.ES2022, true);

      const result = ts.transform(sourceFile, [
        (context) => (file) =>
          ts.visitEachChild(
            file,
            (child) =>
              probeVisitNodeLayerAdapter({
                ts,
                context,
                sourceFile: file,
                sites: [ProbeSiteStub({ start: 0, end: 17 })],
                node: child,
              }),
            context,
          ),
      ]);
      const printed = result.transformed.map((out) => ts.createPrinter().printFile(out)).join('');

      expect(printed.trim()).toBe('const x = a && b;');
    });
  });
});
