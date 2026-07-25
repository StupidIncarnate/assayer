/**
 * PURPOSE: Answers whether a value domain NAMES NOTHING — no enumeration, no exclusion, no numeric
 *   bound, no length axis — so every value the operand's type admits still satisfies it. The twin
 *   question to `is-domain-empty` at the other end of the same scale: empty means no value survives,
 *   unconstrained means none was ever ruled out.
 *
 *   It is what separates a predicate that DEMANDS a value point from one that merely reads the operand.
 *   `type-to-range` yields an unconstrained domain on BOTH arms wherever an arm would otherwise have to
 *   be realized from a type with no scalar point — a truthy/falsy read of an object or an array — and
 *   that is deliberately the same answer an unrecognized predicate gets. Nothing was named either way,
 *   so nothing here rules a value out; a domain that DID name a point can only be met by a type that has
 *   one, which is one of the two refusals `object-arrange` keys on. The other names nothing and so is
 *   invisible to this guard: an arm demanding FALSINESS of a type whose every constructible value is
 *   truthy is asked of the PREDICATE instead (`is-falsy-arm`).
 *
 *   The two exclusivity flags are NOT read: they qualify a bound, and a bound that is absent is not
 *   made present by the flag that would have described it.
 *
 * USAGE:
 * isDomainUnconstrainedGuard({ domain: valueDomainContract.parse({}) });                 // true
 * isDomainUnconstrainedGuard({ domain: valueDomainContract.parse({ lengthMin: 3 }) });   // false
 */
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';

export const isDomainUnconstrainedGuard = ({ domain }: { domain?: ValueDomain }): boolean =>
  domain === undefined ||
  (domain.members === undefined &&
    domain.excluded.length === 0 &&
    domain.min === undefined &&
    domain.max === undefined &&
    domain.lengthMin === undefined &&
    domain.lengthMax === undefined &&
    domain.lengthExcluded.length === 0);
