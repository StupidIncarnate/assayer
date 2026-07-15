import { Project, SyntaxKind } from 'ts-morph';

import { SymbolNameStub } from '@assayer/shared/contracts';

import { deriveBranchIdLayerAdapter } from './derive-branch-id-layer-adapter';
import { deriveBranchIdLayerAdapterProxy } from './derive-branch-id-layer-adapter.proxy';

const CLASSIFY_SCOPE = [SymbolNameStub({ value: 'classify' })];
const NESTED_SCOPE = [SymbolNameStub({ value: 'Classifier' }), SymbolNameStub({ value: 'classify' })];

describe('deriveBranchIdLayerAdapter', () => {
  describe('the id it derives', () => {
    it('VALID: {if (value > 5), scope classify} => the scope path joined to the condition projection', () => {
      deriveBranchIdLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (value > 5) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(deriveBranchIdLayerAdapter({ node, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5',
      );
    });

    it('VALID: {if (name.length === 0)} => the whole property access survives in the projection', () => {
      deriveBranchIdLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (name.length === 0) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(deriveBranchIdLayerAdapter({ node, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/if:BinaryExpression,PropertyAccessExpression,id:name,id:length,EqualsEqualsEqualsToken,num:0',
      );
    });

    it('VALID: {nested scope path} => every segment is joined, so two alike-named entries cannot collide', () => {
      deriveBranchIdLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (value > 5) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(deriveBranchIdLayerAdapter({ node, scopePath: NESTED_SCOPE })).toBe(
        'Classifier/classify/if:BinaryExpression,id:value,GreaterThanToken,num:5',
      );
    });

    it('EMPTY: {empty scope path} => the branch segment alone', () => {
      deriveBranchIdLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (value > 5) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(deriveBranchIdLayerAdapter({ node, scopePath: [] })).toBe(
        'if:BinaryExpression,id:value,GreaterThanToken,num:5',
      );
    });
  });

  describe('formatting invariance', () => {
    it('VALID: {tight and spaced spellings of one condition} => the SAME id, because spelling is not logic', () => {
      deriveBranchIdLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const tight = project.createSourceFile('src/a.ts', 'if (value>5) {}\n');
      const spaced = project.createSourceFile('src/b.ts', 'if ( value   >   5 ) {}\n');
      const tightNode = tight.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);
      const spacedNode = spaced.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(deriveBranchIdLayerAdapter({ node: tightNode, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5',
      );
      expect(deriveBranchIdLayerAdapter({ node: spacedNode, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/if:BinaryExpression,id:value,GreaterThanToken,num:5',
      );
    });

    it("VALID: {double-quoted vs single-quoted literal} => the SAME id, since quote style is spelling", () => {
      deriveBranchIdLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const doubled = project.createSourceFile('src/a.ts', 'if (mode === "on") {}\n');
      const singled = project.createSourceFile('src/b.ts', "if (mode === 'on') {}\n");
      const doubledNode = doubled.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);
      const singledNode = singled.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(deriveBranchIdLayerAdapter({ node: doubledNode, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/if:BinaryExpression,id:mode,EqualsEqualsEqualsToken,str:on',
      );
      expect(deriveBranchIdLayerAdapter({ node: singledNode, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/if:BinaryExpression,id:mode,EqualsEqualsEqualsToken,str:on',
      );
    });
  });

  describe('logic changes move the id', () => {
    it('VALID: {operator changed to >=} => a different id, because the logic moved', () => {
      deriveBranchIdLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (value >= 5) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(deriveBranchIdLayerAdapter({ node, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/if:BinaryExpression,id:value,GreaterThanEqualsToken,num:5',
      );
    });

    it('VALID: {literal changed to 6} => a different id, because the logic moved', () => {
      deriveBranchIdLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'if (value > 6) {}\n');
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement);

      expect(deriveBranchIdLayerAdapter({ node, scopePath: CLASSIFY_SCOPE })).toBe(
        'classify/if:BinaryExpression,id:value,GreaterThanToken,num:6',
      );
    });
  });
});
