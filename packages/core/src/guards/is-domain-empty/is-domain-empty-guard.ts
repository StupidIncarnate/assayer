/**
 * PURPOSE: Answers whether a value domain is PROVABLY empty — no value could satisfy it, so the exit
 *   behind it cannot be reached and no case should be derived for it.
 *
 *   It errs toward NOT empty on purpose. This predicate is what a build error is raised on, and a
 *   false positive tells a reader to delete correct code — the one outcome worse than staying quiet.
 *   So emptiness has to be witnessed by the domain itself: bounds that cross, or an enumeration whose
 *   every member is ruled out by an exclusion or a bound. Anything the analyzer merely could not read
 *   leaves an OPEN domain, and an open domain is never empty.
 *
 *   VALUE bounds are read as ranges over the reals, not the integers: `> 1` and `< 2` do not intersect
 *   to nothing here, even though no integer lies between them. Claiming otherwise needs to know the
 *   operand is an integer, which the type graph does not say.
 *
 *   LENGTH bounds are read over the integers, and that is a fact rather than an assumption — `.length`
 *   is a count by the language's own definition. So `length > 1` and `length < 2` ARE empty while the
 *   plain-numeric pair is not, and `length-candidates` owns that arithmetic so the solver and the
 *   verdict cannot disagree about which lengths remain.
 *
 * USAGE:
 * isDomainEmptyGuard({ domain: { min: 1, minExclusive: true, max: 1, maxExclusive: false, excluded: [] } });
 * // Returns true — nothing is both greater than 1 and at most 1
 */
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import { lengthCandidatesTransformer } from '../../transformers/length-candidates/length-candidates-transformer';
import { isLengthInDomainGuard } from '../is-length-in-domain/is-length-in-domain-guard';
import { isWithinDomainBoundsGuard } from '../is-within-domain-bounds/is-within-domain-bounds-guard';

export const isDomainEmptyGuard = ({ domain }: { domain?: ValueDomain }): boolean => {
  if (domain === undefined) {
    return false;
  }

  const boundsCross =
    domain.min !== undefined &&
    domain.max !== undefined &&
    (domain.min > domain.max || (domain.min === domain.max && (domain.minExclusive || domain.maxExclusive)));

  // `undefined` is "nothing was said about length", which proves nothing. Only a stated axis that no
  // length survives is a proof.
  const lengths = lengthCandidatesTransformer({ domain });
  const noLengthLeft = lengths !== undefined && lengths.length === 0;

  const survivors = (domain.members ?? []).filter(
    (member) =>
      !domain.excluded.includes(member) &&
      isWithinDomainBoundsGuard({ value: member, domain }) &&
      isLengthInDomainGuard({ value: member, domain }),
  );

  return boundsCross || noLengthLeft || (domain.members !== undefined && survivors.length === 0);
};
