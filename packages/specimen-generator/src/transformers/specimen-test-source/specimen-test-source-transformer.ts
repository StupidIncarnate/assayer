/**
 * PURPOSE: Writes the text of one generated `<folder>.test.ts`: a single test that asks
 * specimenObserveBroker to run Assayer on the specimen and compares the result with the prediction.
 * The file is built as syntax-tree nodes and printed, so quoting and escaping are always right. Reach
 * for specimenTestTitleTransformer to word the title.
 *
 * The printer puts no blank line between statements, so the three top-level statements are printed
 * one at a time and joined with a blank line.
 *
 * USAGE:
 * specimenTestSourceTransformer({ folder, relPath, depthToRepoRoot: 6, title, prediction });
 * // Returns the full test file text, ending in one newline
 */
import ts from '#gateway/npm/typescript';

import type { SpecimenOutcome } from '../../contracts/specimen-outcome/specimen-outcome-contract';
import { outcomeLiteralLayerTransformer } from './outcome-literal-layer-transformer';

export const specimenTestSourceTransformer = ({
  folder,
  relPath,
  depthToRepoRoot,
  title,
  prediction,
}: {
  folder: string;
  relPath: string;
  depthToRepoRoot: number;
  title: string;
  prediction: SpecimenOutcome;
}): string => {
  const { factory } = ts;

  const importJoin = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      undefined,
      undefined,
      factory.createNamedImports([factory.createImportSpecifier(false, undefined, factory.createIdentifier('join'))]),
    ),
    factory.createStringLiteral('path', true),
  );
  const importObserve = factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      undefined,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(false, undefined, factory.createIdentifier('specimenObserveBroker')),
      ]),
    ),
    factory.createStringLiteral('@assayer/specimen-generator/observe', true),
  );

  const observation = factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          'observation',
          undefined,
          undefined,
          factory.createAwaitExpression(
            factory.createCallExpression(factory.createIdentifier('specimenObserveBroker'), undefined, [
              factory.createObjectLiteralExpression(
                [
                  factory.createPropertyAssignment(
                    'repoRoot',
                    factory.createCallExpression(factory.createIdentifier('join'), undefined, [
                      factory.createIdentifier('__dirname'),
                      ...Array.from({ length: depthToRepoRoot }, () => factory.createStringLiteral('..', true)),
                    ]),
                  ),
                  factory.createPropertyAssignment('relPath', factory.createStringLiteral(relPath, true)),
                ],
                true,
              ),
            ]),
          ),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
  const expectation = factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createCallExpression(factory.createIdentifier('expect'), undefined, [
          factory.createIdentifier('observation'),
        ]),
        'toStrictEqual',
      ),
      undefined,
      [outcomeLiteralLayerTransformer({ prediction })],
    ),
  );

  const itCall = factory.createCallExpression(factory.createIdentifier('it'), undefined, [
    factory.createStringLiteral(title, true),
    factory.createArrowFunction(
      [factory.createToken(ts.SyntaxKind.AsyncKeyword)],
      undefined,
      [],
      undefined,
      factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      factory.createBlock([observation, expectation], true),
    ),
  ]);
  const describeStatement = factory.createExpressionStatement(
    factory.createCallExpression(factory.createIdentifier('describe'), undefined, [
      factory.createStringLiteral(folder, true),
      factory.createArrowFunction(
        undefined,
        undefined,
        [],
        undefined,
        factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock([factory.createExpressionStatement(itCall)], true),
      ),
    ]),
  );

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const sourceFile = ts.createSourceFile('specimen.test.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const printed = [importJoin, importObserve, describeStatement].map((node) =>
    printer.printNode(ts.EmitHint.Unspecified, node, sourceFile),
  );

  return `${printed.join('\n\n')}\n`;
};
