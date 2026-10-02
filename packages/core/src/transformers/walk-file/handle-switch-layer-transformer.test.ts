import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { WalkNodeStub } from '../../contracts/walk-node/walk-node.stub';
import { handleSwitchLayerTransformer } from './handle-switch-layer-transformer';
import { handleSwitchLayerTransformerProxy } from './handle-switch-layer-transformer.proxy';

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

describe('handleSwitchLayerTransformer', () => {
  describe('the eq-branches it emits', () => {
    it('VALID: {two literal cases plus a default} => one eq-branch per CASE, none for the default', () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({ node, context: TAIL_CONTEXT });

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
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'const code = Number(process.env.CODE);\nswitch (code) {\n  case 1:\n    noop();\n    break;\n  default:\n    noop();\n}\ndeclare function noop(): void;\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({
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

    it('EDGE: {enum-member cases only} => a branch carrying an unrecognized predicate, never a dropped clause', () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'enum E { A, B }\nfunction f(e: E) {\n  switch (e) {\n    case E.A:\n      return 1;\n    default:\n      return 2;\n  }\n}\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({
        node,
        context: WalkContextStub({ scopePath: ['f'], guardPath: [], params: [], exported: true, tail: true }),
      });

      expect(result.branches).toStrictEqual([
        {
          coverageId: 'f/switch:id:e,EqualsEqualsEqualsToken,PropertyAccessExpression,id:E,id:A',
          kind: 'switch',
          condition: {
            kind: 'leaf',
            id: 'f/switch:id:e,EqualsEqualsEqualsToken,PropertyAccessExpression,id:E,id:A#leaf',
            operandParamName: 'e',
            operandType: {
              kind: 'union',
              members: [
                { kind: 'literal', value: 0 },
                { kind: 'literal', value: 1 },
              ],
            },
            predicate: { kind: 'unrecognized' },
          },
          startLine: 4,
          endLine: 5,
        },
      ]);
    });

    // A discriminant welded to a same-file `const` is EVALUATED, not steered — exactly as an `if`
    // operand is — so the leaf carries the single value the analyzer already knows.
    it('VALID: {a switch on a same-file const} => the leaf carries the discriminant`s welded value', () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'const level = 7;\nswitch (level) {\n  case 7:\n    noop();\n    break;\n  default:\n    noop();\n}\ndeclare function noop(): void;\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({
        node,
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false, tail: true }),
      });

      expect(result.branches).toStrictEqual([
        {
          coverageId: '*module*/switch:id:level,EqualsEqualsEqualsToken,num:7',
          kind: 'switch',
          condition: {
            kind: 'leaf',
            id: '*module*/switch:id:level,EqualsEqualsEqualsToken,num:7#leaf',
            operandParamName: 'level',
            operandConstValue: 7,
            operandType: { kind: 'number' },
            predicate: { kind: 'eq', literal: 7 },
          },
          startLine: 3,
          endLine: 5,
        },
      ]);
    });

    // A discriminant the parse cannot pin to a single identifier (a member access) names no operand
    // param — the leaf omits `operandParamName` entirely rather than guessing one.
    it('VALID: {a switch on a member-access discriminant} => the leaf carries no operandParamName', () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const obj: { method: string };\nswitch (obj.method) {\n  case 'get':\n    noop();\n    break;\n  default:\n    noop();\n}\ndeclare function noop(): void;\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({
        node,
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false, tail: true }),
      });

      expect(result.branches).toStrictEqual([
        {
          coverageId: '*module*/switch:PropertyAccessExpression,id:obj,id:method,EqualsEqualsEqualsToken,str:get',
          kind: 'switch',
          condition: {
            kind: 'leaf',
            id: '*module*/switch:PropertyAccessExpression,id:obj,id:method,EqualsEqualsEqualsToken,str:get#leaf',
            operandType: { kind: 'string' },
            predicate: { kind: 'eq', literal: 'get' },
          },
          startLine: 3,
          endLine: 5,
        },
      ]);
    });

    it('VALID: {switch} => records itself as a handled node under its scope', () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.nodes).toStrictEqual([
        WalkNodeStub({ kind: 'SwitchStatement', scopePath: ['routeLabel'], startLine: 2, endLine: 9, handled: true }),
      ]);
    });
  });

  describe('the guards it hands each clause', () => {
    it("VALID: {a literal case} => that case's THEN step", () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({ node, context: TAIL_CONTEXT });

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
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);
      const enclosed = WalkContextStub({
        scopePath: ['routeLabel'],
        guardPath: [{ branchCoverageId: 'routeLabel/if:id:flag', arm: 'then' }],
        params: [{ name: 'method', type: { kind: 'string' } }],
        exported: true,
        tail: true,
      });

      const result = handleSwitchLayerTransformer({ node, context: enclosed });

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
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'ReturnStatement',
        'ReturnStatement',
        'ReturnStatement',
      ]);
    });
  });

  describe('completion exits in tail position', () => {
    it('VALID: {tail switch whose clauses fall out} => a guarded implicit exit per clause', () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', FALLS_OUT_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({ node, context: TAIL_CONTEXT });

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
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'const code = Number(process.env.CODE);\nswitch (code) {\n  case 1:\n    noop();\n    break;\n  default:\n    noop();\n}\ndeclare function noop(): void;\n',
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({
        node,
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: false, tail: true }),
      });

      expect(result.probeSites).toStrictEqual([
        { id: '*module*/exit@switch:id:code,EqualsEqualsEqualsToken,num:1#then', kind: 'complete', start: 69, end: 76 },
        { id: '*module*/exit@switch:id:code,EqualsEqualsEqualsToken,num:1#else', kind: 'complete', start: 103, end: 110 },
      ]);
    });

    it('VALID: {tail switch whose clauses all return} => no completion exits', () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', ALL_RETURN_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });

    it('VALID: {switch NOT in tail position} => no completion exits, because code runs after it', () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', FALLS_OUT_SOURCE);
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({ node, context: NON_TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });

    // No `default` clause means every clause's fallthrough and the wholly-unmatched path converge on
    // the exact same physical continuation — whatever follows the whole `switch` — which the
    // enclosing scope already probes as its own unaccounted-for exit. A per-clause completion here
    // TOO would fire twice on one execution (the taken clause's own probe, then the enclosing one
    // right behind it), so a case predicting only this handler's exit would fail against correct
    // code — verified end to end by `run-unit-broker.integration.test.ts`'s
    // `SWITCH_NO_DEFAULT_SPECIMEN`.
    it('VALID: {a switch with NO default clause} => no completion exit at all', () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "function routeLabel(method: string) {\n  switch (method) {\n    case 'get':\n      noop();\n  }\n}\ndeclare function noop(): void;\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({ node, context: TAIL_CONTEXT });

      expect(result.exits).toStrictEqual([]);
    });

    // A clause holding only a bare `break` has no statement left once break statements are filtered
    // out, so its fall-out completion exit is still emitted but CANNOT be probed.
    it('VALID: {a clause with only a bare break} => the completion exit is emitted with NO probe site', () => {
      handleSwitchLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "function routeLabel(method: string) {\n  switch (method) {\n    case 'get':\n      break;\n    default:\n      noop();\n  }\n}\ndeclare function noop(): void;\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.SwitchStatement);

      const result = handleSwitchLayerTransformer({ node, context: TAIL_CONTEXT });

      expect({
        exitCoverageIds: result.exits.map((exit) => String(exit.coverageId)),
        probeSites: result.probeSites,
      }).toStrictEqual({
        exitCoverageIds: [
          'routeLabel/exit@switch:id:method,EqualsEqualsEqualsToken,str:get#then',
          'routeLabel/exit@switch:id:method,EqualsEqualsEqualsToken,str:get#else',
        ],
        probeSites: [
          {
            id: 'routeLabel/exit@switch:id:method,EqualsEqualsEqualsToken,str:get#else',
            kind: 'complete',
            start: 106,
            end: 113,
          },
        ],
      });
    });
  });
});
