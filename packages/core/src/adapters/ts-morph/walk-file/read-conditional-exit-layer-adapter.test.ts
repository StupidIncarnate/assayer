import { Project, SyntaxKind } from 'ts-morph';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { readConditionalExitLayerAdapter } from './read-conditional-exit-layer-adapter';
import { readConditionalExitLayerAdapterProxy } from './read-conditional-exit-layer-adapter.proxy';

const CONTEXT = WalkContextStub({
  scopePath: ['classify'],
  guardPath: [],
  params: [{ name: 'value', type: { kind: 'number' } }],
  exported: true,
});

const BASIC_SOURCE = 'function classify(value: number) {\n  return value > 5 ? "big" : "small";\n}\n';
const NESTED_SOURCE = 'function classify(value: number) {\n  return value >= 90 ? "a" : value >= 80 ? "b" : "c";\n}\n';

const BRANCH = 'classify/ternary:BinaryExpression,id:value,GreaterThanToken,num:5';
const THEN_EXIT = 'classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#then';
const ELSE_EXIT = 'classify/return@ternary:BinaryExpression,id:value,GreaterThanToken,num:5#else';
const OUTER_SEG = 'ternary:BinaryExpression,id:value,GreaterThanEqualsToken,num:90';
const INNER_SEG = 'ternary:BinaryExpression,id:value,GreaterThanEqualsToken,num:80';
const OUTER = `classify/${OUTER_SEG}`;
const INNER = `classify/${INNER_SEG}`;

