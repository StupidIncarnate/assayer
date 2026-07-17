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
  // ONLY `outer`, and deliberately no `branch:if`. `inner` is walked but never projected as an entry
  // — nothing outside the module can call it, and driving a private directly is not a test anyone
  // wants — so its `if` belongs to `inner` and must not leak into `outer`. That logic is owed through
  // `outer` by call-graph following, which does not exist yet. Declaring `branch:if` here would
  // assert coverage this file does not have. The `undriven` that follows from that is INCIDENTAL —
  // this file catalogues the nesting syntax, and `undriven/private-function.ts` is what proves the
  // admission — but it is true of the file, so it is declared.
  [`${CATALOGUE}/composition/nested-function.ts`]: ['access:named', 'undriven'],
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
  // Welded to `'get'`, and NOT because the feature needs a specimen — `undriven/` owns that. The env
  // rung is one hop through `Number`, which inverts back to a string the environment can carry; a
  // switch discriminates a string union, and no `Number` hop reaches one. A bare
  // `const method = process.env.METHOD` types as `any` (the analyzer's project loads no ambient Node
  // declarations), so it has no domain to pick a member from. This rung is undriven because the env
  // rung does not reach it, and its `undriven` is as incidental as nested-function.ts's.
  [`${CATALOGUE}/switch/pure-statement.ts`]: ['access:module', 'branch:switch', 'undriven'],

  // The two specimens that exist FOR the undriven admission rather than for a syntax rung — which is
  // why they are grouped by the admission and named for its REASON. Every other folder here answers
  // "what syntax is this?"; these answer "what does Assayer admit about it, and who owes the work?".
  // Split in two because the reasons are, and a reason is the whole content of an admission: one is a
  // debt no feature will ever pay, the other names the feature that would pay it. Each file's
  // colocated test pins its sentence verbatim.
  [`${CATALOGUE}/undriven/private-function.ts`]: ['access:named', 'undriven'],
  [`${CATALOGUE}/undriven/welded-operand.ts`]: ['access:module', 'branch:if', 'undriven'],
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
    'no ENTRY can carry it, which is why nothing here does: an unreachable scope is an unexported ' +
    'helper, and analysis-projection only makes entries of exported functions and module scopes. ' +
    'The trait is observed off the entries, so it cannot appear. `composition/nested-function.ts` ' +
    'holds the private helper the walk records, and undriven-projection — which reads the walk, not ' +
    'the entries — is what reports it',
} as const;
