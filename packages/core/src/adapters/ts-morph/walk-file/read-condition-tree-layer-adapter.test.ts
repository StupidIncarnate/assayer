import { Project, SyntaxKind } from 'ts-morph';

import { CoverageIdStub } from '@assayer/shared/contracts';

import { WalkContextStub } from '../../../contracts/walk-context/walk-context.stub';
import { readConditionTreeLayerAdapter } from './read-condition-tree-layer-adapter';
import { readConditionTreeLayerAdapterProxy } from './read-condition-tree-layer-adapter.proxy';

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

describe('readConditionTreeLayerAdapter', () => {
  describe('a single comparison is a one-leaf tree', () => {
    it('VALID: {score > 5} => one leaf at the root, carrying its operand, type and predicate', () => {
      readConditionTreeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const score: number;\nif (score > 5) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerAdapter({
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
      readConditionTreeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const smoke: boolean;\nif (smoke) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerAdapter({
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

  describe('connectives', () => {
    it('VALID: {score > 5 && bonus > 1} => an and over two independently typed leaves', () => {
      readConditionTreeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const score: number;\ndeclare const bonus: number;\nif (score > 5 && bonus > 1) {}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerAdapter({
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
      readConditionTreeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const temp: number;\ndeclare const smoke: boolean;\nif (temp > 50 || smoke) {}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerAdapter({
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
      readConditionTreeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile('src/f.ts', 'declare const ready: boolean;\nif (!ready) {}\n');
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerAdapter({
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
      readConditionTreeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const admin: boolean;\ndeclare const level: number;\ndeclare const owner: boolean;\nif (admin && (level > 3 || owner)) {}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerAdapter({
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
      readConditionTreeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const bare = project.createSourceFile(
        'src/a.ts',
        'declare const score: number;\ndeclare const bonus: number;\nif (score > 5 && bonus > 1) {}\n',
      );
      const parened = project.createSourceFile(
        'src/b.ts',
        'declare const score: number;\ndeclare const bonus: number;\nif (((score > 5)) && (bonus > 1)) {}\n',
      );

      const bareTree = readConditionTreeLayerAdapter({
        condition: bare.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression(),
        context: GRADE_CONTEXT,
        branchCoverageId: BRANCH,
        path: [],
      });
      const parenedTree = readConditionTreeLayerAdapter({
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
      readConditionTreeLayerAdapterProxy();
      const project = new Project({ useInMemoryFileSystem: true });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        'declare const a: number;\ndeclare const b: number;\nif (a + b) {}\n',
      );
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.IfStatement).getExpression();

      const result = readConditionTreeLayerAdapter({
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
});
