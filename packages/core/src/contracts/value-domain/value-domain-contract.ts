/**
 * PURPOSE: Contract for a value domain — the SET of values an operand may still take, carried through
 *   case derivation so that constraints from several guards can be intersected before any concrete
 *   value is chosen.
 *
 *   Choosing the value last is the entire point. A predicate that yields one sample per side cannot be
 *   intersected: `size <= 100` and `size > 10` are jointly satisfiable by anything in 11…100, but two
 *   independently-sampled points (100 and 11) share no member, so set intersection reports nothing —
 *   indistinguishable from `value < 1` and `value > 1`, which really is impossible. A domain keeps the
 *   constraint rather than a sample of it, so an empty intersection means EMPTY.
 *
 *   Four ways to constrain, because predicates constrain in four different shapes, and intersection
 *   is what forces them to coexist in one object rather than in a union:
 *   - `min`/`max` (with exclusivity) — numeric comparisons. Absent = unbounded that way.
 *   - `lengthMin`/`lengthMax`/`lengthExcluded` — the SAME shapes one axis over, for `.length`
 *     comparisons. A separate axis is not a duplication: `s.length >= 3` says nothing whatever about
 *     where `s` sits in an ordering of strings, so writing it as `min: 3` would claim a bound the
 *     predicate never stated. Realizing it as a member instead (`['aaa']`) would be worse still — that
 *     is the sampling this whole model exists to remove, and two length guards would intersect to
 *     nothing exactly as two numeric samples did.
 *   - `members` — a closed enumeration the value must belong to. ABSENT means open, which is not the
 *     same as present-and-empty (nothing satisfies it). Kept as a list rather than collapsed to one
 *     value because a union's `else` fans out one case PER remaining member, and that fan-out is the
 *     tier-2 exhaustive generation.
 *   - `excluded` — values it must not take. `x !== 0` is an open domain minus a point, and modelling
 *     it as "the single sample 1" instead is how a later `x > 5` would intersect to nothing and report
 *     correct code as unreachable.
 *
 *   The two axes are read over DIFFERENT number lines, and that asymmetry is deliberate. `min`/`max`
 *   bound a value the type graph only says is a number, so they are read over the reals — `> 1` and
 *   `< 2` still overlap. A length is a count: a non-negative INTEGER by the language's own definition,
 *   not by anything inferred about the operand. So `length > 1` and `length < 2` really do exclude each
 *   other, and reading the length axis over the integers is a fact rather than an assumption.
 *
 *   An unrecognized predicate contributes a domain that constrains NOTHING. Emptiness must only ever
 *   be provable, never an artefact of something the analyzer could not read.
 *
 * USAGE:
 * valueDomainContract.parse({ min: 10, minExclusive: true });        // > 10
 * valueDomainContract.parse({ lengthMin: 2, lengthMax: 5 });         // 2 <= length <= 5
 * valueDomainContract.parse({ members: ['a', 'b'] });                // one of a, b
 * valueDomainContract.parse({ excluded: [0] });                      // anything but 0
 * // Returns a validated ValueDomain (branded values)
 */
import { z } from 'zod';

import { representativeValueContract } from '@assayer/shared/contracts';

export const valueDomainContract = z.object({
  min: z.number().brand<'DomainBound'>().optional(),
  minExclusive: z.boolean().default(false),
  max: z.number().brand<'DomainBound'>().optional(),
  maxExclusive: z.boolean().default(false),
  lengthMin: z.number().brand<'LengthBound'>().optional(),
  lengthMinExclusive: z.boolean().default(false),
  lengthMax: z.number().brand<'LengthBound'>().optional(),
  lengthMaxExclusive: z.boolean().default(false),
  lengthExcluded: z.array(z.number().brand<'LengthBound'>()).default([]),
  members: z.array(representativeValueContract).optional(),
  excluded: z.array(representativeValueContract).default([]),
});

export type ValueDomain = z.infer<typeof valueDomainContract>;
