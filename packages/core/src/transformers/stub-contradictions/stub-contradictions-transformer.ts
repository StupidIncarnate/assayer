/**
 * PURPOSE: Reports every COMMITTED overlay correction whose authoritative values CANNOT satisfy a
 *   branch guard that reads the corrected property — a P1 build error raised BEFORE any test runs, the
 *   object-stub twin of the unreachable-exit lint. A committed correction is the property's
 *   AUTHORITATIVE domain (a fixed-member set), so for each guard on that property it intersects the
 *   corrected values with the guard's SATISFYING domain (the SAME `type-to-range → intersect-domains`
 *   math the case engine runs) and asks `is-domain-empty`: if no corrected value can make the guard
 *   true, that branch is dead under the human's truth and the case engine would emit a bogus case for
 *   it. The error names the overlay file, the property, the reader:line the guard sits at, and what the
 *   guard needs, so an LLM rectifies the stub without a human.
 *
 *   Only a guard carrying a LITERAL is judged — `eq`/`neq`/comparisons/length comparisons constrain
 *   against a real value, so an empty intersection is a genuine proof. A `truthy`/`falsy`/`non-nullish`
 *   guard's satisfying domain is a representative SAMPLE, not a constraint, so intersecting corrected
 *   values with it would report correct code dead; those are skipped, exactly as `is-domain-empty`
 *   refuses to prove an emptiness it cannot witness.
 *
 *   Errors ride the SAME `{ relPath, line, column, message }` channel as the stale-overlay reconcile —
 *   folded into `compileRunBroker`'s `errors[]`, exit 1, the same class as a broken import.
 *
 * USAGE:
 * stubContradictionsTransformer({ guards, overlays });
 * // Returns [] when every corrected value satisfies its guards, or
 * // [{ relPath: 'assayer/stubs/objects/src/decide.ts/Config.json', line: 1, column: 1,
 * //    message: "corrected values for property 'mode' cannot satisfy the guard at src/decide.ts:6 (needs 'mode' === 'a') — rectify this stub" }]
 */
import { columnNumberContract, lineNumberContract, relPathContract } from '@assayer/shared/contracts';
import type { ColumnNumber, LineNumber, RelPath, StubOverlay } from '@assayer/shared/contracts';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import type { PropertyGuard } from '../../contracts/property-guard/property-guard-contract';
import { valueDomainContract } from '../../contracts/value-domain/value-domain-contract';
import { isDomainEmptyGuard } from '../../guards/is-domain-empty/is-domain-empty-guard';
import { intersectDomainsTransformer } from '../intersect-domains/intersect-domains-transformer';
import { typeToRangeTransformer } from '../type-to-range/type-to-range-transformer';

const OVERLAY_LINE = 1;
const OVERLAY_COLUMN = 1;

// The operator each literal-carrying predicate reads as in the "needs 'x' …" clause of the error; a
// length comparison prints `length >` so the reader sees which axis the guard constrains.
const OPERATOR_BY_KIND = new Map([
  ['eq', '==='],
  ['neq', '!=='],
  ['gt', '>'],
  ['gte', '>='],
  ['lt', '<'],
  ['lte', '<='],
  ['length-eq', 'length ==='],
  ['length-neq', 'length !=='],
  ['length-gt', 'length >'],
  ['length-gte', 'length >='],
  ['length-lt', 'length <'],
  ['length-lte', 'length <='],
]);

export const stubContradictionsTransformer = ({
  guards,
  overlays,
}: {
  guards: readonly PropertyGuard[];
  overlays: readonly StubOverlay[];
}): readonly { relPath: RelPath; line: LineNumber; column: ColumnNumber; message: ErrorMessage }[] => {
  // The corrected values a human committed for each `(typeKey, property)`, with the overlay file they
  // live in — the authoritative domain each guard on that property must be satisfiable within.
  const correctionByKeyProperty = new Map(
    overlays.flatMap((overlay) =>
      overlay.kind === 'object'
        ? overlay.properties.map(
            (property) =>
              [`${String(overlay.key)}#${String(property.name)}`, { values: property.values, overlayPath: overlay.overlayPath }] as const,
          )
        : [],
    ),
  );

  const raw = guards.flatMap((guard) => {
    const correction = correctionByKeyProperty.get(`${String(guard.key)}#${String(guard.property)}`);

    // Uncorrected properties are non-authoritative (their demand contains the branch literal), and a
    // literal-less guard's satisfying domain is a sample rather than a constraint — neither can prove a
    // contradiction, so both are skipped.
    if (correction === undefined || guard.predicate.literal === undefined) {
      return [];
    }

    const authoritative = valueDomainContract.parse({ members: correction.values });
    const { satisfying } = typeToRangeTransformer({
      type: guard.operandType,
      predicateKind: String(guard.predicate.kind),
      literal: guard.predicate.literal,
    });

    if (!isDomainEmptyGuard({ domain: intersectDomainsTransformer({ left: authoritative, right: satisfying }) })) {
      return [];
    }

    const operator = OPERATOR_BY_KIND.get(String(guard.predicate.kind)) ?? 'satisfying';
    const literal = typeof guard.predicate.literal === 'string' ? `'${guard.predicate.literal}'` : String(guard.predicate.literal);

    return [
      {
        overlayPath: correction.overlayPath,
        message: `corrected values for property '${String(guard.property)}' cannot satisfy the guard at ${String(guard.reader)}:${String(guard.line)} (needs '${String(guard.property)}' ${operator} ${literal}) — rectify this stub`,
      },
    ];
  });

  return [...new Map(raw.map((entry) => [`${String(entry.overlayPath)}::${entry.message}`, entry])).values()]
    .map((entry) => ({
      relPath: relPathContract.parse(String(entry.overlayPath)),
      line: lineNumberContract.parse(OVERLAY_LINE),
      column: columnNumberContract.parse(OVERLAY_COLUMN),
      message: errorMessageContract.parse(entry.message),
    }))
    .sort((a, b) => (JSON.stringify(a) < JSON.stringify(b) ? -1 : 1));
};
