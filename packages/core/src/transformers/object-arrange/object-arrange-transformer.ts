/**
 * PURPOSE: Arranges ONE object parameter's properties for a single input bucket — the object twin of
 *   `cause-arrange`, and the step that turns an object-member branch (`if (config.mode === 'a')`) from
 *   admitted-undriven into a driven case. It filters the bucket's requirements down to the ones that
 *   read THIS param, then hands the type's own property list and those requirements to
 *   `arrange-object-properties`, the recursive picker — a `config.db.retry` requirement is answered by
 *   that same recursion descending into `db`'s own shape, so a deep requirement is arranged exactly the
 *   way a one-level requirement always was. See that file for the per-property value math and how a
 *   nested requirement, a committed correction, `unreachable`, and `unfillable` all interact.
 *
 *   Every value is an INPUT, never a code-derived output (P4).
 *
 * USAGE:
 * objectArrangeTransformer({ param: 'config', declaredType, demands, requirements, corrected: ['mode'] });
 * // Returns { unreachable: false, unfillable: false, properties: [{ name: 'mode', value: 'a' }, …] } — sorted by name
 */
import type { ArrangeValue, ConditionLeaf, DeclaredType, PropertyDemand, SymbolName } from '@assayer/shared/contracts';

import { arrangeObjectPropertiesTransformer } from '../arrange-object-properties/arrange-object-properties-transformer';

export const objectArrangeTransformer = ({
  param,
  declaredType,
  demands,
  requirements,
  corrected,
}: {
  param: SymbolName;
  declaredType: DeclaredType;
  demands: PropertyDemand[];
  requirements: { leaf: ConditionLeaf; want: boolean }[];
  corrected: readonly SymbolName[];
}): { unreachable: boolean; unfillable: boolean; properties: { name: SymbolName; value: ArrangeValue }[] } => {
  const own = requirements.filter(
    (requirement) =>
      requirement.leaf.operandParamName !== undefined &&
      String(requirement.leaf.operandParamName) === String(param) &&
      requirement.leaf.operandPropertyPath !== undefined,
  );

  return arrangeObjectPropertiesTransformer({
    properties: declaredType.properties,
    demands,
    requirements: own,
    corrected: new Set(corrected.map((name) => String(name))),
  });
};
