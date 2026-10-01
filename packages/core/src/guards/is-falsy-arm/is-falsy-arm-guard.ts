import type { Predicate } from '@assayer/shared/contracts';
/**
 * PURPOSE: Answers whether ONE arm of a truthiness predicate demands a FALSY value of its operand —
 *   the else side of `if (x)`, the then side of a `falsy` read, and the fall-through side of `a ?? b`
 *   (which asks for null, itself falsy). Negation never reaches here as syntax: `!x` is the same
 *   `truthy` leaf with `want` flipped, so the arm is `want` and nothing else. A missing kind or a
 *   missing arm demands nothing.
 *
 *   It exists because the value-domain language cannot state this demand. On a type WITH a scalar point
 *   the falsy arm is expressed by NAMING that point (`''`, `0`, `false`, `null`) and the domain engine
 *   answers it; on a type with none — an object, an array — `type-to-range` names nothing on either arm,
 *   which reads as "any value will do". Every value the fill seam builds for such a type (`{}`, `[]`,
 *   `{ host: 'abc123' }`) is truthy, so that arm has no value at all and its caller must REFUSE it.
 *
 *   Refusing is not calling the arm dead. The walk drops `undefined` from a type, so `db?: Db` and
 *   `db: Db` read alike and the falsy path may be perfectly live in the real program. "I cannot
 *   construct a falsy value of this type" is the honest statement; "this code is unreachable" is not,
 *   and the two are owed by different parties.
 *
 * USAGE:
 * isFalsyArmGuard({ predicateKind: 'truthy', want: false });
 * // Returns true — the else arm of `if (config.db)`
 * isFalsyArmGuard({ predicateKind: 'truthy', want: true });
 * // Returns false — the then arm, which any constructed object satisfies
 */
export const isFalsyArmGuard = ({ predicateKind, want }: { predicateKind?: Predicate['kind']; want?: boolean }): boolean =>
  want === true
    ? predicateKind === 'falsy'
    : want === false && (predicateKind === 'truthy' || predicateKind === 'non-nullish');
