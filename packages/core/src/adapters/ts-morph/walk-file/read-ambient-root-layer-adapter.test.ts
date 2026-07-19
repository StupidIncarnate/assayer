import { Project, SyntaxKind } from 'ts-morph';
import type { Node } from 'ts-morph';

import { readAmbientRootLayerAdapter } from './read-ambient-root-layer-adapter';
import { readAmbientRootLayerAdapterProxy } from './read-ambient-root-layer-adapter.proxy';

// The first Identifier in the source — crafted so it is the root of the access under test.
const firstIdentifier = ({ source }: { source: string }): Node =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.Identifier);

const firstNumericLiteral = ({ source }: { source: string }): Node =>
  new Project({ useInMemoryFileSystem: true })
    .createSourceFile('src/x.ts', source)
    .getFirstDescendantByKindOrThrow(SyntaxKind.NumericLiteral);

describe('readAmbientRootLayerAdapter', () => {
  describe('ambient host globals the hermetic project cannot type', () => {
    it('VALID: {process, zero declarations} => is a candidate', () => {
      readAmbientRootLayerAdapterProxy();

      expect(readAmbientRootLayerAdapter({ node: firstIdentifier({ source: 'process.env.X;\n' }) })).toBe(true);
    });

    it('VALID: {console, declared only in lib.dom} => is a candidate', () => {
      readAmbientRootLayerAdapterProxy();

      expect(readAmbientRootLayerAdapter({ node: firstIdentifier({ source: "console.log('x');\n" }) })).toBe(true);
    });
  });

  describe('names that are not ambient externals', () => {
    it('VALID: {Number, an ECMAScript intrinsic} => is not a candidate', () => {
      readAmbientRootLayerAdapterProxy();

      expect(readAmbientRootLayerAdapter({ node: firstIdentifier({ source: "Number('5');\n" }) })).toBe(false);
    });

    it('VALID: {a binding this file declares} => is not a candidate', () => {
      readAmbientRootLayerAdapterProxy();

      expect(readAmbientRootLayerAdapter({ node: firstIdentifier({ source: 'const process = { env: {} };\nprocess.env;\n' }) })).toBe(false);
    });

    it('VALID: {a non-identifier node} => is not a candidate', () => {
      readAmbientRootLayerAdapterProxy();

      expect(readAmbientRootLayerAdapter({ node: firstNumericLiteral({ source: 'export const a = 1;\n' }) })).toBe(false);
    });
  });
});
