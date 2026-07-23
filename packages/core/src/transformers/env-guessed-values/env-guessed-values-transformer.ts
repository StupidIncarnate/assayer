/**
 * PURPOSE: Guesses the value set for one `process.env` property from the literals the code compares it
 *   against — the env twin of `collect-property-demands`'s value step. The environment is an OPAQUE
 *   source: the code names the literals it cares about, and the property could always be something
 *   ELSE, so the guess is the distinct compared literals PLUS one synthetic representative for the
 *   "anything else" the source admits. The whole set is a GUESS a human later corrects, never derived
 *   by executing anything (P4).
 *
 *   The synthetic representative is drawn from the literals' shape: an all-numeric property gets a
 *   representative number distinct from the listed ones (the standard fill `7`, or one past the
 *   largest when `7` is already listed); anything else gets the standard string representative. A
 *   property with no compared literals (a read that never branches) guesses just that representative.
 *   Values are deduped and sorted for byte-identical output.
 *
 * USAGE:
 * envGuessedValuesTransformer({ literals: [1, 2] });
 * // Returns [1, 2, 7] — the two switch-case literals plus a representative "anything else"
 */
import { representativeValueContract } from '@assayer/shared/contracts';
import type { RepresentativeValue } from '@assayer/shared/contracts';

import { representativeValueStatics } from '../../statics/representative-value/representative-value-statics';

export const envGuessedValuesTransformer = ({ literals }: { literals: RepresentativeValue[] }): RepresentativeValue[] => {
  const distinct = [...new Map(literals.map((value) => [JSON.stringify(value), value])).values()];
  const numerics = distinct.flatMap((value) => (typeof value === 'number' ? [Number(value)] : []));
  const allNumeric = distinct.length > 0 && numerics.length === distinct.length;

  const other = allNumeric
    ? representativeValueContract.parse(
        numerics.includes(representativeValueStatics.number)
          ? Math.max(...numerics) + 1
          : representativeValueStatics.number,
      )
    : representativeValueContract.parse(representativeValueStatics.string);

  return [...new Map([...distinct, other].map((value) => [JSON.stringify(value), value])).values()].sort((a, b) =>
    JSON.stringify(a) < JSON.stringify(b) ? -1 : 1,
  );
};
