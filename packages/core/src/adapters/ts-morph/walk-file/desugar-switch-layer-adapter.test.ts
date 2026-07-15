import { Project, SyntaxKind } from 'ts-morph';

import { SymbolNameStub } from '@assayer/shared/contracts';

import { desugarSwitchLayerAdapter } from './desugar-switch-layer-adapter';
import { desugarSwitchLayerAdapterProxy } from './desugar-switch-layer-adapter.proxy';

const CLASSIFY_SCOPE = [SymbolNameStub({ value: 'classify' })];

const STRING_SWITCH_SOURCE =
  "function routeLabel(method: string) {\n  switch (method) {\n    case 'get':\n      return 'Fetch';\n    case 'post':\n      return 'Create';\n    default:\n      return 'Other';\n  }\n}\n";

describe('desugarSwitchLayerAdapter', () => {
  describe('the discriminant it reads', () => {
    it('VALID: {switch (method)} => the discriminant symbol name and its node', () => {
      desugarSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', STRING_SWITCH_SOURCE);
      const switchStatement = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = desugarSwitchLayerAdapter({ switchStatement, scopePath: CLASSIFY_SCOPE });

      expect({ discName: result.discName }).toStrictEqual({ discName: 'method' });
      expect(result.discNode).toBe(switchStatement.getExpression());
    });

    it('EDGE: {switch (o.k)} => NO discriminant name, because it is not a bare identifier', () => {
      desugarSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "function f(o: { k: string }) {\n  switch (o.k) {\n    case 'a':\n      return 1;\n  }\n}\n",
      );
      const switchStatement = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = desugarSwitchLayerAdapter({ switchStatement, scopePath: CLASSIFY_SCOPE });

      expect({ discName: result.discName }).toStrictEqual({ discName: undefined });
      expect(result.discNode.getKindName()).toBe('PropertyAccessExpression');
    });
  });

  describe('the eq-branches it desugars each literal case into', () => {
    it('VALID: {string cases} => one case info per case, carrying value, token, and branch id', () => {
      desugarSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', STRING_SWITCH_SOURCE);
      const switchStatement = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = desugarSwitchLayerAdapter({ switchStatement, scopePath: CLASSIFY_SCOPE });

      expect(
        result.caseInfos.map((caseInfo) => ({
          literalValue: caseInfo.literalValue,
          literalToken: caseInfo.literalToken,
          branchCoverageId: caseInfo.branchCoverageId,
        })),
      ).toStrictEqual([
        {
          literalValue: 'get',
          literalToken: 'str:get',
          branchCoverageId: 'classify/switch:id:method,EqualsEqualsEqualsToken,str:get',
        },
        {
          literalValue: 'post',
          literalToken: 'str:post',
          branchCoverageId: 'classify/switch:id:method,EqualsEqualsEqualsToken,str:post',
        },
      ]);
    });

    it('VALID: {numeric case} => a num token and an eq-branch id built from it', () => {
      desugarSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function f(n: number) {\n  switch (n) {\n    case 1:\n      return "one";\n  }\n}\n',
      );
      const switchStatement = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = desugarSwitchLayerAdapter({ switchStatement, scopePath: CLASSIFY_SCOPE });

      expect(
        result.caseInfos.map((caseInfo) => ({
          literalValue: caseInfo.literalValue,
          literalToken: caseInfo.literalToken,
          branchCoverageId: caseInfo.branchCoverageId,
        })),
      ).toStrictEqual([
        {
          literalValue: 1,
          literalToken: 'num:1',
          branchCoverageId: 'classify/switch:id:n,EqualsEqualsEqualsToken,num:1',
        },
      ]);
    });

    it('VALID: {string cases} => each case info points at its own clause', () => {
      desugarSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', STRING_SWITCH_SOURCE);
      const switchStatement = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = desugarSwitchLayerAdapter({ switchStatement, scopePath: CLASSIFY_SCOPE });

      expect(result.caseInfos.map((caseInfo) => caseInfo.clause.getStartLineNumber())).toStrictEqual([3, 5]);
    });

    it('EDGE: {non-identifier discriminant} => the branch id keys on the whole structural projection', () => {
      desugarSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "function f(o: { k: string }) {\n  switch (o.k) {\n    case 'a':\n      return 1;\n  }\n}\n",
      );
      const switchStatement = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = desugarSwitchLayerAdapter({ switchStatement, scopePath: CLASSIFY_SCOPE });

      expect(result.caseInfos.map((caseInfo) => caseInfo.branchCoverageId)).toStrictEqual([
        'classify/switch:PropertyAccessExpression,id:o,id:k,EqualsEqualsEqualsToken,str:a',
      ]);
    });

    it('EDGE: {enum-member case} => SKIPPED rather than guessed at', () => {
      desugarSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'enum E { A, B }\nfunction f(e: E) {\n  switch (e) {\n    case E.A:\n      return 1;\n    default:\n      return 2;\n  }\n}\n',
      );
      const switchStatement = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = desugarSwitchLayerAdapter({ switchStatement, scopePath: CLASSIFY_SCOPE });

      expect(result.caseInfos).toStrictEqual([]);
    });
  });

  describe('the default clause it finds', () => {
    it('VALID: {switch with a default} => that clause', () => {
      desugarSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', STRING_SWITCH_SOURCE);
      const switchStatement = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = desugarSwitchLayerAdapter({ switchStatement, scopePath: CLASSIFY_SCOPE });

      expect(result.defaultClause).toBe(sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.DefaultClause));
    });

    it('EMPTY: {switch without a default} => no default clause', () => {
      desugarSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function f(n: number) {\n  switch (n) {\n    case 1:\n      return "one";\n  }\n}\n',
      );
      const switchStatement = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = desugarSwitchLayerAdapter({ switchStatement, scopePath: CLASSIFY_SCOPE });

      expect({ defaultClause: result.defaultClause }).toStrictEqual({ defaultClause: undefined });
    });
  });

  describe('formatting invariance', () => {
    it('VALID: {double-quoted vs single-quoted case literal} => the SAME branch id', () => {
      desugarSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const doubled = project.createSourceFile(
        'src/a.ts',
        'function f(m: string) {\n  switch (m) {\n    case "get":\n      return 1;\n  }\n}\n',
      );
      const singled = project.createSourceFile(
        'src/b.ts',
        "function f(m: string) {\n  switch(m){\n    case 'get':\n      return 1;\n  }\n}\n",
      );

      expect(
        desugarSwitchLayerAdapter({
          switchStatement: doubled.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement),
          scopePath: CLASSIFY_SCOPE,
        }).caseInfos.map((caseInfo) => caseInfo.branchCoverageId),
      ).toStrictEqual(['classify/switch:id:m,EqualsEqualsEqualsToken,str:get']);
      expect(
        desugarSwitchLayerAdapter({
          switchStatement: singled.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement),
          scopePath: CLASSIFY_SCOPE,
        }).caseInfos.map((caseInfo) => caseInfo.branchCoverageId),
      ).toStrictEqual(['classify/switch:id:m,EqualsEqualsEqualsToken,str:get']);
    });
  });
});
