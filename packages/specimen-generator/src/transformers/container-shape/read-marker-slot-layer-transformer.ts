/**
 * PURPOSE: Reads the slot name from a marker call such as `$stmts('body')`. It answers undefined
 * for any call that is not that marker with a string literal name, so the container reader can
 * ignore every other call. Reach for it when matching marker calls to declared slots.
 *
 * USAGE:
 * readMarkerSlotLayerTransformer({ call, markerName: '$stmts' });
 * // Returns 'body' for the call $stmts('body')
 */
import ts from '#gateway/npm/typescript';

export const readMarkerSlotLayerTransformer = ({
  call,
  markerName,
}: {
  call: ts.CallExpression;
  markerName: string;
}): string | undefined => {
  const [slotArgument] = call.arguments;
  if (!ts.isIdentifier(call.expression) || call.expression.text !== markerName) {
    return undefined;
  }
  if (slotArgument === undefined || !ts.isStringLiteralLike(slotArgument)) {
    return undefined;
  }
  return slotArgument.text;
};
