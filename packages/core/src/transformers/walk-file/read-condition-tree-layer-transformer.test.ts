import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { CoverageIdStub } from '@assayer/shared/contracts/coverage-id/coverage-id.stub';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { readConditionTreeLayerTransformer } from './read-condition-tree-layer-transformer';
import { readConditionTreeLayerTransformerProxy } from './read-condition-tree-layer-transformer.proxy';

const BRANCH = CoverageIdStub({ value: 'B' });

const GRADE_CONTEXT = WalkContextStub({
  scopePath: ['grade'],
  guardPath: [],
  params: [
    { name: 'score', type: { kind: 'number' } },
    { name: 'bonus', type: { kind: 'number' } },
  ],
  exported: true,
});

const ALARM_CONTEXT = WalkContextStub({
  scopePath: ['alarmLevel'],
  guardPath: [],
  params: [
    { name: 'temp', type: { kind: 'number' } },
    { name: 'smoke', type: { kind: 'boolean' } },
  ],
  exported: true,
});

const ROUTE_CONTEXT = WalkContextStub({
  scopePath: ['route'],
  guardPath: [],
  params: [
    { name: 'admin', type: { kind: 'boolean' } },
    { name: 'level', type: { kind: 'number' } },
    { name: 'owner', type: { kind: 'boolean' } },
  ],
  exported: true,
});

const NULLISH_CONTEXT = WalkContextStub({
  scopePath: ['pick'],
  guardPath: [],
  params: [
    { name: 'value', type: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] } },
    { name: 'other', type: { kind: 'number' } },
  ],
  exported: true,
});

