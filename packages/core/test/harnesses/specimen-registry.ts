/**
 * PURPOSE: Declares WHAT each catalogue specimen is — the ground truth the matrix runs its checks
 *   from, and the independent half of the declared-vs-observed cross-check.
 *
 *   Authored by READING each specimen, never generated from the analyzer's output. That independence
 *   is the entire value: this project already refuses to derive an expected value by running the
 *   implementation, because such a value cannot disagree with it. The same holds one level up — were
 *   the matrix to ask the analyzer what is in a file, a broken analyzer would agree with itself, run
 *   fewer checks, and go green. Declarations trigger the checks; the analyzer only audits them.
 *
 *   A specimen missing from here fails the catalogue check, so new syntax cannot arrive untested. A
 *   trait here the analyzer cannot see, or a fact it sees that is not here, fails the cross-check —
 *   which is what a forgotten trait looks like.
 *
 * USAGE:
 * specimenRegistry.get(relPathContract.parse('packages/syntax-repository/src/boolean/and.ts'));
 * // ['access:named', 'branch:if']
 */
import { relPathContract } from '@assayer/shared/contracts';
import type { RelPath } from '@assayer/shared/contracts';

import type { SyntaxTrait } from './syntax-traits';

const CATALOGUE = 'packages/syntax-repository/src';

// `as const` keeps every trait a literal, so assigning into the branded Map below checks each one
// against the closed vocabulary — a typo fails to typecheck rather than silently matching nothing.
const DECLARATIONS = {
  // Exported functions guarding a single `if` — the plain rung. Params are number/boolean, so no
  // union fan-out is owed.
  [`${CATALOGUE}/boolean/and.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/boolean/mixed.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/boolean/not.ts`]: ['access:named', 'branch:if'],
  [`${CATALOGUE}/boolean/or.ts`]: ['access:named', 'branch:if'],

  // Composition: both constructs in one file, which is the point of these rungs.
  [`${CATALOGUE}/composition/fallthrough-in-if.ts`]: ['access:named', 'branch:if', 'branch:switch'],
  [`${CATALOGUE}/composition/if-in-switch.ts`]: ['access:named', 'branch:if', 'branch:switch', 'param:union'],
  // `outer` (named) plus `inner` DRIVEN through it (`access:through-caller`), carrying the `branch:if`
  // that is `inner`'s own. `inner` is unexported, so nothing calls it directly — but `outer` passes
  // its own `value` straight in, so the follower drives `inner`'s branch by driving `outer`. The
  // branch belongs to `inner` and is reported on `inner`'s entry, never leaked into `outer`. No
  // `undriven`: following the call graph reaches it, which is the whole point of this rung.
  [`${CATALOGUE}/composition/nested-function.ts`]: ['access:named', 'access:through-caller', 'branch:if'],
  [`${CATALOGUE}/composition/switch-in-if.ts`]: ['access:named', 'branch:if', 'branch:switch', 'param:union'],

  // A class method is reached through an INSTANCE, not as a module property.
  [`${CATALOGUE}/if-else/in-class.ts`]: ['access:method', 'branch:if'],
  [`${CATALOGUE}/if-else/in-function.ts`]: ['access:named', 'branch:if'],
  // The module-scope rung, and it is DRIVEN: `value` is read from the environment, so the environment
  // is its input and each arm is a case that sets it. `operand:env` gates that check, and the absence
  // of `undriven` is the other half — a file Assayer drives must not also admit it cannot.
  [`${CATALOGUE}/if-else/pure-statement.ts`]: ['access:module', 'branch:if', 'operand:env'],

  // No loop handler exists yet, so the for-of is ADMITTED as a dark spot rather than skipped.
  [`${CATALOGUE}/loop/in-function.ts`]: ['access:named', 'darkspot:ForOfStatement'],

  [`${CATALOGUE}/switch/in-class.ts`]: ['access:method', 'branch:switch', 'param:union'],
  [`${CATALOGUE}/switch/in-function.ts`]: ['access:named', 'branch:switch', 'param:union'],
  // The module-scope switch rung, DRIVEN the same way if-else/pure-statement.ts is: `code` comes from
  // `Number(process.env.CODE)`, so the environment is its input and each case writes CODE and imports
  // the module fresh. `operand:env` gates that check; the absence of `undriven` is the other half — a
  // switch reads its discriminant's env source exactly as an `if` reads its operand's.
  [`${CATALOGUE}/switch/pure-statement.ts`]: ['access:module', 'branch:switch', 'operand:env'],

  // `sad-path/` — the PERMANENT dead-end admissions, one example each: cases no feature and no harness
  // ever closes, so they stay red even when the plan is fully adopted. That is the entry price of this
  // folder, and it is why a DARK SPOT (Assayer's own frontier debt, which flips to driven the moment a
  // handler lands — the loop ratchet) and a GAP (closed by a user-authored harness) are NOT here; each
  // gets fixed. Every other folder answers "what syntax is this?"; this one answers "what does Assayer
  // permanently admit, and who owes the work?". Each file's colocated test pins its sentence verbatim.
  //   - the two UNDRIVEN shapes owe the same "welded value, one outcome" text at different sites: a
  //     value welded into a module const, and one welded into a call argument;
  //   - the LINT is the REPO's debt — dead code the follower reaches from nowhere, which the repo, not
  //     Assayer, must delete or wire up.
  [`${CATALOGUE}/sad-path/undriven-welded-const.ts`]: ['access:module', 'branch:if', 'undriven'],
  [`${CATALOGUE}/sad-path/undriven-welded-arg.ts`]: ['access:named', 'undriven'],
  [`${CATALOGUE}/sad-path/dead-surface.ts`]: ['access:named', 'lint:dead-surface'],
} as const;

export const specimenRegistry = new Map<RelPath, readonly SyntaxTrait[]>(
  Object.entries(DECLARATIONS).map(([relPath, traits]): [RelPath, readonly SyntaxTrait[]] => [
    relPathContract.parse(relPath),
    traits,
  ]),
);

// The constructs the CONTRACTS declare that no specimen exercises — the catalogue's own blind spots,
// each carrying why. Written down rather than discovered, so shrinking this is a deliberate act and
// growing it is impossible by accident: the coverage check fails the moment a contract gains a member
// nobody catalogued. Otherwise "the catalogue covers every syntax we model" is a claim with nothing
// behind it.
export const uncataloguedTraits = {
  'access:default': 'no specimen uses `export default`',
  'access:constructor':
    'nothing exercises the "reached through `new`, so it is a gap needing a harness" path that ' +
    'case-set-projection already implements',
  'access:unreachable':
    'no ENTRY carries it. An unreachable scope is an unexported helper; the analysis makes it an ' +
    'entry only when a caller drives it, and then the access is `through-caller`, not `unreachable`. ' +
    'A helper no caller drives is reported on `undriven`, which carries no access kind. So the ' +
    'unreachable access the walk records is real but never reaches the access field of an entry — ' +
    '`composition/nested-function.ts` is the driven case, `sad-path/undriven-welded-arg.ts` the ' +
    'admitted one.',
} as const;
