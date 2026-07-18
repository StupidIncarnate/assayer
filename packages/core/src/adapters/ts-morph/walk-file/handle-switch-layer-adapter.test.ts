import { Project, SyntaxKind } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { WalkNodeStub } from '../../../contracts/walk-node/walk-node.stub';
import { handleSwitchLayerAdapter } from './handle-switch-layer-adapter';
import { handleSwitchLayerAdapterProxy } from './handle-switch-layer-adapter.proxy';

const TAIL_CONTEXT = WalkContextStub({
  scopePath: ['routeLabel'],
  guardPath: [],
  params: [{ name: 'method', type: { kind: 'string' } }],
  exported: true,
  tail: true,
});

const NON_TAIL_CONTEXT = WalkContextStub({
  scopePath: ['routeLabel'],
  guardPath: [],
  params: [{ name: 'method', type: { kind: 'string' } }],
  exported: true,
  tail: false,
});

const ALL_RETURN_SOURCE =
  "function routeLabel(method: string) {\n  switch (method) {\n    case 'get':\n      return 'Fetch';\n    case 'post':\n      return 'Create';\n    default:\n      return 'Other';\n  }\n}\n";

const FALLS_OUT_SOURCE =
  "function routeLabel(method: string) {\n  switch (method) {\n    case 'get':\n      noop();\n      break;\n    default:\n      noop();\n  }\n}\ndeclare function noop(): void;\n";

describe('handleSwitchLayerAdapter', () => {
  describe('the eq-branches it emits', () => {
    it('VALID: {two literal cases plus a default} => one eq-branch per CASE, none for the default', () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.branches).toStrictEqual([
        {
          coverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get',
          kind: 'switch',
          condition: {
            kind: 'leaf',
            id: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get#leaf',
            operandParamName: 'method',
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'get' },
          },
          startLine: 3,
          endLine: 4,
        },
        {
          coverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post',
          kind: 'switch',
          condition: {
            kind: 'leaf',
            id: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post#leaf',
            operandParamName: 'method',
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'post' },
          },
          startLine: 5,
          endLine: 6,
        },
      ]);
    });

    // The discriminant's env source is read exactly as an `if` reads its operand's, so a module-scope
    // switch on `Number(process.env.X)` is driven by setting X rather than admitted undriven.
    it('VALID: {a switch on Number(process.env.CODE)} => each leaf carries the discriminant`s env source', () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'const code = Number(process.env.CODE);\nswitch (code) {\n  case 1:\n    noop();\n    break;\n  default:\n    noop();\n}\ndeclare function noop(): void;\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerAdapter({
        node,
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false, tail: true }),
      });

      expect(result.branches).toStrictEqual([
        {
          coverageId: '*module*/switch:id:code,EqualsEqualsEqualsToken,num:1',
          kind: 'switch',
          condition: {
            kind: 'leaf',
            id: '*module*/switch:id:code,EqualsEqualsEqualsToken,num:1#leaf',
            operandParamName: 'code',
            operandEnvVarName: 'CODE',
            operandType: { kind: 'number' },
            predicate: { kind: 'eq', literal: 1 },
          },
          startLine: 3,
          endLine: 5,
        },
      ]);
    });

    it('EDGE: {enum-member cases only} => no branches, since they are not desugared yet', () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'enum E { A, B }\nfunction f(e: E) {\n  switch (e) {\n    case E.A:\n      return 1;\n    default:\n      return 2;\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerAdapter({
        node,
        context: WalkContextStub({ scopePath: ['f'], guardPath: [], params: [], exported: true, tail: true }),
      });

      expect(result.branches).toStrictEqual([]);
    });

    it('VALID: {switch} => records itself as a handled node under its scope', () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.nodes).toStrictEqual([
        WalkNodeStub({ kind: 'SwitchStatement', scopePath: ['routeLabel'], startLine: 2, endLine: 9, handled: true }),
      ]);
    });
  });

  describe('the guards it hands each clause', () => {
    it("VALID: {a literal case} => that case's THEN step", () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [{ branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'then' }],
        [{ branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post', arm: 'then' }],
        [
          { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'else' },
          { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post', arm: 'else' },
        ],
      ]);
    });

    it('VALID: {switch reached through an enclosing guard} => clause guards are APPENDED to it, never replacing it', () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);
      const enclosed = WalkContextStub({
        scopePath: ['routeLabel'],
        guardPath: [{ branchCoverageId: 'routeLabel/if:id:flag', arm: 'then' }],
        params: [{ name: 'method', type: { kind: 'string' } }],
        exported: true,
        tail: true,
      });

      const result = handleSwitchLayerAdapter({ node, context: enclosed });

      expect(result.descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [
          { branchCoverageId: 'routeLabel/if:id:flag', arm: 'then' },
          { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'then' },
        ],
        [
          { branchCoverageId: 'routeLabel/if:id:flag', arm: 'then' },
          { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post', arm: 'then' },
        ],
        [
          { branchCoverageId: 'routeLabel/if:id:flag', arm: 'then' },
          { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'else' },
          { branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:post', arm: 'else' },
        ],
      ]);
    });

    it('VALID: {clauses} => one descent per clause statement, cases first then the default', () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'ReturnStatement',
        'ReturnStatement',
        'ReturnStatement',
      ]);
    });
  });

  describe('completion exits in tail position', () => {
    it('VALID: {tail switch whose clauses fall out} => a guarded implicit exit per clause', () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', FALLS_OUT_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([
        {
          coverageId: 'routeLabel/exit@switch:id:method,EqualsEqualsEqualsToken,str:get#then',
          kind: 'implicit',
          guardPath: [{ branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'then' }],
          line: 4,
        },
        {
          coverageId: 'routeLabel/exit@switch:id:method,EqualsEqualsEqualsToken,str:get#else',
          kind: 'implicit',
          guardPath: [{ branchCoverageId: 'routeLabel/switch:id:method,EqualsEqualsEqualsToken,str:get', arm: 'else' }],
          line: 7,
        },
      ]);
    });

    // Each fall-out completion is PROBED on the clause's last non-break statement, so the switch can be
    // driven: a probe after the `break` would be unreachable and never fire.
    it('VALID: {tail switch whose clauses fall out} => a completion probe on each clause`s last non-break statement', () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'const code = Number(process.env.CODE);\nswitch (code) {\n  case 1:\n    noop();\n    break;\n  default:\n    noop();\n}\ndeclare function noop(): void;\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerAdapter({
        node,
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false, tail: true }),
      });

      expect(result.probeSites).toStrictEqual([
        { id: '*module*/exit@switch:id:code,EqualsEqualsEqualsToken,num:1#then', kind: 'complete', start: 69, end: 76 },
        { id: '*module*/exit@switch:id:code,EqualsEqualsEqualsToken,num:1#else', kind: 'complete', start: 103, end: 110 },
      ]);
    });

    it('VALID: {tail switch whose clauses all return} => no completion exits', () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerAdapter({ node, context: TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });

    it('VALID: {switch NOT in tail position} => no completion exits, because code runs after it', () => {
      handleSwitchLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', FALLS_OUT_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerAdapter({ node, context: NON_TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });
  });
});
