import { Project, SyntaxKind } from '#gateway/npm/ts-morph';
import { CompilerOptionsStub } from '#gateway/npm/typescript/compiler-options/compiler-options.stub';

import { WalkContextStub } from '../../contracts/walk-context/walk-context.stub';
import { readBoundTernaryLayerTransformer } from './read-bound-ternary-layer-transformer';
import { readBoundTernaryLayerTransformerProxy } from './read-bound-ternary-layer-transformer.proxy';

const LABEL_CONTEXT = WalkContextStub({
  scopePath: ['*module*', 'label'],
  guardPath: [],
  params: [
    { name: 'value', type: { kind: 'number' } },
    { name: 'text', type: { kind: 'string' }, optional: true },
  ],
  exported: true,
});

const BRANCH_ID = '*module*/label/ternary:BinaryExpression,id:value,EqualsEqualsEqualsToken,num:7';

describe('readBoundTernaryLayerTransformer', () => {
  describe('a ternary default value', () => {
    it('VALID: {text = value === 7 ? "then" : "else"} => one ternary branch and no exit', () => {
      readBoundTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export function label(value: number, text: string = value === 7 ? 'then' : 'else'): string {\n  return text;\n}\n",
      );
      const expression = sourceFile.getFunctionOrThrow('label').getParameterOrThrow('text').getInitializerOrThrow();

      const result = readBoundTernaryLayerTransformer({ expression, context: LABEL_CONTEXT });

      expect({ branches: result.branches, exits: result.exits }).toStrictEqual({
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
            startLine: 1,
            endLine: 1,
          },
        ],
        exits: [],
      });
    });

    it('VALID: {text = value === 7 ? "then" : "else"} => the condition probe, and descents for the condition and each arm under its guard', () => {
      readBoundTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export function label(value: number, text: string = value === 7 ? 'then' : 'else'): string {\n  return text;\n}\n",
      );
      const expression = sourceFile.getFunctionOrThrow('label').getParameterOrThrow('text').getInitializerOrThrow();
      const condition = sourceFile.getFirstDescendantByKindOrThrow(SyntaxKind.BinaryExpression);

      const result = readBoundTernaryLayerTransformer({ expression, context: LABEL_CONTEXT });

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

    it('VALID: {text = value === 7 ? "then" : "else"} => each arm recorded as a fall-through arm on its own line', () => {
      readBoundTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export function label(\n  value: number,\n  text: string = value === 7\n    ? 'then'\n    : 'else',\n): string {\n  return text;\n}\n",
      );
      const expression = sourceFile.getFunctionOrThrow('label').getParameterOrThrow('text').getInitializerOrThrow();

      const result = readBoundTernaryLayerTransformer({ expression, context: LABEL_CONTEXT });

      expect(result.fallthroughArms).toStrictEqual([
        { guardPath: [{ branchCoverageId: BRANCH_ID, arm: 'then' }], startLine: 4, endLine: 4 },
        { guardPath: [{ branchCoverageId: BRANCH_ID, arm: 'else' }], startLine: 5, endLine: 5 },
      ]);
    });

    it('VALID: {a ternary nested in the else arm} => a second branch, guarded by the outer else arm', () => {
      readBoundTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export function label(value: number, text: string = value === 7 ? 'a' : (value > 9 ? 'b' : 'c')): string {\n  return text;\n}\n",
      );
      const expression = sourceFile.getFunctionOrThrow('label').getParameterOrThrow('text').getInitializerOrThrow();

      const result = readBoundTernaryLayerTransformer({ expression, context: LABEL_CONTEXT });

      const nestedId = '*module*/label/ternary:BinaryExpression,id:value,GreaterThanToken,num:9';

      expect({
        branches: result.branches.map((branch) => branch.coverageId),
        guards: result.descents.map((descent) => descent.context.guardPath),
        fallthroughGuards: result.fallthroughArms.map((fallthroughArm) => fallthroughArm.guardPath),
      }).toStrictEqual({
        branches: [BRANCH_ID, nestedId],
        fallthroughGuards: [
          [{ branchCoverageId: BRANCH_ID, arm: 'then' }],
          [
            { branchCoverageId: BRANCH_ID, arm: 'else' },
            { branchCoverageId: nestedId, arm: 'then' },
          ],
          [
            { branchCoverageId: BRANCH_ID, arm: 'else' },
            { branchCoverageId: nestedId, arm: 'else' },
          ],
        ],
        guards: [
          [],
          [{ branchCoverageId: BRANCH_ID, arm: 'then' }],
          [{ branchCoverageId: BRANCH_ID, arm: 'else' }],
          [
            { branchCoverageId: BRANCH_ID, arm: 'else' },
            { branchCoverageId: nestedId, arm: 'then' },
          ],
          [
            { branchCoverageId: BRANCH_ID, arm: 'else' },
            { branchCoverageId: nestedId, arm: 'else' },
          ],
        ],
      });
    });

    it('VALID: {a parenthesized ternary} => the parentheses are seen through, and the walk node is the ternary itself', () => {
      readBoundTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export function label(value: number, text: string = (value === 7 ? 'then' : 'else')): string {\n  return text;\n}\n",
      );
      const expression = sourceFile.getFunctionOrThrow('label').getParameterOrThrow('text').getInitializerOrThrow();

      const result = readBoundTernaryLayerTransformer({ expression, context: LABEL_CONTEXT });

      expect({ branches: result.branches.map((branch) => branch.coverageId), nodes: result.nodes }).toStrictEqual({
        branches: [BRANCH_ID],
        nodes: [{ kind: 'ConditionalExpression', scopePath: ['*module*', 'label'], startLine: 1, endLine: 1, handled: true }],
      });
    });
  });

  describe('a default value that is not a ternary', () => {
    it('EMPTY: {text = "x"} => no branch, and the expression descended whole under the given context', () => {
      readBoundTernaryLayerTransformerProxy();
      const project = new Project({ useInMemoryFileSystem: true, compilerOptions: CompilerOptionsStub() });
      const sourceFile = project.createSourceFile(
        'src/f.ts',
        "export function label(value: number, text: string = 'x'): string {\n  return text;\n}\n",
      );
      const expression = sourceFile.getFunctionOrThrow('label').getParameterOrThrow('text').getInitializerOrThrow();

      const result = readBoundTernaryLayerTransformer({ expression, context: LABEL_CONTEXT });

      expect({
        branches: result.branches,
        probeSites: result.probeSites,
        fallthroughArms: result.fallthroughArms,
        descents: result.descents.map((descent) => ({ node: descent.node, context: descent.context })),
      }).toStrictEqual({
        branches: [],
        probeSites: [],
        fallthroughArms: [],
        descents: [{ node: expression, context: LABEL_CONTEXT }],
      });
    });
  });
});
