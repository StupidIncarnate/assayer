import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { GuardStepStub } from '@assayer/shared/contracts/guard-step/guard-step.stub';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { handleTernaryLayerTransformer } from './handle-ternary-layer-transformer';
import { handleTernaryLayerTransformerProxy } from './handle-ternary-layer-transformer.proxy';

const PICK_CONTEXT = WalkContextStub({
  scopePath: ['*module*', 'pick'],
  guardPath: [],
  params: [{ name: 'value', type: { kind: 'number' } }],
  exported: true,
});

const BRANCH_ID = '*module*/pick/ternary:BinaryExpression,id:value,EqualsEqualsEqualsToken,num:7';

describe('handleTernaryLayerTransformer', () => {
  describe('a ternary in a call argument', () => {
    it('VALID: {log(value === 7 ? "then" : "else")} => one ternary branch keyed under its scope, and no exit', () => {
      handleTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare function log(text: string): void;\nexport function pick(value: number): void {\n  log(value === 7 ? 'then' : 'else');\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ConditionalExpression);

      const result = handleTernaryLayerTransformer({ node, context: PICK_CONTEXT });

      expect({ branches: result.branches, exits: result.exits, opensScope: result.opensScope }).toStrictEqual({
        branches: [
          {
            coverageId: BRANCH_ID,
            kind: 'ternary',
            condition: {
              kind: 'leaf',
              id: `${BRANCH_ID}#leaf`,
              operandParamName: 'value',
              operandType: { kind: 'number' },
              predicate: { kind: 'eq', literal: 7 },
            },
            startLine: 3,
            endLine: 3,
          },
        ],
        exits: [],
        opensScope: undefined,
      });
    });

    it('VALID: {log(value === 7 ? "then" : "else")} => the condition probe, and descents for the condition and each arm under its guard', () => {
      handleTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare function log(text: string): void;\nexport function pick(value: number): void {\n  log(value === 7 ? 'then' : 'else');\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ConditionalExpression);
      const condition = node.getCondition();

      const result = handleTernaryLayerTransformer({ node, context: PICK_CONTEXT });

      expect({
        probeSites: result.probeSites,
        descents: result.descents.map((descent) => ({
          kind: descent.node.getKindName(),
          guardPath: descent.context.guardPath,
          tail: descent.context.tail,
        })),
      }).toStrictEqual({
        probeSites: [{ id: `${BRANCH_ID}#leaf`, kind: 'cond', start: condition.getStart(), end: condition.getEnd() }],
        descents: [
          { kind: 'BinaryExpression', guardPath: [], tail: false },
          { kind: 'StringLiteral', guardPath: [{ branchCoverageId: BRANCH_ID, arm: 'then' }], tail: false },
          { kind: 'StringLiteral', guardPath: [{ branchCoverageId: BRANCH_ID, arm: 'else' }], tail: false },
        ],
      });
    });

    it('VALID: {a ternary split over lines} => each arm recorded as a fall-through arm on its own line', () => {
      handleTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare function log(text: string): void;\nexport function pick(value: number): void {\n  log(value === 7\n    ? 'then'\n    : 'else');\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ConditionalExpression);

      const result = handleTernaryLayerTransformer({ node, context: PICK_CONTEXT });

      expect(result.fallthroughArms).toStrictEqual([
        { guardPath: [{ branchCoverageId: BRANCH_ID, arm: 'then' }], startLine: 4, endLine: 4 },
        { guardPath: [{ branchCoverageId: BRANCH_ID, arm: 'else' }], startLine: 5, endLine: 5 },
      ]);
    });

    it('VALID: {a ternary} => its walk node is the ternary itself, marked handled', () => {
      handleTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare function log(text: string): void;\nexport function pick(value: number): void {\n  log(value === 7 ? 'then' : 'else');\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ConditionalExpression);

      const result = handleTernaryLayerTransformer({ node, context: PICK_CONTEXT });

      expect(result.nodes).toStrictEqual([
        { kind: 'ConditionalExpression', scopePath: ['*module*', 'pick'], startLine: 3, endLine: 3, handled: true },
      ]);
    });
  });

  describe('a ternary inside an enclosing guard', () => {
    it('VALID: {a ternary under an if arm} => its arms EXTEND the guard path the walk carried down', () => {
      handleTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare function log(text: string): void;\nexport function pick(value: number): void {\n  log(value === 7 ? 'then' : 'else');\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ConditionalExpression);
      const outer = GuardStepStub({ branchCoverageId: '*module*/pick/if:id:flag', arm: 'then' });
      const context = WalkContextStub({
        scopePath: ['*module*', 'pick'],
        guardPath: [outer],
        params: [{ name: 'value', type: { kind: 'number' } }],
        exported: true,
      });

      const result = handleTernaryLayerTransformer({ node, context });

      expect({
        descents: result.descents.map((descent) => descent.context.guardPath),
        fallthroughArms: result.fallthroughArms.map((fallthroughArm) => fallthroughArm.guardPath),
      }).toStrictEqual({
        descents: [
          [outer],
          [outer, { branchCoverageId: BRANCH_ID, arm: 'then' }],
          [outer, { branchCoverageId: BRANCH_ID, arm: 'else' }],
        ],
        fallthroughArms: [
          [outer, { branchCoverageId: BRANCH_ID, arm: 'then' }],
          [outer, { branchCoverageId: BRANCH_ID, arm: 'else' }],
        ],
      });
    });
  });

  describe('a ternary in an arm', () => {
    it('VALID: {a parenthesized ternary in the else arm} => only the then arm falls through here, and the else arm descends under its guard', () => {
      handleTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "declare function log(text: string): void;\nexport function pick(value: number): void {\n  log(value === 7 ? 'a' : (value > 9 ? 'b' : 'c'));\n}\n",
      );
      const node = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.ConditionalExpression);

      const result = handleTernaryLayerTransformer({ node, context: PICK_CONTEXT });

      expect({
        branches: result.branches.map((branch) => branch.coverageId),
        fallthroughArms: result.fallthroughArms.map((fallthroughArm) => fallthroughArm.guardPath),
        descents: result.descents.map((descent) => ({
          kind: descent.node.getKindName(),
          guardPath: descent.context.guardPath,
        })),
      }).toStrictEqual({
        branches: [BRANCH_ID],
        fallthroughArms: [[{ branchCoverageId: BRANCH_ID, arm: 'then' }]],
        descents: [
          { kind: 'BinaryExpression', guardPath: [] },
          { kind: 'StringLiteral', guardPath: [{ branchCoverageId: BRANCH_ID, arm: 'then' }] },
          { kind: 'ParenthesizedExpression', guardPath: [{ branchCoverageId: BRANCH_ID, arm: 'else' }] },
        ],
      });
    });
  });
});
