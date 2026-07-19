/**
 * PURPOSE: Enumerates the lengths a domain's length axis still permits, shortest first — the one place
 *   the length constraints are solved, so that "which length do I realize?" and "is any length left?"
 *   can never answer differently.
 *
 *   `undefined` means the domain says NOTHING about length, which is not the same as an empty list. An
 *   empty list is a PROOF — no length can satisfy these guards — and that is what an unreachable exit
 *   is reported on. Collapsing the two would let an operand nobody constrained look impossible.
 *
 *   Lengths are non-negative INTEGERS by the language's own definition of `.length`, not by anything
 *   inferred about the operand, so this axis is solved over the integers where the value axis is read
 *   over the reals. That is why `length > 1` and `length < 2` correctly leave nothing while a plain
 *   `> 1` and `< 2` still overlap: rounding the bounds inward is a fact here and would be a guess
 *   there. The floor at zero is the same kind of fact — nothing is shorter than empty — so `length < 1`
 *   closes a window of exactly one length rather than an unbounded one.
 *
 *   Shortest first, because the shortest satisfying length is the cheapest to realize and every length
 *   in the window drives the same flow. Preferring the upper end would turn `length <= 1000000` into a
 *   million-character argument.
 *
 *   The scan stops one length past the number of exclusions, which is exhaustive rather than arbitrary:
 *   among that many consecutive lengths at most all but one can be excluded, so if none survives the
 *   scan none exists at all. Emptiness stays PROVEN while an open upper bound stays cheap.
 *
 * USAGE:
 * lengthCandidatesTransformer({ domain: { lengthMin: 2, lengthMax: 5, … } });
 * // Returns [2] — the shortest length satisfying both bounds
 */
import { stringLengthContract } from '../../contracts/string-length/string-length-contract';
import type { StringLength } from '../../contracts/string-length/string-length-contract';
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';

const FLOOR = 0;
const ONE_STEP = 1;

export const lengthCandidatesTransformer = ({
  domain,
}: {
  domain: ValueDomain;
}): StringLength[] | undefined => {
  if (domain.lengthMin === undefined && domain.lengthMax === undefined && domain.lengthExcluded.length === 0) {
    return undefined;
  }

  const excluded = domain.lengthExcluded.map((length) => Number(length));

  const lowest =
    domain.lengthMin === undefined
      ? FLOOR
      : domain.lengthMinExclusive
        ? Math.floor(Number(domain.lengthMin)) + ONE_STEP
        : Math.ceil(Number(domain.lengthMin));
  const from = Math.max(FLOOR, lowest);

  const highest =
    domain.lengthMax === undefined
      ? Infinity
      : domain.lengthMaxExclusive
        ? Math.ceil(Number(domain.lengthMax)) - ONE_STEP
        : Math.floor(Number(domain.lengthMax));
  const to = Math.min(highest, from + excluded.length);

  return Array.from({ length: Math.max(FLOOR, to - from + ONE_STEP) }, (_, step) => from + step)
    .filter((candidate) => !excluded.includes(candidate))
    .map((candidate) => stringLengthContract.parse(candidate));
};
