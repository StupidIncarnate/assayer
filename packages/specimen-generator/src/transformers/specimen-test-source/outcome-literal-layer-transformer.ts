/**
 * PURPOSE: Builds the object literal node for a predicted outcome. Every field and every row key is
 * written in the order specimenOutcomeContract declares them, so the printed test never depends on
 * the order a caller built the prediction in.
 *
 * USAGE:
 * outcomeLiteralLayerTransformer({ prediction });
 * // Returns an ObjectLiteralExpression node that prints as `{ branches: [...], caseFailures: [], ... }`
 */
import ts from '#gateway/npm/typescript';

import type { SpecimenOutcome } from '../../contracts/specimen-outcome/specimen-outcome-contract';

export const outcomeLiteralLayerTransformer = ({
  prediction,
}: {
  prediction: SpecimenOutcome;
}): ts.ObjectLiteralExpression => {
  const { factory } = ts;

  const branches = prediction.branches.map(({ kind, line, driven }) =>
    factory.createObjectLiteralExpression(
      [
        factory.createPropertyAssignment('kind', factory.createStringLiteral(kind, true)),
        factory.createPropertyAssignment('line', factory.createNumericLiteral(line)),
        factory.createPropertyAssignment('driven', factory.createStringLiteral(driven, true)),
      ],
      false,
    ),
  );
  const caseFailures = prediction.caseFailures.map(({ status, message }) =>
    factory.createObjectLiteralExpression(
      [
        factory.createPropertyAssignment('status', factory.createStringLiteral(status, true)),
        factory.createPropertyAssignment('message', factory.createStringLiteral(message, true)),
      ],
      false,
    ),
  );
  const lints = prediction.lints.map(({ rule, startLine }) =>
    factory.createObjectLiteralExpression(
      [
        factory.createPropertyAssignment('rule', factory.createStringLiteral(rule, true)),
        factory.createPropertyAssignment('startLine', factory.createNumericLiteral(startLine)),
      ],
      false,
    ),
  );
  const undriven = prediction.undriven.map(({ startLine }) =>
    factory.createObjectLiteralExpression(
      [factory.createPropertyAssignment('startLine', factory.createNumericLiteral(startLine))],
      false,
    ),
  );
  const darkSpots = prediction.darkSpots.map(({ startLine }) =>
    factory.createObjectLiteralExpression(
      [factory.createPropertyAssignment('startLine', factory.createNumericLiteral(startLine))],
      false,
    ),
  );
  const gaps = prediction.gaps.map(({ name }) =>
    factory.createObjectLiteralExpression(
      [factory.createPropertyAssignment('name', factory.createStringLiteral(name, true))],
      false,
    ),
  );

  return factory.createObjectLiteralExpression(
    [
      factory.createPropertyAssignment('branches', factory.createArrayLiteralExpression(branches, false)),
      factory.createPropertyAssignment('caseFailures', factory.createArrayLiteralExpression(caseFailures, false)),
      factory.createPropertyAssignment('lints', factory.createArrayLiteralExpression(lints, false)),
      factory.createPropertyAssignment('undriven', factory.createArrayLiteralExpression(undriven, false)),
      factory.createPropertyAssignment('darkSpots', factory.createArrayLiteralExpression(darkSpots, false)),
      factory.createPropertyAssignment('gaps', factory.createArrayLiteralExpression(gaps, false)),
    ],
    true,
  );
};