describe('readConditionTreeLayerTransformer', () => {
  describe('a single comparison is a one-leaf tree', () => {
    it('VALID: {score > 5} => one leaf at the root, carrying its operand, type and predicate', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const score: number;\nif (score > 5) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: GRADE_CONTEXT,
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'score',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      });
    });

    it('VALID: {bare boolean param} => a truthy leaf, so a bare operand yields a derivable domain', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const smoke: boolean;\nif (smoke) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: ALARM_CONTEXT,
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'smoke',
        operandType: { kind: 'boolean' },
        predicate: { kind: 'truthy' },
      });
    });
  });

  describe('object-member operand', () => {
    it('VALID: {config.mode === "a"} => a leaf naming the root param, its property path, and root type-ref', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'interface Config { mode: string }\nexport function decide(config: Config): string {\n  if (config.mode === "a") { return "x"; }\n  return "y";\n}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: WalkContextStub({
          scopePath: ['decide'],
          guardPath: [],
          params: [{ name: 'config', type: { kind: 'object', typeName: 'Config', properties: [{ name: 'mode', type: { kind: 'string' } }] } }],
          exported: true,
        }),
        branchCoverageId: BRANCH,
        path: [],
      });

      // The operand's OWN type is the property type `string` read off the access node — never the whole
      // `Config` object descriptor the root param carries.
      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'a' },
      });
    });
  });

  describe('typeof operand', () => {
    it("VALID: {typeof target === 'string'} => a leaf naming target itself, carrying operandIsTypeof and the typeof-eq predicate", () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare const target: string | number;\nif (typeof target === 'string') {}\n",
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: WalkContextStub({
          scopePath: ['checkTypeof'],
          guardPath: [],
          params: [{ name: 'target', type: { kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] } }],
          exported: true,
        }),
        branchCoverageId: BRANCH,
        path: [],
      });

      // `operandType` is `target`'s own declared descriptor — the union, never the bare `string` type
      // `typeof target` would evaluate to at runtime — because the predicate narrows the PARAMETER by
      // tag, not the typeof expression's own type.
      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'target',
        operandIsTypeof: true,
        operandType: { kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] },
        predicate: { kind: 'typeof-eq', literal: 'string' },
      });
    });
  });

  describe('connectives', () => {
    it('VALID: {score > 5 && bonus > 1} => an and over two independently typed leaves', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const score: number;\ndeclare const bonus: number;\nif (score > 5 && bonus > 1) {}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: GRADE_CONTEXT,
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(result.condition).toStrictEqual({
        kind: 'and',
        left: {
          kind: 'leaf',
          id: 'B#leaf.0',
          operandParamName: 'score',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 5 },
        },
        right: {
          kind: 'leaf',
          id: 'B#leaf.1',
          operandParamName: 'bonus',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 1 },
        },
      });
    });

    it('VALID: {temp > 50 || smoke} => an or whose bare right operand is a truthy leaf', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const temp: number;\ndeclare const smoke: boolean;\nif (temp > 50 || smoke) {}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: ALARM_CONTEXT,
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(result.condition).toStrictEqual({
        kind: 'or',
        left: {
          kind: 'leaf',
          id: 'B#leaf.0',
          operandParamName: 'temp',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 50 },
        },
        right: {
          kind: 'leaf',
          id: 'B#leaf.1',
          operandParamName: 'smoke',
          operandType: { kind: 'boolean' },
          predicate: { kind: 'truthy' },
        },
      });
    });

    it('VALID: {!ready} => a not wrapping the leaf, so negation is structure rather than a predicate', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const ready: boolean;\nif (!ready) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: WalkContextStub({
          scopePath: ['gate'],
          guardPath: [],
          params: [{ name: 'ready', type: { kind: 'boolean' } }],
          exported: true,
        }),
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(result.condition).toStrictEqual({
        kind: 'not',
        operand: {
          kind: 'leaf',
          id: 'B#leaf.0',
          operandParamName: 'ready',
          operandType: { kind: 'boolean' },
          predicate: { kind: 'truthy' },
        },
      });
    });

    it('VALID: {admin && (level > 3 || owner)} => nested connectives, each leaf addressed by its path', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const admin: boolean;\ndeclare const level: number;\ndeclare const owner: boolean;\nif (admin && (level > 3 || owner)) {}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: ROUTE_CONTEXT,
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(result.condition).toStrictEqual({
        kind: 'and',
        left: {
          kind: 'leaf',
          id: 'B#leaf.0',
          operandParamName: 'admin',
          operandType: { kind: 'boolean' },
          predicate: { kind: 'truthy' },
        },
        right: {
          kind: 'or',
          left: {
            kind: 'leaf',
            id: 'B#leaf.1.0',
            operandParamName: 'level',
            operandType: { kind: 'number' },
            predicate: { kind: 'gt', literal: 3 },
          },
          right: {
            kind: 'leaf',
            id: 'B#leaf.1.1',
            operandParamName: 'owner',
            operandType: { kind: 'boolean' },
            predicate: { kind: 'truthy' },
          },
        },
      });
    });
  });

  describe('formatting invariance', () => {
    it('VALID: {redundant parens around an operand} => byte-identical leaf IDs, since parens are formatting', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const bare = project.createSourceFile(
        'src/a.ts',
        'declare const score: number;\ndeclare const bonus: number;\nif (score > 5 && bonus > 1) {}\n',
      );
      const parened = project.createSourceFile(
        'src/b.ts',
        'declare const score: number;\ndeclare const bonus: number;\nif (((score > 5)) && (bonus > 1)) {}\n',
      );

      const bareTree = readConditionTreeLayerTransformer({
        condition: bare.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression(),
        context: GRADE_CONTEXT,
        branchCoverageId: BRANCH,
        path: [],
      });
      const parenedTree = readConditionTreeLayerTransformer({
        condition: parened.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression(),
        context: GRADE_CONTEXT,
        branchCoverageId: BRANCH,
        path: [],
      });

      // The CONDITION is identical; the SITES are not, and must not be. Offsets are formatting-coupled
      // by nature, which is exactly why a probe plan is keyed by content hash and never diffed.
      expect(parenedTree.condition).toStrictEqual(bareTree.condition);
    });
  });

  describe('conditions it cannot classify', () => {
    // `read-condition` reads the LEFT side of any binary as the operand, so a non-comparison binary
    // names `a` even though the operand under test is really `a + b`. Pinned as-is rather than
    // quietly worked around: the predicate is `unrecognized`, so the type→range engine returns the
    // same value for both arms and the binding constrains nothing either way. What makes this SAFE
    // is the dark spot, not the operand — an unrecognized leaf is recorded, never silently trusted.
    it('EDGE: {an operator that is not a connective or comparison} => one unrecognized leaf, not a guess', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const a: number;\ndeclare const b: number;\nif (a + b) {}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: WalkContextStub({ scopePath: ['f'], guardPath: [], params: [], exported: true }),
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandParamName: 'a',
        operandType: { kind: 'number' },
        predicate: { kind: 'unrecognized' },
      });
    });
  });

  describe('a call operand anchors its position', () => {
    // A CALL operand reads as opaque `truthy` — a single-file parse cannot type the callee — so the
    // leaf instead records WHERE the call is written. That coordinate is the SAME one the call site
    // records (its `getStart()`), the foreign key a later compose pass joins on to swap this leaf for
    // the callee's own predicate.
    it('VALID: {if (exceedsLimit(size))} => a truthy leaf carrying the call’s getStart coordinate', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare function exceedsLimit(n: number): boolean;\nif (exceedsLimit(size)) {}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: WalkContextStub({
          scopePath: ['route'],
          guardPath: [],
          params: [{ name: 'size', type: { kind: 'number' } }],
          exported: true,
        }),
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf',
        operandCallPosition: { line: 2, column: 5 },
        operandType: { kind: 'boolean' },
        predicate: { kind: 'truthy' },
      });
    });
  });

  describe('a `??` read as a condition', () => {
    it('VALID: {value ?? 0, a falsy literal fallback} => the truthiness of value alone, its probe on value', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const value: number | undefined;\nif (value ?? 0) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const left = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readConditionTreeLayerTransformer({ condition, context: NULLISH_CONTEXT, branchCoverageId: BRANCH, path: [] });

      expect(result).toStrictEqual({
        condition: {
          kind: 'leaf',
          id: 'B#leaf.0',
          operandParamName: 'value',
          operandType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
          predicate: { kind: 'truthy' },
        },
        sites: [{ id: 'B#leaf.0', kind: 'cond', start: left.getStart(), end: left.getEnd() }],
      });
    });

    it('VALID: {value ?? 5, a truthy literal fallback} => value truthy, or value nullish', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const value: number | undefined;\nif (value ?? 5) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const left = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression).getLeft();

      const result = readConditionTreeLayerTransformer({ condition, context: NULLISH_CONTEXT, branchCoverageId: BRANCH, path: [] });

      expect(result).toStrictEqual({
        condition: {
          kind: 'or',
          left: {
            kind: 'leaf',
            id: 'B#leaf.0',
            operandParamName: 'value',
            operandType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
            predicate: { kind: 'truthy' },
          },
          right: {
            kind: 'not',
            operand: {
              kind: 'leaf',
              id: 'B#leaf.1.0',
              operandParamName: 'value',
              operandType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
              predicate: { kind: 'non-nullish' },
            },
          },
        },
        sites: [{ id: 'B#leaf.0', kind: 'cond', start: left.getStart(), end: left.getEnd() }],
      });
    });

    it('VALID: {value ?? other > 3} => value truthy, or value nullish and the fallback comparison true', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const value: number | undefined;\ndeclare const other: number;\nif (value ?? other > 3) {}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();
      const nullish = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression);
      const left = nullish.getLeft();
      const right = nullish.getRight();

      const result = readConditionTreeLayerTransformer({ condition, context: NULLISH_CONTEXT, branchCoverageId: BRANCH, path: [] });

      expect(result).toStrictEqual({
        condition: {
          kind: 'or',
          left: {
            kind: 'leaf',
            id: 'B#leaf.0',
            operandParamName: 'value',
            operandType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
            predicate: { kind: 'truthy' },
          },
          right: {
            kind: 'and',
            left: {
              kind: 'not',
              operand: {
                kind: 'leaf',
                id: 'B#leaf.1.0',
                operandParamName: 'value',
                operandType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
                predicate: { kind: 'non-nullish' },
              },
            },
            right: {
              kind: 'leaf',
              id: 'B#leaf.1.1',
              operandParamName: 'other',
              operandType: { kind: 'number' },
              predicate: { kind: 'gt', literal: 3 },
            },
          },
        },
        sites: [
          { id: 'B#leaf.0', kind: 'cond', start: left.getStart(), end: left.getEnd() },
          { id: 'B#leaf.1.1', kind: 'cond', start: right.getStart(), end: right.getEnd() },
        ],
      });
    });

    it('VALID: {(value) ?? 5 against value ?? 5} => redundant parentheses leave the condition unchanged', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const bare = project.createSourceFile('src/a.ts', 'declare const value: number | undefined;\nif (value ?? 5) {}\n');
      const wrapped = project.createSourceFile('src/b.ts', 'declare const value: number | undefined;\nif ((value)??(5)) {}\n');

      const bareResult = readConditionTreeLayerTransformer({
        condition: bare.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression(),
        context: NULLISH_CONTEXT,
        branchCoverageId: BRANCH,
        path: [],
      });
      const wrappedResult = readConditionTreeLayerTransformer({
        condition: wrapped.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression(),
        context: NULLISH_CONTEXT,
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(wrappedResult.condition).toStrictEqual(bareResult.condition);
    });

    // The operand's type is the checker's read of `welded` where the condition uses it, and the
    // checker narrows a `const` initialized to 3 to `number` there.
    it('VALID: {const welded ?? 0} => the truthiness leaf carries the welded value', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'const welded: number | undefined = 3;\nif (welded ?? 0) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: WalkContextStub({ scopePath: ['*module*'], guardPath: [], params: [], exported: true }),
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(result.condition).toStrictEqual({
        kind: 'leaf',
        id: 'B#leaf.0',
        operandParamName: 'welded',
        operandConstValue: 3,
        operandType: { kind: 'number' },
        predicate: { kind: 'truthy' },
      });
    });
  });

  describe('a bare .length read as a condition', () => {
    it('VALID: {xs.length} => a length-neq 0 leaf on xs, its probe on the whole access', () => {
      readConditionTreeLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const xs: readonly number[];\nif (xs.length) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerTransformer({
        condition,
        context: WalkContextStub({
          scopePath: ['count'],
          guardPath: [],
          params: [{ name: 'xs', type: { kind: 'array', element: { kind: 'number' } } }],
          exported: true,
        }),
        branchCoverageId: BRANCH,
        path: [],
      });

      expect(result).toStrictEqual({
        condition: {
          kind: 'leaf',
          id: 'B#leaf',
          operandParamName: 'xs',
          operandType: { kind: 'array', element: { kind: 'number' } },
          predicate: { kind: 'length-neq', literal: 0 },
        },
        sites: [{ id: 'B#leaf', kind: 'cond', start: condition.getStart(), end: condition.getEnd() }],
      });
    });
  });
});
