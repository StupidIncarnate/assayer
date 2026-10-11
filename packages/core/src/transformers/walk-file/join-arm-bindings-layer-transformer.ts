/**
 * PURPOSE: Joins the bindings two `if` arms leave behind. An arm that always exits (`return`, `throw`)
 *   leaves the survivor's bindings alone, and when both exit the bindings before the `if` stand. Where
 *   both arms fall through and leave a variable holding different values, the variable afterward is a
 *   `select` on that `if`'s branch. A variable only one arm tracks is dropped.
 *
 * USAGE:
 * joinArmBindingsLayerTransformer({ before, thenBindings, elseBindings, thenExits: false, elseExits: false, branch });
 * // Returns { '123': { kind: 'select', … } }
 */
import { valueExprContract } from "@assayer/shared/contracts";
import type { ValueExpr } from "@assayer/shared/contracts";

export const joinArmBindingsLayerTransformer = ({
  before,
  thenBindings,
  elseBindings,
  thenExits,
  elseExits,
  branch,
}: {
  before: Record<string, ValueExpr>;
  thenBindings: Record<string, ValueExpr>;
  elseBindings: Record<string, ValueExpr>;
  thenExits: boolean;
  elseExits: boolean;
  branch: string;
}): Record<string, ValueExpr> => {
  if (thenExits && elseExits) {
    return before;
  }

  if (thenExits) {
    return elseBindings;
  }

  if (elseExits) {
    return thenBindings;
  }

  return Object.fromEntries(
    [
      ...new Set([...Object.keys(thenBindings), ...Object.keys(elseBindings)]),
    ].flatMap((key) => {
      const whenThen = thenBindings[key];
      const whenElse = elseBindings[key];

      if (whenThen === undefined || whenElse === undefined) {
        return [];
      }

      return [
        [
          key,
          JSON.stringify(whenThen) === JSON.stringify(whenElse)
            ? whenThen
            : valueExprContract.parse({
                kind: "select",
                branch,
                then: whenThen,
                else: whenElse,
              }),
        ] as const,
      ];
    }),
  );
};
