'use strict';

/**
 * PURPOSE: Flags `??` when the LEFT operand's type is, or contains, `RepresentativeValue` or
 *   `ArrangeValue`. Both are Assayer's own contracts (packages/shared/src/contracts) where `null` is a
 *   real value in the domain, never a stand-in for "missing" — see the "`??` throws away a valid
 *   `null`" entry in plan/open-defects.md. `a ?? b` treats a legitimate `null` the same as `undefined`
 *   and silently swaps in `b`, so a case built to arrange `null` stops exercising the branch it claims
 *   to cover, and still passes. That has happened six times in six places in this repo.
 *
 *   The check reads the TYPE CHECKER's own structural model of the left operand's type, never the
 *   variable's name — a name-based rule would be guesswork, and the whole point is to catch code that
 *   reads fine. It does NOT match on `checker.typeToString`'s rendered text: that text recursively
 *   prints a type's full nested shape, so an unrelated array of large objects (`CallFact[] | undefined`,
 *   where `CallFact` has some OTHER property typed `RepresentativeValue | null` three levels down) would
 *   contain the word "RepresentativeValue" in its rendering without the flagged `??` ever touching that
 *   value — confirmed by running the rule against this repo's own source, where a text-substring version
 *   fired on nine array/Map-lookup fallbacks that were not the bug (see the rule's test file for the
 *   fixture that pins the difference).
 *
 *   Instead it walks the LEFT OPERAND's own type ONE level down (its union constituents, if it is a
 *   union, or the type itself otherwise — never descending into an object's properties or an array's
 *   element) and asks of each constituent:
 *
 *   - Does it carry `RepresentativeValue` or `ArrangeValue` as its OWN alias name? This is what a
 *     directly-annotated `ArrangeValue | undefined` shows.
 *   - Is it an intersection carrying zod's `BRAND<'RepresentativeValue'>` or `BRAND<'ArrangeValue'>`
 *     marker? This is the shape a BRANDED `RepresentativeValue` actually takes once flattened into a
 *     union with `undefined` (an array index under `noUncheckedIndexedAccess`, a `.find()` result) —
 *     the checker drops the `RepresentativeValue` alias itself at that point, but the brand intersection
 *     survives as its own constituent, and `ArrangeValue` bottoms out at the same branded scalar, so
 *     this one check catches both contracts.
 *
 * USAGE:
 * // Given `declare const usable: RepresentativeValue[];`
 * usable[0] ?? fillValue();                              // flagged
 * usable[0] === undefined ? fillValue() : usable[0];      // not flagged
 */

const RESTRICTED_NAMES = new Set(['RepresentativeValue', 'ArrangeValue']);

const isBrandedAsRestrictedName = (intersectionType) =>
  intersectionType.types.some((member) => {
    if (member.aliasSymbol === undefined || member.aliasSymbol.name !== 'BRAND') {
      return false;
    }

    const [nameArgument] = member.aliasTypeArguments ?? [];

    return (
      nameArgument !== undefined &&
      typeof nameArgument.value === 'string' &&
      RESTRICTED_NAMES.has(nameArgument.value)
    );
  });

const hasRestrictedConstituent = (type) => {
  const constituents = type.isUnion() ? type.types : [type];

  return constituents.some(
    (constituent) =>
      (constituent.aliasSymbol !== undefined && RESTRICTED_NAMES.has(constituent.aliasSymbol.name)) ||
      (constituent.isIntersection() && isBrandedAsRestrictedName(constituent)),
  );
};

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow '??' where the left operand's type is or contains RepresentativeValue or ArrangeValue, because null is a real domain value there and '??' silently discards it.",
    },
    schema: [],
    messages: {
      discardsNull:
        "'??' discards a legitimate null here: '{{operandText}}' has type '{{typeText}}'. Use '{{operandText}} === undefined ? {{fallbackText}} : {{operandText}}' instead.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const parserServices = sourceCode.parserServices;

    // No type information (a plain JS file, or a parser that never attached services): this rule has
    // nothing to check the left operand's type against, so it stays silent rather than guessing.
    if (
      parserServices === undefined ||
      parserServices.program === undefined ||
      parserServices.esTreeNodeToTSNodeMap === undefined
    ) {
      return {};
    }

    const checker = parserServices.program.getTypeChecker();

    return {
      LogicalExpression(node) {
        if (node.operator !== '??') {
          return;
        }

        const tsLeftNode = parserServices.esTreeNodeToTSNodeMap.get(node.left);
        const leftType = checker.getTypeAtLocation(tsLeftNode);

        if (!hasRestrictedConstituent(leftType)) {
          return;
        }

        context.report({
          node,
          messageId: 'discardsNull',
          data: {
            operandText: sourceCode.getText(node.left),
            fallbackText: sourceCode.getText(node.right),
            typeText: checker.typeToString(leftType),
          },
        });
      },
    };
  },
};