describe('readConditionalExitLayerAdapter', () => {
  describe('the sentinel for a non-ternary', () => {
    it('VALID: {a plain string return} => not conditional, so the caller keeps its single exit', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function classify(value: number) {\n  return "small";\n}\n');
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: CONTEXT });

      expect({
        conditional: result.conditional,
        branches: result.result.branches,
        exits: result.result.exits,
        probeSites: result.result.probeSites,
        nodes: result.result.nodes,
        descents: result.result.descents,
      }).toStrictEqual({ conditional: false, branches: [], exits: [], probeSites: [], nodes: [], descents: [] });
    });
  });

  describe('the split it emits for a basic ternary', () => {
    it('VALID: {`return value > 5 ? a : b`} => one ternary branch keyed on the condition projection', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', BASIC_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: CONTEXT });

      expect(result.result.branches).toStrictEqual([
        {
          coverageId: BRANCH,
          kind: 'ternary',
          condition: {
            kind: 'leaf',
            id: `${BRANCH}#leaf`,
            operandParamName: 'value',
            operandType: { kind: 'number' },
            predicate: { kind: 'gt', literal: 5 },
          },
          startLine: 2,
          endLine: 2,
        },
      ]);
    });

    it('VALID: {`return value > 5 ? a : b`} => one return exit per arm, guarded then/else', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', BASIC_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: CONTEXT });

      expect(result.result.exits).toStrictEqual([
        {
          coverageId: THEN_EXIT,
          kind: 'return',
          guardPath: [{ branchCoverageId: BRANCH, arm: 'then' }],
          line: 2,
        },
        {
          coverageId: ELSE_EXIT,
          kind: 'return',
          guardPath: [{ branchCoverageId: BRANCH, arm: 'else' }],
          line: 2,
        },
      ]);
    });

    it('VALID: {`return value > 5 ? a : b`} => a cond probe on the condition and an exit probe on each arm', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', BASIC_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: CONTEXT });

      expect(result.result.probeSites).toStrictEqual([
        { id: `${BRANCH}#leaf`, kind: 'cond', start: 44, end: 53 },
        { id: THEN_EXIT, kind: 'exit', start: 56, end: 61 },
        { id: ELSE_EXIT, kind: 'exit', start: 64, end: 71 },
      ]);
    });

    it('VALID: {`return value > 5 ? a : b`} => the ConditionalExpression walk node is marked handled', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', BASIC_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: CONTEXT });

      expect(result.result.nodes).toStrictEqual([
        { kind: 'ConditionalExpression', scopePath: ['classify'], startLine: 2, endLine: 2, handled: true },
      ]);
    });

    it('VALID: {`return value > 5 ? a : b`} => descends the condition unguarded and each arm under its own step', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', BASIC_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: CONTEXT });
      const {descents} = result.result;

      expect(descents.map((descent) => descent.node.getKindName())).toStrictEqual([
        'BinaryExpression',
        'StringLiteral',
        'StringLiteral',
      ]);
      expect(descents.map((descent) => descent.context.guardPath)).toStrictEqual([
        [],
        [{ branchCoverageId: BRANCH, arm: 'then' }],
        [{ branchCoverageId: BRANCH, arm: 'else' }],
      ]);
    });
  });

  describe('the recursion for a nested ternary in the else arm', () => {
    it('VALID: {`value >= 90 ? a : value >= 80 ? b : c`} => two branches, one per condition', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', NESTED_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: CONTEXT });

      expect(result.result.branches.map((branch) => String(branch.coverageId))).toStrictEqual([OUTER, INNER]);
    });

    it('VALID: {`value >= 90 ? a : value >= 80 ? b : c`} => three exits, one per leaf arm, guards accumulating', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', NESTED_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: CONTEXT });

      expect(result.result.exits.map((exit) => String(exit.coverageId))).toStrictEqual([
        `classify/return@${OUTER_SEG}#then`,
        `classify/return@${OUTER_SEG}#else/${INNER_SEG}#then`,
        `classify/return@${OUTER_SEG}#else/${INNER_SEG}#else`,
      ]);
    });
  });

  describe('seeing through parentheses', () => {
    it('VALID: {`return (value > 5 ? a : b)`} => keys identically to the unparenthesized form', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(value: number) {\n  return (value > 5 ? "big" : "small");\n}\n',
      );
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: CONTEXT });

      expect(result.result.branches.map((branch) => String(branch.coverageId))).toStrictEqual([BRANCH]);
    });
  });

  describe('the exit kind follows the caller', () => {
    it('VALID: {`throw value > 5 ? a : b`} => both arm exits are throws, not returns', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function classify(value: number) {\n  throw value > 5 ? new Error("a") : new Error("b");\n}\n',
      );
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ThrowStatement).getExpression();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'throw', context: CONTEXT });

      expect(result.result.exits.map((exit) => String(exit.kind))).toStrictEqual(['throw', 'throw']);
    });
  });

  describe('the split it emits for an `||` chain', () => {
    const OR_SOURCE = 'function pick(a: string, b: string) {\n  return a || b || "d";\n}\n';
    const OR_A = 'pick/ternary:id:a';
    const OR_B = 'pick/ternary:id:b';
    const OR_CONTEXT = WalkContextStub({
      scopePath: ['pick'],
      guardPath: [],
      params: [
        { name: 'a', type: { kind: 'string' } },
        { name: 'b', type: { kind: 'string' } },
      ],
      exported: true,
    });

    it('VALID: {`return a || b || "d"`} => one ternary branch per controlling operand', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', OR_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: OR_CONTEXT });

      expect(result.result.branches.map((branch) => ({ coverageId: String(branch.coverageId), kind: String(branch.kind) }))).toStrictEqual([
        { coverageId: OR_A, kind: 'ternary' },
        { coverageId: OR_B, kind: 'ternary' },
      ]);
    });

    it('VALID: {`return a || b || "d"`} => three exits, then-arm short-circuits, else continues', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', OR_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: OR_CONTEXT });

      expect(result.result.exits.map((exit) => ({ coverageId: String(exit.coverageId), guardPath: exit.guardPath }))).toStrictEqual([
        { coverageId: `pick/return@ternary:id:a#then`, guardPath: [{ branchCoverageId: OR_A, arm: 'then' }] },
        {
          coverageId: `pick/return@ternary:id:a#else/ternary:id:b#then`,
          guardPath: [
            { branchCoverageId: OR_A, arm: 'else' },
            { branchCoverageId: OR_B, arm: 'then' },
          ],
        },
        {
          coverageId: `pick/return@ternary:id:a#else/ternary:id:b#else`,
          guardPath: [
            { branchCoverageId: OR_A, arm: 'else' },
            { branchCoverageId: OR_B, arm: 'else' },
          ],
        },
      ]);
    });

    it('VALID: {`return a || b || "d"`} => an exit probe per operand and no cond probe', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', OR_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: OR_CONTEXT });

      expect(result.result.probeSites.map((site) => String(site.kind))).toStrictEqual(['exit', 'exit', 'exit']);
    });

    it('VALID: {`return a || b || "d"`} => no walk node for the `||` node, operands descend', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', OR_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: OR_CONTEXT });

      expect({
        nodes: result.result.nodes,
        descents: result.result.descents.map((descent) => descent.node.getText()),
      }).toStrictEqual({ nodes: [], descents: ['a', 'b', '"d"'] });
    });
  });

  describe('the split it emits for an `&&` chain', () => {
    const AND_SOURCE = 'function all(a: boolean, b: boolean, c: boolean) {\n  return a && b && c;\n}\n';
    const AND_A = 'all/ternary:id:a';
    const AND_B = 'all/ternary:id:b';
    const AND_CONTEXT = WalkContextStub({
      scopePath: ['all'],
      guardPath: [],
      params: [
        { name: 'a', type: { kind: 'boolean' } },
        { name: 'b', type: { kind: 'boolean' } },
        { name: 'c', type: { kind: 'boolean' } },
      ],
      exported: true,
    });

    it('VALID: {`return a && b && c`} => three exits, else-arm short-circuits, then continues', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', AND_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: AND_CONTEXT });

      expect(result.result.exits.map((exit) => ({ coverageId: String(exit.coverageId), guardPath: exit.guardPath }))).toStrictEqual([
        { coverageId: `all/return@ternary:id:a#else`, guardPath: [{ branchCoverageId: AND_A, arm: 'else' }] },
        {
          coverageId: `all/return@ternary:id:a#then/ternary:id:b#else`,
          guardPath: [
            { branchCoverageId: AND_A, arm: 'then' },
            { branchCoverageId: AND_B, arm: 'else' },
          ],
        },
        {
          coverageId: `all/return@ternary:id:a#then/ternary:id:b#then`,
          guardPath: [
            { branchCoverageId: AND_A, arm: 'then' },
            { branchCoverageId: AND_B, arm: 'then' },
          ],
        },
      ]);
    });
  });

  describe('the split it emits for a `??` chain', () => {
    const NULLISH_SOURCE = 'function orElse(a: string | null, b: string) {\n  return a ?? b;\n}\n';
    const NULLISH_A = 'orElse/ternary:id:a';
    const NULLISH_CONTEXT = WalkContextStub({
      scopePath: ['orElse'],
      guardPath: [],
      params: [
        { name: 'a', type: { kind: 'string' } },
        { name: 'b', type: { kind: 'string' } },
      ],
      exported: true,
    });

    it('VALID: {`return a ?? b`} => the controlling operand is a `non-nullish` leaf, not truthy', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', NULLISH_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: NULLISH_CONTEXT });

      expect(result.result.branches).toStrictEqual([
        {
          coverageId: NULLISH_A,
          kind: 'ternary',
          condition: {
            kind: 'leaf',
            id: `${NULLISH_A}#leaf`,
            operandParamName: 'a',
            operandType: { kind: 'string' },
            predicate: { kind: 'non-nullish' },
          },
          startLine: 2,
          endLine: 2,
        },
      ]);
    });

    it('VALID: {`return a ?? b`} => two exits, then-arm short-circuits to `a`, else falls through to `b`', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', NULLISH_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: NULLISH_CONTEXT });

      expect(result.result.exits.map((exit) => ({ coverageId: String(exit.coverageId), guardPath: exit.guardPath }))).toStrictEqual([
        { coverageId: `orElse/return@ternary:id:a#then`, guardPath: [{ branchCoverageId: NULLISH_A, arm: 'then' }] },
        { coverageId: `orElse/return@ternary:id:a#else`, guardPath: [{ branchCoverageId: NULLISH_A, arm: 'else' }] },
      ]);
    });

    it('VALID: {`return a ?? b ?? c`} => the left-associative spine flattens to three exits', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function pick3(a: string | null, b: string | null, c: string) {\n  return a ?? b ?? c;\n}\n',
      );
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({
        expression,
        kind: 'return',
        context: WalkContextStub({
          scopePath: ['pick3'],
          guardPath: [],
          params: [
            { name: 'a', type: { kind: 'string' } },
            { name: 'b', type: { kind: 'string' } },
            { name: 'c', type: { kind: 'string' } },
          ],
          exported: true,
        }),
      });

      expect(result.result.exits.map((exit) => String(exit.coverageId))).toStrictEqual([
        'pick3/return@ternary:id:a#then',
        'pick3/return@ternary:id:a#else/ternary:id:b#then',
        'pick3/return@ternary:id:a#else/ternary:id:b#else',
      ]);
    });
  });

  describe('the split it emits for a single-level `a?.b`', () => {
    const OPT_SOURCE = 'function len(s: string | null) {\n  return s?.length;\n}\n';
    const OPT_BRANCH = 'len/ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length';
    const OPT_CONTEXT = WalkContextStub({
      scopePath: ['len'],
      guardPath: [],
      params: [{ name: 's', type: { kind: 'string' } }],
      exported: true,
    });

    it("VALID: {`return s?.length`} => a ternary branch on the receiver's non-nullishness", () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', OPT_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: OPT_CONTEXT });

      expect(result.result.branches).toStrictEqual([
        {
          coverageId: OPT_BRANCH,
          kind: 'ternary',
          condition: {
            kind: 'leaf',
            id: `${OPT_BRANCH}#leaf`,
            operandParamName: 's',
            operandType: { kind: 'string' },
            predicate: { kind: 'non-nullish' },
          },
          startLine: 2,
          endLine: 2,
        },
      ]);
    });

    it('VALID: {`return s?.length`} => two exits, then for the member access, else for the nullish short-circuit', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', OPT_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: OPT_CONTEXT });

      expect(result.result.exits.map((exit) => ({ coverageId: String(exit.coverageId), guardPath: exit.guardPath }))).toStrictEqual([
        { coverageId: `len/return@ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length#then`, guardPath: [{ branchCoverageId: OPT_BRANCH, arm: 'then' }] },
        { coverageId: `len/return@ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length#else`, guardPath: [{ branchCoverageId: OPT_BRANCH, arm: 'else' }] },
      ]);
    });

    it('VALID: {`return s?.length`} => ONE optional probe site carrying both exit ids over the whole access', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', OPT_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: OPT_CONTEXT });

      expect(result.result.probeSites).toStrictEqual([
        {
          id: `len/return@ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length#then`,
          elseId: `len/return@ternary:PropertyAccessExpression,id:s,QuestionDotToken,id:length#else`,
          kind: 'optional',
          start: 42,
          end: 51,
        },
      ]);
    });

    it('VALID: {`return s?.length`} => no walk node, only the receiver descends', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', OPT_SOURCE);
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: OPT_CONTEXT });

      expect({
        nodes: result.result.nodes,
        descents: result.result.descents.map((descent) => descent.node.getText()),
      }).toStrictEqual({ nodes: [], descents: ['s'] });
    });

    it('VALID: {`return obj.field?.length`} => a computed receiver is NOT split, the single-exit sentinel stands', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function len(obj: { field: string | null }) {\n  return obj.field?.length;\n}\n',
      );
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: OPT_CONTEXT });

      expect(result.conditional).toBe(false);
    });

    it('VALID: {`return s.length`} => a plain (non-optional) property access is never split', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'function len(s: string) {\n  return s.length;\n}\n');
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: OPT_CONTEXT });

      expect(result.conditional).toBe(false);
    });
  });

  describe('the sentinel for a non-short-circuit binary', () => {
    it('VALID: {`return a + b`} => not conditional, so an arithmetic binary is never split', () => {
      readConditionalExitLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'function add(a: number, b: number) {\n  return a + b;\n}\n',
      );
      const expression = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement).getExpressionOrThrow();

      const result = readConditionalExitLayerAdapter({ expression, kind: 'return', context: CONTEXT });

      expect(result.conditional).toBe(false);
    });
  });
});
