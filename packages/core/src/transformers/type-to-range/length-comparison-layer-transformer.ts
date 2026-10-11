/**
 * PURPOSE: Derives satisfying and violating value domains for the length predicates (`length-eq`,
 *   `length-neq`, `length-gt`, `length-gte`, `length-lt`, `length-lte`). A length comparison becomes a
 *   length BOUND for the same reason a numeric one becomes a value bound: a bound intersects with the next
 *   guard, and a realized string does not. `length === 0` is not special here: it is `length-eq`
 *   carrying 0, and it still realizes '' against '' the moment a value is picked.
 *
 * USAGE:
 * lengthComparisonLayerTransformer({ predicateKind: 'length-gte', bound: 2 });
 * // Returns { satisfying: { lengthMin: 2 }, violating: { lengthMax: 2, lengthMaxExclusive: true } }
 */
import { armValuesContract } from "../../contracts/arm-values/arm-values-contract";
import type { ArmValues } from "../../contracts/arm-values/arm-values-contract";

export const lengthComparisonLayerTransformer = ({
  predicateKind,
  bound,
}: {
  predicateKind: string;
  bound: number;
}): ArmValues => {
  switch (predicateKind) {
    case "length-eq":
      return armValuesContract.parse({
        satisfying: { lengthMin: bound, lengthMax: bound },
        violating: { lengthExcluded: [bound] },
      });
    case "length-neq":
      return armValuesContract.parse({
        satisfying: { lengthExcluded: [bound] },
        violating: { lengthMin: bound, lengthMax: bound },
      });
    case "length-gt":
      return armValuesContract.parse({
        satisfying: { lengthMin: bound, lengthMinExclusive: true },
        violating: { lengthMax: bound },
      });
    case "length-gte":
      return armValuesContract.parse({
        satisfying: { lengthMin: bound },
        violating: { lengthMax: bound, lengthMaxExclusive: true },
      });
    case "length-lt":
      return armValuesContract.parse({
        satisfying: { lengthMax: bound, lengthMaxExclusive: true },
        violating: { lengthMin: bound },
      });
    case "length-lte":
      return armValuesContract.parse({
        satisfying: { lengthMax: bound },
        violating: { lengthMin: bound, lengthMinExclusive: true },
      });
    default:
      return armValuesContract.parse({ satisfying: {}, violating: {} });
  }
};
